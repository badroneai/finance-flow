/*
  Domain: Charts
  Pure data preparation only — no UI.
*/

export function getMonthKey(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
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
    const m = months.find(mm => mm.key === mk);
    if (m) {
      if (t.type === 'income') m.income += t.amount;
      else m.expense += t.amount;
    }
  });

  const maxVal = Math.max(...months.map(m => Math.max(m.income, m.expense)), 1);
  return { months, maxVal };
}
