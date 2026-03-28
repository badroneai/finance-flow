// منطق العقارات — دوال نقية بدون React أو side effects (SPR-018)

import { PROPERTY_TYPES, PROPERTY_STATUSES } from '../constants/index.js';

/** أنواع العقارات مع أيقونات */
export const PROPERTY_TYPE_OPTIONS = [
  { value: 'apartment', label: 'شقة', icon: '🏠' },
  { value: 'villa', label: 'فيلا', icon: '🏡' },
  { value: 'building', label: 'عمارة', icon: '🏬' },
  { value: 'office', label: 'مكتب', icon: '🏢' },
  { value: 'chalet', label: 'شاليه', icon: '🏖️' },
  { value: 'land', label: 'أرض', icon: '🗺️' },
  { value: 'warehouse', label: 'مستودع', icon: '🏭' },
  { value: 'other', label: 'أخرى', icon: '📁' },
];

/** حالات العقار مع الألوان */
export const PROPERTY_STATUS_OPTIONS = [
  { value: 'available', label: 'متاح', color: 'green' },
  { value: 'rented', label: 'مؤجر', color: 'blue' },
  { value: 'maintenance', label: 'صيانة', color: 'yellow' },
  { value: 'sold', label: 'مباع', color: 'gray' },
];

/** أبرز المدن السعودية */
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

/** ترجمة نوع العقار */
export function getPropertyTypeLabel(type) {
  return PROPERTY_TYPES[type] || PROPERTY_TYPES.other;
}

/** أيقونة نوع العقار */
export function getPropertyTypeIcon(type) {
  const opt = PROPERTY_TYPE_OPTIONS.find((o) => o.value === type);
  return opt ? opt.icon : '📁';
}

/** ترجمة حالة العقار */
export function getPropertyStatusLabel(status) {
  return PROPERTY_STATUSES[status] || PROPERTY_STATUSES.available;
}

/** لون حالة العقار */
export function getPropertyStatusColor(status) {
  const opt = PROPERTY_STATUS_OPTIONS.find((o) => o.value === status);
  return opt ? opt.color : 'gray';
}

/** التحقق من صحة بيانات العقار قبل الحفظ */
export function validateProperty(property) {
  const errors = [];
  const name = String(property?.name ?? '').trim();
  if (!name) errors.push('اسم العقار مطلوب');
  if (name.length > 100) errors.push('اسم العقار يجب أن يكون أقل من 100 حرف');

  const type = String(property?.type ?? '').trim();
  if (!PROPERTY_TYPES[type]) errors.push('نوع العقار غير صالح');

  const status = String(property?.status ?? '').trim();
  if (status && !PROPERTY_STATUSES[status]) errors.push('حالة العقار غير صالحة');

  if (property?.unitsCount != null) {
    const units = Number(property.unitsCount);
    if (!Number.isFinite(units) || units < 1) errors.push('عدد الوحدات يجب أن يكون 1 على الأقل');
  }

  if (property?.areaSqm != null && property.areaSqm !== '') {
    const area = Number(property.areaSqm);
    if (!Number.isFinite(area) || area < 0) errors.push('المساحة يجب أن تكون رقماً موجباً');
  }

  if (property?.monthlyRent != null && property.monthlyRent !== '') {
    const rent = Number(property.monthlyRent);
    if (!Number.isFinite(rent) || rent < 0) errors.push('الإيجار يجب أن يكون رقماً موجباً');
  }

  if (property?.purchasePrice != null && property.purchasePrice !== '') {
    const price = Number(property.purchasePrice);
    if (!Number.isFinite(price) || price < 0) errors.push('سعر الشراء يجب أن يكون رقماً موجباً');
  }

  return { valid: errors.length === 0, errors };
}

/** بناء ملخص العقارات */
export function computePropertiesSummary(properties) {
  const list = Array.isArray(properties) ? properties : [];
  const total = list.length;
  const byType = {};
  const byStatus = {};
  let totalMonthlyRent = 0;
  let rentedCount = 0;

  for (const p of list) {
    const t = p.type || 'other';
    const s = p.status || 'available';
    byType[t] = (byType[t] || 0) + 1;
    byStatus[s] = (byStatus[s] || 0) + 1;
    if (s === 'rented' && p.monthlyRent) {
      totalMonthlyRent += Number(p.monthlyRent) || 0;
      rentedCount++;
    }
  }

  return {
    total,
    byType,
    byStatus,
    totalMonthlyRent,
    rentedCount,
    availableCount: byStatus.available || 0,
    maintenanceCount: byStatus.maintenance || 0,
    occupancyRate: total > 0 ? Math.round((rentedCount / total) * 100) : 0,
  };
}

/** فلترة العقارات */
export function filterProperties(properties, filters = {}) {
  let list = Array.isArray(properties) ? [...properties] : [];

  if (filters.type) {
    list = list.filter((p) => p.type === filters.type);
  }
  if (filters.status) {
    list = list.filter((p) => p.status === filters.status);
  }
  if (filters.city) {
    list = list.filter((p) => p.city === filters.city);
  }
  if (filters.search) {
    const s = filters.search.toLowerCase();
    list = list.filter(
      (p) =>
        (p.name || '').toLowerCase().includes(s) ||
        (p.district || '').toLowerCase().includes(s) ||
        (p.ownerName || '').toLowerCase().includes(s) ||
        (p.city || '').toLowerCase().includes(s)
    );
  }

  return list;
}

/** القيم الافتراضية لعقار جديد */
export function defaultProperty() {
  return {
    name: '',
    type: 'apartment',
    status: 'available',
    city: '',
    district: '',
    address: '',
    unitsCount: 1,
    areaSqm: '',
    bedrooms: '',
    bathrooms: '',
    yearBuilt: '',
    floors: '',
    ownerName: '',
    ownerPhone: '',
    purchasePrice: '',
    monthlyRent: '',
    notes: '',
  };
}
