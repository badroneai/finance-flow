// خدمة تسجيل دفعات العقود — تجمع إنشاء الدفعة + الحركة المالية في عملية واحدة
// تُستخدم من QuickPaymentModal و ContractDetailPage لتوحيد المنطق
// ضمان atomicity: إذا فشل إنشاء الحركة المالية، يتم حذف الدفعة (rollback)

import {
  validatePayment,
  buildPaymentPayload,
  buildTransactionPayload,
} from '../domain/contract-payments.js';
import { buildReceiptModel } from '../domain/receipt.js';

/**
 * تسجيل دفعة عقد مع حركة مالية مرتبطة (عملية ذرية)
 *
 * السلوك:
 * - إذا كان dueId موجوداً: تحديث القسط المجدول الموجود (status → paid)
 * - إذا لم يكن dueId: إنشاء سطر جديد في payment_schedule (دفعة إضافية)
 *
 * إذا نجحت الدفعة لكن فشل إنشاء الحركة المالية،
 * يتم التراجع تلقائياً (rollback) لمنع حالة غير متسقة.
 *
 * @param {Object} params
 * @param {Object} params.contract - بيانات العقد
 * @param {Object} params.formData - بيانات النموذج { amount, date, paymentMethod, dueId, note }
 * @param {string} [params.propertyName] - اسم العقار (للوصف)
 * @param {string} [params.unitName] - اسم الوحدة (للوصف)
 * @param {string} [params.tenantName] - اسم المستأجر (للإيصال)
 * @param {string} [params.installmentNumber] - رقم القسط (للإيصال)
 * @param {number} [params.remainingAmount] - المبلغ المتبقي على الاستحقاق
 * @param {string} [params.currentDueStatus] - الحالة الحالية للقسط قبل التحديث (للـ rollback)
 * @param {number} [params.currentPaidAmount] - المبلغ المدفوع الحالي قبل التحديث (للـ rollback)
 * @param {string|null} [params.currentPaidDate] - تاريخ السداد السابق قبل التحديث (للـ rollback)
 * @param {Function} params.createContractPayment - دالة إنشاء دفعة جديدة من DataContext
 * @param {Function} params.updateContractPayment - دالة تحديث قسط موجود من DataContext
 * @param {Function} params.createTransaction - دالة إنشاء الحركة من DataContext
 * @param {Function} [params.deleteContractPayment] - دالة حذف الدفعة للـ rollback
 * @param {Function} [params.createContractReceipt] - دالة حفظ سند القبض
 * @returns {Promise<{ success: boolean, paymentData?: Object, receipt?: Object, errors?: string[], error?: Error }>}
 */
export async function recordContractPayment({
  contract,
  formData,
  propertyName,
  unitName,
  tenantName,
  installmentNumber,
  remainingAmount,
  currentDueStatus,
  currentPaidAmount,
  currentPaidDate,
  createContractPayment,
  updateContractPayment,
  createTransaction,
  deleteContractPayment,
  createContractReceipt,
}) {
  // التحقق من الصحة
  const validation = validatePayment({
    amount: formData.amount,
    date: formData.date,
    remainingAmount,
  });

  if (!validation.valid) {
    return { success: false, errors: validation.errors };
  }

  if (!contract) {
    return { success: false, errors: ['العقد غير موجود'] };
  }

  // متغير لتتبع العملية — للـ rollback إذا لزم
  let createdPaymentId = null;
  let wasUpdate = false;
  let previousStatus = null;
  let previousPaidAmount = 0;
  let previousPaidDate = null;

  try {
    // 1. تسجيل الدفعة — تحديث قسط موجود أو إنشاء دفعة جديدة
    const paymentPayload = buildPaymentPayload({
      contractId: contract.id,
      amount: formData.amount,
      date: formData.date,
      paymentMethod: formData.paymentMethod,
      dueId: formData.dueId,
      note: formData.note,
    });

    let paymentData;

    if (formData.dueId && typeof updateContractPayment === 'function') {
      // قسط مجدول موجود — نحدّثه إلى "مدفوع"
      wasUpdate = true;
      // حفظ الحالة الحالية الفعلية للقسط — تُستخدم للتراجع عند فشل الحركة المالية
      previousStatus = currentDueStatus || 'pending';
      previousPaidAmount = Number(currentPaidAmount) || 0;
      previousPaidDate = currentPaidDate || null;
      const updatePayload = {
        status: 'paid',
        paidAmount: formData.amount,
        paidDate: formData.date,
        paymentMethod: formData.paymentMethod,
        notes: formData.note || '',
      };
      const { data, error } = await updateContractPayment(formData.dueId, updatePayload);
      if (error) throw error;
      paymentData = data;
      createdPaymentId = formData.dueId;
    } else {
      // دفعة إضافية (بدون قسط مجدول) — إنشاء سطر جديد
      const { data, error } = await createContractPayment(paymentPayload);
      if (error) throw error;
      paymentData = data;
      createdPaymentId = paymentData?.id || null;
    }

    // 2. إنشاء حركة مالية مرتبطة
    const txPayload = buildTransactionPayload({
      contract,
      amount: formData.amount,
      date: formData.date,
      paymentMethod: formData.paymentMethod,
      dueId: formData.dueId,
      propertyName,
      unitName,
    });

    if (txPayload) {
      const { error: txError } = await createTransaction(txPayload);
      if (txError) {
        // فشل إنشاء الحركة — rollback
        if (wasUpdate && typeof updateContractPayment === 'function') {
          // إرجاع القسط لحالته السابقة الفعلية — كل الحقول تُعاد كما كانت
          await updateContractPayment(formData.dueId, {
            status: previousStatus,
            paidAmount: previousPaidAmount,
            paidDate: previousPaidDate,
          });
        } else {
          await rollbackPayment(createdPaymentId, deleteContractPayment);
        }
        throw txError;
      }
    }

    // 3. إنشاء سند قبض محفوظ (اختياري — لا يُفشل العملية)
    let receipt = null;
    if (typeof createContractReceipt === 'function') {
      try {
        const receiptModel = buildReceiptModel({
          contract,
          formData,
          tenantName,
          propertyName,
          unitName,
          installmentNumber: installmentNumber ? String(installmentNumber) : '',
        });
        if (receiptModel) {
          // ربط الإيصال بمعرف الدفعة/القسط
          receiptModel.contractPaymentId = createdPaymentId || '';
          const { data: savedReceipt, error: receiptError } =
            await createContractReceipt(receiptModel);
          if (receiptError) {
            console.warn(
              '[قيد العقار] ⚠️ فشل حفظ سند القبض (لا يؤثر على الدفعة):',
              receiptError?.message || receiptError
            );
          } else {
            receipt = savedReceipt || receiptModel;
          }
        }
      } catch (receiptErr) {
        console.warn(
          '[قيد العقار] ⚠️ خطأ أثناء إنشاء سند القبض:',
          receiptErr?.message || receiptErr
        );
      }
    }

    return { success: true, paymentData: paymentPayload, receipt };
  } catch (err) {
    return { success: false, error: err };
  }
}

/**
 * حذف الدفعة المُنشأة عند فشل إنشاء الحركة المالية
 * @param {string|null} paymentId - معرف الدفعة
 * @param {Function|undefined} deleteContractPayment - دالة الحذف
 */
async function rollbackPayment(paymentId, deleteContractPayment) {
  if (!paymentId || typeof deleteContractPayment !== 'function') {
    console.warn(
      '[قيد العقار] ⚠️ تعذر rollback الدفعة — deleteContractPayment غير متوفرة أو معرف الدفعة مفقود'
    );
    return false;
  }

  try {
    const result = await deleteContractPayment(paymentId);
    // DataContext يرجع { error } بدل throw — نفحصه صراحة
    if (result?.error) {
      console.warn(
        '[قيد العقار] ⚠️ فشل rollback الدفعة (returned error):',
        result.error?.message || result.error
      );
      return false;
    }
    return true;
  } catch (rollbackErr) {
    console.warn(
      '[قيد العقار] ⚠️ فشل rollback الدفعة (thrown):',
      rollbackErr?.message || rollbackErr
    );
    return false;
  }
}
