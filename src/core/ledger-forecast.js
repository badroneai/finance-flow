// @deprecated — moved to ledger-planner.js
/*
  Predictive Ledger v4 — 6M Forecast + Scenarios + Cash Gap (Pure)

  Constraints:
  - Pure functions only
  - No storage reads/writes
  - No external libs
*/

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const normalizeCategory = (c) => {
  const x = String(c || '').toLowerCase();
  return (x === 'system' || x === 'operational' || x === 'maintenance' || x === 'marketing') ? x : 'other';
};

const freqMultiplierYearly = (freq) => {
  const f = String(freq || '').toLowerCase();
  if (f === 'weekly') return 52;
  if (f === 'monthly') return 12;
  if (f === 'quarterly') return 4;
  if (f === 'semiannual' || f === 'semi-annually') return 2;
  if (f === 'annual' || f === 'yearly') return 1;
  if (f === 'adhoc') return 0;
  return 0;
};

const monthlyEquivalent = (r) => {
  const amt = Number(r?.amount) || 0;
  if (amt <= 0) return 0;
  const m = freqMultiplierYearly(r?.frequency);
  if (m <= 0) return 0;
  return (amt * m) / 12;
};

const monthKeyFromDate = (d) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${yyyy}-${mm}`;
};

const nextMonths = (count = 6) => {
  const list = [];
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  for (let i = 0; i < count; i++) {
    const x = new Date(d.getTime());
    x.setMonth(d.getMonth() + i);
    list.push({ idx: i, monthKey: monthKeyFromDate(x) });
  }
  return list;
};

export function normalizeMonthlyRunRate(recurringItems = []) {
  const list = Array.isArray(recurringItems) ? recurringItems : [];
  const priced = list.filter(r => Number(r?.amount) > 0);

  const byCategory = { system: 0, operational: 0, maintenance: 0, marketing: 0, other: 0 };
  for (const r of priced) {
    const cat = normalizeCategory(r?.category);
    byCategory[cat] += monthlyEquivalent(r);
  }
  const monthlyTotal = Object.values(byCategory).reduce((a, n) => a + (Number(n) || 0), 0);

  return { monthlyTotal, byCategory };
}

export function forecast6m(recurringItems = [], scenario = {}) {
  const list = Array.isArray(recurringItems) ? recurringItems : [];
  const priced = list.filter(r => Number(r?.amount) > 0);

  const mult = {
    rent: Number(scenario.rent ?? 1.0),
    utilities: Number(scenario.utilities ?? 1.0),
    maintenance: Number(scenario.maintenance ?? 1.0),
    marketing: Number(scenario.marketing ?? 1.0),
    system: Number(scenario.system ?? 1.0),
    other: Number(scenario.other ?? 1.0),
  };

  const isRentLike = (r) => {
    const hint = String(r?.saHint || '').toLowerCase();
    const title = String(r?.title || '').toLowerCase();
    return hint.includes('إيجار') || hint.includes('ايجار') || title.includes('إيجار') || title.includes('ايجار');
  };
  const isUtilitiesLike = (r) => {
    const hint = String(r?.saHint || '').toLowerCase();
    const title = String(r?.title || '').toLowerCase();
    return hint.includes('كهرب') || hint.includes('ماء') || hint.includes('اتصال') || hint.includes('إنترنت') || hint.includes('انترنت') || hint.includes('هاتف') ||
      title.includes('كهرب') || title.includes('ماء') || title.includes('اتصال') || title.includes('إنترنت') || title.includes('انترنت') || title.includes('هاتف');
  };

  const bucketForScenario = (r) => {
    if (isRentLike(r)) return 'rent';
    if (isUtilitiesLike(r)) return 'utilities';
    const cat = normalizeCategory(r?.category);
    if (cat === 'maintenance') return 'maintenance';
    if (cat === 'marketing') return 'marketing';
    if (cat === 'system') return 'system';
    return 'other';
  };

  const months = nextMonths(6).map(m => ({
    monthKey: m.monthKey,
    expectedOutflow: 0,
    byCategory: { system: 0, operational: 0, maintenance: 0, marketing: 0, other: 0 },
    notes: [],
  }));

  // v4: constant monthly-equivalent projection for simplicity (not a strict due-date schedule)
  for (const r of priced) {
    const cat = normalizeCategory(r?.category);
    const base = monthlyEquivalent(r);
    const scBucket = bucketForScenario(r);
    const factor = clamp(mult[scBucket] ?? 1.0, 0.5, 2.0);
    const amt = base * factor;

    for (const m of months) {
      m.expectedOutflow += amt;
      m.byCategory[cat] += amt;
    }
  }

  // notes (lightweight)
  for (const m of months) {
    const topCat = Object.entries(m.byCategory).sort((a, b) => (b[1] || 0) - (a[1] || 0))[0];
    if (topCat && topCat[1] > 0) m.notes.push(`أكبر ضغط: ${topCat[0]}`);
  }

  return months;
}

export function cashGapModel(forecast = [], assumedMonthlyInflow = 0) {
  const inflow = Number(assumedMonthlyInflow) || 0;
  const series = [];
  let cumulative = 0;
  let firstGapMonth = null;
  let worstGap = 0;

  for (const row of (Array.isArray(forecast) ? forecast : [])) {
    const outflow = Number(row?.expectedOutflow) || 0;
    const net = inflow - outflow;
    cumulative += net;
    if (firstGapMonth == null && cumulative < 0) firstGapMonth = row.monthKey;
    worstGap = Math.min(worstGap, cumulative);
    series.push({ monthKey: row.monthKey, outflow, inflow, net, cumulative });
  }

  return { series, firstGapMonth, worstGap };
}

export function insightsFromForecast(forecast = [], cashGap = null) {
  const list = Array.isArray(forecast) ? forecast : [];
  if (!list.length) return [];

  const sumByCategory = { system: 0, operational: 0, maintenance: 0, marketing: 0, other: 0 };
  for (const m of list) {
    for (const k of Object.keys(sumByCategory)) sumByCategory[k] += Number(m?.byCategory?.[k] || 0);
  }
  const top = Object.entries(sumByCategory).sort((a, b) => (b[1] || 0) - (a[1] || 0))[0]?.[0] || 'other';

  const maint = sumByCategory.maintenance;
  const avg = Object.values(sumByCategory).reduce((a, n) => a + (Number(n) || 0), 0) / 5;

  const tips = [];
  tips.push(`أكبر بند ضغطًا في توقعاتك: ${top}.`);
  if (maint > avg * 1.2) tips.push('الصيانة مرتفعة نسبيًا — راجع البنود القابلة للتأجيل/التجزئة.');

  if (cashGap && cashGap.firstGapMonth) {
    tips.push(`يوجد عجز متوقع يبدأ من ${cashGap.firstGapMonth}. خفّض البنود الأعلى ضغطًا أو عزز الدخل الشهري مبكرًا.`);
  } else if (cashGap) {
    tips.push('لا يوجد عجز تراكمي خلال 6 أشهر وفق الدخل المفترض الحالي.');
  }

  return tips.slice(0, 3);
}
