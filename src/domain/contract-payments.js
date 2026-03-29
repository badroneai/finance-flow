// منطق التحقق وتحضير دفعات العقود — دوال نقية بدون React أو side effects
// تُستخدم من QuickPaymentModal و ContractDetailPage

import { safeNum } from '../utils/helpers.js';

/**
 * التحقق من صحة بيانات الدفعة قبل التسجيل
 * @param {Object} params
 * @param {number|string} params.amount - مبلغ الدفعة
 * @param {string} params.date - تاريخ الدفعة (YYYY-MM-DD)
 * @param {number} [params.remainingAmount] - المبلغ المتبقي على الاستحقاق
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validatePayment({ amount, date, remainingAmount }) {
  const errors = [];
  const numAmount = safeNum(amount);

  if (numAmount <= 0) {
    errors.push('أدخل مبلغ دفعة صحيحًا');
  }

  if (!date) {
    errors.push('تاريخ الدفعة مطلوب');
  }

  // تحقق: المبلغ لا يتجاوز المتبقي (إذا مُرر remainingAmount)
  if (
    remainingAmount !== undefined &&
    remainingAmount !== null &&
    numAmount > 0 &&
    numAmount > safeNum(remainingAmount)
  ) {
    errors.push('مبلغ الدفعة يتجاوز المبلغ المتبقي');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * بناء حمولة الدفعة (contractPayment) جاهزة للحفظ
 * @param {Object} params
 * @param {string} params.contractId - معرف العقد
 * @param {number|string} params.amount - المبلغ
 * @param {string} params.date - تاريخ الدفعة
 * @param {string} params.paymentMethod - طريقة الدفع
 * @param {string} [params.dueId] - معرف الاستحقاق المرتبط
 * @param {string} [params.note] - ملاحظة
 * @returns {Object} حمولة الدفعة
 */
export function buildPaymentPayload({ contractId, amount, date, paymentMethod, dueId, note }) {
  return {
    contractId,
    amount: safeNum(amount),
    date,
    paymentMethod: paymentMethod || 'bank_transfer',
    dueId: dueId || '',
    note: String(note || '').trim(),
  };
}

/**
 * بناء حمولة الحركة المالية المرتبطة بالدفعة
 * @param {Object} params
 * @param {Object} params.contract - بيانات العقد
 * @param {number} params.amount - المبلغ
 * @param {string} params.date - تاريخ الدفعة
 * @param {string} params.paymentMethod - طريقة الدفع
 * @param {string} [params.dueId] - معرف الاستحقاق
 * @param {string} [params.propertyName] - اسم العقار
 * @param {string} [params.unitName] - اسم الوحدة
 * @returns {Object} حمولة الحركة المالية
 */
export function buildTransactionPayload({
  contract,
  amount,
  date,
  paymentMethod,
  dueId,
  propertyName,
  unitName,
}) {
  if (!contract) return null;

  const description = [
    `دفعة عقد ${contract.contractNumber || contract.id}`,
    propertyName || '',
    unitName || '',
  ]
    .filter(Boolean)
    .join(' — ');

  return {
    type: 'income',
    category: contract.type === 'sale' ? 'deposit' : 'rent',
    amount: safeNum(amount),
    paymentMethod: paymentMethod || 'bank_transfer',
    date,
    description,
    meta: {
      contractId: contract.id,
      propertyId: contract.propertyId || contract.property_id || '',
      unitId: contract.unitId || contract.unit_id || '',
      dueId: dueId || '',
    },
  };
}
