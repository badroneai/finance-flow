// منطق جهات الاتصال — دوال نقية بدون React أو side effects (SPR-018)

import { CONTACT_TYPES, CONTACT_ID_TYPES } from '../constants/index.js';

/** أنواع جهات الاتصال مع أيقونات */
export const CONTACT_TYPE_OPTIONS = [
  { value: 'tenant', label: 'مستأجر', icon: '' },
  { value: 'owner', label: 'مالك', icon: '' },
  { value: 'buyer', label: 'مشتري', icon: '' },
  { value: 'agent', label: 'وسيط', icon: '' },
  { value: 'supplier', label: 'مورد', icon: '' },
  { value: 'other', label: 'أخرى', icon: '' },
];

/** أنواع الهوية */
export const CONTACT_ID_TYPE_OPTIONS = [
  { value: 'national_id', label: 'هوية وطنية' },
  { value: 'iqama', label: 'إقامة' },
  { value: 'commercial_reg', label: 'سجل تجاري' },
  { value: 'passport', label: 'جواز سفر' },
];

/** أبرز المدن السعودية (مشتركة مع properties) */
export const SAUDI_CITIES = [
  'الرياض',
  'جدة',
  'مكة المكرمة',
  'المدينة المنورة',
  'الدمام',
  'الخبر',
  'الظهران',
  'الطائف',
  'تبوك',
  'بريدة',
  'خميس مشيط',
  'أبها',
  'حائل',
  'نجران',
  'جازان',
  'ينبع',
  'الجبيل',
  'الأحساء',
  'القطيف',
  'أخرى',
];

/** ترجمة نوع جهة الاتصال */
export function getContactTypeLabel(type) {
  return CONTACT_TYPES[type] || CONTACT_TYPES.other;
}

/** أيقونة نوع جهة الاتصال */
export function getContactTypeIcon(type) {
  const opt = CONTACT_TYPE_OPTIONS.find((o) => o.value === type);
  return opt ? opt.icon : '';
}

/** ترجمة نوع الهوية */
export function getContactIdTypeLabel(idType) {
  return CONTACT_ID_TYPES[idType] || CONTACT_ID_TYPES.national_id;
}

/** التحقق من صحة رقم الجوال السعودي */
export function validateSaudiPhone(phone) {
  if (!phone) return true; // اختياري
  const cleaned = phone.replace(/[\s\-()]/g, '');
  // +9665XXXXXXXX أو 05XXXXXXXX أو 5XXXXXXXX
  return /^(\+966|00966|0)?5\d{8}$/.test(cleaned);
}

/** التحقق من صحة البريد الإلكتروني */
export function validateEmail(email) {
  if (!email) return true; // اختياري
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** التحقق من صحة بيانات جهة الاتصال قبل الحفظ */
export function validateContact(contact) {
  const errors = [];
  const name = String(contact?.name ?? '').trim();
  if (!name) errors.push('اسم جهة الاتصال مطلوب');
  if (name.length > 100) errors.push('اسم جهة الاتصال يجب أن يكون أقل من 100 حرف');

  const type = String(contact?.type ?? '').trim();
  if (!CONTACT_TYPES[type]) errors.push('نوع جهة الاتصال غير صالح');

  const phone = String(contact?.phone ?? '').trim();
  if (phone && !validateSaudiPhone(phone)) errors.push('رقم الجوال غير صالح');

  const phone2 = String(contact?.phone2 ?? '').trim();
  if (phone2 && !validateSaudiPhone(phone2)) errors.push('رقم الجوال الإضافي غير صالح');

  const email = String(contact?.email ?? '').trim();
  if (email && !validateEmail(email)) errors.push('البريد الإلكتروني غير صالح');

  const idType = String(contact?.idType ?? '').trim();
  if (idType && !CONTACT_ID_TYPES[idType]) errors.push('نوع الهوية غير صالح');

  return { valid: errors.length === 0, errors };
}

/** بناء ملخص جهات الاتصال */
export function computeContactsSummary(contacts) {
  const list = Array.isArray(contacts) ? contacts : [];
  const total = list.length;
  const byType = {};

  for (const c of list) {
    const t = c.type || 'other';
    byType[t] = (byType[t] || 0) + 1;
  }

  return {
    total,
    byType,
    tenantCount: byType.tenant || 0,
    ownerCount: byType.owner || 0,
    buyerCount: byType.buyer || 0,
    agentCount: byType.agent || 0,
  };
}

/** فلترة جهات الاتصال */
export function filterContacts(contacts, filters = {}) {
  let list = Array.isArray(contacts) ? [...contacts] : [];

  if (filters.type) {
    list = list.filter((c) => c.type === filters.type);
  }
  if (filters.city) {
    list = list.filter((c) => c.city === filters.city);
  }
  if (filters.search) {
    const s = filters.search.toLowerCase();
    list = list.filter(
      (c) =>
        (c.name || '').toLowerCase().includes(s) ||
        (c.phone || '').toLowerCase().includes(s) ||
        (c.email || '').toLowerCase().includes(s) ||
        (c.companyName || '').toLowerCase().includes(s) ||
        (c.idNumber || '').toLowerCase().includes(s) ||
        (c.city || '').toLowerCase().includes(s)
    );
  }

  return list;
}

/** القيم الافتراضية لجهة اتصال جديدة */
export function defaultContact() {
  return {
    name: '',
    type: 'tenant',
    phone: '',
    phone2: '',
    email: '',
    idNumber: '',
    idType: 'national_id',
    city: '',
    district: '',
    address: '',
    companyName: '',
    nationality: '',
    tags: '',
    notes: '',
  };
}
