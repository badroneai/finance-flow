import { describe, it, expect } from 'vitest';
import { normalizeDigits } from '../helpers.js';

describe('normalizeDigits', () => {
  it('يحوّل الأرقام العربية إلى إنجليزية', () => {
    expect(normalizeDigits('١٢٣٤٥٦٧٨٩٠')).toBe('1234567890');
  });

  it('يحوّل الأرقام الفارسية إلى إنجليزية', () => {
    expect(normalizeDigits('۱۲۳۴۵۶۷۸۹۰')).toBe('1234567890');
  });

  it('يحافظ على بقية النص كما هو', () => {
    expect(normalizeDigits('شقة ١٢ في الدور ۳')).toBe('شقة 12 في الدور 3');
  });
});
