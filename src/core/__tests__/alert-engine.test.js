/**
 * اختبارات محرك التنبيهات الذكية (alert-engine)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, val) => { store[key] = String(val); }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });

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
    const income = txs.filter((t) => t.type === 'income').reduce((a, t) => a + (Number(t.amount) || 0), 0);
    const expense = txs.filter((t) => t.type === 'expense').reduce((a, t) => a + (Number(t.amount) || 0), 0);
    return { income, expense, net: income - expense };
  }),
}));

vi.mock('../pulse-engine.js', () => ({
  calculateHealthScore: vi.fn(() => 50),
}));

const { generateSmartAlerts } = await import('../alert-engine.js');

const LEDGER_ID = 'ledger-001';

describe('alert-engine — generateSmartAlerts', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('بدون بيانات يُرجع مصفوفة فارغة', () => {
    const alerts = generateSmartAlerts('', {
      ledgers: [],
      recurringItems: [],
      transactions: [],
    });

    expect(Array.isArray(alerts)).toBe(true);
    expect(alerts).toHaveLength(0);
  });

  it('بدون معرّف دفتر يُرجع مصفوفة فارغة', () => {
    const alerts = generateSmartAlerts(null, {
      ledgers: [],
      recurringItems: [],
      transactions: [],
    });

    expect(alerts).toHaveLength(0);
  });

  it('مصروف اليوم الضخم يولّد تنبيه anomaly (نمط إنفاق غير طبيعي)', () => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // نحتاج حركات في آخر 30 يوم لتحديد المتوسط ثم حركة ضخمة اليوم
    const transactions = [];
    // 29 يوم عادي بمصروف 100 ريال
    for (let i = 1; i <= 29; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      transactions.push({
        id: `tx-${i}`,
        ledgerId: LEDGER_ID,
        type: 'expense',
        amount: 100,
        date: ds,
        description: 'مصروف عادي',
      });
    }
    // حركة ضخمة اليوم: 50,000 ريال (أكثر من 3× المتوسط اليومي)
    transactions.push({
      id: 'tx-big',
      ledgerId: LEDGER_ID,
      type: 'expense',
      amount: 50000,
      date: todayStr,
      description: 'مصروف ضخم',
    });

    const alerts = generateSmartAlerts(LEDGER_ID, {
      ledgers: [{ id: LEDGER_ID, name: 'مكتب' }],
      recurringItems: [],
      transactions,
    });

    const anomaly = alerts.find((a) => a.type === 'spending_anomaly');
    expect(anomaly).toBeDefined();
    expect(anomaly.severity).toBe('warning');
  });

  it('التزام دخل متأخر يولّد تنبيه missed_income', () => {
    const pastDate = '2024-06-15';
    const recurringItems = [
      {
        id: 'rec-income',
        ledgerId: LEDGER_ID,
        title: 'إيجار مستأجر',
        amount: 3000,
        frequency: 'monthly',
        category: 'income',
        nextDueDate: pastDate,
      },
    ];

    const alerts = generateSmartAlerts(LEDGER_ID, {
      ledgers: [{ id: LEDGER_ID, name: 'مكتب' }],
      recurringItems,
      transactions: [],
    });

    const missed = alerts.find((a) => a.type === 'missed_income');
    expect(missed).toBeDefined();
    expect(missed.severity).toBe('warning');
    expect(missed.amount).toBe(3000);
  });

  it('التزام خامل بدورتين يولّد تنبيه dormant_commitment', () => {
    // التزام شهري بدون أي حركات مطابقة → خامل
    const recurringItems = [
      {
        id: 'rec-dormant',
        ledgerId: LEDGER_ID,
        title: 'صيانة شهرية',
        amount: 500,
        frequency: 'monthly',
        category: 'expense',
        nextDueDate: '2025-01-15',
      },
    ];

    const alerts = generateSmartAlerts(LEDGER_ID, {
      ledgers: [{ id: LEDGER_ID, name: 'مكتب' }],
      recurringItems,
      transactions: [],
    });

    const dormant = alerts.find((a) => a.type === 'dormant_commitment');
    expect(dormant).toBeDefined();
    expect(dormant.title).toContain('صيانة شهرية');
  });

  it('التنبيهات مرتبة حسب الخطورة: critical أولاً', () => {
    // نختبر الترتيب بأنواع مختلفة
    const pastDate = '2024-01-01';
    const recurringItems = [
      {
        id: 'rec-1',
        ledgerId: LEDGER_ID,
        title: 'التزام خامل',
        amount: 1000,
        frequency: 'monthly',
        category: 'expense',
        nextDueDate: pastDate,
      },
      {
        id: 'rec-2',
        ledgerId: LEDGER_ID,
        title: 'دخل متأخر',
        amount: 5000,
        frequency: 'monthly',
        category: 'income',
        nextDueDate: pastDate,
      },
    ];

    const alerts = generateSmartAlerts(LEDGER_ID, {
      ledgers: [{ id: LEDGER_ID, name: 'مكتب' }],
      recurringItems,
      transactions: [],
    });

    if (alerts.length >= 2) {
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      for (let i = 1; i < alerts.length; i++) {
        const prev = severityOrder[alerts[i - 1].severity] ?? 3;
        const curr = severityOrder[alerts[i].severity] ?? 3;
        expect(prev).toBeLessThanOrEqual(curr);
      }
    }
  });

  it('أقصى عدد تنبيهات لا يتجاوز 10', () => {
    // نولّد كثير من الالتزامات الخاملة
    const recurringItems = Array.from({ length: 20 }, (_, i) => ({
      id: `rec-${i}`,
      ledgerId: LEDGER_ID,
      title: `التزام ${i}`,
      amount: 100,
      frequency: 'monthly',
      category: 'expense',
      nextDueDate: '2024-01-01',
    }));

    const alerts = generateSmartAlerts(LEDGER_ID, {
      ledgers: [{ id: LEDGER_ID, name: 'مكتب' }],
      recurringItems,
      transactions: [],
    });

    expect(alerts.length).toBeLessThanOrEqual(10);
  });
});
