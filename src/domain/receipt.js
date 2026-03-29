// نموذج سند القبض / إيصال الدفعة — دوال نقية بدون React أو side effects
// يبني كائن receipt موحد من بيانات العقد والدفعة والعقار والمستأجر

import { safeNum } from '../utils/helpers.js';

/** تسميات طرق الدفع */
const PAYMENT_METHOD_LABELS = {
  cash: 'نقدي',
  bank_transfer: 'تحويل بنكي',
  check: 'شيك',
  electronic: 'بطاقة إلكترونية',
};

/**
 * توليد رقم إيصال فريد مبني على الوقت
 * الصيغة: RCP-YYYYMMDD-XXXX (4 أحرف عشوائية)
 * @param {string} [dateStr] - تاريخ الإصدار (YYYY-MM-DD)
 * @returns {string}
 */
export function generateReceiptNumber(dateStr) {
  const d = dateStr ? dateStr.replace(/-/g, '') : new Date().toISOString().split('T')[0].replace(/-/g, '');
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `RCP-${d}-${rand}`;
}

/**
 * بناء نموذج الإيصال الموحد من بيانات الدفعة والعقد
 *
 * @param {Object} params
 * @param {Object} params.contract - بيانات العقد
 * @param {Object} params.formData - بيانات النموذج { amount, date, paymentMethod, dueId, note }
 * @param {string} [params.tenantName] - اسم المستأجر
 * @param {string} [params.propertyName] - اسم العقار
 * @param {string} [params.unitName] - اسم الوحدة
 * @param {string} [params.officeName] - اسم المكتب
 * @param {string} [params.installmentNumber] - رقم القسط
 * @param {string} [params.receiptNumber] - رقم الإيصال (يُولَّد تلقائياً إذا لم يُمرر)
 * @returns {Object} نموذج الإيصال
 */
export function buildReceiptModel({
  contract,
  formData,
  tenantName,
  propertyName,
  unitName,
  officeName,
  installmentNumber,
  receiptNumber,
}) {
  if (!contract || !formData) return null;

  const amount = safeNum(formData.amount);
  const date = formData.date || new Date().toISOString().split('T')[0];
  const contractNumber = contract.contractNumber || contract.contract_number || '';

  return {
    // بيانات الإيصال
    receiptNumber: receiptNumber || generateReceiptNumber(date),
    issueDate: date,

    // بيانات المكتب
    officeName: officeName || 'قيد العقار',

    // بيانات المستأجر
    tenantName: tenantName || '',

    // بيانات العقد
    contractId: contract.id,
    contractNumber,
    contractType: contract.type || 'rent',

    // بيانات العقار
    propertyName: propertyName || '',
    unitName: unitName || '',

    // بيانات الدفعة
    amount,
    paymentMethod: formData.paymentMethod || 'bank_transfer',
    paymentMethodLabel: PAYMENT_METHOD_LABELS[formData.paymentMethod] || PAYMENT_METHOD_LABELS.bank_transfer,
    dueId: formData.dueId || '',
    installmentNumber: installmentNumber || '',
    note: String(formData.note || '').trim(),

    // بيانات وصفية
    createdAt: new Date().toISOString(),
  };
}

/**
 * بناء نموذج إيصال من عنصر مستحق (due item من buildOperationalDues)
 * مناسب للاستخدام في QuickPaymentModal بعد نجاح الدفعة
 *
 * @param {Object} params
 * @param {Object} params.dueItem - عنصر المستحق من dues.js
 * @param {Object} params.contract - بيانات العقد
 * @param {Object} params.formData - بيانات النموذج
 * @param {string} [params.officeName] - اسم المكتب
 * @returns {Object} نموذج الإيصال
 */
export function buildReceiptFromDue({ dueItem, contract, formData, officeName }) {
  if (!dueItem || !contract) return null;

  return buildReceiptModel({
    contract,
    formData,
    tenantName: dueItem.tenantName,
    propertyName: dueItem.propertyName,
    unitName: dueItem.unitName,
    officeName,
    installmentNumber: dueItem.installmentNumber ? String(dueItem.installmentNumber) : '',
  });
}
