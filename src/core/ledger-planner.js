/*
  Ledger Planner — دمج: ledger-inbox + ledger-cash-plan + ledger-forecast
  (Refactor Plan 0.2 — نفس أسماء الدوال المُصدّرة)
*/

// ---------- Helpers shared across Inbox + Cash Plan ----------
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

const normalizeRisk = (risk) => {
  const x = String(risk || '').toLowerCase();
  return (x === 'high' || x === 'medium' || x === 'low') ? x : '';
};

// ==================== SECTION: Inbox (from ledger-inbox.js) ====================

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const isPastDueInbox = (r, nowMs) => {
  if (!r || Number(r?.amount) <= 0) return false;
  const ms = toMs(r?.nextDueDate);
  if (ms == null) return false;
  return ms < nowMs;
};

const isDueWithinDays = (r, days, nowMs) => {
  if (!r || Number(r?.amount) <= 0) return false;
  const ms = toMs(r?.nextDueDate);
  if (ms == null) return false;
  const end = nowMs + days * 24 * 60 * 60 * 1000;
  return ms >= nowMs && ms <= end;
};

const isSnoozedActive = (r, nowMs) => {
  const until = toMs(r?.snoozeUntil);
  if (until == null) return false;
  return until > nowMs;
};

const normalizeStatus = (s) => {
  const x = String(s || '').toLowerCase();
  return (x === 'open' || x === 'snoozed' || x === 'resolved') ? x : 'open';
};

export function buildLedgerInbox({ ledgerId, recurringItems = [], now = new Date() } = {}) {
  const lid = String(ledgerId || '').trim();
  const list = (Array.isArray(recurringItems) ? recurringItems : []).filter(r => String(r?.ledgerId || '') === lid);

  const nowMs = (() => {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  })();

  const items = [];

  for (const r of list) {
    const status = normalizeStatus(r?.status);
    const snoozed = isSnoozedActive(r, nowMs);

    const overdue = isPastDueInbox(r, nowMs);
    if (status === 'resolved' && !overdue) continue;

    if (status === 'snoozed' && snoozed && !overdue) continue;

    const required = !!r?.required;
    const highRisk = normalizeRisk(r?.riskLevel) === 'high';
    const unpriced = Number(r?.amount) === 0;

    let reason = null;
    let priority = 0;

    if (highRisk && overdue) { reason = 'خطر متأخر'; priority = 100; }
    else if (overdue) { reason = 'متأخر'; priority = 90; }
    else if (required && highRisk && unpriced) { reason = 'خطر غير مسعّر'; priority = 85; }
    else if (required && unpriced) { reason = 'إلزامي غير مسعّر'; priority = 75; }
    else if (isDueWithinDays(r, 7, nowMs)) { reason = 'مستحق خلال 7 أيام'; priority = 70; }
    else if (isDueWithinDays(r, 14, nowMs)) { reason = 'مستحق خلال 14 يوم'; priority = 60; }

    if (!reason) continue;

    items.push({
      id: r.id,
      ledgerId: lid,
      title: r.title || '',
      amount: Number(r.amount) || 0,
      category: String(r?.category || 'other'),
      nextDueDate: r.nextDueDate || '',
      required,
      riskLevel: normalizeRisk(r?.riskLevel) || '',
      status,
      snoozeUntil: r.snoozeUntil || '',
      note: String(r.note || ''),
      lastPaidAt: r.lastPaidAt || '',

      payState: String(r?.payState || 'unpaid'),
      payStateAt: r?.payStateAt || '',
      payStateNote: String(r?.payStateNote || ''),

      history: Array.isArray(r?.history) ? r.history : [],

      reason,
      priority,
    });
  }

  items.sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    const da = toMs(a.nextDueDate) ?? 0;
    const db = toMs(b.nextDueDate) ?? 0;
    if (da !== db) return da - db;
    return String(a.title || '').localeCompare(String(b.title || ''), 'ar');
  });

  return items;
}

export function addDaysISO(days) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + Number(days || 0));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ==================== SECTION: Cash Plan (from ledger-cash-plan.js) ====================

const inWindow = (dueMs, fromMs, days) => {
  if (dueMs == null) return false;
  const to = fromMs + days * 24 * 60 * 60 * 1000;
  return dueMs <= to;
};

const bucketLabel = (days) => {
  if (days === 0) return 'today';
  if (days === 7) return 'd7';
  if (days === 30) return 'd30';
  return `d${days}`;
};

const addToBreakdown = (obj, key, amount) => {
  if (!key) key = 'other';
  obj[key] = (Number(obj[key]) || 0) + (Number(amount) || 0);
};

export function computeCashPlan({ ledgerId, recurringItems = [], now = new Date() } = {}) {
  const lid = String(ledgerId || '').trim();
  const list = (Array.isArray(recurringItems) ? recurringItems : []).filter(r => String(r?.ledgerId || '') === lid);

  const todayMs = startOfDayMs(now);

  const windows = [0, 7, 30];
  const totals = { today: 0, d7: 0, d30: 0 };
  const savingsIfSnoozed = { today: 0, d7: 0, d30: 0 };
  const counts = { priced: 0, unpriced: 0, requiredUnpriced: 0, highRiskUnpriced: 0 };

  const breakdown = {
    byCategory: { today: {}, d7: {}, d30: {} },
    required: { today: 0, d7: 0, d30: 0 },
    highRisk: { today: 0, d7: 0, d30: 0 },
  };

  for (const r of list) {
    const amt = Number(r?.amount) || 0;
    const dueMs = toMs(r?.nextDueDate);

    const required = !!r?.required;
    const highRisk = normalizeRisk(r?.riskLevel) === 'high';

    if (amt <= 0) {
      counts.unpriced += 1;
      if (required) counts.requiredUnpriced += 1;
      if (required && highRisk) counts.highRiskUnpriced += 1;
      continue;
    }

    counts.priced += 1;

    const cat = String(r?.category || 'other');

    for (const days of windows) {
      const key = bucketLabel(days);
      if (!inWindow(dueMs, todayMs, days)) continue;

      totals[key] += amt;
      addToBreakdown(breakdown.byCategory[key], cat, amt);
      if (required) breakdown.required[key] += amt;
      if (highRisk) breakdown.highRisk[key] += amt;

      savingsIfSnoozed[key] += amt;
    }
  }

  return {
    ledgerId: lid,
    totals,
    savingsIfSnoozed,
    counts,
    breakdown,
  };
}

// ==================== SECTION: Forecast (from ledger-forecast.js) ====================

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
