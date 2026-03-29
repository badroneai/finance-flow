// اختبارات نموذج سند القبض
import { describe, it, expect } from 'vitest';
import {
  generateReceiptNumber,
  buildReceiptModel,
  buildReceiptFromDue,
} from '../receipt.js';

// --- generateReceiptNumber ---
describe('generateReceiptNumber', () => {
  it('ينتج الصيغة RCP-YYYYMMDD-XXXX', () => {
    const num = generateReceiptNumber('2025-03-15');
    expect(num).toMatch(/^RCP-20250315-[A-Z0-9]{4}$/);
  });

  it('يستخدم التاريخ الحالي عند عدم التمرير', () => {
    const num = generateReceiptNumber();
    const todayStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    expect(num).toMatch(new RegExp(`^RCP-${todayStr}-[A-Z0-9]{4}$`));
  });

  it('يولد أرقام مختلفة عند الاستدعاء المتكرر', () => {
    const nums = new Set(Array.from({ length: 20 }, () => generateReceiptNumber('2025-01-01')));
    // قد تتكرر نظرياً لكن احتمال تكرار 20 من 36^4 ضئيل جداً
    expect(nums.size).toBeGreaterThan(1);
  });
});

// --- buildReceiptModel ---
describe('buildReceiptModel', () => {
  const contract = {
    id: 'c-1',
    contractNumber: 'CNT-001',
    type: 'rent',
  };
  const formData = {
    amount: '1500',
    date: '2025-06-01',
    paymentMethod: 'bank_transfer',
    dueId: 'due-1',
    note: 'سداد كامل',
  };

  it('يبني نموذج إيصال كامل بكل الحقول', () => {
    const receipt = buildReceiptModel({
      contract,
      formData,
      tenantName: 'أحمد',
      propertyName: 'برج السلام',
      unitName: 'شقة 5',
      officeName: 'مكتبي',
      installmentNumber: '3',
    });

    expect(receipt).not.toBeNull();
    expect(receipt.receiptNumber).toMatch(/^RCP-20250601-/);
    expect(receipt.issueDate).toBe('2025-06-01');
    expect(receipt.officeName).toBe('مكتبي');
    expect(receipt.tenantName).toBe('أحمد');
    expect(receipt.contractId).toBe('c-1');
    expect(receipt.contractNumber).toBe('CNT-001');
    expect(receipt.contractType).toBe('rent');
    expect(receipt.propertyName).toBe('برج السلام');
    expect(receipt.unitName).toBe('شقة 5');
    expect(receipt.amount).toBe(1500);
    expect(receipt.paymentMethod).toBe('bank_transfer');
    expect(receipt.paymentMethodLabel).toBe('تحويل بنكي');
    expect(receipt.dueId).toBe('due-1');
    expect(receipt.installmentNumber).toBe('3');
    expect(receipt.note).toBe('سداد كامل');
    expect(receipt.createdAt).toBeTruthy();
  });

  it('يرجع null عند عدم تمرير contract', () => {
    expect(buildReceiptModel({ contract: null, formData })).toBeNull();
  });

  it('يرجع null عند عدم تمرير formData', () => {
    expect(buildReceiptModel({ contract, formData: null })).toBeNull();
  });

  it('يستخدم اسم المكتب الافتراضي عند عدم التمرير', () => {
    const receipt = buildReceiptModel({ contract, formData });
    expect(receipt.officeName).toBe('قيد العقار');
  });

  it('يحول المبلغ النصي إلى رقم', () => {
    const receipt = buildReceiptModel({
      contract,
      formData: { ...formData, amount: '2500.50' },
    });
    expect(receipt.amount).toBe(2500.5);
  });

  it('يعالج طريقة الدفع النقدي', () => {
    const receipt = buildReceiptModel({
      contract,
      formData: { ...formData, paymentMethod: 'cash' },
    });
    expect(receipt.paymentMethodLabel).toBe('نقدي');
  });

  it('يستخدم تحويل بنكي كقيمة افتراضية لطريقة دفع غير معروفة', () => {
    const receipt = buildReceiptModel({
      contract,
      formData: { ...formData, paymentMethod: 'unknown' },
    });
    expect(receipt.paymentMethodLabel).toBe('تحويل بنكي');
  });

  it('يقبل رقم إيصال مخصص', () => {
    const receipt = buildReceiptModel({
      contract,
      formData,
      receiptNumber: 'CUSTOM-001',
    });
    expect(receipt.receiptNumber).toBe('CUSTOM-001');
  });

  it('يقرأ contractNumber من contract_number (snake_case)', () => {
    const c = { id: 'c-2', contract_number: 'SNK-99' };
    const receipt = buildReceiptModel({ contract: c, formData });
    expect(receipt.contractNumber).toBe('SNK-99');
  });

  it('يزيل المسافات من الملاحظة', () => {
    const receipt = buildReceiptModel({
      contract,
      formData: { ...formData, note: '  ملاحظة مهمة  ' },
    });
    expect(receipt.note).toBe('ملاحظة مهمة');
  });

  it('يتعامل مع ملاحظة فارغة', () => {
    const receipt = buildReceiptModel({
      contract,
      formData: { ...formData, note: '' },
    });
    expect(receipt.note).toBe('');
  });

  it('يتعامل مع ملاحظة undefined', () => {
    const receipt = buildReceiptModel({
      contract,
      formData: { ...formData, note: undefined },
    });
    expect(receipt.note).toBe('');
  });

  it('يملأ الحقول الاختيارية بقيم فارغة عند عدم التمرير', () => {
    const receipt = buildReceiptModel({ contract, formData });
    expect(receipt.tenantName).toBe('');
    expect(receipt.propertyName).toBe('');
    expect(receipt.unitName).toBe('');
    expect(receipt.installmentNumber).toBe('');
  });
});

// --- buildReceiptFromDue ---
describe('buildReceiptFromDue', () => {
  const dueItem = {
    tenantName: 'سعد',
    propertyName: 'عمارة النور',
    unitName: 'محل 2',
    installmentNumber: 5,
    contractId: 'c-3',
  };
  const contract = {
    id: 'c-3',
    contractNumber: 'CNT-050',
    type: 'commercial',
  };
  const formData = {
    amount: '3000',
    date: '2025-07-10',
    paymentMethod: 'check',
    dueId: 'due-5',
    note: '',
  };

  it('يبني إيصال من عنصر مستحق', () => {
    const receipt = buildReceiptFromDue({ dueItem, contract, formData });

    expect(receipt).not.toBeNull();
    expect(receipt.tenantName).toBe('سعد');
    expect(receipt.propertyName).toBe('عمارة النور');
    expect(receipt.unitName).toBe('محل 2');
    expect(receipt.installmentNumber).toBe('5');
    expect(receipt.contractNumber).toBe('CNT-050');
    expect(receipt.amount).toBe(3000);
    expect(receipt.paymentMethodLabel).toBe('شيك');
  });

  it('يرجع null عند عدم تمرير dueItem', () => {
    expect(buildReceiptFromDue({ dueItem: null, contract, formData })).toBeNull();
  });

  it('يرجع null عند عدم تمرير contract', () => {
    expect(buildReceiptFromDue({ dueItem, contract: null, formData })).toBeNull();
  });

  it('يمرر اسم المكتب المخصص', () => {
    const receipt = buildReceiptFromDue({
      dueItem,
      contract,
      formData,
      officeName: 'مكتب الأمانة',
    });
    expect(receipt.officeName).toBe('مكتب الأمانة');
  });

  it('يحول installmentNumber الرقمي إلى نص', () => {
    const receipt = buildReceiptFromDue({ dueItem, contract, formData });
    expect(typeof receipt.installmentNumber).toBe('string');
  });

  it('يتعامل مع installmentNumber مفقود', () => {
    const due = { ...dueItem, installmentNumber: undefined };
    const receipt = buildReceiptFromDue({ dueItem: due, contract, formData });
    expect(receipt.installmentNumber).toBe('');
  });
});
