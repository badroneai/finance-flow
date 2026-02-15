/**
 * اختبارات محرك النبض المالي (pulse-engine)
 */
import { describe, it, expect, vi } from 'vitest';
import { calculatePulse } from '../pulse-engine.js';

vi.mock('../ledger-store.js', () => ({
  getLedgers: vi.fn(() => []),
  getActiveLedgerId: vi.fn(() => ''),
  getRecurringItems: vi.fn(() => []),
}));

vi.mock('../dataStore.js', () => ({
  dataStore: {
    transactions: { list: vi.fn(() => []) },
  },
}));

describe('pulse-engine', () => {
  it('calculatePulse() with no ledger returns empty pulse shape', () => {
    const pulse = calculatePulse();

    expect(pulse).toBeDefined();
    expect(pulse.healthStatus).toBe('unknown');
    expect(pulse.healthScore).toBe(0);
    expect(pulse.todayIncome).toBe(0);
    expect(pulse.weekExpenses).toBe(0);
    expect(pulse.currentBalance).toBe(0);
    expect(pulse.balanceTrend).toBe('stable');
    expect(Array.isArray(pulse.alerts)).toBe(true);
    expect(pulse.alerts).toHaveLength(0);
    expect(Array.isArray(pulse.upcomingDues)).toBe(true);
    expect(pulse.upcomingDues).toHaveLength(0);
    expect(pulse.weekForecast).toEqual({ expectedIncome: 0, expectedExpenses: 0, netCashflow: 0, riskLevel: 'safe' });
    expect(pulse.ledgerSummary).toBeDefined();
    expect(pulse.ledgerSummary.ledgerId).toBe('');
    expect(pulse.ledgerSummary.ledgerName).toBe('');
    expect(pulse.dataFreshness).toBe('live');
    expect(pulse.calculatedAt).toBeDefined();
  });

  it('calculatePulse(null) with no active ledger returns same empty shape', () => {
    const pulse = calculatePulse(null);
    expect(pulse.healthStatus).toBe('unknown');
    expect(pulse.ledgerSummary.ledgerId).toBe('');
  });
});
