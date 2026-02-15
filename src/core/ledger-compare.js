/**
 * ledger-compare.js — محرك مقارنة الدفاتر (برومبت 4.1)
 * يقارن 2–5 دفاتر ويرجع صحة، تدفقات 30 يوم، متأخرات، ROI، اتجاه، أفضل/أسوأ، وتوصيات.
 */

import { getLedgers, getRecurringItems } from './ledger-store.js';
import { dataStore } from './dataStore.js';
import { calculateHealthScore } from './pulse-engine.js';
import { calculateInbox } from './inbox-engine.js';

const DAY_MS = 24 * 60 * 60 * 1000;

function getTransactionsForLedger(ledgerId) {
  const lid = String(ledgerId || '').trim();
  if (!lid) return [];
  const all = (dataStore.transactions?.list?.() || []).filter(Boolean);
  return all.filter((t) => String(t?.ledgerId || t?.meta?.ledgerId || '') === lid);
}

function last30DaysRange() {
  const now = new Date();
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const from = new Date(to.getTime() - 30 * DAY_MS);
  const toStr = to.toISOString().slice(0, 10);
  const fromStr = from.toISOString().slice(0, 10);
  return { fromStr, toStr, fromMs: from.getTime(), toMs: to.getTime() + DAY_MS };
}

function previous30DaysRange() {
  const now = new Date();
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const toPrev = new Date(to.getTime() - 30 * DAY_MS);
  const fromPrev = new Date(toPrev.getTime() - 30 * DAY_MS);
  const toStr = toPrev.toISOString().slice(0, 10);
  const fromStr = fromPrev.toISOString().slice(0, 10);
  return { fromStr, toStr };
}

function sumByTypeInRange(txs, fromStr, toStr) {
  let income = 0;
  let expense = 0;
  for (const t of txs) {
    const d = (t?.date || '').slice(0, 10);
    if (!d || d < fromStr || d > toStr) continue;
    const amt = Number(t.amount) || 0;
    if (t.type === 'income') income += amt;
    else if (t.type === 'expense') expense += amt;
  }
  return { income, expense };
}

/**
 * يقارن 2–5 دفاتر ويرجع ملخصاً وتوصيات.
 * @param {string[]} ledgerIds - مصفوفة معرّفات الدفاتر (2 إلى 5)
 * @returns {Object} { ledgers, bestPerformer, worstPerformer, recommendations }
 */
export function compareLedgers(ledgerIds) {
  const ids = (Array.isArray(ledgerIds) ? ledgerIds : []).filter((id) => id != null && String(id).trim());
  const limited = ids.slice(0, 5);
  if (limited.length < 2) {
    return {
      ledgers: [],
      bestPerformer: null,
      worstPerformer: null,
      recommendations: [],
    };
  }

  const allLedgers = getLedgers() || [];
  const { fromStr: from30, toStr: to30 } = last30DaysRange();
  const { fromStr: fromPrev, toStr: toPrev } = previous30DaysRange();

  const ledgers = limited.map((lid) => {
    const ledger = (allLedgers).find((l) => l.id === lid) || null;
    const txs = getTransactionsForLedger(lid);
    const { income: totalIncome30d, expense: totalExpense30d } = sumByTypeInRange(txs, from30, to30);
    const prev = sumByTypeInRange(txs, fromPrev, toPrev);
    const netCashflow30d = totalIncome30d - totalExpense30d;
    const prevNet = prev.income - prev.expense;
    let trend = 'stable';
    if (netCashflow30d > prevNet) trend = 'improving';
    else if (netCashflow30d < prevNet) trend = 'declining';

    const inbox = calculateInbox(lid);
    const overdueCount = inbox?.summary?.totalOverdue ?? 0;
    const overdueAmount = inbox?.summary?.totalOverdueAmount ?? 0;

    const roi = totalExpense30d > 0 ? totalIncome30d / totalExpense30d : (totalIncome30d > 0 ? 10 : 0);
    const healthScore = calculateHealthScore(lid);

    return {
      id: lid,
      name: ledger?.name || '—',
      type: ledger?.type || 'office',
      healthScore: Number(healthScore) || 0,
      totalIncome30d: Math.round(totalIncome30d) || 0,
      totalExpense30d: Math.round(totalExpense30d) || 0,
      netCashflow30d: Math.round(netCashflow30d) || 0,
      overdueCount,
      overdueAmount: Math.round(overdueAmount) || 0,
      roi: Math.round(roi * 100) / 100,
      trend,
    };
  });

  const withRoi = ledgers.filter((l) => l.totalExpense30d > 0);
  const bestByRoi = withRoi.length ? withRoi.reduce((a, b) => (b.roi > a.roi ? b : a), withRoi[0]) : null;
  const bestByHealth = ledgers.reduce((a, b) => (b.healthScore > a.healthScore ? b : a), ledgers[0]);
  const bestPerformer = bestByRoi
    ? { ledgerId: bestByRoi.id, reason: 'أعلى ROI' }
    : { ledgerId: bestByHealth.id, reason: 'أفضل صحة' };

  const worstByOverdue = ledgers.reduce((a, b) => (b.overdueAmount > a.overdueAmount || (b.overdueCount > a.overdueCount && b.overdueAmount >= a.overdueAmount) ? b : a), ledgers[0]);
  const worstByRoi = withRoi.length ? withRoi.reduce((a, b) => (b.roi < a.roi ? b : a), withRoi[0]) : null;
  const worstPerformer = worstByRoi && worstByRoi.roi < 1
    ? { ledgerId: worstByRoi.id, reason: 'أقل ROI' }
    : (worstByOverdue.overdueCount > 0 || worstByOverdue.overdueAmount > 0)
      ? { ledgerId: worstByOverdue.id, reason: 'أكثر متأخرات' }
      : { ledgerId: ledgers[0].id, reason: '—' };

  const recommendations = [];
  for (const l of ledgers) {
    if (l.totalExpense30d > 0 && l.totalIncome30d < l.totalExpense30d) {
      recommendations.push({
        message: `دفتر ${l.name} يستنزف أكثر مما ينتج — راجع التزاماته`,
      });
    }
  }

  return {
    ledgers,
    bestPerformer,
    worstPerformer,
    recommendations,
  };
}
