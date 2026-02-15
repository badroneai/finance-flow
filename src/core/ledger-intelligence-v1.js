// @deprecated — moved to ledger-health.js
/*
  Ledger Intelligence v1 (Health + Projection + Scenario)
  Constraints:
  - Display-only computations
  - No storage writes
  - No external libs
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

const daysAgoMs = (n) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d.getTime();
};

const todayMs = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

export const isSeededOnly = (r) => {
  if (!r) return false;
  if (r.seeded === true) return true;
  // heuristic: presence of seeded metadata
  if (r.saHint || r.priceBand || r.cityFactorEligible != null || r.defaultFreq) return true;
  return false;
};

export const freqMultiplier = (freq) => {
  const f = String(freq || '').toLowerCase();
  if (f === 'monthly') return 12;
  if (f === 'quarterly') return 4;
  if (f === 'semiannual' || f === 'semi-annually') return 2;
  if (f === 'yearly' || f === 'annual') return 1;
  if (f === 'adhoc') return 0;
  return 0;
};

export function computeLedgerHealth({ recurringItems = [], transactions = [] } = {}) {
  const seeded = (Array.isArray(recurringItems) ? recurringItems : []).filter(isSeededOnly);
  const total = seeded.length;
  const priced = seeded.filter(r => Number(r?.amount) > 0);
  const pricedCount = priced.length;

  const overdue = priced.filter(r => {
    const ms = toDateMs(r.nextDueDate);
    if (ms == null) return false;
    return ms < todayMs();
  });
  const overdueCount = overdue.length;

  const dueSoon14 = priced.filter(r => {
    const ms = toDateMs(r.nextDueDate);
    if (ms == null) return false;
    const t = todayMs();
    const d14 = t + 14 * 24 * 60 * 60 * 1000;
    return ms >= t && ms <= d14;
  });
  const dueSoon14Count = dueSoon14.length;

  const highRisk = seeded.filter(r => String(r?.riskLevel || '').toLowerCase() === 'high');
  const highRiskCount = highRisk.length;
  const highRiskUnpriced = highRisk.filter(r => Number(r?.amount) === 0);

  const pricedRatio = total ? (pricedCount / total) : 0;
  const overdueRatio = pricedCount ? (overdueCount / pricedCount) : 0;
  const highRiskRatio = highRiskCount ? (highRiskUnpriced.length / highRiskCount) : 0;

  const base = (pricedRatio * 50) + ((1 - overdueRatio) * 30) + ((1 - highRiskRatio) * 20);
  const score = Math.round(clamp(base, 0, 100));

  // Discipline (approx): compare dueThis30d vs paidThis30d
  const dueThis30d = priced.filter(r => {
    const ms = toDateMs(r.nextDueDate);
    if (ms == null) return false;
    return ms >= daysAgoMs(30) && ms <= todayMs();
  }).reduce((a, r) => a + (Number(r.amount) || 0), 0);

  const paidThis30d = (Array.isArray(transactions) ? transactions : []).filter(t => {
    const ms = toDateMs(t?.date);
    if (ms == null) return false;
    return ms >= daysAgoMs(30) && ms <= todayMs();
  }).reduce((a, t) => a + (Number(t?.amount) || 0), 0);

  const disciplineRatio = dueThis30d > 0 ? clamp(paidThis30d / dueThis30d, 0, 2) : 0;

  return {
    score,
    totalSeeded: total,
    pricedCount,
    overdueCount,
    dueSoon14Count,
    highRiskCount,
    highRiskUnpricedCount: highRiskUnpriced.length,
    pricedRatio,
    overdueRatio,
    highRiskUnpricedRatio: highRiskRatio,
    dueThis30d,
    paidThis30d,
    disciplineRatio,
  };
}

export function computeLedgerProjection({ recurringItems = [] } = {}) {
  const list = (Array.isArray(recurringItems) ? recurringItems : []).filter(isSeededOnly);
  const priced = list.filter(r => Number(r?.amount) > 0);

  const runRate = priced.reduce((a, r) => a + (Number(r.amount) || 0) * freqMultiplier(r.frequency), 0);

  const withBand = priced.filter(r => r?.priceBand && (Number(r.priceBand?.min) > 0 || Number(r.priceBand?.max) > 0));
  const minTotal = withBand.reduce((a, r) => a + (Number(r.priceBand?.min) || 0) * freqMultiplier(r.frequency), 0);
  const maxTotal = withBand.reduce((a, r) => a + (Number(r.priceBand?.max) || 0) * freqMultiplier(r.frequency), 0);

  return {
    annualRunRate: runRate,
    annualMin: minTotal,
    annualMax: maxTotal,
    pricedCount: priced.length,
    totalCount: list.length,
    bandCount: withBand.length,
  };
}

const isRentLike = (r) => {
  const hint = String(r?.saHint || '').toLowerCase();
  if (hint.includes('إيجار') || hint.includes('ايجار')) return true;
  const cat = String(r?.category || '').toLowerCase();
  return cat === 'operational' && (hint.includes('rent') || hint.includes('lease'));
};

const isBillsLike = (r) => {
  const hint = String(r?.saHint || '').toLowerCase();
  return hint.includes('كهرب') || hint.includes('ماء') || hint.includes('اتصال') || hint.includes('إنترنت') || hint.includes('انترنت') || hint.includes('هاتف');
};

const isMaintenanceLike = (r) => {
  const cat = String(r?.category || '').toLowerCase();
  return cat === 'maintenance';
};

export function computeScenario({ recurringItems = [], rentPct = 0, billsPct = 0, maintPct = 0 } = {}) {
  const list = (Array.isArray(recurringItems) ? recurringItems : []).filter(isSeededOnly);
  const priced = list.filter(r => Number(r?.amount) > 0);

  const baseAnnual = priced.reduce((a, r) => a + (Number(r.amount) || 0) * freqMultiplier(r.frequency), 0);

  const bump = (r) => {
    const base = Number(r.amount) || 0;
    let pct = 0;
    if (isRentLike(r)) pct = rentPct;
    else if (isBillsLike(r)) pct = billsPct;
    else if (isMaintenanceLike(r)) pct = maintPct;
    const next = base * (1 + (Number(pct) || 0) / 100);
    return next;
  };

  const newAnnual = priced.reduce((a, r) => a + bump(r) * freqMultiplier(r.frequency), 0);
  const delta = newAnnual - baseAnnual;

  return {
    baseAnnual,
    newAnnual,
    delta,
    inputs: { rentPct: Number(rentPct) || 0, billsPct: Number(billsPct) || 0, maintPct: Number(maintPct) || 0 },
  };
}
