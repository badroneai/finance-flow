// منطق العقود — دوال نقية بدون React أو side effects (SPR-018)

import { CONTRACT_TYPES, CONTRACT_STATUSES, PAYMENT_CYCLES } from '../constants/index.js';

/** أنواع العقود مع أيقونات */
export const CONTRACT_TYPE_OPTIONS = [
  { value: 'rent', label: 'إيجار', icon: '🏠' },
  { value: 'sale', label: 'بيع', icon: '💰' },
  { value: 'management', label: 'إدارة', icon: '📋' },
  { value: 'other', label: 'أخرى', icon: '📁' },
];

/** حالات العقد مع ألوان */
export const CONTRACT_STATUS_OPTIONS = [
  { value: 'draft', label: 'مسودة', color: 'gray' },
  { value: 'active', label: 'ساري', color: 'green' },
  { value: 'expired', label: 'منتهي', color: 'yellow' },
  { value: 'terminated', label: 'ملغي', color: 'red' },
  { value: 'renewed', label: 'مُجدد', color: 'blue' },
];

/** دورات الدفع */
export const PAYMENT_CYCLE_OPTIONS = [
  { value: 'monthly', label: 'شهري' },
  { value: 'quarterly', label: 'ربع سنوي' },
  { value: 'semi_annual', label: 'نصف سنوي' },
  { value: 'annual', label: 'سنوي' },
  { value: 'custom', label: 'مخصص' },
];

/** ترجمة نوع العقد */
export function getContractTypeLabel(type) {
  return CONTRACT_TYPES[type] || CONTRACT_TYPES.other;
}

/** أيقونة نوع العقد */
export function getContractTypeIcon(type) {
  const opt = CONTRACT_TYPE_OPTIONS.find((o) => o.value === type);
  return opt ? opt.icon : '📁';
}

/** ترجمة حالة العقد */
export function getContractStatusLabel(status) {
  return CONTRACT_STATUSES[status] || CONTRACT_STATUSES.draft;
}

/** لون حالة العقد */
export function getContractStatusColor(status) {
  const opt = CONTRACT_STATUS_OPTIONS.find((o) => o.value === status);
  return opt ? opt.color : 'gray';
}

/** ترجمة دورة الدفع */
export function getPaymentCycleLabel(cycle) {
  return PAYMENT_CYCLES[cycle] || PAYMENT_CYCLES.monthly;
}

/** حساب عدد الأيام المتبقية للعقد */
export function daysRemaining(endDate) {
  if (!endDate) return null;
  const end = new Date(endDate);
  const now = new Date();
  const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  return diff;
}

/** هل العقد قارب على الانتهاء (أقل من 30 يوم)؟ */
export function isExpiringSoon(endDate, thresholdDays = 30) {
  const remaining = daysRemaining(endDate);
  if (remaining === null) return false;
  return remaining > 0 && remaining <= thresholdDays;
}

/** هل العقد منتهي؟ */
export function isExpired(endDate) {
  const remaining = daysRemaining(endDate);
  if (remaining === null) return false;
  return remaining <= 0;
}

/** التحقق من صحة بيانات العقد قبل الحفظ */
export function validateContract(contract) {
  const errors = [];

  if (!contract.type || !CONTRACT_TYPES[contract.type]) {
    errors.push('نوع العقد غير صالح');
  }
  if (!contract.startDate) {
    errors.push('تاريخ بداية العقد مطلوب');
  }
  if (!contract.endDate) {
    errors.push('تاريخ نهاية العقد مطلوب');
  }
  if (contract.startDate && contract.endDate && contract.startDate >= contract.endDate) {
    errors.push('تاريخ النهاية يجب أن يكون بعد تاريخ البداية');
  }

  const totalAmount = Number(contract.totalAmount);
  if (isNaN(totalAmount) || totalAmount < 0) {
    errors.push('إجمالي قيمة العقد يجب أن يكون رقماً موجباً');
  }

  const monthlyRent = Number(contract.monthlyRent || 0);
  if (isNaN(monthlyRent) || monthlyRent < 0) {
    errors.push('الإيجار الشهري يجب أن يكون رقماً موجباً');
  }

  if (contract.depositAmount != null && contract.depositAmount !== '') {
    const deposit = Number(contract.depositAmount);
    if (isNaN(deposit) || deposit < 0) {
      errors.push('مبلغ التأمين يجب أن يكون رقماً موجباً');
    }
  }

  return { valid: errors.length === 0, errors };
}

/** بناء ملخص العقود */
export function computeContractsSummary(contracts) {
  const list = Array.isArray(contracts) ? contracts : [];
  const total = list.length;
  const byStatus = {};

  let totalValue = 0;
  let totalMonthlyRent = 0;
  let expiringSoon = 0;

  for (const c of list) {
    const s = c.status || 'draft';
    byStatus[s] = (byStatus[s] || 0) + 1;
    totalValue += Number(c.totalAmount || 0);
    if (s === 'active') {
      totalMonthlyRent += Number(c.monthlyRent || 0);
    }
    if (s === 'active' && isExpiringSoon(c.endDate)) {
      expiringSoon++;
    }
  }

  return {
    total,
    byStatus,
    activeCount: byStatus.active || 0,
    expiredCount: byStatus.expired || 0,
    draftCount: byStatus.draft || 0,
    expiringSoon,
    totalValue,
    totalMonthlyRent,
  };
}

/** فلترة العقود */
export function filterContracts(contracts, filters = {}) {
  let list = Array.isArray(contracts) ? [...contracts] : [];

  if (filters.type) {
    list = list.filter((c) => c.type === filters.type);
  }
  if (filters.status) {
    list = list.filter((c) => c.status === filters.status);
  }
  if (filters.propertyId) {
    list = list.filter((c) => c.propertyId === filters.propertyId);
  }
  if (filters.contactId) {
    list = list.filter((c) => c.contactId === filters.contactId);
  }
  if (filters.search) {
    const s = filters.search.toLowerCase();
    list = list.filter((c) =>
      (c.contractNumber || '').toLowerCase().includes(s) ||
      (c.notes || '').toLowerCase().includes(s) ||
      (c._propertyName || '').toLowerCase().includes(s) ||
      (c._contactName || '').toLowerCase().includes(s)
    );
  }

  return list;
}

/** القيم الافتراضية لعقد جديد */
export function defaultContract() {
  const today = new Date();
  const nextYear = new Date(today);
  nextYear.setFullYear(nextYear.getFullYear() + 1);

  const fmt = (d) => d.toISOString().split('T')[0];

  return {
    propertyId: '',
    contactId: '',
    contractNumber: '',
    type: 'rent',
    status: 'active',
    startDate: fmt(today),
    endDate: fmt(nextYear),
    durationMonths: 12,
    totalAmount: '',
    monthlyRent: '',
    depositAmount: '',
    paymentCycle: 'monthly',
    autoRenew: false,
    notes: '',
  };
}
