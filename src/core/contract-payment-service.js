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
 * إذا نجح إنشاء الدفعة لكن فشل إنشاء الحركة المالية،
 * يتم حذف الدفعة تلقائياً (rollback) لمنع حالة غير متسقة.
 *
 * @param {Object} params
 * @param {Object} params.contract - بيانات العقد
 * @param {Object} params.formData - بيانات النموذج { amount, date, paymentMethod, dueId, note }
 * @param {string} [params.propertyName] - اسم العقار (للوصف)
 * @param {string} [params.unitName] - اسم الوحدة (للوصف)
 * @param {string} [params.tenantName] - اسم المستأجر (للإيصال)
 * @param {string} [params.installmentNumber] - رقم القسط (للإيصال)
 * @param {number} [params.remainingAmount] - المبلغ المتبقي على الاستحقاق
 * @param {Function} params.createContractPayment - دالة إنشاء الدفعة من DataContext
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
  createContractPayment,
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

  // متغير لتتبع الدفعة المُنشأة — للـ rollback إذا لزم
  let createdPaymentId = null;

  try {
    // 1. إنشاء دفعة العقد
    const paymentPayload = buildPaymentPayload({
      contractId: contract.id,
      amount: formData.amount,
      date: formData.date,
      paymentMethod: formData.paymentMethod,
      dueId: formData.dueId,
      note: formData.note,
    });

    const { data: paymentData, error: paymentError } = await createContractPayment(paymentPayload);
    if (paymentError) throw paymentError;

    // حفظ معرف الدفعة للـ rollback المحتمل
    createdPaymentId = paymentData?.id || null;

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
        // فشل إنشاء الحركة — rollback الدفعة
        await rollbackPayment(createdPaymentId, deleteContractPayment);
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
          // ربط الإيصال بمعرف الدفعة المُنشأة
          receiptModel.contractPaymentId = createdPaymentId || '';
          const { data: savedReceipt, error: receiptError } = await createContractReceipt(receiptModel);
          if (receiptError) {
            console.warn('[قيد العقار] ⚠️ فشل حفظ سند القبض (لا يؤثر على الدفعة):', receiptError?.message || receiptError);
          } else {
            receipt = savedReceipt || receiptModel;
          }
        }
      } catch (receiptErr) {
        console.warn('[قيد العقار] ⚠️ خطأ أثناء إنشاء سند القبض:', receiptErr?.message || receiptErr);
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
    console.warn('[قيد العقار] ⚠️ تعذر rollback الدفعة — deleteContractPayment غير متوفرة أو معرف الدفعة مفقود');
    return false;
  }

  try {
    const result = await deleteContractPayment(paymentId);
    // DataContext يرجع { error } بدل throw — نفحصه صراحة
    if (result?.error) {
      console.warn('[قيد العقار] ⚠️ فشل rollback الدفعة (returned error):', result.error?.message || result.error);
      return false;
    }
    return true;
  } catch (rollbackErr) {
    console.warn('[قيد العقار] ⚠️ فشل rollback الدفعة (thrown):', rollbackErr?.message || rollbackErr);
    return false;
  }
}
