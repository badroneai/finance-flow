import { describe, it, expect } from 'vitest';
import {
  validateUnit,
  defaultUnit,
  filterUnits,
  computeUnitsSummary,
} from '../../domain/units.js';

describe('units domain', () => {
  it('defaultUnit ينشئ وحدة افتراضية مرتبطة بالعقار', () => {
    const unit = defaultUnit('prop-1');
    expect(unit.propertyId).toBe('prop-1');
    expect(unit.type).toBe('apartment');
    expect(unit.status).toBe('vacant');
  });

  it('validateUnit يرفض الوحدة بدون اسم', () => {
    const result = validateUnit({ name: '', type: 'apartment', status: 'vacant' });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('اسم/رقم الوحدة');
  });

  it('validateUnit يقبل الوحدة الصحيحة', () => {
    const result = validateUnit({
      name: 'شقة 3',
      type: 'apartment',
      status: 'occupied',
      monthlyRent: 3200,
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('filterUnits يفلتر حسب العقار والحالة والبحث', () => {
    const units = [
      { id: '1', propertyId: 'prop-1', name: 'شقة 1', type: 'apartment', status: 'vacant' },
      { id: '2', propertyId: 'prop-1', name: 'محل A', type: 'shop', status: 'occupied' },
      { id: '3', propertyId: 'prop-2', name: 'شقة 4', type: 'apartment', status: 'occupied' },
    ];

    expect(filterUnits(units, { propertyId: 'prop-1' })).toHaveLength(2);
    expect(filterUnits(units, { status: 'occupied' })).toHaveLength(2);
    expect(filterUnits(units, { search: 'محل' })).toHaveLength(1);
  });

  it('computeUnitsSummary يرجع ملخصًا صحيحًا', () => {
    const summary = computeUnitsSummary([
      { status: 'occupied', monthlyRent: 2500 },
      { status: 'vacant', monthlyRent: 2200 },
      { status: 'occupied', monthlyRent: 2800 },
      { status: 'maintenance', monthlyRent: 0 },
    ]);

    expect(summary.total).toBe(4);
    expect(summary.occupiedCount).toBe(2);
    expect(summary.vacantCount).toBe(1);
    expect(summary.maintenanceCount).toBe(1);
    expect(summary.totalExpectedRent).toBe(7500);
    expect(summary.occupancyRate).toBe(50);
  });

  it('computeUnitsSummary يتعامل بأمان مع القائمة الفارغة', () => {
    expect(computeUnitsSummary([])).toEqual({
      total: 0,
      vacantCount: 0,
      occupiedCount: 0,
      maintenanceCount: 0,
      totalExpectedRent: 0,
      occupancyRate: 0,
    });
  });
});
