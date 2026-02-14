/*
  Authority Layer v8 — Budget Authority Engine (Pure)

  Computes:
  - Monthly budget targets per bucket: system/operational/maintenance/marketing
  - Utilization %
  - Hard cap breach detection
  - Soft warning threshold (80%)

  Note:
  - We intentionally compute utilization from recurring item history (pay_now) to avoid reliance on tx.category (which remains 'other').
  - No storage reads/writes here.
*/

const BUCKETS = ['system', 'operational', 'maintenance', 'marketing'];

const toMs = (iso) => {
  const s = String(iso || '').trim();
  if (!s) return null;
  const ms = new Date(s).getTime();
  return Number.isNaN(ms) ? null : ms;
};

export function normalizeBudgets(budgets) {
  const b = budgets && typeof budgets === 'object' ? budgets : {};
  const out = { system: null, operational: null, maintenance: null, marketing: null, hardLock: false };
  for (const k of BUCKETS) {
    const v = b[k];
    if (v == null || v === '') out[k] = null;
    else {
      const n = Number(v);
      out[k] = Number.isFinite(n) && n >= 0 ? n : null;
    }
  }
  out.hardLock = !!b.hardLock;
  return out;
}

export function recurringCategoryToBucket(category) {
  const c = String(category || '').toLowerCase();
  if (c === 'system') return 'system';
  if (c === 'maintenance') return 'maintenance';
  if (c === 'marketing') return 'marketing';
  // rent/utilities are operational in this model
  if (c === 'rent' || c === 'utilities') return 'operational';
  return 'operational';
}

export function monthKeyFromDate(d = new Date()) {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}`;
}

export function computeSpendByBucketFromHistory({ ledgerId, recurringItems = [], monthKey } = {}) {
  const lid = String(ledgerId || '').trim();
  const mk = String(monthKey || '').trim();
  const list = Array.isArray(recurringItems) ? recurringItems : [];

  const spend = { system: 0, operational: 0, maintenance: 0, marketing: 0 };

  for (const r of list) {
    if (String(r?.ledgerId || '') !== lid) continue;
    const bucket = recurringCategoryToBucket(r?.category);
    const h = Array.isArray(r?.history) ? r.history : [];
    for (const e of h) {
      if (!e || e.type !== 'pay_now') continue;
      const atMs = toMs(e.at);
      if (atMs == null) continue;
      const at = new Date(atMs);
      const emk = `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, '0')}`;
      if (mk && emk !== mk) continue;
      const amt = Number(e.amount) || 0;
      if (amt <= 0) continue;
      spend[bucket] += amt;
    }
  }

  return spend;
}

export function computeBudgetUtilization({ budgets, spendByBucket, softThreshold = 0.8 } = {}) {
  const b = normalizeBudgets(budgets);
  const s = spendByBucket && typeof spendByBucket === 'object' ? spendByBucket : {};

  const perBucket = {};
  let anyBreach = false;
  let anyWarn = false;

  for (const k of BUCKETS) {
    const target = b[k];
    const spent = Number(s[k]) || 0;
    const util = (target && target > 0) ? (spent / target) : 0;

    const warn = !!(target && target > 0 && util >= softThreshold && util < 1);
    const breach = !!(target && target > 0 && util >= 1);

    if (warn) anyWarn = true;
    if (breach) anyBreach = true;

    perBucket[k] = {
      target,
      spent,
      utilization: util,
      utilizationPct: Math.round(util * 100),
      warn,
      breach,
    };
  }

  return {
    budgets: b,
    perBucket,
    anyWarn,
    anyBreach,
  };
}

export function wouldBreachHardLock({ budgets, utilization, bucket, additionalAmount } = {}) {
  const b = normalizeBudgets(budgets);
  if (!b.hardLock) return { blocked: false, reason: '' };
  const k = recurringCategoryToBucket(bucket);
  const target = b[k];
  if (!target || target <= 0) return { blocked: false, reason: '' };
  const spent = Number(utilization?.perBucket?.[k]?.spent) || 0;
  const add = Number(additionalAmount) || 0;
  const next = spent + add;
  if (next > target) {
    return { blocked: true, reason: `تجاوز ميزانية التصنيف (${k})` };
  }
  return { blocked: false, reason: '' };
}
