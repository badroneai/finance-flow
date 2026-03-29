import { describe, expect, it } from 'vitest';
import {
  validatePayment,
  buildPaymentPayload,
  buildTransactionPayload,
} from '../contract-payments.js';

describe('contract-payments domain', () => {
  // ═══════════════════════════════════════
  // validatePayment
  // ═══════════════════════════════════════
  describe('validatePayment', () => {
    it('يقبل دفعة صحيحة', () => {
      const result = validatePayment({ amount: 1000, date: '2026-03-15' });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('يرفض مبلغ صفري', () => {
      const result = validatePayment({ amount: 0, date: '2026-03-15' });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('أدخل مبلغ دفعة صحيحًا');
    });

    it('يرفض مبلغ سالب', () => {
      const result = validatePayment({ amount: -500, date: '2026-03-15' });
      expect(result.valid).toBe(false);
    });

    it('يرفض تاريخ فارغ', () => {
      const result = validatePayment({ amount: 1000, date: '' });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('تاريخ الدفعة مطلوب');
    });

    it('يرفض مبلغ يتجاوز المتبقي', () => {
      const result = validatePayment({
        amount: 5000,
        date: '2026-03-15',
        remainingAmount: 3000,
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('مبلغ الدفعة يتجاوز المبلغ المتبقي');
    });

    it('يقبل مبلغ مساوي للمتبقي (سداد كامل)', () => {
      const result = validatePayment({
        amount: 3000,
        date: '2026-03-15',
        remainingAmount: 3000,
      });
      expect(result.valid).toBe(true);
    });

    it('يقبل دفعة جزئية أقل من المتبقي', () => {
      const result = validatePayment({
        amount: 1000,
        date: '2026-03-15',
        remainingAmount: 3000,
      });
      expect(result.valid).toBe(true);
    });

    it('يتجاهل فحص المتبقي إذا لم يُمرر remainingAmount', () => {
      const result = validatePayment({
        amount: 999999,
        date: '2026-03-15',
      });
      expect(result.valid).toBe(true);
    });

    it('يرجع عدة أخطاء معاً', () => {
      const result = validatePayment({
        amount: 0,
        date: '',
        remainingAmount: 1000,
      });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
    });

    it('يحول النص لرقم عبر safeNum', () => {
      const result = validatePayment({
        amount: '1500',
        date: '2026-03-15',
        remainingAmount: 2000,
      });
      expect(result.valid).toBe(true);
    });
  });

  // ═══════════════════════════════════════
  // buildPaymentPayload
  // ═══════════════════════════════════════
  describe('buildPaymentPayload', () => {
    it('يبني حمولة دفعة كاملة', () => {
      const payload = buildPaymentPayload({
        contractId: 'c-1',
        amount: '3000',
        date: '2026-03-15',
        paymentMethod: 'cash',
        dueId: 'due-1',
        note: ' ملاحظة اختبار ',
      });

      expect(payload.contractId).toBe('c-1');
      expect(payload.amount).toBe(3000);
      expect(payload.date).toBe('2026-03-15');
      expect(payload.paymentMethod).toBe('cash');
      expect(payload.dueId).toBe('due-1');
      expect(payload.note).toBe('ملاحظة اختبار'); // مقتطع
    });

    it('يملأ القيم الافتراضية للحقول الاختيارية', () => {
      const payload = buildPaymentPayload({
        contractId: 'c-2',
        amount: 1000,
        date: '2026-04-01',
      });

      expect(payload.paymentMethod).toBe('bank_transfer');
      expect(payload.dueId).toBe('');
      expect(payload.note).toBe('');
    });
  });

  // ═══════════════════════════════════════
  // buildTransactionPayload
  // ═══════════════════════════════════════
  describe('buildTransactionPayload', () => {
    const mockContract = {
      id: 'c-1',
      contractNumber: '1001',
      type: 'rent',
      propertyId: 'p-1',
      unitId: 'u-1',
    };

    it('يبني حركة مالية صحيحة لعقد إيجار', () => {
      const tx = buildTransactionPayload({
        contract: mockContract,
        amount: 3000,
        date: '2026-03-15',
        paymentMethod: 'bank_transfer',
        dueId: 'due-1',
        propertyName: 'برج السعادة',
        unitName: 'شقة 101',
      });

      expect(tx.type).toBe('income');
      expect(tx.category).toBe('rent');
      expect(tx.amount).toBe(3000);
      expect(tx.description).toContain('1001');
      expect(tx.description).toContain('برج السعادة');
      expect(tx.description).toContain('شقة 101');
      expect(tx.meta.contractId).toBe('c-1');
      expect(tx.meta.propertyId).toBe('p-1');
      expect(tx.meta.unitId).toBe('u-1');
      expect(tx.meta.dueId).toBe('due-1');
    });

    it('يستخدم category=deposit لعقد بيع', () => {
      const tx = buildTransactionPayload({
        contract: { ...mockContract, type: 'sale' },
        amount: 50000,
        date: '2026-03-15',
        paymentMethod: 'check',
      });

      expect(tx.category).toBe('deposit');
    });

    it('يرجع null بدون عقد', () => {
      const tx = buildTransactionPayload({
        contract: null,
        amount: 1000,
        date: '2026-03-15',
      });
      expect(tx).toBeNull();
    });

    it('يدعم snake_case في حقول العقد', () => {
      const tx = buildTransactionPayload({
        contract: {
          id: 'c-3',
          contractNumber: '2002',
          type: 'rent',
          property_id: 'p-snake',
          unit_id: 'u-snake',
        },
        amount: 1000,
        date: '2026-03-15',
      });

      expect(tx.meta.propertyId).toBe('p-snake');
      expect(tx.meta.unitId).toBe('u-snake');
    });

    it('يبني الوصف بدون أسماء العقار والوحدة', () => {
      const tx = buildTransactionPayload({
        contract: mockContract,
        amount: 1000,
        date: '2026-03-15',
      });

      expect(tx.description).toBe('دفعة عقد 1001');
    });
  });
});
