import { beforeEach, describe, expect, it, vi } from 'vitest';
import { KEYS } from '../../constants/index.js';

const mockStorage = {};

vi.stubGlobal('localStorage', {
  getItem: vi.fn((k) => mockStorage[k] ?? null),
  setItem: vi.fn((k, v) => {
    mockStorage[k] = v;
  }),
  removeItem: vi.fn((k) => {
    delete mockStorage[k];
  }),
});

import { dataStore, safeGet, safeSet } from '../dataStore.js';

describe('dataStore seed', () => {
  beforeEach(() => {
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
  });

  it('resetDemo يزرع البيانات العقارية ودفعات العقود', () => {
    const result = dataStore.seed.resetDemo();

    expect(result.ok).toBe(true);
    expect(safeGet(KEYS.properties, [])).not.toHaveLength(0);
    expect(safeGet(KEYS.units, [])).not.toHaveLength(0);
    expect(safeGet(KEYS.contacts, [])).not.toHaveLength(0);
    expect(safeGet(KEYS.contracts, [])).not.toHaveLength(0);
    expect(safeGet(KEYS.contractPayments, [])).not.toHaveLength(0);
  });

  it('ensureSeeded يعيد زرع دفعات العقود إذا كانت مفقودة', () => {
    dataStore.seed.resetDemo();
    safeSet(KEYS.contractPayments, []);

    dataStore.seed.ensureSeeded();

    expect(safeGet(KEYS.contractPayments, [])).not.toHaveLength(0);
  });
});
