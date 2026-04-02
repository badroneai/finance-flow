/**
 * اختبارات صحة الدفتر (ledger-health)
 * تغطي: computeComplianceShield, isSeededOnly, freqMultiplier,
 *        computeLedgerHealth, computeLedgerProjection, computeScenario,
 *        calculateBurnRate, calculateMonthlyFixed, calculateNext90DayRisk,
 *        calculateDisciplineTrend, detectHighRiskCluster,
 *        calculateCashPressureScore, calculateBurnRateBundle,
 *        getBurnBreakdown, getPressureBreakdown, getRiskBreakdown90d,
 *        getDailyPlaybook, getBenchmarkComparison, SAUDI_BENCHMARKS
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  computeComplianceShield,
  isSeededOnly,
  freqMultiplier,
  computeLedgerHealth,
  computeLedgerProjection,
  computeScenario,
  calculateBurnRate,
  calculateMonthlyFixed,
  calculateNext90DayRisk,
  calculateDisciplineTrend,
  detectHighRiskCluster,
  calculateCashPressureScore,
  calculateBurnRateBundle,
  getBurnBreakdown,
  getPressureBreakdown,
  getRiskBreakdown90d,
  getDailyPlaybook,
  getBenchmarkComparison,
  SAUDI_BENCHMARKS,
} from '../ledger-health.js';

// ثابت تاريخ الاختبار: 2026-04-02
const TEST_NOW = new Date('2026-04-02T00:00:00');

// دالة مساعدة لتنسيق التاريخ
const daysFromNow = (n) => {
  const d = new Date(TEST_NOW);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

// بند متكرر أساسي
const makeItem = (overrides = {}) => ({
  id: 'r1',
  ledgerId: 'L1',
  title: 'بند اختبار',
  amount: 500,
  category: 'operational',
  frequency: 'monthly',
  nextDueDate: daysFromNow(5),
  riskLevel: '',
  seeded: true,
  ...overrides,
});

describe('ledger-health', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(TEST_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ==================== isSeededOnly ====================
  describe('isSeededOnly', () => {
    it('يُرجع false لقيمة فارغة', () => {
      expect(isSeededOnly(null)).toBe(false);
      expect(isSeededOnly(undefined)).toBe(false);
    });

    it('يُرجع true إذا seeded === true', () => {
      expect(isSeededOnly({ seeded: true })).toBe(true);
    });

    it('يُرجع true إذا يملك saHint', () => {
      expect(isSeededOnly({ saHint: 'إيجار شهري' })).toBe(true);
    });

    it('يُرجع true إذا يملك priceBand', () => {
      expect(isSeededOnly({ priceBand: { min: 100, max: 500 } })).toBe(true);
    });

    it('يُرجع true إذا cityFactorEligible != null', () => {
      expect(isSeededOnly({ cityFactorEligible: false })).toBe(true);
    });

    it('يُرجع true إذا يملك defaultFreq', () => {
      expect(isSeededOnly({ defaultFreq: 'monthly' })).toBe(true);
    });

    it('يُرجع false لكائن فارغ بدون علامات', () => {
      expect(isSeededOnly({})).toBe(false);
      expect(isSeededOnly({ amount: 100, title: 'عادي' })).toBe(false);
    });
  });

  // ==================== freqMultiplier ====================
  describe('freqMultiplier', () => {
    it('monthly = 12', () => expect(freqMultiplier('monthly')).toBe(12));
    it('quarterly = 4', () => expect(freqMultiplier('quarterly')).toBe(4));
    it('semiannual = 2', () => expect(freqMultiplier('semiannual')).toBe(2));
    it('semi-annually = 2', () => expect(freqMultiplier('semi-annually')).toBe(2));
    it('yearly = 1', () => expect(freqMultiplier('yearly')).toBe(1));
    it('annual = 1', () => expect(freqMultiplier('annual')).toBe(1));
    it('adhoc = 0', () => expect(freqMultiplier('adhoc')).toBe(0));
    it('قيمة غير معروفة = 0', () => expect(freqMultiplier('unknown')).toBe(0));
    it('null = 0', () => expect(freqMultiplier(null)).toBe(0));
  });

  // ==================== computeComplianceShield ====================
  describe('computeComplianceShield', () => {
    it('بدون بنود → درجة 100 + مكافأة (capped 100)', () => {
      const result = computeComplianceShield({
        ledgerId: 'L1',
        recurringItems: [],
        now: TEST_NOW,
      });
      // score = 100 + 10 (no system overdue bonus) = 110 → capped to 100
      expect(result.score).toBe(100);
      expect(result.status).toBe('متوافق');
      expect(result.drivers).toHaveLength(0);
    });

    it('بند نظامي غير مسعّر → خصم 20', () => {
      const items = [makeItem({ category: 'system', amount: 0 })];
      const result = computeComplianceShield({
        ledgerId: 'L1',
        recurringItems: items,
        now: TEST_NOW,
      });
      // 100 - 20 + 10 (no overdue) = 90
      expect(result.score).toBe(90);
      expect(result.status).toBe('متوافق');
      expect(result.drivers.length).toBeGreaterThan(0);
      expect(result.drivers[0].reason).toContain('غير مسعّر');
    });

    it('بند نظامي متأخر → خصم 25', () => {
      const items = [makeItem({ category: 'system', amount: 500, nextDueDate: daysFromNow(-5) })];
      const result = computeComplianceShield({
        ledgerId: 'L1',
        recurringItems: items,
        now: TEST_NOW,
      });
      // 100 - 25 (overdue) = 75 (no bonus since hasSystemOverdue)
      expect(result.score).toBe(75);
      expect(result.status).toBe('يحتاج انتباه');
    });

    it('بند عالي المخاطر غير مسعّر → خصم 15', () => {
      const items = [makeItem({ riskLevel: 'high', amount: 0 })];
      const result = computeComplianceShield({
        ledgerId: 'L1',
        recurringItems: items,
        now: TEST_NOW,
      });
      // 100 - 15 + 10 = 95
      expect(result.score).toBe(95);
    });

    it('تراكم خصومات متعددة → حالة خطر', () => {
      const items = [
        makeItem({ id: 'r1', category: 'system', amount: 0 }),
        makeItem({ id: 'r2', category: 'system', amount: 300, nextDueDate: daysFromNow(-3) }),
        makeItem({ id: 'r3', riskLevel: 'high', amount: 0 }),
      ];
      const result = computeComplianceShield({
        ledgerId: 'L1',
        recurringItems: items,
        now: TEST_NOW,
      });
      // 100 - 20 (unpriced system) - 25 (overdue system) - 15 (high risk unpriced) = 40
      expect(result.score).toBe(40);
      expect(result.status).toBe('خطر نظامي');
    });

    it('يرشّح البنود حسب ledgerId', () => {
      const items = [
        makeItem({ ledgerId: 'L1', category: 'system', amount: 0 }),
        makeItem({ id: 'r2', ledgerId: 'L2', category: 'system', amount: 0 }),
      ];
      const result = computeComplianceShield({
        ledgerId: 'L1',
        recurringItems: items,
        now: TEST_NOW,
      });
      // فقط بند L1 يُحسب
      expect(result.drivers).toHaveLength(1);
    });
  });

  // ==================== computeLedgerHealth ====================
  describe('computeLedgerHealth', () => {
    it('بدون بنود → score 50 (overdueRatio=0 → 30pts, highRiskRatio=0 → 20pts)', () => {
      const result = computeLedgerHealth({ recurringItems: [], transactions: [] });
      // pricedRatio=0 → 0, (1-0)*30=30, (1-0)*20=20 → 50
      expect(result.score).toBe(50);
      expect(result.totalSeeded).toBe(0);
    });

    it('كل البنود مسعّرة ولا متأخرات → score عالي', () => {
      const items = [
        makeItem({ amount: 500, nextDueDate: daysFromNow(10) }),
        makeItem({ id: 'r2', amount: 300, nextDueDate: daysFromNow(20) }),
      ];
      const result = computeLedgerHealth({ recurringItems: items, transactions: [] });
      expect(result.pricedCount).toBe(2);
      expect(result.overdueCount).toBe(0);
      // pricedRatio = 1.0 → 50pts, overdueRatio = 0 → 30pts, highRiskRatio = 0 → 20pts = 100
      expect(result.score).toBe(100);
    });

    it('نصف البنود غير مسعّرة → score أقل', () => {
      const items = [
        makeItem({ amount: 500, nextDueDate: daysFromNow(10) }),
        makeItem({ id: 'r2', amount: 0, nextDueDate: daysFromNow(20) }),
      ];
      const result = computeLedgerHealth({ recurringItems: items });
      expect(result.pricedRatio).toBe(0.5);
      // 0.5 * 50 + 1 * 30 + 1 * 20 = 75
      expect(result.score).toBe(75);
    });

    it('بنود متأخرة → overdueCount > 0', () => {
      const items = [makeItem({ amount: 500, nextDueDate: daysFromNow(-5) })];
      const result = computeLedgerHealth({ recurringItems: items });
      expect(result.overdueCount).toBe(1);
    });

    it('dueSoon14Count يحسب البنود خلال 14 يوم', () => {
      const items = [
        makeItem({ amount: 500, nextDueDate: daysFromNow(3) }),
        makeItem({ id: 'r2', amount: 300, nextDueDate: daysFromNow(10) }),
        makeItem({ id: 'r3', amount: 200, nextDueDate: daysFromNow(20) }),
      ];
      const result = computeLedgerHealth({ recurringItems: items });
      expect(result.dueSoon14Count).toBe(2);
    });

    it('highRisk tracking', () => {
      const items = [
        makeItem({ riskLevel: 'high', amount: 0 }),
        makeItem({ id: 'r2', riskLevel: 'high', amount: 500, nextDueDate: daysFromNow(5) }),
        makeItem({ id: 'r3', riskLevel: 'low', amount: 300, nextDueDate: daysFromNow(5) }),
      ];
      const result = computeLedgerHealth({ recurringItems: items });
      expect(result.highRiskCount).toBe(2);
      expect(result.highRiskUnpricedCount).toBe(1);
    });
  });

  // ==================== computeLedgerProjection ====================
  describe('computeLedgerProjection', () => {
    it('بدون بنود → أصفار', () => {
      const result = computeLedgerProjection({ recurringItems: [] });
      expect(result.annualRunRate).toBe(0);
      expect(result.pricedCount).toBe(0);
      expect(result.totalCount).toBe(0);
    });

    it('بند شهري 500 → run rate سنوي 6000', () => {
      const items = [makeItem({ amount: 500, frequency: 'monthly' })];
      const result = computeLedgerProjection({ recurringItems: items });
      expect(result.annualRunRate).toBe(6000);
      expect(result.pricedCount).toBe(1);
    });

    it('بند ربع سنوي 1000 → run rate سنوي 4000', () => {
      const items = [makeItem({ amount: 1000, frequency: 'quarterly' })];
      const result = computeLedgerProjection({ recurringItems: items });
      expect(result.annualRunRate).toBe(4000);
    });

    it('priceBand يُحسب min/max', () => {
      const items = [
        makeItem({
          amount: 500,
          frequency: 'monthly',
          priceBand: { min: 400, max: 600 },
        }),
      ];
      const result = computeLedgerProjection({ recurringItems: items });
      expect(result.annualMin).toBe(4800); // 400 * 12
      expect(result.annualMax).toBe(7200); // 600 * 12
      expect(result.bandCount).toBe(1);
    });

    it('بنود غير مسعّرة تُستثنى من run rate', () => {
      const items = [
        makeItem({ amount: 500, frequency: 'monthly' }),
        makeItem({ id: 'r2', amount: 0, frequency: 'monthly' }),
      ];
      const result = computeLedgerProjection({ recurringItems: items });
      expect(result.annualRunRate).toBe(6000);
      expect(result.pricedCount).toBe(1);
      expect(result.totalCount).toBe(2);
    });
  });

  // ==================== computeScenario ====================
  describe('computeScenario', () => {
    it('بدون تغييرات → delta = 0', () => {
      const items = [
        makeItem({ amount: 500, frequency: 'monthly', saHint: 'إيجار', category: 'operational' }),
      ];
      const result = computeScenario({
        recurringItems: items,
        rentPct: 0,
        billsPct: 0,
        maintPct: 0,
      });
      expect(result.delta).toBe(0);
      expect(result.baseAnnual).toBe(result.newAnnual);
    });

    it('زيادة إيجار 10% → delta موجب', () => {
      const items = [makeItem({ amount: 1000, frequency: 'monthly', saHint: 'إيجار شهري' })];
      const result = computeScenario({ recurringItems: items, rentPct: 10 });
      expect(result.baseAnnual).toBe(12000);
      expect(result.newAnnual).toBe(13200); // 1000 * 1.1 * 12
      expect(result.delta).toBe(1200);
    });

    it('بنود صيانة تتأثر بـ maintPct', () => {
      const items = [makeItem({ amount: 200, frequency: 'monthly', category: 'maintenance' })];
      const result = computeScenario({ recurringItems: items, maintPct: 50 });
      expect(result.newAnnual).toBe(3600); // 200 * 1.5 * 12
    });
  });

  // ==================== calculateBurnRate / calculateMonthlyFixed ====================
  describe('calculateBurnRate', () => {
    it('بدون بنود → 0', () => {
      const result = calculateBurnRate('L1', { recurringItems: [] });
      expect(result.monthlyTotal).toBe(0);
      expect(result.count).toBe(0);
    });

    it('يحسب فقط البنود الشهرية المسعّرة', () => {
      const items = [
        makeItem({ amount: 500, frequency: 'monthly' }),
        makeItem({ id: 'r2', amount: 300, frequency: 'monthly' }),
        makeItem({ id: 'r3', amount: 1000, frequency: 'quarterly' }), // يُستثنى
        makeItem({ id: 'r4', amount: 0, frequency: 'monthly' }), // يُستثنى
      ];
      const result = calculateBurnRate('L1', { recurringItems: items });
      expect(result.monthlyTotal).toBe(800);
      expect(result.count).toBe(2);
    });
  });

  describe('calculateMonthlyFixed', () => {
    it('wrapper يُرجع نفس القيمة', () => {
      const items = [makeItem({ amount: 700, frequency: 'monthly' })];
      const result = calculateMonthlyFixed('L1', { recurringItems: items });
      expect(result.monthlyFixed).toBe(700);
      expect(result.count).toBe(1);
    });
  });

  // ==================== calculateBurnRateBundle ====================
  describe('calculateBurnRateBundle', () => {
    it('يحسب monthly/d90/yearly', () => {
      const items = [makeItem({ amount: 1000, frequency: 'monthly' })];
      const result = calculateBurnRateBundle('L1', { recurringItems: items });
      expect(result.monthly).toBe(1000);
      expect(result.d90).toBe(3000);
      expect(result.yearly).toBe(12000);
    });
  });

  // ==================== calculateNext90DayRisk ====================
  describe('calculateNext90DayRisk', () => {
    it('بدون بنود → low', () => {
      const result = calculateNext90DayRisk('L1', { recurringItems: [] });
      expect(result.level).toBe('low');
      expect(result.due90Total).toBe(0);
    });

    it('بنود مستحقة خلال 90 يوم', () => {
      const items = [
        makeItem({ amount: 500, frequency: 'monthly', nextDueDate: daysFromNow(30) }),
        makeItem({ id: 'r2', amount: 300, frequency: 'monthly', nextDueDate: daysFromNow(60) }),
      ];
      const result = calculateNext90DayRisk('L1', { recurringItems: items });
      expect(result.due90Count).toBe(2);
      expect(result.due90Total).toBe(800);
    });
  });

  // ==================== calculateDisciplineTrend ====================
  describe('calculateDisciplineTrend', () => {
    it('بدون بنود → ratio 0, يتراجع', () => {
      const result = calculateDisciplineTrend('L1', { recurringItems: [], transactions: [] });
      expect(result.ratio).toBe(0);
      expect(result.trend).toBe('يتراجع');
    });

    it('بنود مستحقة مع معاملات دفع → يحسب ratio', () => {
      const items = [
        makeItem({ amount: 500, nextDueDate: daysFromNow(-10) }),
        makeItem({ id: 'r2', amount: 300, nextDueDate: daysFromNow(-20) }),
      ];
      const transactions = [
        { date: daysFromNow(-10), amount: 500, meta: { ledgerId: 'L1' } },
        { date: daysFromNow(-20), amount: 300, meta: { ledgerId: 'L1' } },
      ];
      const result = calculateDisciplineTrend('L1', { recurringItems: items, transactions });
      expect(result.due60).toBe(2);
      expect(result.paid60).toBe(2);
      expect(result.ratio).toBe(1);
      expect(result.trend).toBe('يتحسن');
    });
  });

  // ==================== detectHighRiskCluster ====================
  describe('detectHighRiskCluster', () => {
    it('بدون بنود عالية المخاطر → false', () => {
      const items = [makeItem({ riskLevel: 'low' })];
      expect(detectHighRiskCluster('L1', { recurringItems: items })).toBe(false);
    });

    it('3+ بنود عالية المخاطر غير مسعّرة → true', () => {
      const items = [
        makeItem({ id: 'r1', riskLevel: 'high', amount: 0 }),
        makeItem({ id: 'r2', riskLevel: 'high', amount: 0 }),
        makeItem({ id: 'r3', riskLevel: 'high', amount: 0 }),
      ];
      expect(detectHighRiskCluster('L1', { recurringItems: items })).toBe(true);
    });

    it('بند عالي المخاطر متأخر → true', () => {
      const items = [makeItem({ riskLevel: 'high', amount: 500, nextDueDate: daysFromNow(-5) })];
      expect(detectHighRiskCluster('L1', { recurringItems: items })).toBe(true);
    });
  });

  // ==================== calculateCashPressureScore ====================
  describe('calculateCashPressureScore', () => {
    it('بدون بنود → score 10 (disciplinePenalty=1 → 10pts), مستقر', () => {
      const result = calculateCashPressureScore('L1', { recurringItems: [], transactions: [] });
      // disciplineRatio=0 → penalty=1 → 10pts
      expect(result.score).toBe(10);
      expect(result.band).toBe('مستقر');
    });

    it('كل البنود غير مسعّرة → ضغط عالي', () => {
      const items = [makeItem({ amount: 0 }), makeItem({ id: 'r2', amount: 0 })];
      const result = calculateCashPressureScore('L1', { recurringItems: items, transactions: [] });
      // unpricedRatio = 1.0 → 40pts
      expect(result.unpricedRatio).toBe(1);
      expect(result.score).toBeGreaterThanOrEqual(40);
    });

    it('بنود مسعّرة ومتأخرة → overdueCount > 0', () => {
      const items = [makeItem({ amount: 500, nextDueDate: daysFromNow(-10) })];
      const result = calculateCashPressureScore('L1', { recurringItems: items, transactions: [] });
      expect(result.overdueCount).toBe(1);
    });
  });

  // ==================== getBurnBreakdown ====================
  describe('getBurnBreakdown', () => {
    it('بدون بنود → totalMonthly 0', () => {
      const result = getBurnBreakdown('L1', { recurringItems: [] });
      expect(result.totalMonthly).toBe(0);
      expect(result.buckets).toHaveLength(0);
    });

    it('يُقسّم حسب الفئة', () => {
      const items = [
        makeItem({ amount: 600, frequency: 'monthly', category: 'operational' }),
        makeItem({ id: 'r2', amount: 400, frequency: 'monthly', category: 'maintenance' }),
      ];
      const result = getBurnBreakdown('L1', { recurringItems: items });
      expect(result.totalMonthly).toBe(1000);
      expect(result.buckets).toHaveLength(2);
      // مرتّب تنازلياً
      expect(result.buckets[0].category).toBe('operational');
      expect(result.buckets[0].monthlySum).toBe(600);
    });
  });

  // ==================== getPressureBreakdown ====================
  describe('getPressureBreakdown', () => {
    it('يُرجع تفاصيل الضغط', () => {
      const items = [
        makeItem({ amount: 0 }),
        makeItem({ id: 'r2', amount: 500, nextDueDate: daysFromNow(-5) }),
      ];
      const result = getPressureBreakdown('L1', { recurringItems: items, transactions: [] });
      expect(result.missingPricingCount).toBe(1);
      expect(result.overdueCount).toBe(1);
      expect(result.weightedScoreParts).toBeDefined();
    });
  });

  // ==================== getRiskBreakdown90d ====================
  describe('getRiskBreakdown90d', () => {
    it('بدون بنود → أصفار', () => {
      const result = getRiskBreakdown90d('L1', { recurringItems: [] });
      expect(result.totalDueAmount).toBe(0);
      expect(result.highRiskCount).toBe(0);
      expect(result.computedLevel).toBe('low');
    });

    it('بند عالي المخاطر يظهر في highRiskCount', () => {
      const items = [makeItem({ riskLevel: 'high', amount: 1000, nextDueDate: daysFromNow(30) })];
      const result = getRiskBreakdown90d('L1', { recurringItems: items });
      expect(result.highRiskCount).toBe(1);
      expect(result.totalDueAmount).toBe(1000);
    });
  });

  // ==================== getDailyPlaybook ====================
  describe('getDailyPlaybook', () => {
    it('بدون بنود → قائمة فارغة', () => {
      const result = getDailyPlaybook('L1', { recurringItems: [] });
      expect(result).toHaveLength(0);
    });

    it('بند متأخر عالي المخاطر → أولوية 100', () => {
      const items = [makeItem({ riskLevel: 'high', amount: 500, nextDueDate: daysFromNow(-3) })];
      const result = getDailyPlaybook('L1', { recurringItems: items });
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('highrisk_overdue');
      expect(result[0].priorityScore).toBe(100);
    });

    it('بند متأخر عادي → أولوية 80', () => {
      const items = [makeItem({ amount: 500, nextDueDate: daysFromNow(-3) })];
      const result = getDailyPlaybook('L1', { recurringItems: items });
      expect(result[0].type).toBe('overdue');
      expect(result[0].priorityScore).toBe(80);
    });

    it('بند قادم خلال 14 يوم → أولوية 60', () => {
      const items = [makeItem({ amount: 500, nextDueDate: daysFromNow(10) })];
      const result = getDailyPlaybook('L1', { recurringItems: items });
      expect(result[0].type).toBe('due_soon');
      expect(result[0].priorityScore).toBe(60);
    });

    it('بند غير مسعّر → أولوية 40', () => {
      const items = [makeItem({ amount: 0, nextDueDate: daysFromNow(30) })];
      const result = getDailyPlaybook('L1', { recurringItems: items });
      expect(result[0].type).toBe('missing_pricing');
      expect(result[0].priorityScore).toBe(40);
    });

    it('الحد الأقصى 5 مهام مرتّبة تنازلياً', () => {
      const items = Array.from({ length: 8 }, (_, i) =>
        makeItem({ id: `r${i}`, amount: 500, nextDueDate: daysFromNow(-i - 1) })
      );
      const result = getDailyPlaybook('L1', { recurringItems: items });
      expect(result).toHaveLength(5);
      expect(result[0].priorityScore).toBeGreaterThanOrEqual(result[4].priorityScore);
    });
  });

  // ==================== getBenchmarkComparison ====================
  describe('getBenchmarkComparison', () => {
    it('بدون بنود → نسب صفرية', () => {
      const result = getBenchmarkComparison('L1', { recurringItems: [] });
      expect(result.totalBurn).toBe(0);
      expect(result.ratios.rentRatio).toBe(0);
    });

    it('يُقارن مع معايير المكتب (default)', () => {
      const items = [
        makeItem({ amount: 5000, frequency: 'monthly', saHint: 'إيجار شهري' }),
        makeItem({ id: 'r2', amount: 1000, frequency: 'monthly', category: 'maintenance' }),
      ];
      const result = getBenchmarkComparison('L1', { recurringItems: items });
      expect(result.ledgerType).toBe('office');
      expect(result.ratios.rentRatio).toBeCloseTo(5000 / 6000, 2);
      expect(result.flags).toHaveLength(3);
    });

    it('يستخدم نوع الدفتر المحدد', () => {
      const items = [makeItem({ amount: 1000, frequency: 'monthly' })];
      const result = getBenchmarkComparison('L1', {
        recurringItems: items,
        ledgerType: 'chalet',
      });
      expect(result.ledgerType).toBe('chalet');
      expect(result.benchmarks).toEqual(SAUDI_BENCHMARKS.chalet);
    });

    it('flags high عندما تتجاوز النسبة الحد', () => {
      // إيجار 90% من الإجمالي → يتجاوز حد 45% للمكتب
      const items = [
        makeItem({ amount: 9000, frequency: 'monthly', saHint: 'إيجار' }),
        makeItem({ id: 'r2', amount: 1000, frequency: 'monthly', category: 'maintenance' }),
      ];
      const result = getBenchmarkComparison('L1', { recurringItems: items });
      const rentFlag = result.flags.find((f) => f.type === 'rent');
      expect(rentFlag.status).toBe('high');
    });
  });

  // ==================== SAUDI_BENCHMARKS ====================
  describe('SAUDI_BENCHMARKS', () => {
    it('يحتوي على أنواع العقارات الأساسية', () => {
      expect(SAUDI_BENCHMARKS).toHaveProperty('office');
      expect(SAUDI_BENCHMARKS).toHaveProperty('chalet');
      expect(SAUDI_BENCHMARKS).toHaveProperty('building');
      expect(SAUDI_BENCHMARKS).toHaveProperty('villa');
      expect(SAUDI_BENCHMARKS).toHaveProperty('personal');
    });

    it('كل نوع يحتوي على الحدود الثلاثة', () => {
      for (const type of Object.keys(SAUDI_BENCHMARKS)) {
        expect(SAUDI_BENCHMARKS[type]).toHaveProperty('rentRatioMax');
        expect(SAUDI_BENCHMARKS[type]).toHaveProperty('utilitiesRatioMax');
        expect(SAUDI_BENCHMARKS[type]).toHaveProperty('marketingRatioMax');
      }
    });
  });
});
