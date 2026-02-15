/**
 * inbox-engine.js — محرك صندوق الوارد المالي (برومبت 2.1)
 * يحسب المستحقات: متأخرة، هذا الأسبوع، هذا الشهر، مع مطابقة الحركات للمدفوع.
 *
 * - يستخدم ledger-store.js للالتزامات المتكررة
 * - يطابق المستحقات مع الحركات (meta.recurringId + date) لتحديد المدفوع
 * - التواريخ بتوقيت Asia/Riyadh
 * - ترتيب: overdue الأقدم أولاً، thisWeek/thisMonth الأقرب أولاً
 */

import { getRecurringItems } from './ledger-store.js';
import { dataStore } from './dataStore.js';

const TZ = 'Asia/Riyadh';
const DAY_MS = 24 * 60 * 60 * 1000;

/** YYYY-MM-DD في توقيت الرياض */
function dateStrRiyadh(d = new Date()) {
  try {
    const s = new Date(d).toLocaleString('en-CA', { timeZone: TZ });
    return String(s).slice(0, 10);
  } catch {
    const x = new Date(d);
    const y = x.getFullYear();
    const m = String(x.getMonth() + 1).padStart(2, '0');
    const day = String(x.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}

function parseDateStr(str) {
  const s = String(str || '').trim();
  if (!s) return null;
  const ms = new Date(s + 'T00:00:00').getTime();
  return Number.isNaN(ms) ? null : ms;
}

/** إضافة أشهر لتاريخ YYYY-MM-DD (بنفس اليوم إن أمكن) */
function addMonths(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return dateStr;
  d.setMonth(d.getMonth() + Number(n));
  return dateStrRiyadh(d);
}

/** إضافة 3 أشهر */
function addQuarters(dateStr, n) {
  return addMonths(dateStr, 3 * Number(n));
}

/** إضافة سنة */
function addYears(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return dateStr;
  d.setFullYear(d.getFullYear() + Number(n));
  return dateStrRiyadh(d);
}

/** بداية اليوم (00:00) بالمللي ثانية من تاريخ YYYY-MM-DD في الرياض */
function startOfDayMs(dateStr) {
  const ms = parseDateStr(dateStr);
  return ms != null ? ms : null;
}

/** تقدم تاريخ الاستحقاق التالي حسب التكرار */
function nextDueByFrequency(dateStr, frequency) {
  const f = String(frequency || '').toLowerCase();
  if (f === 'yearly') return addYears(dateStr, 1);
  if (f === 'quarterly') return addQuarters(dateStr, 1);
  if (f === 'weekly') {
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() + 7);
    return dateStrRiyadh(d);
  }
  if (f === 'monthly') return addMonths(dateStr, 1);
  return addMonths(dateStr, 1);
}

/** الرجوع بتاريخ الاستحقاق السابق حسب التكرار */
function prevDueByFrequency(dateStr, frequency) {
  const f = String(frequency || '').toLowerCase();
  if (f === 'yearly') return addYears(dateStr, -1);
  if (f === 'quarterly') return addQuarters(dateStr, -1);
  if (f === 'weekly') {
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() - 7);
    return dateStrRiyadh(d);
  }
  if (f === 'monthly') return addMonths(dateStr, -1);
  return addMonths(dateStr, -1);
}

/** دخل من الصنف؟ */
function isIncomeCategory(category) {
  const c = String(category || '').toLowerCase();
  return c === 'income' || c === 'دخل' || c === 'commission' || c === 'عمولة' || c === 'deposit' || c === 'إيداع';
}

/** نوع المستحق: income | expense */
function dueType(recurringItem) {
  return isIncomeCategory(recurringItem?.category) ? 'income' : 'expense';
}

/** أولوية: critical | high | medium */
function duePriority(dueDateStr, todayStr, riskLevel) {
  const dueMs = parseDateStr(dueDateStr);
  const todayMs = parseDateStr(todayStr);
  if (dueMs == null || todayMs == null) return 'medium';
  const daysOverdue = Math.floor((todayMs - dueMs) / DAY_MS);
  const risk = String(riskLevel || '').toLowerCase();
  if (daysOverdue > 7 || (daysOverdue > 0 && risk === 'high')) return 'critical';
  if (daysOverdue > 0) return 'high';
  return 'medium';
}

/** حركات الدفتر فقط */
function getTransactionsForLedger(ledgerId) {
  const lid = String(ledgerId || '').trim();
  if (!lid) return [];
  const all = (dataStore.transactions?.list?.() || []).filter(Boolean);
  return all.filter((t) => String(t?.ledgerId || t?.meta?.ledgerId || '') === lid);
}

/** هل استحقاق معيّن (recurringId + dueDate) مدفوع؟ يطابق حركة بنفس recurringId وتاريخ الدفعة = dueDate أو بعدها ضمن نفس الدورة */
function isDuePaid(transactions, recurringId, dueDateStr, nextDueStr) {
  const rid = String(recurringId || '');
  const from = dueDateStr;
  const to = nextDueStr || '9999-12-31';
  return (transactions || []).some((t) => {
    const tid = String(t?.meta?.recurringId || '').trim();
    if (tid !== rid) return false;
    const txDate = (t.date || '').slice(0, 10);
    return txDate >= from && txDate < to;
  });
}

/**
 * تحويل التزامات متكررة إلى مستحقات بين fromDate و toDate
 * يستبعد المستحقات المدفوعة (مطابقة حركة بنفس recurringId وتاريخ ضمن النافذة)
 *
 * @param {Array} recurringItems - مصفوفة الالتزامات المتكررة (تُفلتر حسب ledgerId لاحقاً عند الاستدعاء)
 * @param {string} fromDate - YYYY-MM-DD
 * @param {string} toDate - YYYY-MM-DD
 * @param {Array} [transactions] - حركات الدفتر (إن لم تُمرَّر تُقرأ من dataStore - يحتاج ledgerId)
 * @param {string} [ledgerId] - لفلترة الالتزامات وقراءة الحركات
 * @returns {Array} مصفوفة مستحقات غير مدفوعة { id, name, amount, type, dueDate, daysOverdue, recurringItemId, priority }
 */
export function expandRecurringToDues(recurringItems, fromDate, toDate, transactions, ledgerId) {
  const from = String(fromDate || '').trim();
  const to = String(toDate || '').trim();
  if (!from || !to) return [];

  const list = (Array.isArray(recurringItems) ? recurringItems : []).filter(
    (r) => r && Number(r?.amount) !== 0
  );
  const lid = String(ledgerId || '').trim();
  const txs = Array.isArray(transactions)
    ? transactions
    : lid
      ? getTransactionsForLedger(lid)
      : [];
  const todayStr = dateStrRiyadh();
  const fromMs = parseDateStr(from);
  const toMs = parseDateStr(to);
  if (fromMs == null || toMs == null) return [];

  const dues = [];

  for (const r of list) {
    if (lid && String(r?.ledgerId || '') !== lid) continue;

    let cur = String(r?.nextDueDate || '').trim();
    if (!cur) continue;

    const freq = String(r?.frequency || 'monthly').toLowerCase();
    const amount = Number(r?.amount) || 0;
    const name = r?.title || '—';
    const type = dueType(r);
    const recurringItemId = r?.id || '';

    while (cur && parseDateStr(cur) > fromMs) {
      cur = prevDueByFrequency(cur, freq);
    }
    if (!cur) continue;
    if (parseDateStr(cur) < fromMs) cur = nextDueByFrequency(cur, freq);

    while (cur && parseDateStr(cur) <= toMs) {
      const dueMs = parseDateStr(cur);
      if (dueMs == null) break;
      if (dueMs >= fromMs) {
        const nextDue = nextDueByFrequency(cur, freq);
        const paid = isDuePaid(txs, recurringItemId, cur, nextDue);
        if (!paid) {
          const todayMs = parseDateStr(todayStr);
          const daysOverdue = todayMs != null ? Math.max(0, Math.floor((todayMs - dueMs) / DAY_MS)) : 0;
          dues.push({
            id: `due_${recurringItemId}_${cur}`,
            name,
            amount,
            type,
            dueDate: cur,
            daysOverdue,
            recurringItemId,
            priority: duePriority(cur, todayStr, r?.riskLevel),
          });
        }
      }
      cur = nextDueByFrequency(cur, freq);
    }
  }

  return dues;
}

/**
 * حساب صندوق الوارد للدفتر
 *
 * @param {string} ledgerId - معرّف الدفتر
 * @returns {Object} { overdue, thisWeek, thisMonth, summary }
 */
export function calculateInbox(ledgerId) {
  const lid = String(ledgerId || '').trim();
  const recurringItems = (getRecurringItems() || []).filter((r) => String(r?.ledgerId || '') === lid);
  const transactions = getTransactionsForLedger(lid);

  const todayStr = dateStrRiyadh();
  const todayMs = parseDateStr(todayStr) || 0;

  const now = new Date();
  const weekStart = new Date(now);
  const dayOfWeek = weekStart.getDay();
  const diff = dayOfWeek === 0 ? 0 : -dayOfWeek;
  weekStart.setDate(weekStart.getDate() + diff);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekEndStr = dateStrRiyadh(weekEnd);
  const weekStartStr = dateStrRiyadh(weekStart);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const monthStartStr = dateStrRiyadh(monthStart);
  const monthEndStr = dateStrRiyadh(monthEnd);

  const fromDate = addMonths(todayStr, -12);
  const toDate = addMonths(monthEndStr, 1);

  const allDues = expandRecurringToDues(recurringItems, fromDate, toDate, transactions, lid);

  const overdue = allDues
    .filter((d) => d.dueDate < todayStr)
    .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));

  const thisWeek = allDues
    .filter((d) => d.dueDate >= todayStr && d.dueDate <= weekEndStr)
    .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));

  const thisMonth = allDues
    .filter((d) => d.dueDate > weekEndStr && d.dueDate <= monthEndStr)
    .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));

  const sumAmount = (arr) => arr.reduce((s, d) => s + (Number(d.amount) || 0), 0);

  return {
    overdue,
    thisWeek,
    thisMonth,
    summary: {
      totalOverdue: overdue.length,
      totalOverdueAmount: sumAmount(overdue),
      totalThisWeek: thisWeek.length,
      totalThisWeekAmount: sumAmount(thisWeek),
      totalThisMonth: thisMonth.length,
      totalThisMonthAmount: sumAmount(thisMonth),
    },
  };
}
