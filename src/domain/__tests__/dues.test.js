import { describe, expect, it } from 'vitest';
import { buildOperationalDues, getExpiringContracts } from '../dues.js';

// ═══════════════════════════════════════
// بيانات اختبار مشتركة
// ═══════════════════════════════════════
const CONTACTS = [
  { id: 'c1', name: 'أحمد المالكي', type: 'tenant' },
  { id: 'c2', name: 'فهد العتيبي', type: 'tenant' },
];

const PROPERTIES = [
  { id: 'p1', name: 'برج النور' },
  { id: 'p2', name: 'فيلا الربيع' },
];

const UNITS = [
  { id: 'u1', name: 'شقة 3', propertyId: 'p1' },
  { id: 'u2', name: 'شقة 7', propertyId: 'p1' },
];

// ═══════════════════════════════════════
// اختبارات buildOperationalDues
// ═══════════════════════════════════════
describe('buildOperationalDues', () => {
  it('يصنف عقد بدون دفعات — كل الأقساط مستحقة أو متأخرة', () => {
    const contracts = [
      {
        id: 'con-1',
        status: 'active',
        contactId: 'c1',
        propertyId: 'p1',
        unitId: 'u1',
        startDate: '2026-01-01',
        endDate: '2026-06-30',
        durationMonths: 6,
        totalAmount: 30000,
        paymentCycle: 'monthly',
        installmentCount: 6,
        contractNumber: 'W-001',
      },
    ];

    // المرجع: 15 مارس 2026 (أحد) — يعني 3 أقساط متأخرة (يناير، فبراير، مارس الأول)
    const ref = new Date('2026-03-15T00:00:00');
    const result = buildOperationalDues({
      contracts,
      contractPayments: [],
      contacts: CONTACTS,
      properties: PROPERTIES,
      units: UNITS,
      referenceDate: ref,
    });

    // يناير + فبراير + مارس (الأول) متأخرة
    expect(result.overdue.length).toBe(3);

    // التحقق من بيانات العنصر
    const first = result.overdue[0];
    expect(first.tenantName).toBe('أحمد المالكي');
    expect(first.propertyName).toBe('برج النور');
    expect(first.unitName).toBe('شقة 3');
    expect(first.contractId).toBe('con-1');
    expect(first.amount).toBe(5000);
    expect(first.remainingAmount).toBe(5000);
    expect(first.daysOverdue).toBeGreaterThan(0);
    expect(first.actionTarget).toBe('/contracts/con-1');
    expect(first.contractNumber).toBe('W-001');

    // الملخص
    expect(result.summary.overdueCount).toBe(3);
    expect(result.summary.overdueTotal).toBe(15000);
  });

  it('يحسب عقد مدفوع جزئياً بشكل صحيح', () => {
    const contracts = [
      {
        id: 'con-2',
        status: 'active',
        contactId: 'c1',
        propertyId: 'p1',
        unitId: 'u1',
        startDate: '2026-01-01',
        endDate: '2026-03-31',
        durationMonths: 3,
        totalAmount: 9000,
        paymentCycle: 'monthly',
        installmentCount: 3,
      },
    ];

    const payments = [
      { id: 'pay-1', contractId: 'con-2', amount: 3000, date: '2026-01-05', dueId: 'con-2-due-1' },
      { id: 'pay-2', contractId: 'con-2', amount: 1500, date: '2026-02-10', dueId: 'con-2-due-2' },
    ];

    // المرجع: 20 مارس — القسط الأول مدفوع، الثاني جزئي متأخر، الثالث متأخر
    const ref = new Date('2026-03-20T00:00:00');
    const result = buildOperationalDues({
      contracts,
      contractPayments: payments,
      contacts: CONTACTS,
      properties: PROPERTIES,
      units: UNITS,
      referenceDate: ref,
    });

    // القسط الأول مدفوع بالكامل — لا يظهر
    // القسط الثاني: جزئي (1500 متبقي) ومتأخر
    // القسط الثالث: 3000 متأخر
    expect(result.overdue.length).toBe(2);

    // القسط الجزئي
    const partial = result.overdue.find((d) => d.installmentNumber === 2);
    expect(partial).toBeTruthy();
    expect(partial.remainingAmount).toBe(1500);
    expect(partial.paidAmount).toBe(1500);
    expect(partial.status).toBe('partial');

    // القسط الثالث
    const third = result.overdue.find((d) => d.installmentNumber === 3);
    expect(third).toBeTruthy();
    expect(third.remainingAmount).toBe(3000);
  });

  it('يحسب عقد متأخر بالكامل — كل الأقساط overdue', () => {
    const contracts = [
      {
        id: 'con-3',
        status: 'active',
        contactId: 'c2',
        propertyId: 'p2',
        startDate: '2025-10-01',
        endDate: '2025-12-31',
        durationMonths: 3,
        totalAmount: 15000,
        paymentCycle: 'monthly',
        installmentCount: 3,
      },
    ];

    const ref = new Date('2026-03-15T00:00:00');
    const result = buildOperationalDues({
      contracts,
      contractPayments: [],
      contacts: CONTACTS,
      properties: PROPERTIES,
      units: UNITS,
      referenceDate: ref,
    });

    expect(result.overdue.length).toBe(3);
    expect(result.summary.overdueTotal).toBe(15000);

    // أكثرها تأخراً أولاً (أكتوبر قبل ديسمبر)
    expect(result.overdue[0].daysOverdue).toBeGreaterThan(result.overdue[2].daysOverdue);
  });

  it('يدعم دفعة موجهة لقسط محدد (dueId)', () => {
    const contracts = [
      {
        id: 'con-4',
        status: 'active',
        contactId: 'c1',
        propertyId: 'p1',
        startDate: '2026-01-01',
        endDate: '2026-03-31',
        durationMonths: 3,
        totalAmount: 9000,
        paymentCycle: 'monthly',
        installmentCount: 3,
      },
    ];

    // دفعة موجهة للقسط الثاني تحديداً
    const payments = [
      { id: 'pay-1', contractId: 'con-4', amount: 3000, date: '2026-01-15', dueId: 'con-4-due-2' },
    ];

    const ref = new Date('2026-03-20T00:00:00');
    const result = buildOperationalDues({
      contracts,
      contractPayments: payments,
      contacts: CONTACTS,
      properties: PROPERTIES,
      units: UNITS,
      referenceDate: ref,
    });

    // القسط الأول: غير مدفوع (متأخر) — 3000
    // القسط الثاني: مدفوع بالكامل — لا يظهر
    // القسط الثالث: غير مدفوع (متأخر) — 3000
    expect(result.overdue.length).toBe(2);
    expect(result.overdue.find((d) => d.installmentNumber === 2)).toBeUndefined();
  });

  it('يدعم عقد بدورة one_time', () => {
    const contracts = [
      {
        id: 'con-5',
        status: 'active',
        contactId: 'c2',
        propertyId: 'p2',
        startDate: '2026-04-01',
        endDate: '2026-04-15',
        durationMonths: 1,
        totalAmount: 50000,
        paymentCycle: 'one_time',
        installmentCount: 1,
      },
    ];

    // المرجع: 1 أبريل — القسط بعد 14 يوم (endDate = 15 أبريل)
    const ref = new Date('2026-04-01T00:00:00');
    const result = buildOperationalDues({
      contracts,
      contractPayments: [],
      contacts: CONTACTS,
      properties: PROPERTIES,
      units: UNITS,
      referenceDate: ref,
    });

    expect(result.overdue.length).toBe(0);
    expect(result.dueToday.length).toBe(0);
    // خلال هذا الأسبوع أو 30 يوم
    const allUpcoming = [...result.dueThisWeek, ...result.dueNext30Days];
    expect(allUpcoming.length).toBe(1);
    expect(allUpcoming[0].amount).toBe(50000);
    expect(allUpcoming[0].tenantName).toBe('فهد العتيبي');
  });

  it('يتجاهل العقود غير النشطة', () => {
    const contracts = [
      {
        id: 'con-6',
        status: 'expired',
        contactId: 'c1',
        propertyId: 'p1',
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        durationMonths: 12,
        totalAmount: 60000,
        paymentCycle: 'monthly',
        installmentCount: 12,
      },
      {
        id: 'con-7',
        status: 'draft',
        contactId: 'c2',
        propertyId: 'p2',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        durationMonths: 12,
        totalAmount: 36000,
        paymentCycle: 'monthly',
        installmentCount: 12,
      },
    ];

    const ref = new Date('2026-03-15T00:00:00');
    const result = buildOperationalDues({
      contracts,
      contractPayments: [],
      contacts: CONTACTS,
      properties: PROPERTIES,
      units: UNITS,
      referenceDate: ref,
    });

    expect(result.summary.totalCount).toBe(0);
  });

  it('يعمل مع بيانات فارغة بدون أخطاء', () => {
    const result = buildOperationalDues({
      contracts: [],
      contractPayments: [],
      contacts: [],
      properties: [],
      units: [],
    });

    expect(result.overdue).toEqual([]);
    expect(result.dueToday).toEqual([]);
    expect(result.dueThisWeek).toEqual([]);
    expect(result.dueNext30Days).toEqual([]);
    expect(result.summary.totalCount).toBe(0);
    expect(result.summary.totalAmount).toBe(0);
  });

  it('يصنف "مستحق اليوم" بشكل صحيح', () => {
    const contracts = [
      {
        id: 'con-today',
        status: 'active',
        contactId: 'c1',
        propertyId: 'p1',
        startDate: '2026-03-15',
        endDate: '2026-04-14',
        durationMonths: 1,
        totalAmount: 5000,
        paymentCycle: 'one_time',
        installmentCount: 1,
      },
    ];

    // تاريخ الاستحقاق = endDate = 2026-04-14, المرجع = نفس اليوم
    const ref = new Date('2026-04-14T00:00:00');
    const result = buildOperationalDues({
      contracts,
      contractPayments: [],
      contacts: CONTACTS,
      properties: PROPERTIES,
      units: UNITS,
      referenceDate: ref,
    });

    expect(result.dueToday.length).toBe(1);
    expect(result.dueToday[0].remainingAmount).toBe(5000);
  });

  // ─── اختبار دعم snake_case الاحترازي ───
  it('يقرأ حقول snake_case بشكل صحيح (توافق Supabase)', () => {
    // عقد بحقول snake_case
    const contracts = [
      {
        id: 'con-snake',
        status: 'active',
        contact_id: 'c1',
        property_id: 'p1',
        unit_id: 'u1',
        startDate: '2026-01-01',
        endDate: '2026-03-31',
        durationMonths: 3,
        totalAmount: 9000,
        paymentCycle: 'monthly',
        installmentCount: 3,
        contract_number: 'SNK-001',
      },
    ];

    // دفعات بحقول snake_case
    const payments = [
      { id: 'ps1', contract_id: 'con-snake', amount: 3000, date: '2026-01-05', dueId: 'con-snake-due-1' },
    ];

    const ref = new Date('2026-03-15T00:00:00');
    const result = buildOperationalDues({
      contracts,
      contractPayments: payments,
      contacts: CONTACTS,
      properties: PROPERTIES,
      units: UNITS,
      referenceDate: ref,
    });

    // الدفعة ربطت بالعقد — القسط الأول مدفوع
    expect(result.overdue.length).toBe(2); // فبراير ومارس فقط
    expect(result.overdue[0].tenantName).toBe('أحمد المالكي');
    expect(result.overdue[0].propertyName).toBe('برج النور');
    expect(result.overdue[0].unitName).toBe('شقة 3');
    expect(result.overdue[0].contractNumber).toBe('SNK-001');
  });

  // ─── اختبار نوافذ الأسبوع التقويمية ───
  it('يستخدم نهاية الأسبوع التقويمية (أحد–سبت) وليس 7 أيام متحركة', () => {
    // المرجع: الخميس 2026-03-12
    // نهاية الأسبوع التقويمية: السبت 2026-03-14 (الأحد 8 مارس + 6 = السبت 14)
    // عقد بقسط يوم السبت 14 مارس — يجب أن يكون "هذا الأسبوع"
    // عقد بقسط يوم الأحد 15 مارس — يجب ألا يكون "هذا الأسبوع"
    const contracts = [
      {
        id: 'con-sat',
        status: 'active',
        contactId: 'c1',
        propertyId: 'p1',
        startDate: '2026-03-14',
        endDate: '2026-03-14',
        totalAmount: 1000,
        paymentCycle: 'one_time',
        installmentCount: 1,
      },
      {
        id: 'con-sun',
        status: 'active',
        contactId: 'c2',
        propertyId: 'p2',
        startDate: '2026-03-15',
        endDate: '2026-03-15',
        totalAmount: 2000,
        paymentCycle: 'one_time',
        installmentCount: 1,
      },
    ];

    const ref = new Date('2026-03-12T00:00:00'); // الخميس
    const result = buildOperationalDues({
      contracts,
      contractPayments: [],
      contacts: CONTACTS,
      properties: PROPERTIES,
      units: UNITS,
      referenceDate: ref,
    });

    // السبت 14 = ضمن هذا الأسبوع (نهاية الأسبوع التقويمية)
    expect(result.dueThisWeek.length).toBe(1);
    expect(result.dueThisWeek[0].contractId).toBe('con-sat');

    // الأحد 15 = خارج هذا الأسبوع — ضمن 30 يوم
    expect(result.dueNext30Days.length).toBe(1);
    expect(result.dueNext30Days[0].contractId).toBe('con-sun');
  });
});

// ═══════════════════════════════════════
// اختبارات getExpiringContracts
// ═══════════════════════════════════════
describe('getExpiringContracts', () => {
  it('يرجع العقود التي تنتهي خلال 30 يوم مع referenceDate ثابت', () => {
    const contracts = [
      {
        id: 'con-exp-1',
        status: 'active',
        contactId: 'c1',
        propertyId: 'p1',
        endDate: '2026-04-10',
        type: 'rent',
        contractNumber: 'EXP-001',
      },
      {
        id: 'con-exp-2',
        status: 'active',
        contactId: 'c2',
        propertyId: 'p2',
        endDate: '2027-01-01',
        type: 'rent',
      },
      {
        id: 'con-exp-3',
        status: 'expired',
        contactId: 'c1',
        propertyId: 'p1',
        endDate: '2026-04-05',
        type: 'rent',
      },
    ];

    // المرجع: 20 مارس 2026
    const ref = new Date('2026-03-20T00:00:00');
    const result = getExpiringContracts({
      contracts,
      contacts: CONTACTS,
      properties: PROPERTIES,
      thresholdDays: 30,
      referenceDate: ref,
    });

    // con-exp-1: ينتهي 10 أبريل = 21 يوم من 20 مارس — ضمن 30 يوم
    expect(result.length).toBe(1);
    expect(result[0].contractId).toBe('con-exp-1');
    expect(result[0].daysRemaining).toBe(21);
    expect(result[0].tenantName).toBe('أحمد المالكي');
    expect(result[0].contractNumber).toBe('EXP-001');

    // expired لا يظهر
    const expiredIncluded = result.find((r) => r.contractId === 'con-exp-3');
    expect(expiredIncluded).toBeUndefined();

    // con-exp-2 بعيد جداً (يناير 2027) — لا يظهر
    const farIncluded = result.find((r) => r.contractId === 'con-exp-2');
    expect(farIncluded).toBeUndefined();
  });

  it('يرتب الأقرب انتهاءً أولاً', () => {
    const contracts = [
      {
        id: 'far',
        status: 'active',
        contactId: 'c2',
        propertyId: 'p2',
        endDate: '2026-04-05',
        type: 'rent',
      },
      {
        id: 'near',
        status: 'active',
        contactId: 'c1',
        propertyId: 'p1',
        endDate: '2026-03-25',
        type: 'rent',
      },
    ];

    const ref = new Date('2026-03-20T00:00:00');
    const result = getExpiringContracts({
      contracts,
      contacts: CONTACTS,
      properties: PROPERTIES,
      thresholdDays: 30,
      referenceDate: ref,
    });

    expect(result.length).toBe(2);
    expect(result[0].contractId).toBe('near'); // 5 أيام
    expect(result[0].daysRemaining).toBe(5);
    expect(result[1].contractId).toBe('far'); // 16 يوم
    expect(result[1].daysRemaining).toBe(16);
  });

  it('يدعم حقول snake_case (توافق Supabase)', () => {
    const contracts = [
      {
        id: 'con-snake-exp',
        status: 'active',
        contact_id: 'c1',
        property_id: 'p1',
        end_date: '2026-04-01',
        type: 'rent',
        contract_number: 'SNK-EXP',
      },
    ];

    const ref = new Date('2026-03-20T00:00:00');
    const result = getExpiringContracts({
      contracts,
      contacts: CONTACTS,
      properties: PROPERTIES,
      thresholdDays: 30,
      referenceDate: ref,
    });

    expect(result.length).toBe(1);
    expect(result[0].tenantName).toBe('أحمد المالكي');
    expect(result[0].propertyName).toBe('برج النور');
    expect(result[0].contractNumber).toBe('SNK-EXP');
    expect(result[0].daysRemaining).toBe(12);
  });

  it('يستبعد عقود منتهية بالفعل (daysRemaining <= 0)', () => {
    const contracts = [
      {
        id: 'already-expired',
        status: 'active', // لم يُحدَّث الحالة بعد
        contactId: 'c1',
        propertyId: 'p1',
        endDate: '2026-03-15',
        type: 'rent',
      },
    ];

    const ref = new Date('2026-03-20T00:00:00');
    const result = getExpiringContracts({
      contracts,
      contacts: CONTACTS,
      properties: PROPERTIES,
      thresholdDays: 30,
      referenceDate: ref,
    });

    expect(result.length).toBe(0);
  });
});
