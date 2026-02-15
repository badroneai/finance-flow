/**
 * monthly-report-generator.js — مولّد التقرير الشهري (برومبت 5.1)
 * يجمع بيانات الشهر ويولد كائن تقرير: ملخص، تفصيل دخل/مصروف، التزامات، أبرز الأحداث، توقعات، حركات.
 */

import { getLedgers, getRecurringItems } from './ledger-store.js';
import { dataStore } from './dataStore.js';
import { calculateHealthScore } from './pulse-engine.js';
import { computePL } from './ledger-analytics.js';
import { buildLedgerInbox } from './ledger-planner.js';

function getTransactionsForLedger(ledgerId) {
  const lid = String(ledgerId || '').trim();
  if (!lid) return [];
  const all = (dataStore.transactions?.list?.() || []).filter(Boolean);
  return all.filter((t) => String(t?.ledgerId || t?.meta?.ledgerId || '') === lid);
}

function monthRange(year, month) {
  const y = Number(year) || new Date().getFullYear();
  const m = Number(month) || new Date().getMonth() + 1;
  const firstDay = `${y}-${String(m).padStart(2, '0')}-01`;
  const lastDate = new Date(y, m, 0);
  const lastDay = `${y}-${String(m).padStart(2, '0')}-${String(lastDate.getDate()).padStart(2, '0')}`;
  return { firstDay, lastDay };
}

function balanceBefore(txs, beforeDateStr) {
  let income = 0;
  let expense = 0;
  for (const t of txs) {
    const d = (t?.date || '').slice(0, 10);
    if (!d || d >= beforeDateStr) continue;
    const amt = Number(t.amount) || 0;
    if (t.type === 'income') income += amt;
    else if (t.type === 'expense') expense += amt;
  }
  return income - expense;
}

function filterTxInMonth(txs, firstDay, lastDay) {
  return (txs || []).filter((t) => {
    const d = (t?.date || '').slice(0, 10);
    return d && d >= firstDay && d <= lastDay;
  });
}

function breakdownByKey(txs, keyField, typeFilter) {
  const list = (txs || []).filter((t) => !typeFilter || t.type === typeFilter);
  const byKey = {};
  for (const t of list) {
    const key = String(t[keyField] || 'أخرى').trim() || 'أخرى';
    byKey[key] = byKey[key] || { amount: 0, count: 0 };
    byKey[key].amount += Number(t.amount) || 0;
    byKey[key].count += 1;
  }
  const total = Object.values(byKey).reduce((s, x) => s + x.amount, 0);
  return Object.entries(byKey).map(([k, v]) => ({
    [keyField === 'category' ? 'category' : 'source']: k,
    amount: Math.round(v.amount) || 0,
    percentage: total > 0 ? Math.round((v.amount / total) * 10000) / 100 : 0,
    count: v.count,
  })).sort((a, b) => b.amount - a.amount);
}

/**
 * يجمع بيانات الشهر ويولد كائن التقرير.
 * @param {string} ledgerId - معرّف الدفتر
 * @param {number|string} month - الشهر (1–12)
 * @param {number|string} year - السنة
 * @returns {Promise<Object>} كائن التقرير
 */
export async function generateMonthlyReport(ledgerId, month, year) {
  const lid = String(ledgerId || '').trim();
  const allLedgers = getLedgers() || [];
  const ledger = allLedgers.find((l) => l.id === lid) || null;
  const recurringList = (getRecurringItems() || []).filter((r) => String(r?.ledgerId || '') === lid);
  const txs = getTransactionsForLedger(lid);
  const { firstDay, lastDay } = monthRange(year, month);
  const monthTxs = filterTxInMonth(txs, firstDay, lastDay);

  const openingBalance = balanceBefore(txs, firstDay);
  const plMonth = computePL({ transactions: monthTxs });
  const totalIncome = Number(plMonth?.income) || 0;
  const totalExpense = Number(plMonth?.expense) || 0;
  const netCashflow = totalIncome - totalExpense;
  const closingBalance = openingBalance + netCashflow;

  const healthScore = lid ? calculateHealthScore(lid) : 0;
  let healthTrend = 'مستقر';
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const { firstDay: prevFirst, lastDay: prevLast } = monthRange(prevYear, prevMonth);
  const prevTxs = filterTxInMonth(txs, prevFirst, prevLast);
  const prevNet = (computePL({ transactions: prevTxs })?.income || 0) - (computePL({ transactions: prevTxs })?.expense || 0);
  if (netCashflow > prevNet) healthTrend = 'تحسن';
  else if (netCashflow < prevNet) healthTrend = 'تراجع';

  const incomeBreakdown = breakdownByKey(monthTxs, 'category', 'income').map((o) => ({
    source: o.category,
    amount: o.amount,
    percentage: o.percentage,
    count: o.count,
  }));
  const expenseBreakdown = breakdownByKey(monthTxs, 'category', 'expense');

  const recurringPaidInMonth = monthTxs
    .filter((t) => t?.meta?.recurringId)
    .reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const dueInMonth = (recurringList || []).filter((r) => {
    const d = (r?.nextDueDate || '').slice(0, 10);
    return d && d >= firstDay && d <= lastDay;
  });
  const totalDue = dueInMonth.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const nowForInbox = new Date(year, month - 1, 15);
  const inbox = buildLedgerInbox({ ledgerId: lid, recurringItems: recurringList, now: nowForInbox });
  const totalOverdue = (inbox || []).filter((i) => {
    const d = (i.nextDueDate || '').slice(0, 10);
    return d && d < firstDay;
  }).reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const complianceRate = totalDue > 0 ? Math.round((Math.min(recurringPaidInMonth, totalDue) / totalDue) * 100) : 100;

  const highlights = [];
  if (netCashflow > 0) highlights.push({ type: 'positive', message: `صافي التدفق إيجابي: +${Math.round(netCashflow).toLocaleString('ar-SA')} ر.س` });
  else if (netCashflow < 0) highlights.push({ type: 'negative', message: `صافي التدفق سالب: ${Math.round(netCashflow).toLocaleString('ar-SA')} ر.س` });
  if (totalOverdue > 0) highlights.push({ type: 'negative', message: `وجود التزامات متأخرة بقيمة ${Math.round(totalOverdue).toLocaleString('ar-SA')} ر.س` });
  if (complianceRate >= 90 && totalDue > 0) highlights.push({ type: 'positive', message: `نسبة الالتزام بالمواعيد ${complianceRate}%` });
  if (healthScore >= 80) highlights.push({ type: 'positive', message: `درجة الصحة المالية ${healthScore}` });
  else if (healthScore < 50 && healthScore > 0) highlights.push({ type: 'negative', message: `درجة الصحة المالية تحت المتوسط: ${healthScore}` });
  if (highlights.length === 0) highlights.push({ type: 'neutral', message: 'لا أحداث بارزة هذا الشهر' });

  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const nextFirst = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
  const nextRecurring = (recurringList || []).filter((r) => {
    const d = (r?.nextDueDate || '').slice(0, 10);
    return d && d >= nextFirst;
  });
  const expectedExpense = nextRecurring.filter((r) => String(r?.category || '').toLowerCase() !== 'income').reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const expectedIncome = nextRecurring.filter((r) => String(r?.category || '').toLowerCase() === 'income').reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const expectedNet = expectedIncome - expectedExpense;
  const risks = [];
  if (totalOverdue > 0) risks.push('التزامات متأخرة من الشهر السابق');
  if (expectedExpense > closingBalance && closingBalance > 0) risks.push('رصيد الإغلاق قد لا يغطي مصروفات الشهر القادم');

  return {
    meta: {
      ledgerName: ledger?.name || '—',
      ledgerType: ledger?.type || 'office',
      month: Number(month) || 1,
      year: Number(year) || new Date().getFullYear(),
      generatedAt: new Date().toISOString(),
    },
    summary: {
      openingBalance: Math.round(openingBalance) || 0,
      closingBalance: Math.round(closingBalance) || 0,
      totalIncome: Math.round(totalIncome) || 0,
      totalExpense: Math.round(totalExpense) || 0,
      netCashflow: Math.round(netCashflow) || 0,
      healthScore: Number(healthScore) || 0,
      healthTrend,
    },
    incomeBreakdown,
    expenseBreakdown,
    commitments: {
      totalDue: Math.round(totalDue) || 0,
      totalPaid: Math.round(recurringPaidInMonth) || 0,
      totalOverdue: Math.round(totalOverdue) || 0,
      complianceRate,
    },
    highlights,
    nextMonthForecast: {
      expectedIncome: Math.round(expectedIncome) || 0,
      expectedExpense: Math.round(expectedExpense) || 0,
      expectedNet: Math.round(expectedNet) || 0,
      risks,
    },
    transactions: monthTxs.map((t) => ({
      id: t.id,
      date: (t.date || '').slice(0, 10),
      type: t.type,
      category: t.category,
      amount: Number(t.amount) || 0,
      description: t.description,
      paymentMethod: t.paymentMethod,
    })),
  };
}
