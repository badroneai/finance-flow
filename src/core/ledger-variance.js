/*
  Ledger Performance v5 — Income model + Expected vs Actual + Variance + Targets (Pure)

  Constraints:
  - Pure functions only
  - No storage reads/writes
  - No external libs
*/

const isValidMonthKey = (k) => /^\d{4}-\d{2}$/.test(String(k || ''));

const monthKeyFromISODate = (s) => {
  const x = String(s || '').trim();
  if (!x) return null;
  // expected format YYYY-MM-DD
  const m = x.slice(0, 7);
  return isValidMonthKey(m) ? m : null;
};

const lastNMonthKeys = (n = 4) => {
  const list = [];
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  for (let i = n - 1; i >= 0; i--) {
    const x = new Date(d.getTime());
    x.setMonth(d.getMonth() - i);
    const key = `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}`;
    list.push(key);
  }
  return list;
};

export function computeActualsByMonth(transactions = [], ledgerId) {
  const lid = String(ledgerId || '').trim();
  const months = {};
  const list = Array.isArray(transactions) ? transactions : [];

  for (const t of list) {
    if (String(t?.meta?.ledgerId || '') !== lid) continue;
    const key = monthKeyFromISODate(t?.date);
    if (!key) continue;

    const amount = Number(t?.amount) || 0;
    const type = String(t?.type || '').toLowerCase();

    // App uses positive amounts; type determines direction.
    const isIncome = type === 'income';
    const isExpense = type === 'expense';

    if (!months[key]) months[key] = { income: 0, expense: 0, net: 0 };

    if (isIncome) months[key].income += amount;
    else if (isExpense) months[key].expense += amount;
    else {
      // fallback: if type missing, infer by sign
      if (amount >= 0) months[key].income += amount;
      else months[key].expense += Math.abs(amount);
    }

    months[key].net = months[key].income - months[key].expense;
  }

  return { months };
}

export function computeExpectedByMonth(forecast6mOutput = [], incomeModelFn = null) {
  const expected = {};
  const list = Array.isArray(forecast6mOutput) ? forecast6mOutput : [];

  for (const row of list) {
    const key = String(row?.monthKey || '').trim();
    if (!isValidMonthKey(key)) continue;

    const expectedExpense = Number(row?.expectedOutflow) || 0;
    const expectedIncome = typeof incomeModelFn === 'function' ? (Number(incomeModelFn(key)) || 0) : 0;
    const expectedNet = expectedIncome - expectedExpense;

    expected[key] = { income: expectedIncome, expense: expectedExpense, net: expectedNet, byCategory: row?.byCategory || null };
  }

  return { months: expected };
}

export function variance(expectedRow = null, actualRow = null) {
  const e = expectedRow || { income: 0, expense: 0, net: 0, byCategory: null };
  const a = actualRow || { income: 0, expense: 0, net: 0 };

  const varianceIncome = (Number(a.income) || 0) - (Number(e.income) || 0);
  const varianceExpense = (Number(a.expense) || 0) - (Number(e.expense) || 0);
  const varianceNet = (Number(a.net) || 0) - (Number(e.net) || 0);

  // Likely reason (simple):
  const reasons = [];
  if (varianceExpense > 0) {
    const by = e.byCategory && typeof e.byCategory === 'object' ? e.byCategory : null;
    if (by) {
      const top = Object.entries(by).sort((x, y) => (Number(y[1]) || 0) - (Number(x[1]) || 0))[0]?.[0];
      if (top) reasons.push(`مصروفات أعلى من المتوقع (أكبر ضغط: ${top}).`);
      else reasons.push('مصروفات أعلى من المتوقع.');
    } else {
      reasons.push('مصروفات أعلى من المتوقع.');
    }
  }
  if (varianceIncome < 0) reasons.push('دخل أقل من المتوقع.');
  if (!reasons.length) reasons.push('قريب من المتوقع.');

  return { varianceIncome, varianceExpense, varianceNet, reasons };
}

export function targetsEvaluation(expectedExpenseByCategory = {}, targets = {}) {
  const get = (k) => Number(expectedExpenseByCategory?.[k]) || 0;

  const evalOne = (k, max) => {
    const limit = Number(max) || 0;
    if (!limit) return { status: 'none', amountOver: 0 };
    const actual = get(k);
    const amountOver = Math.max(0, actual - limit);
    const ratio = limit > 0 ? actual / limit : 0;
    const status = amountOver <= 0 ? 'ok' : ratio <= 1.1 ? 'warn' : 'bad';
    return { status, amountOver, actual, limit };
  };

  return {
    operational: evalOne('operational', targets.operationalMax),
    maintenance: evalOne('maintenance', targets.maintenanceMax),
    marketing: evalOne('marketing', targets.marketingMax),
  };
}

export function buildIncomeModelFn(model = {}) {
  const mode = String(model?.mode || 'fixed');

  if (mode === 'fixed') {
    const v = Number(model?.fixedMonthly) || 0;
    return () => v;
  }

  if (mode === 'seasonal') {
    const peak = Number(model?.peakMonthly) || 0;
    const base = Number(model?.baseMonthly) || 0;
    const peaks = Array.isArray(model?.peakMonths) ? model.peakMonths.map(String) : [];
    return (monthKey) => peaks.includes(String(monthKey)) ? peak : base;
  }

  if (mode === 'manual') {
    const map = model?.manualByMonth && typeof model.manualByMonth === 'object' ? model.manualByMonth : {};
    return (monthKey) => Number(map?.[String(monthKey)]) || 0;
  }

  return () => 0;
}

export function getLast4MonthsTable({ forecast6mOutput = [], transactions = [], ledgerId, incomeModel }) {
  const keys = lastNMonthKeys(4);
  const actual = computeActualsByMonth(transactions, ledgerId).months;
  const expected = computeExpectedByMonth(forecast6mOutput, buildIncomeModelFn(incomeModel)).months;

  const rows = keys.map((k) => {
    const e = expected[k] || { income: 0, expense: 0, net: 0, byCategory: null };
    const a = actual[k] || { income: 0, expense: 0, net: 0 };
    const v = variance(e, a);
    return { monthKey: k, expected: e, actual: a, variance: v };
  });

  return { keys, rows };
}
