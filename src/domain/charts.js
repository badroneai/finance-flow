/*
  Domain: Charts
  Pure data preparation only — no UI.
*/

/**
 * Returns YYYY-MM for the given date string, or null if invalid.
 * Uses string parsing for YYYY-MM-DD to avoid timezone shifts.
 */
export function getMonthKey(dateStr) {
  if (dateStr == null || String(dateStr).trim() === '') return null;
  const part = String(dateStr).split('T')[0].trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(part)) return part.substring(0, 7);
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  if (!Number.isFinite(y) || !Number.isFinite(m)) return null;
  return `${y}-${String(m).padStart(2, '0')}`;
}

/**
 * يُرجع نطاق التواريخ الفعلي للحركات (أقدم شهر → أحدث شهر) لاستخدامه في الرسم
 * حتى يظهر الجدول الإحصائي كل البيانات (القديمة والجديدة).
 */
export function getDataDateRange(allTxs) {
  const list = Array.isArray(allTxs) ? allTxs : [];
  if (list.length === 0) return { from: null, to: null };
  const dates = list.map((t) => t.date).filter(Boolean);
  if (dates.length === 0) return { from: null, to: null };
  const minDate = dates.reduce((a, b) => (a <= b ? a : b));
  const maxDate = dates.reduce((a, b) => (a >= b ? a : b));
  const from = minDate.substring(0, 7) + '-01';
  const [y, m] = maxDate.split('-').map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  const to = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { from, to };
}

export function buildLast6MonthsIncomeExpenseChart(allTxs, nowDate = new Date(), locale = 'ar-SA') {
  const list = Array.isArray(allTxs) ? allTxs : [];
  const months = [];
  const now = nowDate;

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = getMonthKey(d.toISOString());
    const label = d.toLocaleDateString(locale, { month: 'short' });
    months.push({ key, label, income: 0, expense: 0 });
  }

  list.forEach(t => {
    const mk = getMonthKey(t.date);
    if (!mk) return;
    const m = months.find(mm => mm.key === mk);
    if (m) {
      if (t.type === 'income') m.income += t.amount;
      else m.expense += t.amount;
    }
  });

  const maxVal = Math.max(...months.map(m => Math.max(m.income, m.expense)), 1);
  return { months, maxVal };
}

/**
 * يبني بيانات الرسم لأشهر تحتوي على حركات فقط (لا يُظهر أشهراً فارغة).
 */
export function buildChartDataForRangeOnlyMonthsWithData(allTxs, locale = 'ar-SA') {
  const list = Array.isArray(allTxs) ? allTxs : [];
  const byMonth = new Map();
  list.forEach((t) => {
    const mk = getMonthKey(t.date);
    if (!mk) return;
    if (!byMonth.has(mk)) {
      const [y, m] = mk.split('-').map(Number);
      const d = new Date(y, m - 1, 1);
      byMonth.set(mk, { key: mk, label: d.toLocaleDateString(locale, { month: 'short' }), income: 0, expense: 0 });
    }
    const row = byMonth.get(mk);
    if (t.type === 'income') row.income += t.amount;
    else row.expense += t.amount;
  });
  const months = Array.from(byMonth.keys()).sort().map((k) => byMonth.get(k));
  const maxVal = Math.max(...months.map((m) => Math.max(m.income, m.expense)), 1);
  return { months, maxVal };
}

/**
 * يبني بيانات الرسم حسب نطاق تواريخ (من-إلى) ليتوافق مع الفترة المختارة في لوحة التحكم.
 * @param {Array} allTxs - قائمة الحركات (يُفضّل أن تكون مُفلترة مسبقاً بنفس النطاق)
 * @param {string} fromDate - YYYY-MM-DD
 * @param {string} toDate - YYYY-MM-DD
 * @param {string} locale
 */
export function buildChartDataForRange(allTxs, fromDate, toDate, locale = 'ar-SA') {
  const list = Array.isArray(allTxs) ? allTxs : [];
  const months = [];
  const from = fromDate ? new Date(fromDate + 'T00:00:00') : null;
  const to = toDate ? new Date(toDate + 'T23:59:59') : null;
  if (!from || !to || Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return { months: [], maxVal: 1 };
  }
  const cur = new Date(from.getFullYear(), from.getMonth(), 1);
  const end = new Date(to.getFullYear(), to.getMonth(), 1);
  while (cur.getTime() <= end.getTime()) {
    const key = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}`;
    const label = cur.toLocaleDateString(locale, { month: 'short' });
    months.push({ key, label, income: 0, expense: 0 });
    cur.setMonth(cur.getMonth() + 1);
  }
  list.forEach(t => {
    const mk = getMonthKey(t.date);
    if (!mk) return;
    const m = months.find(mm => mm.key === mk);
    if (m) {
      if (t.type === 'income') m.income += t.amount;
      else m.expense += t.amount;
    }
  });
  const maxVal = Math.max(...months.map(m => Math.max(m.income, m.expense)), 1);
  return { months, maxVal };
}
