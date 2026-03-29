import { PAYMENT_METHODS } from '../constants/index.js';
import { safeNum } from '../utils/helpers.js';
import { getCycleMonths, getInstallmentCount } from './contracts.js';

function parseDate(dateStr) {
  if (!dateStr) return null;
  const parsed = new Date(`${dateStr}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addMonths(date, count) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + count);
  return next;
}

function addDays(date, count) {
  const next = new Date(date);
  next.setDate(next.getDate() + count);
  return next;
}

function splitAmount(total, count) {
  const normalizedCount = Math.max(1, count);
  const base = Math.floor((safeNum(total) / normalizedCount) * 100) / 100;
  const amounts = Array.from({ length: normalizedCount }, () => base);
  const allocated = amounts.reduce((sum, value) => sum + value, 0);
  amounts[normalizedCount - 1] = Math.round((safeNum(total) - allocated + base) * 100) / 100;
  return amounts;
}

function createDueDates(contract, count) {
  const start = parseDate(contract?.startDate);
  const end = parseDate(contract?.endDate);
  if (!start) return [];

  if (contract?.paymentCycle === 'one_time') {
    return [formatDate(end || start)];
  }

  if (contract?.paymentCycle === 'custom') {
    if (!end || count === 1) return [formatDate(start)];
    const totalDays = Math.max(0, Math.round((end.getTime() - start.getTime()) / 86400000));
    return Array.from({ length: count }, (_, index) => {
      if (index === 0) return formatDate(start);
      if (index === count - 1) return formatDate(end);
      const offset = Math.round((totalDays * index) / (count - 1));
      return formatDate(addDays(start, offset));
    });
  }

  const cycleMonths = getCycleMonths(contract?.paymentCycle) || 1;
  return Array.from({ length: count }, (_, index) => formatDate(addMonths(start, cycleMonths * index)));
}

function compareDates(a, b) {
  return String(a || '').localeCompare(String(b || ''));
}

function applyAmount(due, payment, amount) {
  if (amount <= 0 || !due) return amount;
  const remainingBefore = Math.max(0, due.amount - due.paidAmount);
  if (remainingBefore <= 0) return amount;

  const applied = Math.min(remainingBefore, amount);
  due.paidAmount = Math.round((due.paidAmount + applied) * 100) / 100;
  due.remainingAmount = Math.max(0, Math.round((due.amount - due.paidAmount) * 100) / 100);
  due.payments.push({ ...payment, appliedAmount: applied });
  return Math.round((amount - applied) * 100) / 100;
}

export function getDueStatusLabel(status) {
  const labels = {
    paid: 'مدفوع',
    due: 'مستحق',
    overdue: 'متأخر',
    partial: 'جزئي',
  };
  return labels[status] || labels.due;
}

export function getDueStatusColor(status) {
  const colors = {
    paid: 'green',
    due: 'blue',
    overdue: 'red',
    partial: 'yellow',
  };
  return colors[status] || 'gray';
}

export function getPaymentMethodLabel(method) {
  return PAYMENT_METHODS[method] || PAYMENT_METHODS.bank_transfer;
}

export function buildContractSchedule(contract, payments = [], referenceDate = new Date()) {
  if (!contract) return [];

  const count = getInstallmentCount(contract);
  const amounts = splitAmount(contract.totalAmount, count);
  const dueDates = createDueDates(contract, count);
  const today = parseDate(formatDate(referenceDate)) || referenceDate;

  const dues = Array.from({ length: count }, (_, index) => ({
    id: `${contract.id}-due-${index + 1}`,
    contractId: contract.id,
    installmentNumber: index + 1,
    dueDate: dueDates[index] || contract.endDate || contract.startDate || '',
    amount: amounts[index] || 0,
    paidAmount: 0,
    remainingAmount: amounts[index] || 0,
    status: 'due',
    payments: [],
  }));

  const sortedPayments = [...(Array.isArray(payments) ? payments : [])].sort((a, b) => {
    const byDate = compareDates(a?.date, b?.date);
    if (byDate !== 0) return byDate;
    return compareDates(a?.createdAt, b?.createdAt);
  });

  for (const payment of sortedPayments) {
    let remaining = safeNum(payment?.amount);
    if (remaining <= 0) continue;

    const targetedDue = payment?.dueId ? dues.find((due) => due.id === payment.dueId) : null;
    if (targetedDue) {
      remaining = applyAmount(targetedDue, payment, remaining);
    }

    for (const due of dues) {
      if (remaining <= 0) break;
      if (targetedDue && due.id === targetedDue.id) continue;
      remaining = applyAmount(due, payment, remaining);
    }
  }

  for (const due of dues) {
    if (due.remainingAmount <= 0) {
      due.status = 'paid';
    } else if (due.paidAmount > 0) {
      due.status = 'partial';
    } else {
      const dueDate = parseDate(due.dueDate);
      due.status = dueDate && dueDate < today ? 'overdue' : 'due';
    }
  }

  return dues;
}

export function buildContractFinancials(contract, payments = [], referenceDate = new Date()) {
  const schedule = buildContractSchedule(contract, payments, referenceDate);
  const paid = schedule.reduce((sum, due) => sum + safeNum(due.paidAmount), 0);
  const total = safeNum(contract?.totalAmount);
  const remaining = Math.max(0, Math.round((total - paid) * 100) / 100);
  const overdue = schedule
    .filter((due) => due.status === 'overdue' || (due.status === 'partial' && due.remainingAmount > 0))
    .filter((due) => {
      const dueDate = parseDate(due.dueDate);
      const today = parseDate(formatDate(referenceDate)) || referenceDate;
      return dueDate && dueDate < today;
    })
    .reduce((sum, due) => sum + safeNum(due.remainingAmount), 0);

  const nextDue =
    schedule.find((due) => due.status !== 'paid' && due.remainingAmount > 0) || null;

  return {
    total,
    paid: Math.round(paid * 100) / 100,
    remaining,
    overdue: Math.round(overdue * 100) / 100,
    nextDue,
    schedule,
  };
}
