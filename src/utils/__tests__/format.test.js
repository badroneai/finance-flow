/**
 * اختبارات تنسيق الأرقام والعملة
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('../../core/theme-ui.js', () => ({
  getNumeralsMode: vi.fn(() => 'ar'),
}));

const { formatNumber, formatCurrency } = await import('../format.jsx');

describe('format', () => {
  it('formatNumber returns string with digits', () => {
    expect(typeof formatNumber(1000)).toBe('string');
    expect(formatNumber(1000).length).toBeGreaterThan(0);
    expect(formatNumber(0)).toMatch(/[0٠]/);
    expect(formatNumber(null)).toMatch(/[0٠]/);
    expect(formatNumber(undefined)).toMatch(/[0٠]/);
  });

  it('formatCurrency appends ر.س', () => {
    const result = formatCurrency(1000);
    expect(result).toContain('ر.س');
    expect(result.length).toBeGreaterThan(3);
  });

  it('formatCurrency(0) contains ر.س', () => {
    expect(formatCurrency(0)).toContain('ر.س');
  });
});
