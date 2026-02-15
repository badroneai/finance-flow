/**
 * alert-engine.js — محرك التنبيهات الذكية (برومبت 3.1)
 * يحلل البيانات ويولّد تنبيهات استباقية.
 * شكل التنبيه: { id, type, severity, title, amount?, dueDate?, actionLabel, actionType } (متوافق مع pulse-engine)
 * لا تكرر المُرفضة (dismissed) أو المؤجلة (snoozed) — تُخزَّن في localStorage بصلاحية 7 أيام. أقصى 10 تنبيهات.
 */

import { getLedgers, getActiveLedgerId, getRecurringItems } from './ledger-store.js';
import { dataStore } from './dataStore.js';
import { buildLedgerInbox, computeCashPlan } from './ledger-planner.js';
import { computePL } from './ledger-analytics.js';
import { calculateHealthScore } from './pulse-engine.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const STORAGE_KEY = 'ff_alert_state';
const DISMISS_TTL_DAYS = 7;
const MAX_ALERTS = 10;

function getTransactionsForLedger(ledgerId) {
  const lid = String(ledgerId || '').trim();
  if (!lid) return [];
  const all = (dataStore.transactions?.list?.() || []).filter(Boolean);
  return all.filter((t) => String(t?.ledgerId || t?.meta?.ledgerId || '') === lid);
}

function getContext(ledgerId) {
  const lid = (ledgerId != null ? String(ledgerId).trim() : (getActiveLedgerId() || '').trim()) || '';
  const ledgers = getLedgers() || [];
  const ledger = (Array.isArray(ledgers) ? ledgers : []).find((l) => l.id === lid) || null;
  const recurring = getRecurringItems() || [];
  const recurringList = (Array.isArray(recurring) ? recurring : []).filter((r) => String(r?.ledgerId || '') === lid);
  const txs = getTransactionsForLedger(lid);
  const now = new Date();
  return { lid, ledger, recurringList, txs, now };
}

function todayKey(now = new Date()) {
  const d = new Date(now);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** يرجع مجموعة معرّفات التنبيهات المخفية (مرفوضة ضمن TTL أو مؤجلة حتى وقت لاحق) */
function getHiddenIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const data = JSON.parse(raw);
    const now = Date.now();
    const hidden = new Set();
    const dismissed = data?.dismissed && typeof data.dismissed === 'object' ? data.dismissed : {};
    for (const [id, expiryAt] of Object.entries(dismissed)) {
      if (Number(expiryAt) > now) hidden.add(id);
    }
    const snoozed = data?.snoozed && typeof data.snoozed === 'object' ? data.snoozed : {};
    for (const [id, showAfter] of Object.entries(snoozed)) {
      if (Number(showAfter) > now) hidden.add(id);
    }
    return hidden;
  } catch {
    return new Set();
  }
}

function bySeverityThenDate(a, b) {
  const order = { critical: 0, warning: 1, info: 2 };
  const sa = order[a.severity] ?? 3;
  const sb = order[b.severity] ?? 3;
  if (sa !== sb) return sa - sb;
  const da = (a.dueDate || '').slice(0, 10);
  const db = (b.dueDate || '').slice(0, 10);
  return (da || '').localeCompare(db || '');
}

function isIncomeCategory(category) {
  const c = String(category || '').toLowerCase();
  return c === 'income' || c === 'دخل' || c === 'commission' || c === 'عمولة' || c === 'deposit' || c === 'إيداع';
}

// ---------- 1. أزمة سيولة متوقعة ----------
function detectCashflowCrisis(ledgerId) {
  const ctx = getContext(ledgerId);
  const { lid, txs, recurringList, now } = ctx;
  if (!lid) return [];

  const pl = computePL({ transactions: txs });
  const balance = (Number(pl?.income) || 0) - (Number(pl?.expense) || 0);
  const plan = computeCashPlan({ ledgerId: lid, recurringItems: recurringList, now });
  const expectedExpense30 = Number(plan?.totals?.d30) || 0;
  const todayMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const in30 = todayMs + 30 * DAY_MS;
  let expectedIncome30 = 0;
  for (const r of recurringList) {
    if (!isIncomeCategory(r?.category)) continue;
    const amt = Number(r?.amount) || 0;
    if (amt <= 0) continue;
    const dueStr = (r?.nextDueDate || '').slice(0, 10);
    if (!dueStr) continue;
    const dueMs = new Date(dueStr + 'T00:00:00').getTime();
    if (dueMs >= todayMs && dueMs <= in30) expectedIncome30 += amt;
  }
  const projected = balance + expectedIncome30 - expectedExpense30;
  if (projected >= 0) return [];

  const needed = Math.abs(Math.round(projected));
  const dateStr = new Date(now.getTime() + 30 * DAY_MS);
  const dateLabel = dateStr.toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });
  return [
    {
      id: 'smart_cashflow_crisis',
      type: 'cashflow_crisis',
      severity: 'critical',
      title: `تحذير: في ${dateLabel} ستحتاج ${needed.toLocaleString('ar-SA')} ر.س إضافية لتغطية التزاماتك`,
      amount: needed,
      dueDate: todayKey(now),
      actionLabel: 'راجع التوقعات والالتزامات',
      actionType: 'review_forecast',
    },
  ];
}

// ---------- 2. نمط إنفاق غير طبيعي ----------
function detectSpendingAnomaly(ledgerId) {
  const ctx = getContext(ledgerId);
  const { txs, now } = ctx;
  const todayStr = todayKey(now);
  const last30 = (txs || []).filter((t) => {
    const d = (t?.date || '').slice(0, 10);
    if (!d) return false;
    return Date.now() - new Date(d + 'T00:00:00').getTime() <= 30 * DAY_MS;
  });
  const expenses30 = last30.filter((t) => t.type === 'expense');
  const total30 = expenses30.reduce((a, t) => a + (Number(t.amount) || 0), 0);
  const avgDaily = expenses30.length ? total30 / 30 : 0;
  const todayExpense = expenses30
    .filter((t) => (t.date || '').slice(0, 10) === todayStr)
    .reduce((a, t) => a + (Number(t.amount) || 0), 0);
  if (avgDaily <= 0 || todayExpense < 3 * avgDaily) return [];
  const avgLabel = Math.round(avgDaily).toLocaleString('ar-SA');
  const todayLabel = Math.round(todayExpense).toLocaleString('ar-SA');
  return [
    {
      id: 'smart_spending_anomaly',
      type: 'spending_anomaly',
      severity: 'warning',
      title: `مصروفات اليوم (${todayLabel} ر.س) أعلى بكثير من المعتاد (${avgLabel} ر.س)`,
      amount: Math.round(todayExpense),
      dueDate: todayStr,
      actionLabel: 'راجع الحركات',
      actionType: 'review_transaction',
    },
  ];
}

// ---------- 3. دخل متوقع لم يصل ----------
function isDuePaid(txs, recurringId, dueStr, nextDueStr) {
  const rid = String(recurringId || '');
  return (txs || []).some((t) => {
    const tid = String(t?.meta?.recurringId || '').trim();
    if (tid !== rid) return false;
    const txDate = (t.date || '').slice(0, 10);
    return txDate >= dueStr && txDate < (nextDueStr || '9999-12-31');
  });
}

function nextDueByFrequency(dateStr, frequency) {
  const d = new Date(dateStr + 'T00:00:00');
  const f = String(frequency || '').toLowerCase();
  if (f === 'yearly') d.setFullYear(d.getFullYear() + 1);
  else if (f === 'quarterly') d.setMonth(d.getMonth() + 3);
  else if (f === 'weekly') d.setDate(d.getDate() + 7);
  else d.setMonth(d.getMonth() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function detectMissedIncome(ledgerId) {
  const ctx = getContext(ledgerId);
  const { lid, txs, recurringList, now } = ctx;
  if (!lid) return [];
  const todayStr = todayKey(now);
  const alerts = [];
  for (const r of recurringList) {
    if (!isIncomeCategory(r?.category)) continue;
    const dueStr = (r?.nextDueDate || '').slice(0, 10);
    if (!dueStr || dueStr >= todayStr) continue;
    if (isDuePaid(txs, r.id, dueStr, nextDueByFrequency(dueStr, r.frequency))) continue;
    const name = r?.title || '—';
    const dateLabel = dueStr ? new Date(dueStr + 'T00:00:00').toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' }) : dueStr;
    alerts.push({
      id: `smart_missed_income_${r.id}_${dueStr}`,
      type: 'missed_income',
      severity: 'warning',
      title: `${name} كان يفترض وصوله في ${dateLabel} ولم يُسجل بعد`,
      amount: Number(r?.amount) || 0,
      dueDate: dueStr,
      actionLabel: 'سجّل الوارد',
      actionType: 'record_payment',
    });
  }
  return alerts;
}

// ---------- 4. تحسن/تدهور الصحة المالية ----------
const HEALTH_STORAGE_PREFIX = 'ff_alert_last_health_';
const HEALTH_TREND_THRESHOLD = 10;

function detectHealthTrend(ledgerId) {
  const lid = String(ledgerId || '').trim();
  if (!lid) return [];
  const currentScore = calculateHealthScore(lid);
  const key = HEALTH_STORAGE_PREFIX + lid;
  let previousScore = null;
  let previousAt = null;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const data = JSON.parse(raw);
      previousScore = data?.score;
      previousAt = data?.at;
    }
  } catch {}
  const now = Date.now();
  const sixDaysMs = 6 * DAY_MS;
  const alerts = [];
  if (previousScore != null && previousAt != null && now - previousAt >= sixDaysMs) {
    const diff = currentScore - previousScore;
    if (diff <= -HEALTH_TREND_THRESHOLD) {
      alerts.push({
        id: 'smart_health_decline',
        type: 'health_trend',
        severity: 'warning',
        title: `تدهور الصحة المالية: انخفاض ${Math.abs(diff)} نقطة عن الفترة السابقة`,
        amount: 0,
        dueDate: todayKey(),
        actionLabel: 'راجع الدفتر والالتزامات',
        actionType: 'review_forecast',
      });
    } else if (diff >= HEALTH_TREND_THRESHOLD) {
      alerts.push({
        id: 'smart_health_improve',
        type: 'health_trend',
        severity: 'info',
        title: `تحسن الصحة المالية: ارتفاع ${diff} نقطة عن الفترة السابقة`,
        amount: 0,
        dueDate: todayKey(),
        actionLabel: 'عرض النبض',
        actionType: 'review_forecast',
      });
    }
  }
  try {
    localStorage.setItem(key, JSON.stringify({ score: currentScore, at: now }));
  } catch {}
  return alerts;
}

// ---------- 5. التزام بدون حركات منذ فترة (دورتين) ----------
function cycleDays(frequency) {
  const f = String(frequency || '').toLowerCase();
  if (f === 'yearly') return 365;
  if (f === 'quarterly') return 90;
  if (f === 'weekly') return 14;
  return 60;
}

function detectDormantCommitments(ledgerId) {
  const ctx = getContext(ledgerId);
  const { lid, txs, recurringList, now } = ctx;
  if (!lid) return [];
  const todayMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const alerts = [];
  for (const r of recurringList) {
    const amt = Number(r?.amount) || 0;
    if (amt <= 0) continue;
    const rid = r.id;
    const matching = (txs || []).filter((t) => String(t?.meta?.recurringId || '') === rid);
    const lastTx = matching.length
      ? matching.reduce((best, t) => {
          const d = (t.date || '').slice(0, 10);
          if (!d) return best;
          const ms = new Date(d + 'T00:00:00').getTime();
          return !best || ms > best ? ms : best;
        }, null)
      : null;
    const days = cycleDays(r.frequency) * 2;
    const cutoff = todayMs - days * DAY_MS;
    if (lastTx == null || lastTx < cutoff) {
      const name = r?.title || '—';
      alerts.push({
        id: `smart_dormant_${rid}`,
        type: 'dormant_commitment',
        severity: 'warning',
        title: `التزام "${name}" لم يُسجل له أي حركة منذ دورتين — تحقق من أنه لا يزال فعالاً أو سجّل الدفعة`,
        amount: amt,
        dueDate: r?.nextDueDate || todayKey(now),
        actionLabel: 'راجع الالتزامات',
        actionType: 'review_forecast',
      });
    }
  }
  return alerts;
}

// ---------- تجميع وترتيب ----------
function detectAllAlerts(ledgerId) {
  const all = [
    ...detectCashflowCrisis(ledgerId),
    ...detectSpendingAnomaly(ledgerId),
    ...detectMissedIncome(ledgerId),
    ...detectHealthTrend(ledgerId),
    ...detectDormantCommitments(ledgerId),
  ];
  const hidden = getHiddenIds();
  const filtered = all.filter((a) => a && a.id && !hidden.has(a.id));
  return filtered.sort(bySeverityThenDate).slice(0, MAX_ALERTS);
}

/**
 * يرجع تنبيهات ذكية للدفتر، مرتبة حسب الخطورة ثم التاريخ، بعد استبعاد المُرفضة/المؤجلة، بحد أقصى 10.
 * @param {string} [ledgerId] - معرّف الدفتر (إن غاب يُستخدم النشط)
 * @returns {Array<{ id, type, severity, title, amount?, dueDate?, actionLabel, actionType }>}
 */
export function generateSmartAlerts(ledgerId) {
  return detectAllAlerts(ledgerId);
}
