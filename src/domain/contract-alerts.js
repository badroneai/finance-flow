/**
 * contract-alerts.js — تنبيهات العقود (SPR-018: المرحلة 1، الخطوة 4)
 * دوال نقية بدون React — تولّد تنبيهات بنفس شكل alert-engine.js
 * الشكل: { id, type, severity, title, amount?, dueDate?, actionLabel, actionType }
 */

const DAY_MS = 24 * 60 * 60 * 1000;

function todayKey(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function daysUntil(dateStr, now = new Date()) {
  if (!dateStr) return null;
  const end = new Date(String(dateStr).slice(0, 10) + 'T00:00:00');
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.ceil((end.getTime() - today.getTime()) / DAY_MS);
}

function formatDateAr(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * تولّد تنبيهات العقود العقارية
 * @param {Array} contracts - مصفوفة العقود من DataContext
 * @param {Array} [properties] - مصفوفة العقارات (لإثراء الأسماء)
 * @param {Array} [contacts] - مصفوفة جهات الاتصال (لإثراء الأسماء)
 * @param {Object} [opts] - { now, expiringThresholdDays }
 * @returns {Array} تنبيهات بنفس شكل alert-engine
 */
export function generateContractAlerts(contracts, properties = [], contacts = [], opts = {}) {
  const list = Array.isArray(contracts) ? contracts : [];
  if (list.length === 0) return [];

  const now = opts.now || new Date();
  const threshold = opts.expiringThresholdDays || 30;
  const alerts = [];

  // خرائط أسماء سريعة
  const propMap = new Map((Array.isArray(properties) ? properties : []).map((p) => [p.id, p.name]));
  const contactMap = new Map((Array.isArray(contacts) ? contacts : []).map((c) => [c.id, c.name]));

  for (const c of list) {
    // نتجاهل العقود غير السارية
    if (c.status !== 'active') continue;

    const endDate = String(c.endDate || c.end_date || '').slice(0, 10);
    if (!endDate) continue;

    const remaining = daysUntil(endDate, now);
    if (remaining === null) continue;

    const propName = propMap.get(c.propertyId || c.property_id) || c._propertyName || 'عقار';
    const contactName = contactMap.get(c.contactId || c.contact_id) || c._contactName || '';
    const endLabel = formatDateAr(endDate);

    // 1. عقد منتهي (سارٍ لكن تاريخ النهاية فات)
    if (remaining <= 0) {
      const overdueDays = Math.abs(remaining);
      alerts.push({
        id: `contract_expired_${c.id}`,
        type: 'contract_expired',
        severity: 'critical',
        title: `عقد "${propName}" منتهي منذ ${overdueDays} يوم${contactName ? ` — ${contactName}` : ''}`,
        amount: Number(c.monthlyRent || c.monthly_rent || 0),
        dueDate: endDate,
        actionLabel: 'راجع العقد',
        actionType: 'view_contract',
      });
      continue; // لا نظهر تنبيه انتهاء قريب أيضاً
    }

    // 2. عقد ينتهي قريباً (أقل من threshold يوم)
    if (remaining <= threshold) {
      const sev = remaining <= 7 ? 'critical' : 'warning';
      alerts.push({
        id: `contract_expiring_${c.id}`,
        type: 'contract_expiring',
        severity: sev,
        title: `عقد "${propName}" ينتهي خلال ${remaining} يوم (${endLabel})${contactName ? ` — ${contactName}` : ''}`,
        amount: Number(c.monthlyRent || c.monthly_rent || 0),
        dueDate: endDate,
        actionLabel: remaining <= 7 ? 'جدّد العقد' : 'راجع العقد',
        actionType: 'view_contract',
      });
    }
  }

  return alerts;
}
