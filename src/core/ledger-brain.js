/*
  Ledger Brain v2 — Risk Radar Engine (Pure functions)

  Constraints:
  - No storage reads/writes
  - No external libs
  - Display-only calculations

  NOTE: Functions take ledgerId as first param (per spec) and an optional context
  object to keep them pure.
*/

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const isValidDate = (s) => {
  const x = String(s || '').trim();
  if (!x) return false;
  const d = new Date(x + 'T00:00:00');
  return !Number.isNaN(d.getTime());
};

const toDateMs = (s) => {
  if (!isValidDate(s)) return null;
  return new Date(String(s) + 'T00:00:00').getTime();
};

const startOfTodayMs = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const daysAgoMs = (n) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d.getTime();
};

const daysFromNowMs = (n) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d.getTime();
};

const freqMultiplier = (freq) => {
  const f = String(freq || '').toLowerCase();
  if (f === 'monthly') return 12;
  if (f === 'quarterly') return 4;
  if (f === 'semiannual' || f === 'semi-annually') return 2;
  if (f === 'yearly' || f === 'annual') return 1;
  if (f === 'adhoc') return 0;
  return 0;
};

const isSeeded = (r) => {
  if (!r) return false;
  if (r.seeded === true) return true;
  // heuristic: seeded metadata
  if (r.saHint || r.priceBand || r.cityFactorEligible != null || r.defaultFreq) return true;
  return false;
};

const filterLedgerRecurring = (ledgerId, recurringItems = []) => {
  const lid = String(ledgerId || '').trim();
  return (Array.isArray(recurringItems) ? recurringItems : [])
    .filter(r => String(r?.ledgerId || '') === lid)
    .filter(isSeeded);
};

const filterLedgerTransactions = (ledgerId, transactions = []) => {
  const lid = String(ledgerId || '').trim();
  return (Array.isArray(transactions) ? transactions : [])
    .filter(t => String(t?.meta?.ledgerId || '') === lid);
};

const countOverdue = (items = []) => {
  const t = startOfTodayMs();
  return items.filter(r => {
    if (Number(r?.amount) <= 0) return false;
    const ms = toDateMs(r?.nextDueDate);
    if (ms == null) return false;
    return ms < t;
  }).length;
};

const sumDueWithinDays = (items = [], days) => {
  const t0 = startOfTodayMs();
  const t1 = daysFromNowMs(days);
  return items.filter(r => {
    if (Number(r?.amount) <= 0) return false;
    const ms = toDateMs(r?.nextDueDate);
    if (ms == null) return false;
    return ms >= t0 && ms <= t1;
  }).reduce((a, r) => a + (Number(r.amount) || 0), 0);
};

const countDueWithinDays = (items = [], days) => {
  const t0 = startOfTodayMs();
  const t1 = daysFromNowMs(days);
  return items.filter(r => {
    if (Number(r?.amount) <= 0) return false;
    const ms = toDateMs(r?.nextDueDate);
    if (ms == null) return false;
    return ms >= t0 && ms <= t1;
  }).length;
};

export function calculateBurnRate(ledgerId, ctx = {}) {
  const items = filterLedgerRecurring(ledgerId, ctx.recurringItems);
  // Burn Rate = مجموع الالتزامات المسعّرة الشهرية
  const monthly = items
    .filter(r => String(r?.frequency || '').toLowerCase() === 'monthly')
    .filter(r => Number(r?.amount) > 0);
  const total = monthly.reduce((a, r) => a + (Number(r.amount) || 0), 0);
  return { monthlyTotal: total, count: monthly.length };
}

export function calculateMonthlyFixed(ledgerId, ctx = {}) {
  // v2: treat as burn rate (monthly priced) to keep semantics simple.
  const b = calculateBurnRate(ledgerId, ctx);
  return { monthlyFixed: b.monthlyTotal, count: b.count };
}

export function calculateNext90DayRisk(ledgerId, ctx = {}) {
  const items = filterLedgerRecurring(ledgerId, ctx.recurringItems);
  const burn = calculateBurnRate(ledgerId, ctx).monthlyTotal;
  const due90Total = sumDueWithinDays(items, 90);
  const due90Count = countDueWithinDays(items, 90);

  const baseline90 = (Number(burn) || 0) * 3;
  const ratio = baseline90 > 0 ? due90Total / baseline90 : (due90Total > 0 ? 9 : 0);

  let level = 'low';
  if (ratio >= 1.5) level = 'critical';
  else if (ratio >= 1.15) level = 'high';
  else if (ratio >= 0.85) level = 'medium';

  const label = level === 'critical' ? 'حرج' : level === 'high' ? 'مرتفع' : level === 'medium' ? 'متوسط' : 'منخفض';

  return { due90Total, due90Count, ratio, level, label };
}

export function calculateDisciplineTrend(ledgerId, ctx = {}) {
  const items = filterLedgerRecurring(ledgerId, ctx.recurringItems).filter(r => Number(r?.amount) > 0);
  const txs = filterLedgerTransactions(ledgerId, ctx.transactions);

  const due60 = items.filter(r => {
    const ms = toDateMs(r?.nextDueDate);
    if (ms == null) return false;
    return ms >= daysAgoMs(60) && ms <= startOfTodayMs();
  }).length;

  const paid60 = txs.filter(t => {
    const ms = toDateMs(t?.date);
    if (ms == null) return false;
    return ms >= daysAgoMs(60) && ms <= startOfTodayMs();
  }).length;

  const ratio = due60 > 0 ? clamp(paid60 / due60, 0, 2) : 0;
  const trend = ratio >= 0.8 ? 'يتحسن' : ratio >= 0.5 ? 'ثابت' : 'يتراجع';

  return { due60, paid60, ratio, trend };
}

export function detectHighRiskCluster(ledgerId, ctx = {}) {
  const items = filterLedgerRecurring(ledgerId, ctx.recurringItems);
  const highRisk = items.filter(r => String(r?.riskLevel || '').toLowerCase() === 'high');
  const highRiskUnpriced = highRisk.filter(r => Number(r?.amount) === 0);
  const highRiskOverdue = highRisk.filter(r => {
    if (Number(r?.amount) <= 0) return false;
    const ms = toDateMs(r?.nextDueDate);
    if (ms == null) return false;
    return ms < startOfTodayMs();
  });

  if (highRiskUnpriced.length > 2) return true;
  if (highRiskOverdue.length > 0) return true;
  return false;
}

export function calculateCashPressureScore(ledgerId, ctx = {}) {
  const items = filterLedgerRecurring(ledgerId, ctx.recurringItems);
  const txs = filterLedgerTransactions(ledgerId, ctx.transactions);

  const total = items.length;
  const unpricedCount = items.filter(r => Number(r?.amount) === 0).length;
  const unpricedRatio = total ? (unpricedCount / total) : 0;

  const priced = items.filter(r => Number(r?.amount) > 0);
  const overdueCount = countOverdue(priced);

  const highRisk = items.filter(r => String(r?.riskLevel || '').toLowerCase() === 'high');
  const highRiskUnpriced = highRisk.filter(r => Number(r?.amount) === 0).length;

  // discipline (approx): paidThis30 / dueThis30
  const dueThis30 = priced.filter(r => {
    const ms = toDateMs(r?.nextDueDate);
    if (ms == null) return false;
    return ms >= daysAgoMs(30) && ms <= startOfTodayMs();
  }).reduce((a, r) => a + (Number(r.amount) || 0), 0);

  const paidThis30 = txs.filter(t => {
    const ms = toDateMs(t?.date);
    if (ms == null) return false;
    return ms >= daysAgoMs(30) && ms <= startOfTodayMs();
  }).reduce((a, t) => a + (Number(t?.amount) || 0), 0);

  const disciplineRatio = dueThis30 > 0 ? clamp(paidThis30 / dueThis30, 0, 2) : 0;

  // Score (0-100): higher => more pressure
  const overdueRatio = priced.length ? (overdueCount / priced.length) : 0;
  const highRiskUnpricedFlag = highRiskUnpriced > 0 ? 1 : 0;
  const disciplinePenalty = 1 - clamp(disciplineRatio, 0, 1);

  const score = Math.round(clamp(
    (unpricedRatio * 40) + (overdueRatio * 30) + (highRiskUnpricedFlag * 20) + (disciplinePenalty * 10),
    0,
    100,
  ) * 1);

  const band = score >= 80 ? 'خطر تشغيلي' : score >= 70 ? 'ضغط عالي' : score >= 40 ? 'ضغط متوسط' : 'مستقر';

  return {
    score,
    band,
    unpricedRatio,
    unpricedCount,
    total,
    overdueCount,
    highRiskUnpricedCount: highRiskUnpriced,
    disciplineRatio,
  };
}

export function calculateBurnRateBundle(ledgerId, ctx = {}) {
  const burn = calculateBurnRate(ledgerId, ctx).monthlyTotal;
  return {
    monthly: burn,
    d90: burn * 3,
    yearly: burn * 12,
  };
}
