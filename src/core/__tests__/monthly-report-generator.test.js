/**
 * اختبارات مولّد التقرير الشهري (monthly-report-generator)
 */
import { describe, it, expect, vi } from 'vitest';

// Mock dependencies
vi.mock('../ledger-store.js', () => ({
  getLedgers: vi.fn(() => []),
  getActiveLedgerId: vi.fn(() => ''),
  getRecurringItems: vi.fn(() => []),
}));

vi.mock('../dataStore.js', () => ({
  dataStore: { transactions: { list: vi.fn(() => []) } },
  getTransactionsForLedger: vi.fn(() => []),
}));

vi.mock('../ledger-planner.js', () => ({
  buildLedgerInbox: vi.fn(() => []),
  computeCashPlan: vi.fn(() => ({ totals: { d7: 0, d30: 0 } })),
}));

vi.mock('../ledger-health.js', () => ({
  computeLedgerHealth: vi.fn(() => ({ score: 50, disciplineRatio: 0.5 })),
  computeComplianceShield: vi.fn(() => ({ score: 50 })),
}));

vi.mock('../ledger-analytics.js', () => ({
  computePL: vi.fn(({ transactions }) => {
    const txs = Array.isArray(transactions) ? transactions : [];
    const income = txs
      .filter((t) => t.type === 'income')
      .reduce((a, t) => a + (Number(t.amount) || 0), 0);
    const expense = txs
      .filter((t) => t.type === 'expense')
      .reduce((a, t) => a + (Number(t.amount) || 0), 0);
    return { income, expense, net: income - expense };
  }),
}));

vi.mock('../pulse-engine.js', () => ({
  calculateHealthScore: vi.fn(() => 75),
}));

const { generateMonthlyReport } = await import('../monthly-report-generator.js');

const LEDGER_ID = 'ledger-001';

describe('monthly-report-generator — generateMonthlyReport', () => {
  it('بدون حركات يُرجع تقرير فارغ مع هيكل صحيح', async () => {
    const report = await generateMonthlyReport(LEDGER_ID, 3, 2025, {
      ledgers: [{ id: LEDGER_ID, name: 'مكتب الأمانة', type: 'office' }],
      recurringItems: [],
      transactions: [],
    });

    expect(report).toBeDefined();
    expect(report.meta.ledgerName).toBe('مكتب الأمانة');
    expect(report.meta.month).toBe(3);
    expect(report.meta.year).toBe(2025);
    expect(report.summary.totalIncome).toBe(0);
    expect(report.summary.totalExpense).toBe(0);
    expect(report.summary.netCashflow).toBe(0);
    expect(report.transactions).toHaveLength(0);
    expect(Array.isArray(report.incomeBreakdown)).toBe(true);
    expect(Array.isArray(report.expenseBreakdown)).toBe(true);
    expect(Array.isArray(report.highlights)).toBe(true);
    expect(report.highlights.length).toBeGreaterThan(0);
  });

  it('حركات الشهر تُحسب في الملخص بشكل صحيح', async () => {
    const transactions = [
      {
        id: 't1',
        ledgerId: LEDGER_ID,
        type: 'income',
        amount: 15000,
        date: '2025-03-05',
        category: 'إيجار',
        description: 'إيجار مارس',
      },
      {
        id: 't2',
        ledgerId: LEDGER_ID,
        type: 'expense',
        amount: 3000,
        date: '2025-03-10',
        category: 'صيانة',
        description: 'صيانة مكيفات',
      },
      {
        id: 't3',
        ledgerId: LEDGER_ID,
        type: 'expense',
        amount: 1000,
        date: '2025-03-15',
        category: 'كهرباء',
        description: 'فاتورة كهرباء',
      },
      // حركة خارج الشهر — لا تُحسب
      {
        id: 't4',
        ledgerId: LEDGER_ID,
        type: 'income',
        amount: 5000,
        date: '2025-02-28',
        category: 'إيجار',
        description: 'إيجار فبراير',
      },
    ];

    const report = await generateMonthlyReport(LEDGER_ID, 3, 2025, {
      ledgers: [{ id: LEDGER_ID, name: 'مكتب الأمانة', type: 'office' }],
      recurringItems: [],
      transactions,
    });

    expect(report.summary.totalIncome).toBe(15000);
    expect(report.summary.totalExpense).toBe(4000);
    expect(report.summary.netCashflow).toBe(11000);
    expect(report.transactions).toHaveLength(3);
  });

  it('رصيد الافتتاح يشمل حركات قبل الشهر', async () => {
    const transactions = [
      {
        id: 't-prev',
        ledgerId: LEDGER_ID,
        type: 'income',
        amount: 20000,
        date: '2025-02-15',
        category: 'إيجار',
      },
      {
        id: 't-prev2',
        ledgerId: LEDGER_ID,
        type: 'expense',
        amount: 5000,
        date: '2025-02-20',
        category: 'مصروف',
      },
      {
        id: 't-current',
        ledgerId: LEDGER_ID,
        type: 'income',
        amount: 10000,
        date: '2025-03-10',
        category: 'إيجار',
      },
    ];

    const report = await generateMonthlyReport(LEDGER_ID, 3, 2025, {
      ledgers: [{ id: LEDGER_ID, name: 'مكتب' }],
      recurringItems: [],
      transactions,
    });

    // رصيد الافتتاح = 20000 - 5000 = 15000
    expect(report.summary.openingBalance).toBe(15000);
    // رصيد الإغلاق = 15000 + 10000 = 25000
    expect(report.summary.closingBalance).toBe(25000);
  });

  it('تفصيل الدخل والمصروف حسب التصنيف', async () => {
    const transactions = [
      {
        id: 't1',
        ledgerId: LEDGER_ID,
        type: 'income',
        amount: 10000,
        date: '2025-03-01',
        category: 'إيجار',
      },
      {
        id: 't2',
        ledgerId: LEDGER_ID,
        type: 'income',
        amount: 5000,
        date: '2025-03-05',
        category: 'عمولة',
      },
      {
        id: 't3',
        ledgerId: LEDGER_ID,
        type: 'expense',
        amount: 2000,
        date: '2025-03-10',
        category: 'صيانة',
      },
      {
        id: 't4',
        ledgerId: LEDGER_ID,
        type: 'expense',
        amount: 1000,
        date: '2025-03-12',
        category: 'صيانة',
      },
    ];

    const report = await generateMonthlyReport(LEDGER_ID, 3, 2025, {
      ledgers: [{ id: LEDGER_ID, name: 'مكتب' }],
      recurringItems: [],
      transactions,
    });

    expect(report.incomeBreakdown.length).toBe(2);
    const rental = report.incomeBreakdown.find((b) => b.source === 'إيجار');
    expect(rental).toBeDefined();
    expect(rental.amount).toBe(10000);

    expect(report.expenseBreakdown.length).toBe(1);
    expect(report.expenseBreakdown[0].category).toBe('صيانة');
    expect(report.expenseBreakdown[0].amount).toBe(3000);
  });

  it('صافي موجب يظهر كـ highlight إيجابي', async () => {
    const transactions = [
      {
        id: 't1',
        ledgerId: LEDGER_ID,
        type: 'income',
        amount: 10000,
        date: '2025-03-01',
        category: 'إيجار',
      },
    ];

    const report = await generateMonthlyReport(LEDGER_ID, 3, 2025, {
      ledgers: [{ id: LEDGER_ID, name: 'مكتب' }],
      recurringItems: [],
      transactions,
    });

    const positive = report.highlights.find((h) => h.type === 'positive');
    expect(positive).toBeDefined();
    expect(positive.message).toContain('إيجابي');
  });

  it('بدون دفتر صالح يُرجع اسم دفتر افتراضي', async () => {
    const report = await generateMonthlyReport('nonexistent', 1, 2025, {
      ledgers: [],
      recurringItems: [],
      transactions: [],
    });

    expect(report.meta.ledgerName).toBe('—');
  });

  it('توقعات الشهر القادم تحتوي هيكل صحيح', async () => {
    const report = await generateMonthlyReport(LEDGER_ID, 3, 2025, {
      ledgers: [{ id: LEDGER_ID, name: 'مكتب' }],
      recurringItems: [],
      transactions: [],
    });

    expect(report.nextMonthForecast).toBeDefined();
    expect(typeof report.nextMonthForecast.expectedIncome).toBe('number');
    expect(typeof report.nextMonthForecast.expectedExpense).toBe('number');
    expect(typeof report.nextMonthForecast.expectedNet).toBe('number');
    expect(Array.isArray(report.nextMonthForecast.risks)).toBe(true);
  });
});
