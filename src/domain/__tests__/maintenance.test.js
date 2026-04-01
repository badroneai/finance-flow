import { describe, it, expect } from 'vitest';
import {
  createMaintenanceRequest,
  validateMaintenanceRequest,
  canTransitionMaintenance,
  transitionMaintenance,
  createMaintenanceUpdate,
  createMaintenanceCost,
  computeMaintenanceSummary,
  isMaintenanceClosed,
  isMaintenanceOverdue,
  getAllowedTransitions,
} from '../maintenance.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** يبني طلب صيانة جاهز للاختبار */
function makeRequest(overrides = {}) {
  return {
    propertyId: 'prop-001',
    unitId: null,
    contractId: null,
    title: 'تسرب مياه في المطبخ',
    description: null,
    status: 'open',
    priority: 'high',
    category: 'plumbing',
    reportedById: null,
    assignedToId: null,
    assignedToName: null,
    reportedAt: '2026-03-01',
    scheduledDate: null,
    holdReason: null,
    resolvedAt: null,
    closedAt: null,
    closureType: null,
    cancellationNote: null,
    reopenReason: null,
    notes: null,
    ...overrides,
  };
}

/** ينقل الطلب عبر سلسلة انتقالات بدون توقف */
function chainTransitions(request, steps, now = new Date('2026-03-29')) {
  let current = request;
  for (const { status, context } of steps) {
    const { request: next, errors } = transitionMaintenance(current, status, context, now);
    if (!next) throw new Error(`فشل الانتقال إلى ${status}: ${errors.join(', ')}`);
    current = next;
  }
  return current;
}

// ─── 1. createMaintenanceRequest ─────────────────────────────────────────────

describe('createMaintenanceRequest', () => {
  it('1. ينشئ طلب صالح بحالة open افتراضياً', () => {
    const { request, errors } = createMaintenanceRequest({
      propertyId: 'prop-001',
      title: 'تسرب مياه',
      category: 'plumbing',
      priority: 'high',
    });
    expect(errors).toHaveLength(0);
    expect(request).not.toBeNull();
    expect(request.status).toBe('open');
    expect(request.title).toBe('تسرب مياه');
    expect(request.propertyId).toBe('prop-001');
  });

  it('يُجبر الحالة على open حتى لو مُرِّر status مختلف', () => {
    const { request } = createMaintenanceRequest({
      propertyId: 'prop-001',
      title: 'عطل كهربائي',
      category: 'electrical',
      priority: 'medium',
      status: 'in_progress', // يجب تجاهله
    });
    expect(request?.status).toBe('open');
  });

  it('2. يرفض إنشاء طلب بدون propertyId', () => {
    const { request, errors } = createMaintenanceRequest({
      title: 'تسرب مياه',
      category: 'plumbing',
      priority: 'medium',
    });
    expect(request).toBeNull();
    expect(errors.some((e) => e.includes('العقار'))).toBe(true);
  });

  it('3. يرفض إنشاء طلب بدون title', () => {
    const { request, errors } = createMaintenanceRequest({
      propertyId: 'prop-001',
      category: 'electrical',
      priority: 'medium',
    });
    expect(request).toBeNull();
    expect(errors.some((e) => e.includes('عنوان'))).toBe(true);
  });

  it('يرفض title أطول من 200 حرف', () => {
    const { request, errors } = createMaintenanceRequest({
      propertyId: 'prop-001',
      title: 'أ'.repeat(201),
      category: 'plumbing',
      priority: 'low',
    });
    expect(request).toBeNull();
    expect(errors.some((e) => e.includes('200'))).toBe(true);
  });
});

// ─── 2. validateMaintenanceRequest — assigned ────────────────────────────────

describe('validateMaintenanceRequest — حالة assigned', () => {
  it('4. يرفض assigned بدون assignedToId أو assignedToName', () => {
    const { valid, errors } = validateMaintenanceRequest({
      propertyId: 'prop-001',
      title: 'عطل كهربائي',
      category: 'electrical',
      priority: 'medium',
      status: 'assigned',
      assignedToId: null,
      assignedToName: '   ', // فراغات فقط = فارغ
    });
    expect(valid).toBe(false);
    expect(errors.some((e) => e.includes('الإسناد'))).toBe(true);
  });

  it('يقبل assigned مع assignedToName نص حر', () => {
    const { valid } = validateMaintenanceRequest({
      propertyId: 'prop-001',
      title: 'عطل',
      category: 'electrical',
      priority: 'medium',
      status: 'assigned',
      assignedToId: null,
      assignedToName: 'محمد السباك',
    });
    expect(valid).toBe(true);
  });

  it('يقبل assigned مع assignedToId فقط', () => {
    const { valid } = validateMaintenanceRequest({
      propertyId: 'prop-001',
      title: 'عطل',
      category: 'electrical',
      priority: 'medium',
      status: 'assigned',
      assignedToId: 'contact-001',
      assignedToName: null,
    });
    expect(valid).toBe(true);
  });
});

// ─── 3. canTransitionMaintenance ────────────────────────────────────────────

describe('canTransitionMaintenance — الانتقالات المسموحة', () => {
  it('5. يسمح open -> in_progress بدون حقول إضافية', () => {
    const { allowed } = canTransitionMaintenance('open', 'in_progress');
    expect(allowed).toBe(true);
  });

  it('6. يمنع open -> resolved', () => {
    const { allowed } = canTransitionMaintenance('open', 'resolved');
    expect(allowed).toBe(false);
  });

  it('يمنع open -> on_hold بدون holdReason', () => {
    const { allowed } = canTransitionMaintenance('open', 'on_hold');
    expect(allowed).toBe(false);
  });

  it('يمنع in_progress -> assigned (رجوع للوراء)', () => {
    const { allowed } = canTransitionMaintenance('in_progress', 'assigned');
    expect(allowed).toBe(false);
  });

  it('يسمح assigned -> open (إلغاء إسناد)', () => {
    const { allowed } = canTransitionMaintenance('assigned', 'open');
    expect(allowed).toBe(true);
  });

  it('يسمح on_hold -> in_progress', () => {
    const { allowed } = canTransitionMaintenance('on_hold', 'in_progress');
    expect(allowed).toBe(true);
  });

  it('يمنع on_hold -> assigned (رجوع غير منطقي)', () => {
    const { allowed } = canTransitionMaintenance('on_hold', 'assigned');
    expect(allowed).toBe(false);
  });
});

describe('canTransitionMaintenance — الإغلاق', () => {
  it('7. يسمح resolved -> closed مع closureType: completed', () => {
    const { allowed } = canTransitionMaintenance('resolved', 'closed', {
      closureType: 'completed',
    });
    expect(allowed).toBe(true);
  });

  it('8. يمنع resolved -> closed بدون closureType', () => {
    const { allowed } = canTransitionMaintenance('resolved', 'closed', {});
    expect(allowed).toBe(false);
  });

  it('9. يسمح open -> closed كـ cancelled مع cancellationNote', () => {
    const { allowed } = canTransitionMaintenance('open', 'closed', {
      closureType: 'cancelled',
      cancellationNote: 'ألغاه المالك',
    });
    expect(allowed).toBe(true);
  });

  it('9. يمنع open -> closed كـ completed (يتطلب resolved أولاً)', () => {
    const { allowed, reason } = canTransitionMaintenance('open', 'closed', {
      closureType: 'completed',
    });
    expect(allowed).toBe(false);
    expect(reason).toContain('محلول');
  });

  it('يمنع cancelled بدون cancellationNote', () => {
    const { allowed } = canTransitionMaintenance('in_progress', 'closed', {
      closureType: 'cancelled',
      cancellationNote: '',
    });
    expect(allowed).toBe(false);
  });

  it('يمنع resolved -> on_hold (رجوع للوراء بعد الحل)', () => {
    const { allowed } = canTransitionMaintenance('resolved', 'on_hold');
    expect(allowed).toBe(false);
  });
});

describe('canTransitionMaintenance — reopened', () => {
  it('11. يسمح closed -> reopened مع reopenReason', () => {
    const { allowed } = canTransitionMaintenance('closed', 'reopened', {
      reopenReason: 'المشكلة عادت',
    });
    expect(allowed).toBe(true);
  });

  it('يمنع closed -> reopened بدون reopenReason', () => {
    const { allowed } = canTransitionMaintenance('closed', 'reopened', {});
    expect(allowed).toBe(false);
  });

  it('12. يمنع reopened -> closed مباشرة', () => {
    const { allowed } = canTransitionMaintenance('reopened', 'closed', {
      closureType: 'completed',
    });
    expect(allowed).toBe(false);
  });

  it('يسمح reopened -> in_progress فقط', () => {
    expect(getAllowedTransitions('reopened')).toEqual(['in_progress']);
  });
});

// ─── 4. transitionMaintenance ────────────────────────────────────────────────

describe('transitionMaintenance — تحديث الحقول', () => {
  const now = new Date('2026-03-29');

  it('يضبط resolvedAt عند resolved', () => {
    const req = makeRequest({ status: 'in_progress' });
    const { request } = transitionMaintenance(req, 'resolved', {}, now);
    expect(request?.resolvedAt).toBe('2026-03-29');
  });

  it('يضبط closedAt و closureType عند closed', () => {
    const req = makeRequest({ status: 'resolved', resolvedAt: '2026-03-20' });
    const { request } = transitionMaintenance(req, 'closed', { closureType: 'completed' }, now);
    expect(request?.closedAt).toBe('2026-03-29');
    expect(request?.closureType).toBe('completed');
  });

  it('يُصفّر حقول الإغلاق عند reopened', () => {
    const req = makeRequest({
      status: 'closed',
      closedAt: '2026-03-20',
      closureType: 'completed',
      resolvedAt: '2026-03-18',
    });
    const { request } = transitionMaintenance(req, 'reopened', {
      reopenReason: 'المشكلة لم تُحل',
    }, now);
    expect(request?.status).toBe('reopened');
    expect(request?.closedAt).toBeNull();
    expect(request?.resolvedAt).toBeNull();
    expect(request?.closureType).toBeNull();
    expect(request?.reopenReason).toBe('المشكلة لم تُحل');
  });

  it('يُلغي الإسناد عند العودة لـ open', () => {
    const req = makeRequest({ status: 'assigned', assignedToId: 'c-001', assignedToName: 'محمد' });
    const { request } = transitionMaintenance(req, 'open', {}, now);
    expect(request?.assignedToId).toBeNull();
    expect(request?.assignedToName).toBeNull();
  });

  it('يُرجع error عند انتقال ممنوع', () => {
    const req = makeRequest({ status: 'open' });
    const { request, errors } = transitionMaintenance(req, 'resolved', {}, now);
    expect(request).toBeNull();
    expect(errors.length).toBeGreaterThan(0);
  });
});

// ─── 5. createMaintenanceCost ────────────────────────────────────────────────

describe('createMaintenanceCost', () => {
  it('10. يمنع إضافة تكلفة على طلب مغلق (object)', () => {
    const closedReq = makeRequest({ status: 'closed' });
    const { cost, errors } = createMaintenanceCost(
      { maintenanceId: 'req-001', amount: 500, paidBy: 'owner', date: '2026-03-15' },
      closedReq
    );
    expect(cost).toBeNull();
    expect(errors.some((e) => e.includes('مغلق'))).toBe(true);
  });

  it('10. يمنع إضافة تكلفة على طلب مغلق (string status)', () => {
    const { cost, errors } = createMaintenanceCost(
      { maintenanceId: 'req-001', amount: 300, paidBy: 'tenant', date: '2026-03-15' },
      'closed'
    );
    expect(cost).toBeNull();
    expect(errors.some((e) => e.includes('مغلق'))).toBe(true);
  });

  it('15. يمنع amount === 0', () => {
    const { cost, errors } = createMaintenanceCost(
      { maintenanceId: 'req-001', amount: 0, paidBy: 'owner', date: '2026-03-15' },
      makeRequest({ status: 'in_progress' })
    );
    expect(cost).toBeNull();
    expect(errors.some((e) => e.includes('موجباً'))).toBe(true);
  });

  it('15. يمنع amount سالب', () => {
    const { cost, errors } = createMaintenanceCost(
      { maintenanceId: 'req-001', amount: -100, paidBy: 'owner', date: '2026-03-15' },
      'in_progress'
    );
    expect(cost).toBeNull();
    expect(errors.some((e) => e.includes('موجباً'))).toBe(true);
  });

  it('يُنشئ تكلفة صالحة على طلب مفتوح', () => {
    const { cost, errors } = createMaintenanceCost(
      { maintenanceId: 'req-001', amount: 750, paidBy: 'owner', date: '2026-03-15' },
      makeRequest({ status: 'in_progress' })
    );
    expect(errors).toHaveLength(0);
    expect(cost?.amount).toBe(750);
    expect(cost?.paidBy).toBe('owner');
  });
});

// ─── 6. computeMaintenanceSummary ────────────────────────────────────────────

describe('computeMaintenanceSummary', () => {
  it('13. يحسب totalCost بشكل صحيح', () => {
    const req = makeRequest({ status: 'in_progress', reportedAt: '2026-03-01' });
    const costs = [
      { amount: 300, paidBy: 'owner' },
      { amount: 150, paidBy: 'tenant' },
      { amount: 50.5, paidBy: 'office' },
    ];
    const { totalCost } = computeMaintenanceSummary(req, [], costs, new Date('2026-03-29'));
    expect(totalCost).toBeCloseTo(500.5);
  });

  it('يُرجع totalCost = 0 بدون تكاليف', () => {
    const req = makeRequest({ reportedAt: '2026-03-01' });
    const { totalCost } = computeMaintenanceSummary(req, [], [], new Date('2026-03-29'));
    expect(totalCost).toBe(0);
  });

  it('14. يحسب isOverdue = true عند تجاوز الموعد', () => {
    const req = makeRequest({
      status: 'in_progress',
      scheduledDate: '2026-03-10',
      reportedAt: '2026-03-01',
    });
    const { isOverdue } = computeMaintenanceSummary(req, [], [], new Date('2026-03-29'));
    expect(isOverdue).toBe(true);
  });

  it('14. يحسب isOverdue = false لموعد مستقبلي', () => {
    const req = makeRequest({
      status: 'in_progress',
      scheduledDate: '2026-04-10',
      reportedAt: '2026-03-01',
    });
    const { isOverdue } = computeMaintenanceSummary(req, [], [], new Date('2026-03-29'));
    expect(isOverdue).toBe(false);
  });

  it('14. يحسب isOverdue = false للطلب المغلق حتى لو الموعد فات', () => {
    const req = makeRequest({
      status: 'closed',
      scheduledDate: '2026-01-01',
      reportedAt: '2025-12-01',
    });
    const { isOverdue } = computeMaintenanceSummary(req, [], [], new Date('2026-03-29'));
    expect(isOverdue).toBe(false);
  });

  it('يحسب daysOpen بشكل صحيح', () => {
    const req = makeRequest({ reportedAt: '2026-03-01' });
    const { daysOpen } = computeMaintenanceSummary(req, [], [], new Date('2026-03-29'));
    expect(daysOpen).toBe(28);
  });

  it('يحسب updatesCount بشكل صحيح', () => {
    const req = makeRequest();
    const updates = [{ type: 'note', note: 'زيارة' }, { type: 'visit', note: 'تفقد' }];
    const { updatesCount } = computeMaintenanceSummary(req, updates, [], new Date());
    expect(updatesCount).toBe(2);
  });
});

// ─── 7. isMaintenanceClosed & isMaintenanceOverdue ───────────────────────────

describe('isMaintenanceClosed', () => {
  it('يُرجع true للطلب المغلق', () => {
    expect(isMaintenanceClosed(makeRequest({ status: 'closed' }))).toBe(true);
  });
  it('يُرجع false لأي حالة أخرى', () => {
    ['open', 'assigned', 'in_progress', 'on_hold', 'resolved', 'reopened'].forEach((s) => {
      expect(isMaintenanceClosed(makeRequest({ status: s }))).toBe(false);
    });
  });
});

describe('isMaintenanceOverdue', () => {
  const now = new Date('2026-03-29');
  it('يُرجع true لطلب متأخر عن موعده', () => {
    const req = makeRequest({ status: 'in_progress', scheduledDate: '2026-03-10' });
    expect(isMaintenanceOverdue(req, now)).toBe(true);
  });
  it('يُرجع false لطلب موعده لم يحن', () => {
    const req = makeRequest({ status: 'in_progress', scheduledDate: '2026-04-10' });
    expect(isMaintenanceOverdue(req, now)).toBe(false);
  });
  it('يُرجع false للطلب المغلق حتى لو الموعد فات', () => {
    const req = makeRequest({ status: 'closed', scheduledDate: '2026-01-01' });
    expect(isMaintenanceOverdue(req, now)).toBe(false);
  });
  it('يُرجع false إذا لا يوجد scheduledDate', () => {
    const req = makeRequest({ status: 'in_progress', scheduledDate: null });
    expect(isMaintenanceOverdue(req, now)).toBe(false);
  });
});

// ─── 8. سيناريوهات تكاملية ────────────────────────────────────────────────────

describe('سيناريوهات تكاملية', () => {
  const now = new Date('2026-03-29');

  it('دورة كاملة: open → assigned → in_progress → resolved → closed', () => {
    const { request: base } = createMaintenanceRequest({
      propertyId: 'prop-001',
      title: 'عطل تكييف',
      category: 'hvac',
      priority: 'high',
    });

    const closed = chainTransitions(base, [
      { status: 'assigned', context: { assignedToName: 'فني التكييف' } },
      { status: 'in_progress', context: {} },
      { status: 'resolved', context: {} },
      { status: 'closed', context: { closureType: 'completed' } },
    ], now);

    expect(closed.status).toBe('closed');
    expect(closed.closureType).toBe('completed');
    expect(closed.closedAt).toBe('2026-03-29');
    // resolvedAt يُحفظ عند resolved ولا يُصفَّر عند closed — هذا سجل تاريخي
    expect(closed.resolvedAt).toBe('2026-03-29');
  });

  it('دورة إلغاء: open → in_progress → closed(cancelled)', () => {
    const { request: base } = createMaintenanceRequest({
      propertyId: 'prop-002',
      title: 'تسرب خفيف',
      category: 'plumbing',
      priority: 'low',
    });

    const cancelled = chainTransitions(base, [
      { status: 'in_progress', context: {} },
      {
        status: 'closed',
        context: { closureType: 'cancelled', cancellationNote: 'تم إلغاؤه من المالك' },
      },
    ], now);

    expect(cancelled.status).toBe('closed');
    expect(cancelled.closureType).toBe('cancelled');
    expect(cancelled.cancellationNote).toBe('تم إلغاؤه من المالك');
  });

  it('دورة إعادة فتح: closed → reopened → in_progress → resolved → closed', () => {
    const base = makeRequest({ status: 'closed', closureType: 'completed', closedAt: '2026-03-20' });

    const reclosed = chainTransitions(base, [
      { status: 'reopened', context: { reopenReason: 'التسرب عاد' } },
      { status: 'in_progress', context: {} },
      { status: 'resolved', context: {} },
      { status: 'closed', context: { closureType: 'completed' } },
    ], now);

    expect(reclosed.status).toBe('closed');
    expect(reclosed.reopenReason).toBe('التسرب عاد');
  });

  it('createMaintenanceUpdate يُنشئ تحديثاً صالحاً', () => {
    const { update, errors } = createMaintenanceUpdate({
      maintenanceId: 'req-001',
      type: 'visit',
      note: 'زيارة الفني اليوم',
      previousStatus: 'assigned',
      newStatus: 'in_progress',
    });
    expect(errors).toHaveLength(0);
    expect(update?.type).toBe('visit');
    expect(update?.note).toBe('زيارة الفني اليوم');
  });

  it('createMaintenanceUpdate يرفض note فارغ', () => {
    const { update, errors } = createMaintenanceUpdate({
      maintenanceId: 'req-001',
      type: 'note',
      note: '   ',
    });
    expect(update).toBeNull();
    expect(errors.length).toBeGreaterThan(0);
  });
});

// ─── 9. التحقق عبر refs ───────────────────────────────────────────────────────

describe('validateMaintenanceRequest — refs', () => {
  it('يرفض unitId من عقار مختلف', () => {
    const refs = {
      units: [{ id: 'unit-001', propertyId: 'prop-999' }],
    };
    const { valid, errors } = validateMaintenanceRequest(
      {
        propertyId: 'prop-001',
        title: 'عطل',
        category: 'electrical',
        priority: 'medium',
        status: 'open',
        unitId: 'unit-001',
      },
      refs
    );
    expect(valid).toBe(false);
    expect(errors.some((e) => e.includes('الوحدة'))).toBe(true);
  });

  it('يقبل unitId من نفس العقار', () => {
    const refs = {
      units: [{ id: 'unit-001', propertyId: 'prop-001' }],
    };
    const { valid } = validateMaintenanceRequest(
      {
        propertyId: 'prop-001',
        title: 'عطل',
        category: 'electrical',
        priority: 'medium',
        status: 'open',
        unitId: 'unit-001',
      },
      refs
    );
    expect(valid).toBe(true);
  });
});
