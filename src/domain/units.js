// منطق الوحدات — دوال نقية بدون React أو side effects

import { UNIT_TYPES, UNIT_STATUSES } from '../constants/index.js';

export const UNIT_TYPE_OPTIONS = [
  { value: 'apartment', label: 'شقة', icon: '' },
  { value: 'shop', label: 'محل', icon: '' },
  { value: 'office', label: 'مكتب', icon: '' },
  { value: 'studio', label: 'استوديو', icon: '' },
  { value: 'room', label: 'غرفة', icon: '' },
  { value: 'other', label: 'أخرى', icon: '' },
];

export const UNIT_STATUS_OPTIONS = [
  { value: 'vacant', label: 'شاغرة', color: 'green' },
  { value: 'occupied', label: 'مؤجرة', color: 'blue' },
  { value: 'maintenance', label: 'صيانة', color: 'yellow' },
];

export function getUnitTypeLabel(type) {
  return UNIT_TYPES[type] || UNIT_TYPES.other;
}

export function getUnitStatusLabel(status) {
  return UNIT_STATUSES[status] || UNIT_STATUSES.vacant;
}

export function getUnitStatusColor(status) {
  const opt = UNIT_STATUS_OPTIONS.find((o) => o.value === status);
  return opt ? opt.color : 'gray';
}

export function validateUnit(unit) {
  const errors = [];
  const name = String(unit?.name ?? '').trim();
  const type = String(unit?.type ?? '').trim();

  if (!name) errors.push('اسم/رقم الوحدة مطلوب');
  if (!UNIT_TYPES[type]) errors.push('نوع الوحدة غير صالح');

  const numericFields = [
    ['areaSqm', 'المساحة يجب أن تكون رقماً موجباً'],
    ['rooms', 'عدد الغرف يجب أن يكون رقماً موجباً أو صفراً'],
    ['bathrooms', 'عدد الحمامات يجب أن يكون رقماً موجباً أو صفراً'],
    ['monthlyRent', 'الإيجار الشهري يجب أن يكون رقماً موجباً أو صفراً'],
  ];

  for (const [field, message] of numericFields) {
    if (unit?.[field] != null && unit[field] !== '') {
      const value = Number(unit[field]);
      if (!Number.isFinite(value) || value < 0) {
        errors.push(message);
      }
    }
  }

  const status = String(unit?.status ?? '').trim();
  if (status && !UNIT_STATUSES[status]) errors.push('حالة الوحدة غير صالحة');

  return { valid: errors.length === 0, errors };
}

export function defaultUnit(propertyId = '') {
  return {
    propertyId,
    name: '',
    type: 'apartment',
    floor: '',
    areaSqm: '',
    rooms: '',
    bathrooms: '',
    monthlyRent: '',
    status: 'vacant',
    notes: '',
  };
}

export function filterUnits(units, filters = {}) {
  let list = Array.isArray(units) ? [...units] : [];

  if (filters.propertyId) {
    list = list.filter((unit) => unit.propertyId === filters.propertyId);
  }
  if (filters.type) {
    list = list.filter((unit) => unit.type === filters.type);
  }
  if (filters.status) {
    list = list.filter((unit) => unit.status === filters.status);
  }
  if (filters.search) {
    const search = String(filters.search).toLowerCase();
    list = list.filter(
      (unit) =>
        String(unit.name || '')
          .toLowerCase()
          .includes(search) ||
        String(unit.floor || '')
          .toLowerCase()
          .includes(search) ||
        String(unit.notes || '')
          .toLowerCase()
          .includes(search)
    );
  }

  return list;
}

export function computeUnitsSummary(units) {
  const list = Array.isArray(units) ? units : [];
  const total = list.length;
  let vacantCount = 0;
  let occupiedCount = 0;
  let maintenanceCount = 0;
  let totalExpectedRent = 0;

  for (const unit of list) {
    const rent = Number(unit?.monthlyRent || 0);
    const status = unit?.status || 'vacant';

    totalExpectedRent += Number.isFinite(rent) ? rent : 0;

    if (status === 'vacant') vacantCount++;
    if (status === 'occupied') occupiedCount++;
    if (status === 'maintenance') maintenanceCount++;
  }

  return {
    total,
    vacantCount,
    occupiedCount,
    maintenanceCount,
    totalExpectedRent,
    occupancyRate: total > 0 ? Math.round((occupiedCount / total) * 100) : 0,
  };
}
