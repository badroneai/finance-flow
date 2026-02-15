/*
  Ledger Health — دمج: ledger-compliance + ledger-intelligence-v1 + ledger-brain
  (Refactor Plan 0.2 — نفس أسماء الدوال والثوابت المُصدّرة)
*/

// ---------- Helpers shared across sections ----------
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const toMs = (dateStr) => {
  const s = String(dateStr || '').trim();
  if (!s) return null;
  const d = new Date(s + 'T00:00:00');
  const ms = d.getTime();
  return Number.isNaN(ms) ? null : ms;
};

const startOfDayMs = (d = new Date()) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
};

const startOfTodayMs = () => startOfDayMs(new Date());

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

const daysFromNowMs = (n) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d.getTime();
};

const todayMs = () => startOfTodayMs();

// ==================== SECTION: Compliance (from ledger-compliance.js) ====================

const risk = (r) => String(r || '').toLowerCase();

export function computeComplianceShield({ ledgerId, recurringItems = [], now = new Date() } = {}) {
  const lid = String(ledgerId || '').trim();
  const list = (Array.isArray(recurringItems) ? recurringItems : []).filter(r => String(r?.ledgerId || '') === lid);

  const todayMsVal = startOfDayMs(now);

  let score = 100;
  const drivers = [];

  let hasSystemOverdue = false;

  for (const r of list) {
    const cat = String(r?.category || 'other').toLowerCase();
    const amt = Number(r?.amount) || 0;
    const dueMs = toMs(r?.nextDueDate);
    const overdue = (dueMs != null) ? (dueMs < todayMsVal) : false;

    const highRisk = risk(r?.riskLevel) === 'high';

    if (cat === 'system') {
      if (amt <= 0) {
        score -= 20;
        drivers.push({ id: r.id, title: r.title || '—', reason: 'بند نظامي غير مسعّر', weight: 20 });
      }
      if (overdue) {
        score -= 25;
        drivers.push({ id: r.id, title: r.title || '—', reason: 'بند نظامي متأخر', weight: 25 });
        hasSystemOverdue = true;
      }
    }

    if (highRisk && amt <= 0) {
      score -= 15;
      drivers.push({ id: r.id, title: r.title || '—', reason: 'عالي المخاطر غير مسعّر', weight: 15 });
    }
  }

  if (!hasSystemOverdue) {
    score += 10;
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  drivers.sort((a, b) => (b.weight - a.weight));

  const status = score >= 85 ? 'متوافق' : score >= 60 ? 'يحتاج انتباه' : 'خطر نظامي';

  return {
    ledgerId: lid,
    score,
    status,
    drivers: drivers.slice(0, 3),
  };
}

// ==================== SECTION: Intelligence v1 (from ledger-intelligence-v1.js) ====================

export const isSeededOnly = (r) => {
  if (!r) return false;
  if (r.seeded === true) return true;
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

const isRentLikeIntel = (r) => {
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
    if (isRentLikeIntel(r)) pct = rentPct;
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

// ==================== SECTION: Brain (from ledger-brain.js) ====================

const isSeeded = (r) => isSeededOnly(r);

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
  const monthly = items
    .filter(r => String(r?.frequency || '').toLowerCase() === 'monthly')
    .filter(r => Number(r?.amount) > 0);
  const total = monthly.reduce((a, r) => a + (Number(r.amount) || 0), 0);
  return { monthlyTotal: total, count: monthly.length };
}

export function calculateMonthlyFixed(ledgerId, ctx = {}) {
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

const normalizeCategoryBrain = (c) => {
  const x = String(c || '').toLowerCase();
  return (x === 'system' || x === 'operational' || x === 'maintenance' || x === 'marketing') ? x : 'other';
};

const monthlyEquivalent = (r) => {
  const amt = Number(r?.amount) || 0;
  if (amt <= 0) return 0;
  const m = freqMultiplier(r?.frequency);
  if (m <= 0) return 0;
  return (amt * m) / 12;
};

export function getBurnBreakdown(ledgerId, ctx = {}) {
  const items = filterLedgerRecurring(ledgerId, ctx.recurringItems).filter(r => Number(r?.amount) > 0);
  const buckets = {};
  for (const r of items) {
    const cat = normalizeCategoryBrain(r?.category);
    buckets[cat] = (buckets[cat] || 0) + monthlyEquivalent(r);
  }
  const totalMonthly = Object.values(buckets).reduce((a, n) => a + (Number(n) || 0), 0);
  const list = Object.keys(buckets).map((category) => {
    const monthlySum = Number(buckets[category]) || 0;
    const percentOfTotal = totalMonthly > 0 ? Math.round((monthlySum / totalMonthly) * 100) : 0;
    return { category, monthlySum, percentOfTotal };
  }).sort((a, b) => b.monthlySum - a.monthlySum);
  return { totalMonthly, buckets: list };
}

export function getPressureBreakdown(ledgerId, ctx = {}) {
  const items = filterLedgerRecurring(ledgerId, ctx.recurringItems);
  const txs = filterLedgerTransactions(ledgerId, ctx.transactions);

  const total = items.length;
  const missingPricingCount = items.filter(r => Number(r?.amount) === 0).length;
  const priced = items.filter(r => Number(r?.amount) > 0);
  const overdueCount = countOverdue(priced);

  const highRisk = items.filter(r => String(r?.riskLevel || '').toLowerCase() === 'high');
  const highRiskUnpriced = highRisk.filter(r => Number(r?.amount) === 0).length;

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

  const unpricedRatio = total ? (missingPricingCount / total) : 0;
  const overdueRatio = priced.length ? (overdueCount / priced.length) : 0;
  const highRiskUnpricedFlag = highRiskUnpriced > 0 ? 1 : 0;
  const disciplinePenalty = 1 - clamp(disciplineRatio, 0, 1);

  const weightedScoreParts = {
    unpriced: unpricedRatio * 40,
    overdue: overdueRatio * 30,
    highRiskUnpriced: highRiskUnpricedFlag * 20,
    discipline: disciplinePenalty * 10,
  };

  return {
    missingPricingCount,
    overdueCount,
    highRiskUnpriced,
    disciplineRatio,
    weightedScoreParts,
  };
}

export function getRiskBreakdown90d(ledgerId, ctx = {}) {
  const items = filterLedgerRecurring(ledgerId, ctx.recurringItems);
  const due90 = sumDueWithinDays(items, 90);
  const burn = calculateBurnRate(ledgerId, ctx).monthlyTotal;
  const burnRatio = burn > 0 ? due90 / (burn * 3) : (due90 > 0 ? 9 : 0);

  const highRiskItems = items.filter(r => String(r?.riskLevel || '').toLowerCase() === 'high');
  const highRiskCount = highRiskItems.length;
  const overdueAmount = items.filter(r => {
    if (Number(r?.amount) <= 0) return false;
    const ms = toDateMs(r?.nextDueDate);
    if (ms == null) return false;
    return ms < startOfTodayMs();
  }).reduce((a, r) => a + (Number(r.amount) || 0), 0);

  const risk = calculateNext90DayRisk(ledgerId, ctx);
  return {
    totalDueAmount: due90,
    highRiskCount,
    overdueAmount,
    burnRatio,
    computedLevel: risk.level,
  };
}

export function getDailyPlaybook(ledgerId, ctx = {}) {
  const items = filterLedgerRecurring(ledgerId, ctx.recurringItems);
  const t = startOfTodayMs();
  const d14 = daysFromNowMs(14);

  const scoreFor = (r) => {
    const high = String(r?.riskLevel || '').toLowerCase() === 'high';
    const priced = Number(r?.amount) > 0;
    const ms = toDateMs(r?.nextDueDate);
    const overdue = priced && ms != null && ms < t;
    const dueSoon14 = priced && ms != null && ms >= t && ms <= d14;
    const missingPricing = Number(r?.amount) === 0;

    if (high && overdue) return { p: 100, type: 'highrisk_overdue', reason: 'بند عالي المخاطر ومتأخر.' };
    if (overdue) return { p: 80, type: 'overdue', reason: 'بند متأخر ويحتاج إجراء.' };
    if (high && missingPricing) return { p: 70, type: 'highrisk_unpriced', reason: 'عالي المخاطر بدون تسعير.' };
    if (dueSoon14) return { p: 60, type: 'due_soon', reason: 'قادم خلال 14 يوم.' };
    if (missingPricing) return { p: 40, type: 'missing_pricing', reason: 'بدون تسعير.' };
    return null;
  };

  const tasks = [];
  for (const r of items) {
    const s = scoreFor(r);
    if (!s) continue;
    tasks.push({
      type: s.type,
      title: r.title || '—',
      reason: s.reason,
      priorityScore: s.p,
      recurringId: r.id,
    });
  }

  return tasks.sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 5);
}

export const SAUDI_BENCHMARKS = {
  office: { rentRatioMax: 0.45, utilitiesRatioMax: 0.12, marketingRatioMax: 0.15 },
  chalet: { rentRatioMax: 0.55, utilitiesRatioMax: 0.15, marketingRatioMax: 0.10 },
  building: { rentRatioMax: 0.35, utilitiesRatioMax: 0.10, marketingRatioMax: 0.12 },
  villa: { rentRatioMax: 0.50, utilitiesRatioMax: 0.14, marketingRatioMax: 0.08 },
  personal: { rentRatioMax: 0.50, utilitiesRatioMax: 0.15, marketingRatioMax: 0.05 },
};

const isRentLikeBrain = (r) => {
  const hint = String(r?.saHint || '').toLowerCase();
  if (hint.includes('إيجار') || hint.includes('ايجار')) return true;
  const title = String(r?.title || '').toLowerCase();
  if (title.includes('إيجار') || title.includes('ايجار')) return true;
  return false;
};

const isUtilitiesLike = (r) => {
  const hint = String(r?.saHint || '').toLowerCase();
  const title = String(r?.title || '').toLowerCase();
  return hint.includes('كهرب') || hint.includes('ماء') || hint.includes('اتصال') || hint.includes('إنترنت') || hint.includes('انترنت') || hint.includes('هاتف') ||
    title.includes('كهرب') || title.includes('ماء') || title.includes('اتصال') || title.includes('إنترنت') || title.includes('انترنت') || title.includes('هاتف');
};

export function getBenchmarkComparison(ledgerId, ctx = {}) {
  const items = filterLedgerRecurring(ledgerId, ctx.recurringItems).filter(r => Number(r?.amount) > 0);

  const ledgerType = String(ctx.ledgerType || ctx.ledger?.type || '').toLowerCase();
  const bench = SAUDI_BENCHMARKS[ledgerType] || SAUDI_BENCHMARKS.office;

  const totalBurn = items.reduce((a, r) => a + monthlyEquivalent(r), 0);
  const rent = items.filter(isRentLikeBrain).reduce((a, r) => a + monthlyEquivalent(r), 0);
  const utilities = items.filter(isUtilitiesLike).reduce((a, r) => a + monthlyEquivalent(r), 0);
  const marketing = items.filter(r => normalizeCategoryBrain(r?.category) === 'marketing').reduce((a, r) => a + monthlyEquivalent(r), 0);

  const rentRatio = totalBurn > 0 ? rent / totalBurn : 0;
  const utilitiesRatio = totalBurn > 0 ? utilities / totalBurn : 0;
  const marketingRatio = totalBurn > 0 ? marketing / totalBurn : 0;

  const flags = [];
  flags.push({ type: 'rent', status: rentRatio > bench.rentRatioMax ? 'high' : 'ok', ratio: rentRatio, max: bench.rentRatioMax });
  flags.push({ type: 'utilities', status: utilitiesRatio > bench.utilitiesRatioMax ? 'high' : 'ok', ratio: utilitiesRatio, max: bench.utilitiesRatioMax });
  flags.push({ type: 'marketing', status: marketingRatio > bench.marketingRatioMax ? 'high' : 'ok', ratio: marketingRatio, max: bench.marketingRatioMax });

  const pct = (x) => `${Math.round((x || 0) * 100)}%`;
  const commentary = [
    `إيجارك يمثل ${pct(rentRatio)} من مصروفاتك الشهرية (الشائع ≤${pct(bench.rentRatioMax)}).`,
    `المرافق تمثل ${pct(utilitiesRatio)} (الشائع ≤${pct(bench.utilitiesRatioMax)}).`,
    `التسويق يمثل ${pct(marketingRatio)} (الشائع ≤${pct(bench.marketingRatioMax)}).`,
  ].join(' ');

  return {
    ledgerType: ledgerType || 'office',
    totalBurn,
    ratios: { rentRatio, utilitiesRatio, marketingRatio },
    benchmarks: bench,
    flags,
    commentary,
  };
}
