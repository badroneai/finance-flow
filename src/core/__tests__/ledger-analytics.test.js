/**
 * اختبارات تحليلات الدفتر (ledger-analytics — computePL)
 */
import { describe, it, expect } from 'vitest';
import { computePL, computeTopBuckets, variance } from '../ledger-analytics.js';

describe('ledger-analytics — computePL', () => {
  it('بدون حركات يُرجع أصفار', () => {
    const pl = computePL({ transactions: [] });

    expect(pl.income).toBe(0);
    expect(pl.expense).toBe(0);
    expect(pl.net).toBe(0);
  });

  it('دخل فقط → الصافي موجب', () => {
    const transactions = [
      { type: 'income', amount: 5000 },
      { type: 'income', amount: 3000 },
    ];

    const pl = computePL({ transactions });

    expect(pl.income).toBe(8000);
    expect(pl.expense).toBe(0);
    expect(pl.net).toBe(8000);
  });

  it('مصروف فقط → الصافي سالب', () => {
    const transactions = [
      { type: 'expense', amount: 2000 },
      { type: 'expense', amount: 1500 },
    ];

    const pl = computePL({ transactions });

    expect(pl.income).toBe(0);
    expect(pl.expense).toBe(3500);
    expect(pl.net).toBe(-3500);
  });

  it('خليط دخل ومصروف → الصافي صحيح', () => {
    const transactions = [
      { type: 'income', amount: 10000 },
      { type: 'expense', amount: 3000 },
      { type: 'income', amount: 2000 },
      { type: 'expense', amount: 4000 },
    ];

    const pl = computePL({ transactions });

    expect(pl.income).toBe(12000);
    expect(pl.expense).toBe(7000);
    expect(pl.net).toBe(5000);
  });

  it('مبالغ عشرية تُحسب بدقة', () => {
    const transactions = [
      { type: 'income', amount: 1500.5 },
      { type: 'expense', amount: 750.25 },
    ];

    const pl = computePL({ transactions });

    expect(pl.income).toBeCloseTo(1500.5, 2);
    expect(pl.expense).toBeCloseTo(750.25, 2);
    expect(pl.net).toBeCloseTo(750.25, 2);
  });

  it('مبالغ نصية تُحوّل لأرقام', () => {
    const transactions = [
      { type: 'income', amount: '5000' },
      { type: 'expense', amount: '2000' },
    ];

    const pl = computePL({ transactions });

    expect(pl.income).toBe(5000);
    expect(pl.expense).toBe(2000);
    expect(pl.net).toBe(3000);
  });

  it('مبلغ غير صالح يُعامل كصفر', () => {
    const transactions = [
      { type: 'income', amount: null },
      { type: 'income', amount: undefined },
      { type: 'income', amount: 'abc' },
      { type: 'income', amount: 1000 },
    ];

    const pl = computePL({ transactions });

    expect(pl.income).toBe(1000);
  });
});

describe('ledger-analytics — computeTopBuckets', () => {
  it('بدون حركات يُرجع مصفوفة فارغة', () => {
    const result = computeTopBuckets({ transactions: [] });
    expect(result).toEqual([]);
  });

  it('يُرجع أعلى البنود مرتبة تنازلياً', () => {
    const transactions = [
      { type: 'expense', amount: 500, meta: { acct: { bucket: 'operational' } } },
      { type: 'expense', amount: 1000, meta: { acct: { bucket: 'maintenance' } } },
      { type: 'expense', amount: 200, meta: { acct: { bucket: 'marketing' } } },
    ];

    const result = computeTopBuckets({ transactions, limit: 3 });

    expect(result.length).toBe(3);
    expect(result[0].bucket).toBe('maintenance');
    expect(result[0].total).toBe(1000);
  });
});

describe('ledger-analytics — variance', () => {
  it('بدون بيانات يُرجع أصفار', () => {
    const v = variance(null, null);

    expect(v.varianceIncome).toBe(0);
    expect(v.varianceExpense).toBe(0);
    expect(v.varianceNet).toBe(0);
  });

  it('مصروف فعلي أعلى من المتوقع → variance موجب', () => {
    const expected = { income: 10000, expense: 5000, net: 5000 };
    const actual = { income: 10000, expense: 8000, net: 2000 };

    const v = variance(expected, actual);

    expect(v.varianceExpense).toBe(3000);
    expect(v.reasons.length).toBeGreaterThan(0);
    expect(v.reasons[0]).toContain('مصروفات أعلى');
  });

  it('دخل فعلي أقل من المتوقع → سبب واضح', () => {
    const expected = { income: 10000, expense: 5000, net: 5000 };
    const actual = { income: 7000, expense: 5000, net: 2000 };

    const v = variance(expected, actual);

    expect(v.varianceIncome).toBe(-3000);
    expect(v.reasons.some((r) => r.includes('دخل أقل'))).toBe(true);
  });
});
