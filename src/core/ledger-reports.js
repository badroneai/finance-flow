// Ledger reports helpers (read-only analytics)

import { normalizeCategory, normalizeRisk, isSeededRecurring, isPastDue } from './recurring-intelligence.js';
import { assertArr } from './contracts.js';

const asNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const asStr = (v) => String(v ?? '').trim();

export function getBucketForRecurring(rec) {
  const freq = asStr(rec?.frequency).toLowerCase();
  if (freq === 'adhoc') return 'adhoc';

  const cat = normalizeCategory(rec?.category);
  if (cat === 'system') return 'system';
  if (cat === 'operational') return 'operational';
  if (cat === 'maintenance') return 'maintenance';
  if (cat === 'marketing') return 'marketing';
  return 'other';
}

export function buildTxMetaFromRecurring({ activeLedgerId, recurring }) {
  const r = recurring || {};
  const bucket = getBucketForRecurring(r);
  const required = !!r.required;
  const riskLevel = normalizeRisk(r.riskLevel) || 'low';

  return {
    ledgerId: String(activeLedgerId || ''),
    recurringId: String(r.id || ''),
    acct: {
      bucket,
      required,
      riskLevel,
      templateKey: bucket,
    },
  };
}

export function filterTransactionsForLedgerByMeta({ transactions, ledgerId }) {
  assertArr(transactions, 'transactions');
  const txs = Array.isArray(transactions) ? transactions : [];
  const lid = String(ledgerId || '');
  return txs.filter(t => t?.meta && String(t.meta.ledgerId || '') === lid);
}

export function computePL({ transactions }) {
  assertArr(transactions, 'transactions');
  const txs = Array.isArray(transactions) ? transactions : [];
  const income = txs.filter(t => t.type === 'income').reduce((a, t) => a + asNum(t.amount), 0);
  const expense = txs.filter(t => t.type === 'expense').reduce((a, t) => a + asNum(t.amount), 0);
  return { income, expense, net: income - expense };
}

export function computeTopBuckets({ transactions, limit = 5 }) {
  assertArr(transactions, 'transactions');
  const txs = Array.isArray(transactions) ? transactions : [];
  const buckets = {};
  for (const t of txs) {
    if (t?.type !== 'expense') continue;
    const b = asStr(t?.meta?.acct?.bucket) || 'uncategorized';
    buckets[b] = (buckets[b] || 0) + asNum(t.amount);
  }
  return Object.entries(buckets)
    .map(([bucket, total]) => ({ bucket, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

export function computeComplianceScore({ recurringItems, budgetsHealth }) {
  const list = Array.isArray(recurringItems) ? recurringItems : [];
  const seeded = list.filter(isSeededRecurring);
  if (seeded.length === 0) return null;

  const completion = seeded.length ? (seeded.filter(x => asNum(x.amount) > 0).length / seeded.length) : 0;
  const overdueCount = seeded.filter(x => isPastDue(x)).length;

  const budgetPenalty = (() => {
    if (!budgetsHealth) return 0;
    if (budgetsHealth.status === 'danger') return 0.25;
    if (budgetsHealth.status === 'warn') return 0.1;
    return 0;
  })();

  const overduePenalty = overdueCount > 0 ? Math.min(0.25, overdueCount * 0.05) : 0;

  const score = Math.max(0, Math.min(1, completion - overduePenalty - budgetPenalty));
  const pct = Math.round(score * 100);

  const note = overdueCount > 0
    ? 'يوجد استحقاقات متأخرة — ابدأ بتسعير/تحديث الأقرب.'
    : budgetsHealth?.status === 'danger'
      ? 'تجاوز للميزانية — راجع الالتزامات عالية التكلفة.'
      : 'جيد — استمر برفع اكتمال التسعير.';

  return { pct, note, completionPct: Math.round(completion * 100), overdueCount };
}
