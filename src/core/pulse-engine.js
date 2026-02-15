/**
 * pulse-engine.js — محرك النبض المالي (برومبت 0.4)
 * يحسب الصحة المالية للدفتر النشط والتنبيهات والتوقعات.
 *
 * يعتمد على:
 * - ledger-store.js (قراءة الدفتر النشط والالتزامات)
 * - dataStore.js (قراءة الحركات)
 * - ledger-planner.js (التوقعات وصندوق الوارد)
 * - ledger-health.js (درجة الصحة والامتثال)
 * - ledger-analytics.js (P&amp;L)
 */

import { getLedgers, getActiveLedgerId, getRecurringItems } from './ledger-store.js';
import { dataStore } from './dataStore.js';
import { buildLedgerInbox, computeCashPlan } from './ledger-planner.js';
import { computeLedgerHealth, computeComplianceShield } from './ledger-health.js';
import { computePL } from './ledger-analytics.js';

const DAY_MS = 24 * 60 * 60 * 1000;

function todayKey(now = new Date()) {
  const d = new Date(now);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function startOfWeekMs(now = new Date()) {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? 0 : -day;
  d.setDate(d.getDate() + diff);
  return d.getTime();
}

function endOfWeekMs(now = new Date()) {
  return startOfWeekMs(now) + 7 * DAY_MS - 1;
}

function getTransactionsForLedger(ledgerId) {
  const lid = String(ledgerId || '').trim();
  if (!lid) return [];
  const all = dataStore.transactions.list() || [];
  return all.filter((t) => String(t?.ledgerId || t?.meta?.ledgerId || '') === lid);
}

/** تجميع سياق الدفتر (للاستخدام الداخلي والدوال المُصدَّرة) */
function getContext(ledgerId) {
  const lid = (ledgerId != null ? String(ledgerId).trim() : (getActiveLedgerId() || '').trim()) || '';
  const ledgers = getLedgers();
  const ledger = (Array.isArray(ledgers) ? ledgers : []).find((l) => l.id === lid) || null;
  const recurring = getRecurringItems();
  const recurringList = (Array.isArray(recurring) ? recurring : []).filter((r) => String(r?.ledgerId || '') === lid);
  const txs = getTransactionsForLedger(lid);
  return { lid, ledger, recurringList, txs, now: new Date() };
}

function healthToStatusAndColor(score) {
  if (score >= 80) return { status: 'excellent', color: '#059669' };
  if (score >= 60) return { status: 'good', color: '#2563eb' };
  if (score >= 40) return { status: 'warning', color: '#d97706' };
  return { status: 'critical', color: '#dc2626' };
}

// ---------- الدوال المساعدة المُصدَّرة (برومبت 0.4) ----------

/**
 * حساب درجة الصحة (0–100)
 * المعايير: التزامات مدفوعة في وقتها 40%، نسبة دخل/مصروف 20%، التنبيهات الحرجة 20%، استقرار التدفق 3 أشهر 20%
 */
export function calculateHealthScore(ledgerId) {
  const ctx = getContext(ledgerId);
  const { lid, txs, recurringList } = ctx;
  if (!lid) return 0;

  const health = computeLedgerHealth({ recurringItems: recurringList, transactions: txs });
  const compliance = computeComplianceShield({ ledgerId: lid, recurringItems: recurringList, now: ctx.now });

  // 40%: انضباط الدفع (disciplineRatio 0–1)
  const disciplineScore = Math.min(40, Math.round((Number(health?.disciplineRatio) ?? 0) * 40));

  // 20%: نسبة دخل/مصروف (لا تتجاوز الميزانية)
  const pl = computePL({ transactions: txs });
  const income = Number(pl?.income) || 0;
  const expense = Number(pl?.expense) || 0;
  const ratio = expense > 0 ? Math.min(1, income / expense) : 1;
  const ratioScore = Math.round(ratio * 20);

  // 20%: تنبيهات حرجة (كل حرج يخصم)
  const alerts = detectAlertsInternal(ctx);
  const criticalCount = alerts.filter((a) => a.severity === 'critical').length;
  const alertScore = Math.max(0, 20 - criticalCount * 5);

  // 20%: استقرار التدفق (تباين صافي آخر 3 أشهر)
  const last90 = txs.filter((t) => {
    const d = (t?.date || '').slice(0, 10);
    if (!d) return false;
    return Date.now() - new Date(d + 'T00:00:00').getTime() <= 90 * DAY_MS;
  });
  const byMonth = {};
  for (const t of last90) {
    const key = (t.date || '').slice(0, 7);
    if (!key) continue;
    if (!byMonth[key]) byMonth[key] = 0;
    const amt = Number(t.amount) || 0;
    byMonth[key] += t.type === 'income' ? amt : -amt;
  }
  const nets = Object.values(byMonth);
  const avg = nets.length ? nets.reduce((a, n) => a + n, 0) / nets.length : 0;
  const variance = nets.length ? nets.reduce((a, n) => a + (n - avg) ** 2, 0) / nets.length : 0;
  const stability = variance > 0 ? Math.max(0, 1 - Math.min(1, variance / (Math.abs(avg) || 1))) : 1;
  const stabilityScore = Math.round(stability * 20);

  // خلط مع صحة الدفتر والامتثال إن وُجدتا (مرجّح خفيف)
  const legacyHealth = (health?.score != null ? Math.min(50, Math.round(health.score * 0.5)) : 0) +
    (compliance?.score != null ? Math.min(50, Math.round(compliance.score * 0.5)) : 0);
  const blended = (disciplineScore + ratioScore + alertScore + stabilityScore) * 0.7 + Math.min(100, legacyHealth) * 0.3;

  return Math.min(100, Math.max(0, Math.round(blended)));
}

/**
 * اكتشاف التنبيهات: overdue، upcoming، anomaly، cashflow_risk
 * يرجع مصفوفة بالشكل { id, type, severity, title, amount, dueDate, actionLabel, actionType }
 */
export function detectAlerts(ledgerId) {
  return detectAlertsInternal(getContext(ledgerId));
}

function detectAlertsInternal(ctx) {
  const { lid, txs, recurringList, now } = ctx;
  const alerts = [];
  const todayMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const in7 = todayMs + 7 * DAY_MS;

  const inbox = buildLedgerInbox({ ledgerId: lid, recurringItems: recurringList, now });
  for (const item of inbox || []) {
    const due = item.nextDueDate ? new Date(item.nextDueDate + 'T00:00:00').getTime() : null;
    if (due == null) continue;
    const amount = Number(item.amount) || 0;
    const dueStr = item.nextDueDate || '';
    if (due < todayMs) {
      alerts.push({
        id: `overdue-${item.id || Math.random().toString(36).slice(2)}`,
        type: 'overdue',
        severity: 'critical',
        title: item.title || '—',
        amount,
        dueDate: dueStr,
        actionLabel: 'سجّل الدفعة',
        actionType: 'record_payment',
      });
    } else if (due <= in7) {
      alerts.push({
        id: `upcoming-${item.id || Math.random().toString(36).slice(2)}`,
        type: 'upcoming',
        severity: 'warning',
        title: item.title || '—',
        amount,
        dueDate: dueStr,
        actionLabel: 'استعد للدفع',
        actionType: 'prepare_payment',
      });
    }
  }

  // anomaly: حركة > 3× متوسط نفس النوع في آخر 90 يوم
  const last90 = txs.filter((t) => {
    const d = (t?.date || '').slice(0, 10);
    if (!d) return false;
    return Date.now() - new Date(d + 'T00:00:00').getTime() <= 90 * DAY_MS;
  });
  const avgIncome = last90.filter((t) => t.type === 'income').reduce((a, t) => a + (Number(t.amount) || 0), 0) / (last90.filter((t) => t.type === 'income').length || 1);
  const avgExpense = last90.filter((t) => t.type === 'expense').reduce((a, t) => a + (Number(t.amount) || 0), 0) / (last90.filter((t) => t.type === 'expense').length || 1);
  for (const t of last90) {
    const amt = Number(t.amount) || 0;
    const threshold = t.type === 'income' ? avgIncome * 3 : avgExpense * 3;
    if (threshold > 0 && amt >= threshold) {
      alerts.push({
        id: `anomaly-${t.id || t.date || Math.random().toString(36).slice(2)}`,
        type: 'anomaly',
        severity: 'warning',
        title: (t.description || 'حركة غير اعتيادية').slice(0, 60),
        amount: amt,
        dueDate: (t.date || '').slice(0, 10),
        actionLabel: 'راجع الحركة',
        actionType: 'review_transaction',
      });
    }
  }

  // cashflow_risk: توقع عجز خلال 30 يوم
  const weekF = calculateWeekForecastInternal(ctx);
  if (weekF.riskLevel === 'danger' || (weekF.netCashflow < 0 && weekF.expectedExpenses > 0)) {
    alerts.push({
      id: 'cashflow_risk-1',
      type: 'cashflow_risk',
      severity: weekF.riskLevel === 'danger' ? 'critical' : 'warning',
      title: 'توقع عجز في السيولة خلال الأسبوع',
      amount: Math.abs(weekF.netCashflow),
      dueDate: todayKey(now),
      actionLabel: 'راجع التوقعات والالتزامات',
      actionType: 'review_forecast',
    });
  }

  return alerts.slice(0, 15);
}

/**
 * توقعات الأسبوع: دخل متوقع، مصروفات، صافي التدفق، مستوى المخاطرة
 */
export function calculateWeekForecast(ledgerId) {
  return calculateWeekForecastInternal(getContext(ledgerId));
}

function calculateWeekForecastInternal(ctx) {
  const { lid, txs, recurringList } = ctx;
  const plan = computeCashPlan({ ledgerId: lid, recurringItems: recurringList, now: ctx.now });
  const weekExpenses = Number(plan?.totals?.d7) || 0;

  const cutoff = Date.now() - 28 * DAY_MS;
  const recent = (txs || []).filter((t) => {
    const d = (t.date || '').slice(0, 10);
    if (!d) return false;
    return new Date(d + 'T00:00:00').getTime() >= cutoff;
  });
  const incomeSum = recent.filter((t) => t.type === 'income').reduce((a, t) => a + (Number(t.amount) || 0), 0);
  const expectedIncome = recent.length > 0 ? incomeSum / (28 / 7) : 0;

  const netCashflow = expectedIncome - weekExpenses;
  let riskLevel = 'safe';
  if (netCashflow < 0) riskLevel = 'danger';
  else if (weekExpenses > 0 && netCashflow < weekExpenses * 0.2) riskLevel = 'tight';

  return {
    expectedIncome: Math.round(expectedIncome),
    expectedExpenses: Math.round(weekExpenses),
    netCashflow: Math.round(netCashflow),
    riskLevel,
  };
}

// ---------- كائن النبض الكامل (برومبت 0.4) ----------

/**
 * يحسب ويرجع كائن النبض (Pulse Object) للواجهة
 * @param {string} [ledgerId] - معرّف الدفتر (إن غاب يُستخدم النشط)
 */
export function calculatePulse(ledgerId) {
  const ctx = getContext(ledgerId);
  const { lid, ledger, recurringList, txs, now } = ctx;
  const calculatedAt = now.toISOString();

  if (!lid) {
    return {
      todayIncome: 0,
      weekExpenses: 0,
      currentBalance: 0,
      balanceTrend: 'stable',
      healthScore: 0,
      healthStatus: 'unknown',
      healthColor: '#6b7280',
      alerts: [],
      weekForecast: { expectedIncome: 0, expectedExpenses: 0, netCashflow: 0, riskLevel: 'safe' },
      upcomingDues: [],
      ledgerSummary: { ledgerId: '', ledgerName: '', ledgerType: '', totalTransactions: 0, activeRecurringItems: 0, monthlyAvgIncome: 0, monthlyAvgExpense: 0 },
      calculatedAt,
      dataFreshness: 'live',
    };
  }

  const todayStr = todayKey(now);
  const todayIncome = txs.filter((t) => t.type === 'income' && (t.date || '').slice(0, 10) === todayStr).reduce((a, t) => a + (Number(t.amount) || 0), 0);
  const weekStart = startOfWeekMs(now);
  const weekEnd = endOfWeekMs(now);
  const weekExpenses = txs
    .filter((t) => {
      const d = (t.date || '').slice(0, 10);
      if (!d) return false;
      const tMs = new Date(d + 'T00:00:00').getTime();
      return t.type === 'expense' && tMs >= weekStart && tMs <= weekEnd;
    })
    .reduce((a, t) => a + (Number(t.amount) || 0), 0);

  const pl = computePL({ transactions: txs });
  const currentBalance = (Number(pl?.income) || 0) - (Number(pl?.expense) || 0);

  const lastWeekStart = weekStart - 7 * DAY_MS;
  const lastWeekEnd = weekEnd - 7 * DAY_MS;
  const lastWeekNet = txs
    .filter((t) => {
      const d = (t.date || '').slice(0, 10);
      if (!d) return false;
      const tMs = new Date(d + 'T00:00:00').getTime();
      return tMs >= lastWeekStart && tMs <= lastWeekEnd;
    })
    .reduce((a, t) => a + (t.type === 'income' ? Number(t.amount) || 0 : -(Number(t.amount) || 0)), 0);
  const thisWeekNet = txs
    .filter((t) => {
      const d = (t.date || '').slice(0, 10);
      if (!d) return false;
      const tMs = new Date(d + 'T00:00:00').getTime();
      return tMs >= weekStart && tMs <= weekEnd;
    })
    .reduce((a, t) => a + (t.type === 'income' ? Number(t.amount) || 0 : -(Number(t.amount) || 0)), 0);
  let balanceTrend = 'stable';
  if (thisWeekNet > lastWeekNet) balanceTrend = 'up';
  else if (thisWeekNet < lastWeekNet) balanceTrend = 'down';

  const healthScore = calculateHealthScore(lid);
  const { status: healthStatus, color: healthColor } = healthToStatusAndColor(healthScore);

  const alerts = detectAlerts(lid);
  const weekForecast = calculateWeekForecast(lid);

  const inbox = buildLedgerInbox({ ledgerId: lid, recurringItems: recurringList, now });
  const upcomingDues = (inbox || []).slice(0, 5).map((item) => {
    const due = item.nextDueDate || '';
    const dueMs = due ? new Date(due + 'T00:00:00').getTime() : null;
    const todayMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const daysRemaining = dueMs != null ? Math.ceil((dueMs - todayMs) / DAY_MS) : null;
    return {
      id: item.id,
      name: item.title || '—',
      amount: item.amount,
      dueDate: due,
      daysRemaining,
      type: (item.category || '').toLowerCase() === 'income' ? 'income' : 'expense',
      recurring: true,
    };
  });

  const last90 = txs.filter((t) => {
    const d = (t.date || '').slice(0, 10);
    if (!d) return false;
    return Date.now() - new Date(d + 'T00:00:00').getTime() <= 90 * DAY_MS;
  });
  const monthlyIncome = last90.filter((t) => t.type === 'income').reduce((a, t) => a + (Number(t.amount) || 0), 0) / 3;
  const monthlyExpense = last90.filter((t) => t.type === 'expense').reduce((a, t) => a + (Number(t.amount) || 0), 0) / 3;

  return {
    todayIncome,
    weekExpenses,
    currentBalance,
    balanceTrend,
    healthScore,
    healthStatus,
    healthColor,
    alerts,
    weekForecast,
    upcomingDues,
    ledgerSummary: {
      ledgerId: lid,
      ledgerName: ledger?.name || '—',
      ledgerType: ledger?.type || 'office',
      totalTransactions: txs.length,
      activeRecurringItems: recurringList.filter((r) => Number(r?.amount) > 0).length,
      monthlyAvgIncome: Math.round(monthlyIncome) || 0,
      monthlyAvgExpense: Math.round(monthlyExpense) || 0,
    },
    calculatedAt,
    dataFreshness: 'live',
  };
}
