/*
  Domain: Reports/Stats
  Pure helpers only — no UI.
*/

export function getDashboardDateRange(periodType, fromDate, toDate, nowDate = new Date()) {
  const now = nowDate;
  if (periodType === 'thisMonth') {
    return {
      from: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`,
      to: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-31`,
    };
  }
  if (periodType === 'last3') {
    const d = new Date(now);
    d.setMonth(d.getMonth() - 3);
    return { from: d.toISOString().split('T')[0], to: now.toISOString().split('T')[0] };
  }
  if (periodType === 'last6') {
    const d = new Date(now);
    d.setMonth(d.getMonth() - 6);
    return { from: d.toISOString().split('T')[0], to: now.toISOString().split('T')[0] };
  }
  if (periodType === 'thisYear') {
    return { from: `${now.getFullYear()}-01-01`, to: `${now.getFullYear()}-12-31` };
  }
  if (periodType === 'custom') {
    return { from: fromDate, to: toDate };
  }
  return { from: '', to: '' };
}

export function computeIncomeExpenseNet(txs) {
  const list = Array.isArray(txs) ? txs : [];
  const income = list.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = list.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const net = income - expense;
  return { income, expense, net };
}

export function splitCommissionsByStatus(allCms) {
  const list = Array.isArray(allCms) ? allCms : [];
  const pendingCms = list.filter(c => c.status === 'pending');
  const paidCms = list.filter(c => c.status === 'paid');
  return { pendingCms, paidCms };
}

export function computeCommissionOfficeTotals(pendingCms, paidCms) {
  const pendingTotal = (Array.isArray(pendingCms) ? pendingCms : []).reduce(
    (s, c) => s + (c.dealValue * c.officePercent) / 100,
    0
  );
  const paidTotal = (Array.isArray(paidCms) ? paidCms : []).reduce(
    (s, c) => s + (c.dealValue * c.officePercent) / 100,
    0
  );
  return { pendingTotal, paidTotal };
}
