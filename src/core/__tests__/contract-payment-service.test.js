import { describe, expect, it, vi } from 'vitest';
import { recordContractPayment } from '../contract-payment-service.js';

describe('contract-payment-service', () => {
  const mockContract = {
    id: 'c-1',
    contractNumber: '1001',
    type: 'rent',
    propertyId: 'p-1',
    unitId: 'u-1',
  };

  // دوال وهمية — تحاكي DataContext
  const makeCreateContractPayment = (shouldFail = false) =>
    vi.fn().mockResolvedValue(
      shouldFail
        ? { data: null, error: { message: 'فشل حفظ الدفعة' } }
        : { data: { id: 'pay-1' }, error: null }
    );

  const makeCreateTransaction = (shouldFail = false) =>
    vi.fn().mockResolvedValue(
      shouldFail
        ? { data: null, error: { message: 'فشل الحركة' } }
        : { data: { id: 'tx-1' }, error: null }
    );

  const makeDeleteContractPayment = () =>
    vi.fn().mockResolvedValue({ error: null });

  it('يسجل دفعة كاملة بنجاح', async () => {
    const createPayment = makeCreateContractPayment();
    const createTx = makeCreateTransaction();

    const result = await recordContractPayment({
      contract: mockContract,
      formData: {
        amount: 3000,
        date: '2026-03-15',
        paymentMethod: 'bank_transfer',
        dueId: 'due-1',
        note: 'سداد كامل',
      },
      propertyName: 'برج السعادة',
      unitName: 'شقة 101',
      remainingAmount: 3000,
      createContractPayment: createPayment,
      createTransaction: createTx,
    });

    expect(result.success).toBe(true);
    expect(createPayment).toHaveBeenCalledOnce();
    expect(createTx).toHaveBeenCalledOnce();

    // تحقق من حمولة الدفعة
    const payloadArg = createPayment.mock.calls[0][0];
    expect(payloadArg.contractId).toBe('c-1');
    expect(payloadArg.amount).toBe(3000);

    // تحقق من حمولة الحركة
    const txArg = createTx.mock.calls[0][0];
    expect(txArg.type).toBe('income');
    expect(txArg.category).toBe('rent');
    expect(txArg.amount).toBe(3000);
  });

  it('يسجل دفعة جزئية بنجاح', async () => {
    const createPayment = makeCreateContractPayment();
    const createTx = makeCreateTransaction();

    const result = await recordContractPayment({
      contract: mockContract,
      formData: {
        amount: 1000,
        date: '2026-03-15',
        paymentMethod: 'cash',
        dueId: 'due-1',
      },
      remainingAmount: 3000,
      createContractPayment: createPayment,
      createTransaction: createTx,
    });

    expect(result.success).toBe(true);
    const payloadArg = createPayment.mock.calls[0][0];
    expect(payloadArg.amount).toBe(1000);
  });

  it('يرفض مبلغ يتجاوز المتبقي', async () => {
    const createPayment = makeCreateContractPayment();
    const createTx = makeCreateTransaction();

    const result = await recordContractPayment({
      contract: mockContract,
      formData: {
        amount: 5000,
        date: '2026-03-15',
        paymentMethod: 'bank_transfer',
        dueId: 'due-1',
      },
      remainingAmount: 3000,
      createContractPayment: createPayment,
      createTransaction: createTx,
    });

    expect(result.success).toBe(false);
    expect(result.errors).toContain('مبلغ الدفعة يتجاوز المبلغ المتبقي');
    // لم يتم استدعاء أي دالة حفظ
    expect(createPayment).not.toHaveBeenCalled();
    expect(createTx).not.toHaveBeenCalled();
  });

  it('يرفض مبلغ صفري', async () => {
    const createPayment = makeCreateContractPayment();
    const createTx = makeCreateTransaction();

    const result = await recordContractPayment({
      contract: mockContract,
      formData: { amount: 0, date: '2026-03-15' },
      createContractPayment: createPayment,
      createTransaction: createTx,
    });

    expect(result.success).toBe(false);
    expect(result.errors).toContain('أدخل مبلغ دفعة صحيحًا');
  });

  it('يرفض تاريخ فارغ', async () => {
    const createPayment = makeCreateContractPayment();
    const createTx = makeCreateTransaction();

    const result = await recordContractPayment({
      contract: mockContract,
      formData: { amount: 1000, date: '' },
      createContractPayment: createPayment,
      createTransaction: createTx,
    });

    expect(result.success).toBe(false);
    expect(result.errors).toContain('تاريخ الدفعة مطلوب');
  });

  it('يرجع خطأ إذا العقد غير موجود', async () => {
    const createPayment = makeCreateContractPayment();
    const createTx = makeCreateTransaction();

    const result = await recordContractPayment({
      contract: null,
      formData: { amount: 1000, date: '2026-03-15' },
      createContractPayment: createPayment,
      createTransaction: createTx,
    });

    expect(result.success).toBe(false);
    expect(result.errors).toContain('العقد غير موجود');
  });

  it('يعالج خطأ فشل حفظ الدفعة', async () => {
    const createPayment = makeCreateContractPayment(true);
    const createTx = makeCreateTransaction();

    const result = await recordContractPayment({
      contract: mockContract,
      formData: {
        amount: 1000,
        date: '2026-03-15',
        paymentMethod: 'bank_transfer',
      },
      createContractPayment: createPayment,
      createTransaction: createTx,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
    // لم يتم إنشاء الحركة إذا فشلت الدفعة
    expect(createTx).not.toHaveBeenCalled();
  });

  it('يمرر dueId فارغ إذا لم يُحدد', async () => {
    const createPayment = makeCreateContractPayment();
    const createTx = makeCreateTransaction();

    await recordContractPayment({
      contract: mockContract,
      formData: {
        amount: 1000,
        date: '2026-03-15',
        paymentMethod: 'bank_transfer',
      },
      createContractPayment: createPayment,
      createTransaction: createTx,
    });

    const payloadArg = createPayment.mock.calls[0][0];
    expect(payloadArg.dueId).toBe('');
  });

  // ═══════════════════════════════════════
  // اختبارات سند القبض المحفوظ
  // ═══════════════════════════════════════
  describe('receipt persistence — حفظ سند القبض', () => {
    const makeCreateContractReceipt = (shouldFail = false) =>
      vi.fn().mockResolvedValue(
        shouldFail
          ? { data: null, error: { message: 'فشل حفظ السند' } }
          : { data: { id: 'rcp-1', receiptNumber: 'RCP-20260315-ABCD', amount: 1000 }, error: null }
      );

    it('يحفظ سند قبض ويرجعه مع النتيجة عند النجاح', async () => {
      const createPayment = makeCreateContractPayment();
      const createTx = makeCreateTransaction();
      const createReceipt = makeCreateContractReceipt();

      const result = await recordContractPayment({
        contract: mockContract,
        formData: {
          amount: 1000,
          date: '2026-03-15',
          paymentMethod: 'bank_transfer',
          dueId: 'due-1',
          note: 'سداد',
        },
        propertyName: 'برج',
        unitName: 'شقة 1',
        tenantName: 'أحمد',
        installmentNumber: '3',
        createContractPayment: createPayment,
        createTransaction: createTx,
        createContractReceipt: createReceipt,
      });

      expect(result.success).toBe(true);
      expect(result.receipt).toBeTruthy();
      expect(result.receipt.id).toBe('rcp-1');
      expect(createReceipt).toHaveBeenCalledOnce();

      // تحقق أن الإيصال يحمل contractPaymentId
      const receiptArg = createReceipt.mock.calls[0][0];
      expect(receiptArg.contractPaymentId).toBe('pay-1');
      expect(receiptArg.amount).toBe(1000);
      expect(receiptArg.tenantName).toBe('أحمد');
      expect(receiptArg.receiptNumber).toMatch(/^RCP-/);
    });

    it('receiptNumber ثابت — يُولد مرة واحدة وقت الحفظ', async () => {
      const createPayment = makeCreateContractPayment();
      const createTx = makeCreateTransaction();
      const createReceipt = makeCreateContractReceipt();

      await recordContractPayment({
        contract: mockContract,
        formData: { amount: 500, date: '2026-03-15', paymentMethod: 'cash' },
        createContractPayment: createPayment,
        createTransaction: createTx,
        createContractReceipt: createReceipt,
      });

      // receiptNumber مولّد في receiptModel ثم يُمرر للتخزين
      const receiptArg = createReceipt.mock.calls[0][0];
      expect(receiptArg.receiptNumber).toBeTruthy();
      expect(typeof receiptArg.receiptNumber).toBe('string');
      expect(receiptArg.receiptNumber.startsWith('RCP-')).toBe(true);
    });

    it('لا يُفشل الدفعة إذا فشل حفظ سند القبض', async () => {
      const createPayment = makeCreateContractPayment();
      const createTx = makeCreateTransaction();
      const createReceipt = makeCreateContractReceipt(true); // يفشل

      const result = await recordContractPayment({
        contract: mockContract,
        formData: { amount: 1000, date: '2026-03-15', paymentMethod: 'bank_transfer' },
        createContractPayment: createPayment,
        createTransaction: createTx,
        createContractReceipt: createReceipt,
      });

      // الدفعة نجحت رغم فشل السند
      expect(result.success).toBe(true);
      expect(result.receipt).toBeNull();
      expect(createPayment).toHaveBeenCalledOnce();
      expect(createTx).toHaveBeenCalledOnce();
    });

    it('يعمل بدون createContractReceipt (backward compatible)', async () => {
      const createPayment = makeCreateContractPayment();
      const createTx = makeCreateTransaction();

      const result = await recordContractPayment({
        contract: mockContract,
        formData: { amount: 1000, date: '2026-03-15', paymentMethod: 'bank_transfer' },
        createContractPayment: createPayment,
        createTransaction: createTx,
        // لا createContractReceipt
      });

      expect(result.success).toBe(true);
      expect(result.receipt).toBeNull();
    });

    it('لا يُفشل الدفعة إذا ألقى createContractReceipt خطأ', async () => {
      const createPayment = makeCreateContractPayment();
      const createTx = makeCreateTransaction();
      const createReceipt = vi.fn().mockRejectedValue(new Error('crash'));

      const result = await recordContractPayment({
        contract: mockContract,
        formData: { amount: 1000, date: '2026-03-15', paymentMethod: 'bank_transfer' },
        createContractPayment: createPayment,
        createTransaction: createTx,
        createContractReceipt: createReceipt,
      });

      expect(result.success).toBe(true);
      expect(result.receipt).toBeNull();
    });
  });

  // ═══════════════════════════════════════
  // اختبارات الـ Atomicity / Rollback
  // ═══════════════════════════════════════
  describe('atomicity — rollback عند فشل الحركة المالية', () => {
    it('يحذف الدفعة (rollback) إذا نجحت لكن فشل إنشاء الحركة', async () => {
      const createPayment = makeCreateContractPayment(); // ينجح ويرجع { data: { id: 'pay-1' } }
      const createTx = makeCreateTransaction(true); // يفشل
      const deletePayment = makeDeleteContractPayment();

      const result = await recordContractPayment({
        contract: mockContract,
        formData: {
          amount: 1000,
          date: '2026-03-15',
          paymentMethod: 'bank_transfer',
        },
        createContractPayment: createPayment,
        deleteContractPayment: deletePayment,
        createTransaction: createTx,
      });

      expect(result.success).toBe(false);
      // تأكد أن الدفعة أُنشئت أولاً
      expect(createPayment).toHaveBeenCalledOnce();
      // تأكد أن الحذف (rollback) تم استدعاؤه بمعرف الدفعة
      expect(deletePayment).toHaveBeenCalledOnce();
      expect(deletePayment).toHaveBeenCalledWith('pay-1');
    });

    it('لا يبقي دفعة بدون حركة مالية بعد فشل الحركة', async () => {
      const createPayment = makeCreateContractPayment();
      const createTx = makeCreateTransaction(true);
      const deletePayment = makeDeleteContractPayment();

      await recordContractPayment({
        contract: mockContract,
        formData: {
          amount: 2000,
          date: '2026-04-01',
          paymentMethod: 'cash',
        },
        createContractPayment: createPayment,
        deleteContractPayment: deletePayment,
        createTransaction: createTx,
      });

      // النتيجة: الدفعة أُنشئت ثم حُذفت — لا شيء متبقي
      expect(createPayment).toHaveBeenCalledOnce();
      expect(deletePayment).toHaveBeenCalledOnce();
      // تتبع الترتيب: إنشاء ثم حذف
      const createOrder = createPayment.mock.invocationCallOrder[0];
      const deleteOrder = deletePayment.mock.invocationCallOrder[0];
      expect(deleteOrder).toBeGreaterThan(createOrder);
    });

    it('يتعامل بأمان إذا deleteContractPayment غير متوفرة', async () => {
      const createPayment = makeCreateContractPayment();
      const createTx = makeCreateTransaction(true);

      // لا نمرر deleteContractPayment — يجب ألا ينكسر
      const result = await recordContractPayment({
        contract: mockContract,
        formData: {
          amount: 1000,
          date: '2026-03-15',
          paymentMethod: 'bank_transfer',
        },
        createContractPayment: createPayment,
        createTransaction: createTx,
        // deleteContractPayment غير ممررة
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
      // لم ينكسر — الخدمة تُرجع الخطأ بدون throw
    });

    it('يتعامل بأمان إذا فشل الـ rollback نفسه', async () => {
      const createPayment = makeCreateContractPayment();
      const createTx = makeCreateTransaction(true);
      // deleteContractPayment يرمي خطأ
      const deletePayment = vi.fn().mockRejectedValue(new Error('فشل الحذف'));

      const result = await recordContractPayment({
        contract: mockContract,
        formData: {
          amount: 1000,
          date: '2026-03-15',
          paymentMethod: 'bank_transfer',
        },
        createContractPayment: createPayment,
        deleteContractPayment: deletePayment,
        createTransaction: createTx,
      });

      // الخدمة لا تنكسر حتى لو فشل rollback
      expect(result.success).toBe(false);
      expect(deletePayment).toHaveBeenCalledOnce();
    });

    it('يكتشف فشل rollback عندما deleteContractPayment ترجع { error }', async () => {
      const createPayment = makeCreateContractPayment();
      const createTx = makeCreateTransaction(true);
      // deleteContractPayment تنجح تقنياً (resolve) لكن ترجع { error } — نمط DataContext
      const deletePayment = vi.fn().mockResolvedValue({ error: { message: 'فشل الحذف من المخزن' } });

      const result = await recordContractPayment({
        contract: mockContract,
        formData: {
          amount: 1000,
          date: '2026-03-15',
          paymentMethod: 'bank_transfer',
        },
        createContractPayment: createPayment,
        deleteContractPayment: deletePayment,
        createTransaction: createTx,
      });

      // الخدمة لا تنكسر
      expect(result.success).toBe(false);
      // تم محاولة الـ rollback
      expect(deletePayment).toHaveBeenCalledOnce();
      expect(deletePayment).toHaveBeenCalledWith('pay-1');
      // الخطأ الأصلي (فشل الحركة) يُرجع للمستدعي
      expect(result.error?.message).toBe('فشل الحركة');
    });

    it('لا يستدعي rollback إذا نجحت كلا العمليتين', async () => {
      const createPayment = makeCreateContractPayment();
      const createTx = makeCreateTransaction();
      const deletePayment = makeDeleteContractPayment();

      const result = await recordContractPayment({
        contract: mockContract,
        formData: {
          amount: 1000,
          date: '2026-03-15',
          paymentMethod: 'bank_transfer',
        },
        createContractPayment: createPayment,
        deleteContractPayment: deletePayment,
        createTransaction: createTx,
      });

      expect(result.success).toBe(true);
      // لم يتم استدعاء الحذف — لا حاجة لـ rollback
      expect(deletePayment).not.toHaveBeenCalled();
    });
  });
});
