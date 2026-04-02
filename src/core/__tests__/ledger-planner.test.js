/**
 * اختبارات تخطيط الدفتر (ledger-planner)
 * تغطي: buildLedgerInbox, addDaysISO, computeCashPlan,
 *        normalizeMonthlyRunRate, forecast6m, cashGapModel, insightsFromForecast
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  buildLedgerInbox,
  addDaysISO,
  computeCashPlan,
  normalizeMonthlyRunRate,
  forecast6m,
  cashGapModel,
  insightsFromForecast,
} from '../ledger-planner.js';

// ثابت تاريخ الاختبار: 2026-04-02
const TEST_NOW = new Date('2026-04-02T00:00:00');

const daysFromNow = (n) => {
  const d = new Date(TEST_NOW);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

const makeItem = (overrides = {}) => ({
  id: 'r1',
  ledgerId: 'L1',
  title: 'بند اختبار',
  amount: 500,
  category: 'operational',
  frequency: 'monthly',
  nextDueDate: daysFromNow(5),
  riskLevel: '',
  required: false,
  ...overrides,
});

describe('ledger-planner', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(TEST_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ==================== buildLedgerInbox ====================
  describe('buildLedgerInbox', () => {
    it('بدون بنود → قائمة فارغة', () => {
      const result = buildLedgerInbox({ ledgerId: 'L1', recurringItems: [], now: TEST_NOW });
      expect(result).toHaveLength(0);
    });

    it('بند متأخر عالي المخاطر → priority 100', () => {
      const items = [makeItem({ riskLevel: 'high', amount: 500, nextDueDate: daysFromNow(-3) })];
      const result = buildLedgerInbox({ ledgerId: 'L1', recurringItems: items, now: TEST_NOW });
      expect(result).toHaveLength(1);
      expect(result[0].reason).toBe('خطر متأخر');
      expect(result[0].priority).toBe(100);
    });

    it('بند متأخر عادي → priority 90', () => {
      const items = [makeItem({ amount: 500, nextDueDate: daysFromNow(-3) })];
      const result = buildLedgerInbox({ ledgerId: 'L1', recurringItems: items, now: TEST_NOW });
      expect(result[0].reason).toBe('متأخر');
      expect(result[0].priority).toBe(90);
    });

    it('بند إلزامي عالي المخاطر غير مسعّر → priority 85', () => {
      const items = [makeItem({ required: true, riskLevel: 'high', amount: 0 })];
      const result = buildLedgerInbox({ ledgerId: 'L1', recurringItems: items, now: TEST_NOW });
      expect(result[0].reason).toBe('خطر غير مسعّر');
      expect(result[0].priority).toBe(85);
    });

    it('بند إلزامي غير مسعّر → priority 75', () => {
      const items = [makeItem({ required: true, amount: 0 })];
      const result = buildLedgerInbox({ ledgerId: 'L1', recurringItems: items, now: TEST_NOW });
      expect(result[0].reason).toBe('إلزامي غير مسعّر');
      expect(result[0].priority).toBe(75);
    });

    it('بند مستحق خلال 7 أيام → priority 70', () => {
      const items = [makeItem({ amount: 500, nextDueDate: daysFromNow(5) })];
      const result = buildLedgerInbox({ ledgerId: 'L1', recurringItems: items, now: TEST_NOW });
      expect(result[0].reason).toBe('مستحق خلال 7 أيام');
      expect(result[0].priority).toBe(70);
    });

    it('بند مستحق خلال 14 يوم → priority 60', () => {
      const items = [makeItem({ amount: 500, nextDueDate: daysFromNow(10) })];
      const result = buildLedgerInbox({ ledgerId: 'L1', recurringItems: items, now: TEST_NOW });
      expect(result[0].reason).toBe('مستحق خلال 14 يوم');
      expect(result[0].priority).toBe(60);
    });

    it('بند مستقبلي بعيد → لا يظهر', () => {
      const items = [makeItem({ amount: 500, nextDueDate: daysFromNow(30) })];
      const result = buildLedgerInbox({ ledgerId: 'L1', recurringItems: items, now: TEST_NOW });
      expect(result).toHaveLength(0);
    });

    it('بند resolved غير متأخر → لا يظهر', () => {
      const items = [makeItem({ status: 'resolved', amount: 500, nextDueDate: daysFromNow(5) })];
      const result = buildLedgerInbox({ ledgerId: 'L1', recurringItems: items, now: TEST_NOW });
      expect(result).toHaveLength(0);
    });

    it('بند resolved لكن متأخر → يظهر', () => {
      const items = [makeItem({ status: 'resolved', amount: 500, nextDueDate: daysFromNow(-3) })];
      const result = buildLedgerInbox({ ledgerId: 'L1', recurringItems: items, now: TEST_NOW });
      expect(result).toHaveLength(1);
    });

    it('بند snoozed نشط غير متأخر → لا يظهر', () => {
      const items = [
        makeItem({
          status: 'snoozed',
          amount: 500,
          nextDueDate: daysFromNow(5),
          snoozeUntil: daysFromNow(10),
        }),
      ];
      const result = buildLedgerInbox({ ledgerId: 'L1', recurringItems: items, now: TEST_NOW });
      expect(result).toHaveLength(0);
    });

    it('يرشّح حسب ledgerId', () => {
      const items = [
        makeItem({ ledgerId: 'L1', amount: 500, nextDueDate: daysFromNow(-3) }),
        makeItem({ id: 'r2', ledgerId: 'L2', amount: 500, nextDueDate: daysFromNow(-3) }),
      ];
      const result = buildLedgerInbox({ ledgerId: 'L1', recurringItems: items, now: TEST_NOW });
      expect(result).toHaveLength(1);
      expect(result[0].ledgerId).toBe('L1');
    });

    it('مرتّب حسب الأولوية تنازلياً', () => {
      const items = [
        makeItem({ id: 'r1', amount: 500, nextDueDate: daysFromNow(5) }), // 7 days → 70
        makeItem({ id: 'r2', riskLevel: 'high', amount: 500, nextDueDate: daysFromNow(-3) }), // 100
        makeItem({ id: 'r3', amount: 500, nextDueDate: daysFromNow(-1) }), // 90
      ];
      const result = buildLedgerInbox({ ledgerId: 'L1', recurringItems: items, now: TEST_NOW });
      expect(result[0].priority).toBe(100);
      expect(result[1].priority).toBe(90);
      expect(result[2].priority).toBe(70);
    });

    it('يحتوي على الحقول المتوقعة', () => {
      const items = [makeItem({ amount: 500, nextDueDate: daysFromNow(-3), note: 'ملاحظة' })];
      const result = buildLedgerInbox({ ledgerId: 'L1', recurringItems: items, now: TEST_NOW });
      const item = result[0];
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('ledgerId');
      expect(item).toHaveProperty('title');
      expect(item).toHaveProperty('amount');
      expect(item).toHaveProperty('category');
      expect(item).toHaveProperty('reason');
      expect(item).toHaveProperty('priority');
      expect(item).toHaveProperty('payState');
      expect(item).toHaveProperty('history');
    });
  });

  // ==================== addDaysISO ====================
  describe('addDaysISO', () => {
    it('إضافة 0 أيام → اليوم', () => {
      expect(addDaysISO(0)).toBe('2026-04-02');
    });

    it('إضافة 5 أيام', () => {
      expect(addDaysISO(5)).toBe('2026-04-07');
    });

    it('إضافة أيام سالبة', () => {
      expect(addDaysISO(-2)).toBe('2026-03-31');
    });

    it('null/undefined → اليوم', () => {
      expect(addDaysISO(null)).toBe('2026-04-02');
      expect(addDaysISO(undefined)).toBe('2026-04-02');
    });
  });

  // ==================== computeCashPlan ====================
  describe('computeCashPlan', () => {
    it('بدون بنود → أصفار', () => {
      const result = computeCashPlan({ ledgerId: 'L1', recurringItems: [], now: TEST_NOW });
      expect(result.totals.today).toBe(0);
      expect(result.totals.d7).toBe(0);
      expect(result.totals.d30).toBe(0);
      expect(result.counts.priced).toBe(0);
      expect(result.counts.unpriced).toBe(0);
    });

    it('بند مستحق اليوم → يظهر في today و d7 و d30', () => {
      const items = [makeItem({ amount: 1000, nextDueDate: daysFromNow(0) })];
      const result = computeCashPlan({ ledgerId: 'L1', recurringItems: items, now: TEST_NOW });
      expect(result.totals.today).toBe(1000);
      expect(result.totals.d7).toBe(1000);
      expect(result.totals.d30).toBe(1000);
    });

    it('بند مستحق بعد 5 أيام → لا يظهر في today', () => {
      const items = [makeItem({ amount: 800, nextDueDate: daysFromNow(5) })];
      const result = computeCashPlan({ ledgerId: 'L1', recurringItems: items, now: TEST_NOW });
      expect(result.totals.today).toBe(0);
      expect(result.totals.d7).toBe(800);
      expect(result.totals.d30).toBe(800);
    });

    it('بند مستحق بعد 20 يوم → فقط d30', () => {
      const items = [makeItem({ amount: 600, nextDueDate: daysFromNow(20) })];
      const result = computeCashPlan({ ledgerId: 'L1', recurringItems: items, now: TEST_NOW });
      expect(result.totals.today).toBe(0);
      expect(result.totals.d7).toBe(0);
      expect(result.totals.d30).toBe(600);
    });

    it('بنود غير مسعّرة → counts.unpriced', () => {
      const items = [
        makeItem({ amount: 0 }),
        makeItem({ id: 'r2', amount: 0, required: true }),
        makeItem({ id: 'r3', amount: 0, required: true, riskLevel: 'high' }),
      ];
      const result = computeCashPlan({ ledgerId: 'L1', recurringItems: items, now: TEST_NOW });
      expect(result.counts.unpriced).toBe(3);
      expect(result.counts.requiredUnpriced).toBe(2);
      expect(result.counts.highRiskUnpriced).toBe(1);
    });

    it('يُقسّم حسب الفئة في breakdown', () => {
      const items = [
        makeItem({ amount: 500, category: 'operational', nextDueDate: daysFromNow(3) }),
        makeItem({ id: 'r2', amount: 300, category: 'maintenance', nextDueDate: daysFromNow(3) }),
      ];
      const result = computeCashPlan({ ledgerId: 'L1', recurringItems: items, now: TEST_NOW });
      expect(result.breakdown.byCategory.d7.operational).toBe(500);
      expect(result.breakdown.byCategory.d7.maintenance).toBe(300);
    });

    it('يُميّز required و highRisk في breakdown', () => {
      const items = [
        makeItem({ amount: 500, required: true, nextDueDate: daysFromNow(3) }),
        makeItem({ id: 'r2', amount: 300, riskLevel: 'high', nextDueDate: daysFromNow(3) }),
      ];
      const result = computeCashPlan({ ledgerId: 'L1', recurringItems: items, now: TEST_NOW });
      expect(result.breakdown.required.d7).toBe(500);
      expect(result.breakdown.highRisk.d7).toBe(300);
    });

    it('يرشّح حسب ledgerId', () => {
      const items = [
        makeItem({ ledgerId: 'L1', amount: 500, nextDueDate: daysFromNow(3) }),
        makeItem({ id: 'r2', ledgerId: 'L2', amount: 300, nextDueDate: daysFromNow(3) }),
      ];
      const result = computeCashPlan({ ledgerId: 'L1', recurringItems: items, now: TEST_NOW });
      expect(result.totals.d7).toBe(500);
    });
  });

  // ==================== normalizeMonthlyRunRate ====================
  describe('normalizeMonthlyRunRate', () => {
    it('بدون بنود → monthlyTotal 0', () => {
      const result = normalizeMonthlyRunRate([]);
      expect(result.monthlyTotal).toBe(0);
    });

    it('بند شهري 600 → monthlyTotal 600', () => {
      const items = [makeItem({ amount: 600, frequency: 'monthly' })];
      const result = normalizeMonthlyRunRate(items);
      expect(result.monthlyTotal).toBe(600);
    });

    it('بند ربع سنوي 1200 → monthlyTotal 400', () => {
      const items = [makeItem({ amount: 1200, frequency: 'quarterly' })];
      const result = normalizeMonthlyRunRate(items);
      // 1200 * 4 / 12 = 400
      expect(result.monthlyTotal).toBe(400);
    });

    it('يُقسّم حسب الفئة', () => {
      const items = [
        makeItem({ amount: 600, frequency: 'monthly', category: 'system' }),
        makeItem({ id: 'r2', amount: 400, frequency: 'monthly', category: 'maintenance' }),
      ];
      const result = normalizeMonthlyRunRate(items);
      expect(result.byCategory.system).toBe(600);
      expect(result.byCategory.maintenance).toBe(400);
      expect(result.monthlyTotal).toBe(1000);
    });

    it('يتجاهل البنود غير المسعّرة', () => {
      const items = [
        makeItem({ amount: 600, frequency: 'monthly' }),
        makeItem({ id: 'r2', amount: 0, frequency: 'monthly' }),
      ];
      const result = normalizeMonthlyRunRate(items);
      expect(result.monthlyTotal).toBe(600);
    });
  });

  // ==================== forecast6m ====================
  describe('forecast6m', () => {
    it('بدون بنود → 6 أشهر بأصفار', () => {
      const result = forecast6m([]);
      expect(result).toHaveLength(6);
      result.forEach((m) => {
        expect(m.expectedOutflow).toBe(0);
      });
    });

    it('بند شهري 1000 → كل شهر 1000', () => {
      const items = [makeItem({ amount: 1000, frequency: 'monthly' })];
      const result = forecast6m(items);
      expect(result).toHaveLength(6);
      result.forEach((m) => {
        expect(m.expectedOutflow).toBe(1000);
      });
    });

    it('scenario multiplier يؤثر على المبلغ', () => {
      const items = [makeItem({ amount: 1000, frequency: 'monthly', saHint: 'إيجار' })];
      const result = forecast6m(items, { rent: 1.5 });
      result.forEach((m) => {
        expect(m.expectedOutflow).toBe(1500); // 1000 * 1.5
      });
    });

    it('scenario clamped بين 0.5 و 2.0', () => {
      const items = [makeItem({ amount: 1000, frequency: 'monthly', saHint: 'إيجار' })];
      // factor 5.0 → clamped to 2.0
      const result = forecast6m(items, { rent: 5.0 });
      result.forEach((m) => {
        expect(m.expectedOutflow).toBe(2000);
      });
    });

    it('byCategory tracking', () => {
      const items = [
        makeItem({ amount: 600, frequency: 'monthly', category: 'system' }),
        makeItem({ id: 'r2', amount: 400, frequency: 'monthly', category: 'maintenance' }),
      ];
      const result = forecast6m(items);
      result.forEach((m) => {
        expect(m.byCategory.system).toBe(600);
        expect(m.byCategory.maintenance).toBe(400);
        expect(m.expectedOutflow).toBe(1000);
      });
    });

    it('كل شهر يحتوي monthKey بصيغة YYYY-MM', () => {
      const result = forecast6m([]);
      result.forEach((m) => {
        expect(m.monthKey).toMatch(/^\d{4}-\d{2}$/);
      });
    });
  });

  // ==================== cashGapModel ====================
  describe('cashGapModel', () => {
    it('بدون forecast → سلسلة فارغة', () => {
      const result = cashGapModel([], 5000);
      expect(result.series).toHaveLength(0);
      expect(result.firstGapMonth).toBeNull();
      expect(result.worstGap).toBe(0);
    });

    it('دخل يغطي المصاريف → لا عجز', () => {
      const forecast = [
        { monthKey: '2026-04', expectedOutflow: 5000 },
        { monthKey: '2026-05', expectedOutflow: 5000 },
      ];
      const result = cashGapModel(forecast, 6000);
      expect(result.firstGapMonth).toBeNull();
      expect(result.worstGap).toBe(0);
      expect(result.series).toHaveLength(2);
      expect(result.series[0].net).toBe(1000);
      expect(result.series[1].cumulative).toBe(2000);
    });

    it('دخل لا يغطي → عجز تراكمي', () => {
      const forecast = [
        { monthKey: '2026-04', expectedOutflow: 8000 },
        { monthKey: '2026-05', expectedOutflow: 8000 },
      ];
      const result = cashGapModel(forecast, 5000);
      expect(result.firstGapMonth).toBe('2026-04');
      expect(result.worstGap).toBe(-6000); // -3000 + -3000
      expect(result.series[0].net).toBe(-3000);
    });

    it('عجز يبدأ من الشهر الثاني', () => {
      const forecast = [
        { monthKey: '2026-04', expectedOutflow: 3000 },
        { monthKey: '2026-05', expectedOutflow: 10000 },
      ];
      const result = cashGapModel(forecast, 5000);
      // شهر 1: +2000, شهر 2: -5000 → cumulative -3000
      expect(result.firstGapMonth).toBe('2026-05');
      expect(result.worstGap).toBe(-3000);
    });

    it('دخل 0 → عجز من أول شهر', () => {
      const forecast = [{ monthKey: '2026-04', expectedOutflow: 1000 }];
      const result = cashGapModel(forecast, 0);
      expect(result.firstGapMonth).toBe('2026-04');
      expect(result.worstGap).toBe(-1000);
    });
  });

  // ==================== insightsFromForecast ====================
  describe('insightsFromForecast', () => {
    it('بدون forecast → قائمة فارغة', () => {
      const result = insightsFromForecast([]);
      expect(result).toHaveLength(0);
    });

    it('يُحدد أكبر بند ضغط', () => {
      const forecast = [
        {
          monthKey: '2026-04',
          expectedOutflow: 5000,
          byCategory: {
            system: 3000,
            operational: 1000,
            maintenance: 500,
            marketing: 500,
            other: 0,
          },
        },
      ];
      const result = insightsFromForecast(forecast);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toContain('system');
    });

    it('صيانة مرتفعة → نصيحة إضافية', () => {
      const forecast = [
        {
          monthKey: '2026-04',
          expectedOutflow: 5000,
          byCategory: {
            system: 100,
            operational: 100,
            maintenance: 5000,
            marketing: 100,
            other: 100,
          },
        },
      ];
      const result = insightsFromForecast(forecast);
      const maintTip = result.find((t) => t.includes('الصيانة'));
      expect(maintTip).toBeDefined();
    });

    it('مع cashGap عجز → نصيحة عن العجز', () => {
      const forecast = [
        {
          monthKey: '2026-04',
          expectedOutflow: 5000,
          byCategory: {
            system: 1000,
            operational: 1000,
            maintenance: 1000,
            marketing: 1000,
            other: 1000,
          },
        },
      ];
      const gap = { firstGapMonth: '2026-05', worstGap: -3000 };
      const result = insightsFromForecast(forecast, gap);
      const gapTip = result.find((t) => t.includes('عجز'));
      expect(gapTip).toBeDefined();
    });

    it('بدون cashGap عجز → نصيحة إيجابية', () => {
      const forecast = [
        {
          monthKey: '2026-04',
          expectedOutflow: 5000,
          byCategory: {
            system: 1000,
            operational: 1000,
            maintenance: 1000,
            marketing: 1000,
            other: 1000,
          },
        },
      ];
      const gap = { firstGapMonth: null, worstGap: 0 };
      const result = insightsFromForecast(forecast, gap);
      const noGapTip = result.find((t) => t.includes('لا يوجد عجز'));
      expect(noGapTip).toBeDefined();
    });

    it('الحد الأقصى 3 نصائح', () => {
      const forecast = [
        {
          monthKey: '2026-04',
          expectedOutflow: 10000,
          byCategory: {
            system: 100,
            operational: 100,
            maintenance: 8000,
            marketing: 100,
            other: 100,
          },
        },
      ];
      const gap = { firstGapMonth: '2026-05', worstGap: -5000 };
      const result = insightsFromForecast(forecast, gap);
      expect(result.length).toBeLessThanOrEqual(3);
    });
  });
});
