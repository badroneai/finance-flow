// Ledger budgets helpers (stored inside ff_ledgers objects)

const asNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

export function normalizeBudgets(budgets) {
  const b = budgets && typeof budgets === 'object' ? budgets : {};
  const monthlyTarget = Math.max(0, asNum(b.monthlyTarget));
  const yearlyTarget = Math.max(0, asNum(b.yearlyTarget));
  return { monthlyTarget, yearlyTarget };
}

export function computeBudgetHealth({ actualMonthly = 0, actualYearly = 0, budgets }) {
  const b = normalizeBudgets(budgets);

  const gapMonthly = b.monthlyTarget > 0 ? (b.monthlyTarget - actualMonthly) : 0;
  const gapYearly = b.yearlyTarget > 0 ? (b.yearlyTarget - actualYearly) : 0;

  const ratioMonthly = b.monthlyTarget > 0 ? (actualMonthly / b.monthlyTarget) : null;
  const ratioYearly = b.yearlyTarget > 0 ? (actualYearly / b.yearlyTarget) : null;

  const status = (() => {
    // if no targets, stay neutral
    if (b.monthlyTarget === 0 && b.yearlyTarget === 0) return 'neutral';

    const ratios = [ratioMonthly, ratioYearly].filter(x => typeof x === 'number');
    const max = ratios.length ? Math.max(...ratios) : 0;

    if (max <= 0.7) return 'good';
    if (max <= 1.0) return 'warn';
    return 'danger';
  })();

  return { ...b, gapMonthly, gapYearly, ratioMonthly, ratioYearly, status };
}
