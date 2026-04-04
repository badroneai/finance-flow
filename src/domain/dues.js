// طبقة المستحقات الموحدة — تجمع استحقاقات العقود النشطة في قوائم تشغيلية
// دوال نقية بدون React أو side effects

import { buildContractSchedule } from './contract-finance.js';
import { safeNum } from '../utils/helpers.js';

/**
 * تحويل تاريخ إلى صيغة YYYY-MM-DD
 * @param {Date} date
 * @returns {string}
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * حساب عدد أيام التأخير من تاريخ الاستحقاق
 * @param {string} dueDate - تاريخ الاستحقاق بصيغة YYYY-MM-DD
 * @param {string} todayStr - تاريخ اليوم بصيغة YYYY-MM-DD
 * @returns {number} عدد أيام التأخير (0 أو أكبر)
 */
function calcDaysOverdue(dueDate, todayStr) {
  if (!dueDate || !todayStr) return 0;
  const due = new Date(`${dueDate}T00:00:00`);
  const today = new Date(`${todayStr}T00:00:00`);
  if (Number.isNaN(due.getTime()) || Number.isNaN(today.getTime())) return 0;
  const diff = Math.floor((today.getTime() - due.getTime()) / 86400000);
  return Math.max(0, diff);
}

/**
 * حساب عدد الأيام حتى الاستحقاق
 * @param {string} dueDate
 * @param {string} todayStr
 * @returns {number}
 */
function calcDaysUntil(dueDate, todayStr) {
  if (!dueDate || !todayStr) return 0;
  const due = new Date(`${dueDate}T00:00:00`);
  const today = new Date(`${todayStr}T00:00:00`);
  if (Number.isNaN(due.getTime()) || Number.isNaN(today.getTime())) return 0;
  return Math.floor((due.getTime() - today.getTime()) / 86400000);
}

/**
 * حساب عدد الأيام المتبقية من تاريخ المرجع حتى تاريخ الانتهاء
 * (بديل محلي لـ daysRemaining يقبل referenceDate لضمان النقاء)
 * @param {string} endDate - تاريخ الانتهاء بصيغة YYYY-MM-DD
 * @param {Date} referenceDate - تاريخ المرجع
 * @returns {number|null}
 */
function daysRemainingFrom(endDate, referenceDate) {
  if (!endDate) return null;
  const end = new Date(`${endDate}T00:00:00`);
  if (Number.isNaN(end.getTime())) return null;
  const ref = new Date(referenceDate);
  ref.setHours(0, 0, 0, 0);
  return Math.ceil((end.getTime() - ref.getTime()) / 86400000);
}

/**
 * بناء خريطة بحث سريعة بالمعرف
 * @param {Array} items
 * @returns {Map}
 */
function buildLookup(items) {
  return new Map((Array.isArray(items) ? items : []).map((item) => [item.id, item]));
}

/**
 * حساب نهاية الأسبوع التقويمية (السبت) من تاريخ مرجعي
 * يطابق تعريف inbox-engine.js: الأسبوع من الأحد إلى السبت
 * @param {Date} ref - تاريخ المرجع
 * @returns {string} تاريخ نهاية الأسبوع بصيغة YYYY-MM-DD
 */
function calendarWeekEnd(ref) {
  const d = new Date(ref);
  const dayOfWeek = d.getDay(); // 0=الأحد
  // بداية الأسبوع (الأحد)
  const diff = dayOfWeek === 0 ? 0 : -dayOfWeek;
  d.setDate(d.getDate() + diff);
  // نهاية الأسبوع (السبت) = بداية + 6
  d.setDate(d.getDate() + 6);
  return formatDate(d);
}

/**
 * قراءة حقل مع دعم camelCase و snake_case احترازياً
 * DataContext يحوّل كل شيء لـ camelCase، لكن هذا دفاع إضافي
 * @param {Object} obj
 * @param {string} camelKey - المفتاح بصيغة camelCase
 * @param {string} snakeKey - المفتاح بصيغة snake_case
 * @returns {*}
 */
function field(obj, camelKey, snakeKey) {
  if (!obj) return undefined;
  return obj[camelKey] !== undefined ? obj[camelKey] : obj[snakeKey];
}

/**
 * تجميع مستحقات العقود النشطة في قوائم تشغيلية
 *
 * @param {Object} params
 * @param {Array} params.contracts - قائمة العقود
 * @param {Array} params.contractPayments - قائمة دفعات العقود
 * @param {Array} params.contacts - قائمة جهات الاتصال
 * @param {Array} params.properties - قائمة العقارات
 * @param {Array} params.units - قائمة الوحدات
 * @param {Date} [params.referenceDate] - تاريخ المرجع (افتراضياً اليوم)
 * @returns {Object} القوائم التشغيلية: overdue, dueToday, dueThisWeek, dueNext30Days, summary
 */
export function buildOperationalDues({
  contracts,
  contractPayments,
  contacts,
  properties,
  units,
  referenceDate,
}) {
  const ref = referenceDate || new Date();
  const todayStr = formatDate(ref);

  // نهاية الأسبوع التقويمية (الأحد–السبت) — يطابق inbox-engine.js
  const weekEndStr = calendarWeekEnd(ref);

  // حساب نهاية 30 يوم
  const month30 = new Date(ref);
  month30.setDate(month30.getDate() + 30);
  const month30Str = formatDate(month30);

  // خرائط بحث سريعة
  const contactMap = buildLookup(contacts);
  const propertyMap = buildLookup(properties);
  const unitMap = buildLookup(units);

  // تصنيف الدفعات حسب العقد — مع دعم snake_case احترازياً
  const paymentsByContract = {};
  for (const p of Array.isArray(contractPayments) ? contractPayments : []) {
    const cid = field(p, 'contractId', 'contract_id');
    if (!cid) continue;
    if (!paymentsByContract[cid]) paymentsByContract[cid] = [];
    paymentsByContract[cid].push(p);
  }

  // القوائم التشغيلية
  const overdue = [];
  const dueToday = [];
  const dueThisWeek = [];
  const dueNext30Days = [];

  // معالجة كل عقد نشط
  const activeContracts = (Array.isArray(contracts) ? contracts : []).filter(
    (c) => c.status === 'active'
  );

  for (const contract of activeContracts) {
    const payments = paymentsByContract[contract.id] || [];
    const schedule = buildContractSchedule(contract, payments, ref);

    // معلومات مرجعية — مع دعم snake_case احترازياً
    const contactId = field(contract, 'contactId', 'contact_id');
    const propertyId = field(contract, 'propertyId', 'property_id');
    const unitId = field(contract, 'unitId', 'unit_id');

    const contact = contactId ? contactMap.get(contactId) : null;
    const property = propertyId ? propertyMap.get(propertyId) : null;
    const unit = unitId ? unitMap.get(unitId) : null;

    const tenantName = contact?.name || '';
    const propertyName = property?.name || '';
    const unitName = unit?.name || '';

    for (const due of schedule) {
      // تخطي المدفوع بالكامل
      if (due.status === 'paid') continue;

      // استخراج تاريخ آخر دفعة — للـ rollback الآمن عند فشل الحركة المالية
      const lastPayment = due.payments?.length ? due.payments[due.payments.length - 1] : null;

      const dueItem = {
        contractId: contract.id,
        dueId: due.id,
        tenantName,
        propertyName,
        unitName,
        amount: safeNum(due.amount),
        remainingAmount: safeNum(due.remainingAmount),
        paidAmount: safeNum(due.paidAmount),
        paidDate: lastPayment?.date || null,
        dueDate: due.dueDate,
        daysOverdue: calcDaysOverdue(due.dueDate, todayStr),
        daysUntil: calcDaysUntil(due.dueDate, todayStr),
        status: due.status,
        installmentNumber: due.installmentNumber,
        contractNumber: field(contract, 'contractNumber', 'contract_number') || '',
        contractType: contract.type || 'rent',
        // مسار التنقل لصفحة العقد
        actionTarget: `/contracts/${contract.id}`,
      };

      // تصنيف حسب الموعد
      if (due.dueDate < todayStr) {
        // متأخر
        overdue.push(dueItem);
      } else if (due.dueDate === todayStr) {
        // مستحق اليوم
        dueToday.push(dueItem);
      } else if (due.dueDate <= weekEndStr) {
        // مستحق هذا الأسبوع (حتى نهاية الأسبوع التقويمية)
        dueThisWeek.push(dueItem);
      } else if (due.dueDate <= month30Str) {
        // مستحق خلال 30 يوم
        dueNext30Days.push(dueItem);
      }
    }
  }

  // ترتيب: المتأخر الأقدم أولاً، القادم الأقرب أولاً
  overdue.sort((a, b) => b.daysOverdue - a.daysOverdue);
  dueToday.sort((a, b) => b.remainingAmount - a.remainingAmount);
  dueThisWeek.sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));
  dueNext30Days.sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));

  // ملخص مالي
  const summary = {
    overdueCount: overdue.length,
    overdueTotal: overdue.reduce((s, d) => s + d.remainingAmount, 0),
    dueTodayCount: dueToday.length,
    dueTodayTotal: dueToday.reduce((s, d) => s + d.remainingAmount, 0),
    dueThisWeekCount: dueThisWeek.length,
    dueThisWeekTotal: dueThisWeek.reduce((s, d) => s + d.remainingAmount, 0),
    dueNext30DaysCount: dueNext30Days.length,
    dueNext30DaysTotal: dueNext30Days.reduce((s, d) => s + d.remainingAmount, 0),
  };

  // إجمالي كل المستحقات غير المسددة
  summary.totalCount =
    summary.overdueCount +
    summary.dueTodayCount +
    summary.dueThisWeekCount +
    summary.dueNext30DaysCount;
  summary.totalAmount =
    summary.overdueTotal +
    summary.dueTodayTotal +
    summary.dueThisWeekTotal +
    summary.dueNext30DaysTotal;

  return { overdue, dueToday, dueThisWeek, dueNext30Days, summary };
}

/**
 * جلب العقود التي تنتهي قريباً (خلال عدد أيام محدد)
 * دالة نقية — تقبل referenceDate لضمان ثبات الاختبارات
 *
 * @param {Object} params
 * @param {Array} params.contracts - قائمة العقود
 * @param {Array} params.contacts - قائمة جهات الاتصال
 * @param {Array} params.properties - قائمة العقارات
 * @param {number} [params.thresholdDays=30] - عدد أيام العتبة
 * @param {Date} [params.referenceDate] - تاريخ المرجع (افتراضياً اليوم)
 * @returns {Array} قائمة العقود المنتهية قريباً مع تفاصيل إضافية
 */
export function getExpiringContracts({
  contracts,
  contacts,
  properties,
  thresholdDays = 30,
  referenceDate,
}) {
  const ref = referenceDate || new Date();
  const contactMap = buildLookup(contacts);
  const propertyMap = buildLookup(properties);

  const result = [];

  for (const contract of Array.isArray(contracts) ? contracts : []) {
    if (contract.status !== 'active') continue;

    const endDate = field(contract, 'endDate', 'end_date');
    const remaining = daysRemainingFrom(endDate, ref);
    if (remaining === null || remaining <= 0 || remaining > thresholdDays) continue;

    const contactId = field(contract, 'contactId', 'contact_id');
    const propertyId = field(contract, 'propertyId', 'property_id');
    const contact = contactId ? contactMap.get(contactId) : null;
    const property = propertyId ? propertyMap.get(propertyId) : null;

    result.push({
      contractId: contract.id,
      contractNumber: field(contract, 'contractNumber', 'contract_number') || '',
      tenantName: contact?.name || '',
      propertyName: property?.name || '',
      endDate,
      daysRemaining: remaining,
      type: contract.type || 'rent',
      actionTarget: `/contracts/${contract.id}`,
    });
  }

  // الأقرب انتهاءً أولاً
  result.sort((a, b) => (a.daysRemaining ?? 999) - (b.daysRemaining ?? 999));

  return result;
}
