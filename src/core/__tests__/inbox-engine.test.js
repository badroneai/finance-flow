/**
 * اختبارات محرك صندوق الوارد (inbox-engine)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('../ledger-store.js', () => ({
  getRecurringItems: vi.fn(() => []),
  getLedgers: vi.fn(() => []),
  getActiveLedgerId: vi.fn(() => ''),
}));

vi.mock('../dataStore.js', () => ({
  dataStore: { transactions: { list: vi.fn(() => []) } },
  getTransactionsForLedger: vi.fn(() => []),
}));

const { calculateInbox, expandRecurringToDues } = await import('../inbox-engine.js');

// بيانات تجريبية
const LEDGER_ID = 'ledger-001';

function makeRecurring(overrides = {}) {
  return {
    id: 'rec-001',
    ledgerId: LEDGER_ID,
    title: 'إيجار شهري',
    amount: 5000,
    frequency: 'monthly',
    category: 'expense',
    nextDueDate: '2025-03-15',
    riskLevel: 'medium',
    ...overrides,
  };
}

describe('inbox-engine — calculateInbox', () => {
  it('بدون بيانات يُرجع كائن فارغ بأقسام خالية', () => {
    const result = calculateInbox('', { recurringItems: [], transactions: [] });

    expect(result).toBeDefined();
    expect(result.overdue).toEqual([]);
    expect(result.thisWeek).toEqual([]);
    expect(result.thisMonth).toEqual([]);
    expect(result.summary.totalOverdue).toBe(0);
    expect(result.summary.totalThisWeek).toBe(0);
    expect(result.summary.totalThisMonth).toBe(0);
  });

  it('التزام متأخر يظهر في overdue', () => {
    const pastDate = '2024-01-10';
    const recurring = [makeRecurring({ nextDueDate: pastDate })];

    const result = calculateInbox(LEDGER_ID, {
      recurringItems: recurring,
      transactions: [],
    });

    expect(result.overdue.length).toBeGreaterThan(0);
    expect(result.summary.totalOverdue).toBeGreaterThan(0);
    expect(result.summary.totalOverdueAmount).toBeGreaterThan(0);
  });

  it('التزام هذا الأسبوع يظهر في thisWeek (إن كان تاريخه ضمن الأسبوع)', () => {
    // نجهّز التزام يستحق اليوم
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const recurring = [makeRecurring({ nextDueDate: todayStr })];

    const result = calculateInbox(LEDGER_ID, {
      recurringItems: recurring,
      transactions: [],
    });

    // يجب أن يكون إما في thisWeek أو overdue (حسب الساعة)
    const found = result.thisWeek.length > 0 || result.overdue.length > 0;
    expect(found).toBe(true);
  });

  it('التزام مدفوع لا يظهر في المستحقات', () => {
    const dueDate = '2024-06-15';
    const recurring = [makeRecurring({ id: 'rec-paid', nextDueDate: dueDate })];
    const transactions = [
      {
        id: 'tx-001',
        ledgerId: LEDGER_ID,
        type: 'expense',
        amount: 5000,
        date: '2024-06-15',
        meta: { recurringId: 'rec-paid' },
      },
    ];

    const result = calculateInbox(LEDGER_ID, {
      recurringItems: recurring,
      transactions,
    });

    // المستحق المدفوع لا يظهر في overdue لنفس الفترة
    const overdueForPaid = result.overdue.filter(
      (d) => d.recurringItemId === 'rec-paid' && d.dueDate === dueDate
    );
    expect(overdueForPaid).toHaveLength(0);
  });

  it('تكرار ربع سنوي يولّد مستحقات بفاصل 3 أشهر', () => {
    const recurring = [
      makeRecurring({
        id: 'rec-q',
        frequency: 'quarterly',
        nextDueDate: '2025-01-01',
        amount: 10000,
      }),
    ];

    const dues = expandRecurringToDues(recurring, '2025-01-01', '2025-12-31', [], LEDGER_ID);

    // ربع سنوي: يناير، أبريل، يوليو، أكتوبر = 4 مستحقات
    expect(dues.length).toBe(4);
    expect(dues[0].dueDate).toBe('2025-01-01');
    expect(dues[1].dueDate).toBe('2025-04-01');
  });

  it('تكرار سنوي يولّد مستحق واحد في السنة', () => {
    const recurring = [
      makeRecurring({
        id: 'rec-y',
        frequency: 'yearly',
        nextDueDate: '2025-06-01',
        amount: 20000,
      }),
    ];

    const dues = expandRecurringToDues(recurring, '2025-01-01', '2025-12-31', [], LEDGER_ID);

    expect(dues.length).toBe(1);
    expect(dues[0].dueDate).toBe('2025-06-01');
    expect(dues[0].amount).toBe(20000);
  });

  it('التزام بمبلغ صفر لا يولّد مستحقات', () => {
    const recurring = [makeRecurring({ amount: 0, nextDueDate: '2025-03-15' })];

    const dues = expandRecurringToDues(recurring, '2025-01-01', '2025-12-31', [], LEDGER_ID);

    expect(dues).toHaveLength(0);
  });

  it('التزام من دفتر آخر لا يظهر', () => {
    const recurring = [makeRecurring({ ledgerId: 'other-ledger', nextDueDate: '2025-03-15' })];

    const dues = expandRecurringToDues(recurring, '2025-01-01', '2025-12-31', [], LEDGER_ID);

    expect(dues).toHaveLength(0);
  });
});
