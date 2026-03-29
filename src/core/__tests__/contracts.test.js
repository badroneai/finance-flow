import { describe, it, expect } from 'vitest';
import { defaultContract, filterContracts, validateContract } from '../../domain/contracts.js';

describe('contracts domain', () => {
  it('defaultContract يحتوي على unitId فارغ للتوافق مع العقود القديمة والجديدة', () => {
    const contract = defaultContract();
    expect(contract).toHaveProperty('unitId');
    expect(contract.unitId).toBe('');
  });

  it('validateContract يطلب اختيار العقار', () => {
    const result = validateContract({
      ...defaultContract(),
      propertyId: '',
      totalAmount: 1000,
      monthlyRent: 100,
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('اختيار العقار مطلوب');
  });

  it('filterContracts يدعم فلترة الوحدة والبحث باسمها', () => {
    const contracts = [
      {
        id: 'c1',
        propertyId: 'p1',
        unitId: 'u1',
        contractNumber: 'A-1',
        _unitName: 'شقة 1',
      },
      {
        id: 'c2',
        propertyId: 'p1',
        unitId: 'u2',
        contractNumber: 'A-2',
        _unitName: 'محل A',
      },
    ];

    expect(filterContracts(contracts, { unitId: 'u1' })).toHaveLength(1);
    expect(filterContracts(contracts, { search: 'محل' })).toHaveLength(1);
  });
});
