// صفحة الدفاتر — اختبار تدخين لفحص عدم وجود خطأ عند استيراد الصفحة
import { describe, it, expect, vi } from 'vitest';

vi.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: '/ledgers', search: '' }),
  useNavigate: () => vi.fn(),
}));
vi.mock('../../contexts/ToastContext.jsx', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }),
}));
vi.mock('../../contexts/DataContext.jsx', () => ({
  useData: () => ({
    ledgers: [],
    activeLedgerId: '',
    setActiveLedgerId: vi.fn(),
    transactions: [],
    recurringItems: [],
    createLedger: vi.fn(),
    updateLedger: vi.fn(),
    createRecurringItem: vi.fn(),
    updateRecurringItem: vi.fn(),
    deleteRecurringItem: vi.fn(),
    fetchLedgers: vi.fn().mockResolvedValue([]),
    fetchRecurringItems: vi.fn().mockResolvedValue([]),
    fetchTransactions: vi.fn().mockResolvedValue([]),
    createTransaction: vi.fn(),
  }),
}));

describe('LedgersPage smoke', () => {
  it('should import without error', async () => {
    const mod = await import('../LedgersPage.jsx');
    expect(mod.default).toBeDefined();
  });
});
