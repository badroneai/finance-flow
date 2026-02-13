/*
  Ledger Cash Plan v7 — Inbox Pro (Pure)

  Goals:
  - Compute cash obligations totals (priced only: amount > 0)
  - Buckets: today (<= today), 7 days, 30 days
  - Compute "saving if snoozed" for the same windows
  - Provide breakdown by category + required/risk

  Constraints:
  - Pure functions only
  - No storage reads/writes
  - No external libs
*/

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

      // If item is snoozable (overdue or within window), the entire amount is "saving" from that window
      savingsIfSnoozed[key] += amt;
    }
  }

  // savingsIfSnoozed is intentionally simple v1: equals the sum in each window ("if you snooze all due")
  // This makes the UI honest + avoids complex assumptions.

  return {
    ledgerId: lid,
    totals,
    savingsIfSnoozed,
    counts,
    breakdown,
  };
}
