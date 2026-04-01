// منطق الصيانة والمتابعة — دوال نقية بدون React أو side effects
// النموذج التشغيلي المُجمَّد: SPR-020

// ─── Constants ───────────────────────────────────────────────────────────────

/** حالات طلب الصيانة */
export const MAINTENANCE_STATUSES = {
  open: 'مفتوح',
  assigned: 'مُسند',
  in_progress: 'جارٍ',
  on_hold: 'موقوف',
  resolved: 'محلول',
  closed: 'مغلق',
  reopened: 'مُعاد فتحه',
};

/** أولويات طلب الصيانة */
export const MAINTENANCE_PRIORITIES = {
  urgent: 'طارئ',
  high: 'عالي',
  medium: 'متوسط',
  low: 'منخفض',
};

/** تصنيفات الصيانة */
export const MAINTENANCE_CATEGORIES = {
  plumbing: 'سباكة',
  electrical: 'كهرباء',
  hvac: 'تكييف',
  structural: 'هيكلي',
  painting: 'دهانات',
  cleaning: 'نظافة',
  appliances: 'أجهزة',
  other: 'أخرى',
};

/** أنواع إغلاق الطلب */
export const CLOSURE_TYPES = {
  completed: 'منجز',
  cancelled: 'ملغي',
};

/** أنواع تحديثات timeline الطلب */
export const UPDATE_TYPES = {
  status_change: 'تغيير حالة',
  note: 'ملاحظة',
  visit: 'زيارة',
  cost_added: 'تكلفة مضافة',
  reopened: 'إعادة فتح',
  closed: 'إغلاق',
};

/** جهات دفع تكلفة الصيانة */
export const COST_PAYERS = {
  office: 'المكتب',
  owner: 'المالك',
  tenant: 'المستأجر',
};

// ─── Transition Map ───────────────────────────────────────────────────────────

/**
 * خريطة الانتقالات المسموحة — المُجمَّدة من النموذج التشغيلي
 * open → assigned | in_progress | closed(cancelled)
 * assigned → in_progress | on_hold | open | closed(cancelled)
 * in_progress → on_hold | resolved | closed(cancelled)
 * on_hold → in_progress | closed(cancelled)
 * resolved → closed(completed) | reopened
 * closed → reopened
 * reopened → in_progress
 */
const ALLOWED_TRANSITIONS = {
  open: ['assigned', 'in_progress', 'closed'],
  assigned: ['in_progress', 'on_hold', 'open', 'closed'],
  in_progress: ['on_hold', 'resolved', 'closed'],
  on_hold: ['in_progress', 'closed'],
  resolved: ['closed', 'reopened'],
  closed: ['reopened'],
  reopened: ['in_progress'],
};

// الحالات التي يُسمح إغلاقها كـ cancelled فقط (وليس completed)
const CANCELLABLE_STATUSES = new Set(['open', 'assigned', 'in_progress', 'on_hold']);

// ─── Default Shape ────────────────────────────────────────────────────────────

/**
 * يُنشئ شكل طلب صيانة افتراضي فارغ
 * @param {string} [propertyId]
 * @returns {Object}
 */
export function defaultMaintenanceRequest(propertyId = '') {
  return {
    propertyId,
    unitId: null,
    contractId: null,
    title: '',
    description: null,
    status: 'open',
    priority: 'medium',
    category: 'other',
    reportedById: null,
    assignedToId: null,
    assignedToName: null,
    reportedAt: new Date().toISOString().split('T')[0],
    scheduledDate: null,
    holdReason: null,
    resolvedAt: null,
    closedAt: null,
    closureType: null,
    cancellationNote: null,
    reopenReason: null,
    notes: null,
  };
}

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * يتحقق من صحة بيانات طلب الصيانة
 * @param {Object} input - بيانات الطلب
 * @param {Object} [refs] - مراجع اختيارية { units: [], contracts: [] }
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateMaintenanceRequest(input, refs = {}) {
  const errors = [];

  // الحقول الإلزامية الأساسية
  if (!input?.propertyId) errors.push('معرف العقار مطلوب');

  const title = String(input?.title ?? '').trim();
  if (!title) errors.push('عنوان الطلب مطلوب');
  if (title.length > 200) errors.push('عنوان الطلب لا يتجاوز 200 حرف');

  if (!MAINTENANCE_CATEGORIES[input?.category]) errors.push('تصنيف الصيانة غير صالح');
  if (!MAINTENANCE_PRIORITIES[input?.priority]) errors.push('أولوية الطلب غير صالحة');
  if (!MAINTENANCE_STATUSES[input?.status]) errors.push('حالة الطلب غير صالحة');

  // قواعد خاصة بكل حالة
  const status = input?.status;

  if (status === 'assigned') {
    const hasId = Boolean(input?.assignedToId);
    const hasName = Boolean(String(input?.assignedToName ?? '').trim());
    if (!hasId && !hasName) errors.push('الإسناد يتطلب معرف المورد أو اسمه');
  }

  if (status === 'on_hold') {
    if (!String(input?.holdReason ?? '').trim()) errors.push('سبب الإيقاف مطلوب عند حالة موقوف');
  }

  if (status === 'closed') {
    if (!CLOSURE_TYPES[input?.closureType]) errors.push('نوع الإغلاق مطلوب (completed أو cancelled)');
    if (input?.closureType === 'cancelled' && !String(input?.cancellationNote ?? '').trim()) {
      errors.push('ملاحظة الإلغاء مطلوبة عند إغلاق الطلب كملغي');
    }
  }

  if (status === 'reopened') {
    if (!String(input?.reopenReason ?? '').trim()) errors.push('سبب إعادة الفتح مطلوب');
  }

  // تحقق متقاطع عبر refs (اختياري — لا يُوقف العملية إذا لم تُمرَّر)
  if (input?.unitId && Array.isArray(refs?.units)) {
    const unit = refs.units.find((u) => u.id === input.unitId);
    if (unit && unit.propertyId !== input.propertyId) {
      errors.push('الوحدة المختارة لا تنتمي للعقار المحدد');
    }
  }

  if (input?.contractId && Array.isArray(refs?.contracts)) {
    const contract = refs.contracts.find((c) => c.id === input.contractId);
    if (contract) {
      const contractPropertyId = contract.propertyId ?? contract.property_id;
      if (contractPropertyId && contractPropertyId !== input.propertyId) {
        errors.push('العقد المختار غير مرتبط بالعقار المحدد');
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

// ─── Creation ─────────────────────────────────────────────────────────────────

/**
 * يُنشئ طلب صيانة مُتحقق منه — الحالة دائماً open عند الإنشاء
 * @param {Object} input
 * @param {Object} [refs]
 * @returns {{ request: Object|null, errors: string[] }}
 */
export function createMaintenanceRequest(input, refs = {}) {
  const merged = {
    ...defaultMaintenanceRequest(input?.propertyId),
    ...input,
    status: 'open', // الحالة مُجبرة على open عند الإنشاء
    assignedToId: null,
    assignedToName: null,
    holdReason: null,
    resolvedAt: null,
    closedAt: null,
    closureType: null,
    cancellationNote: null,
    reopenReason: null,
  };

  const { valid, errors } = validateMaintenanceRequest(merged, refs);
  if (!valid) return { request: null, errors };

  return {
    request: {
      propertyId: merged.propertyId,
      unitId: merged.unitId || null,
      contractId: merged.contractId || null,
      title: String(merged.title).trim(),
      description: merged.description || null,
      status: 'open',
      priority: merged.priority,
      category: merged.category,
      reportedById: merged.reportedById || null,
      assignedToId: null,
      assignedToName: null,
      reportedAt: merged.reportedAt,
      scheduledDate: merged.scheduledDate || null,
      holdReason: null,
      resolvedAt: null,
      closedAt: null,
      closureType: null,
      cancellationNote: null,
      reopenReason: null,
      notes: merged.notes || null,
    },
    errors: [],
  };
}

// ─── Transition Logic ─────────────────────────────────────────────────────────

/**
 * يُرجع الانتقالات المسموحة من حالة معينة
 * @param {string} currentStatus
 * @returns {string[]}
 */
export function getAllowedTransitions(currentStatus) {
  return ALLOWED_TRANSITIONS[currentStatus] || [];
}

/**
 * يتحقق من إمكانية الانتقال بين حالتين
 * @param {string} currentStatus
 * @param {string} nextStatus
 * @param {Object} [context] - بيانات سياق الانتقال
 * @returns {{ allowed: boolean, reason: string|null }}
 */
export function canTransitionMaintenance(currentStatus, nextStatus, context = {}) {
  const allowedNext = ALLOWED_TRANSITIONS[currentStatus] || [];

  if (!allowedNext.includes(nextStatus)) {
    const fromLabel = MAINTENANCE_STATUSES[currentStatus] || currentStatus;
    const toLabel = MAINTENANCE_STATUSES[nextStatus] || nextStatus;
    return { allowed: false, reason: `الانتقال من "${fromLabel}" إلى "${toLabel}" غير مسموح` };
  }

  // حقول إلزامية خاصة بالانتقال المستهدف
  if (nextStatus === 'assigned') {
    const hasId = Boolean(context?.assignedToId);
    const hasName = Boolean(String(context?.assignedToName ?? '').trim());
    if (!hasId && !hasName) return { allowed: false, reason: 'الإسناد يتطلب معرف المورد أو اسمه' };
  }

  if (nextStatus === 'on_hold') {
    if (!String(context?.holdReason ?? '').trim()) {
      return { allowed: false, reason: 'سبب الإيقاف مطلوب' };
    }
  }

  if (nextStatus === 'closed') {
    if (!CLOSURE_TYPES[context?.closureType]) {
      return { allowed: false, reason: 'نوع الإغلاق مطلوب (completed أو cancelled)' };
    }
    // completed مسموح فقط من resolved
    if (context?.closureType === 'completed' && currentStatus !== 'resolved') {
      return { allowed: false, reason: 'الإغلاق كمنجز يتطلب المرور بحالة محلول أولاً' };
    }
    // cancelled مسموح فقط من الحالات النشطة
    if (context?.closureType === 'cancelled' && !CANCELLABLE_STATUSES.has(currentStatus)) {
      return { allowed: false, reason: 'الإلغاء غير متسق مع الحالة الحالية' };
    }
    if (context?.closureType === 'cancelled' && !String(context?.cancellationNote ?? '').trim()) {
      return { allowed: false, reason: 'ملاحظة الإلغاء مطلوبة عند إغلاق الطلب كملغي' };
    }
  }

  if (nextStatus === 'reopened') {
    if (!String(context?.reopenReason ?? '').trim()) {
      return { allowed: false, reason: 'سبب إعادة الفتح مطلوب' };
    }
  }

  return { allowed: true, reason: null };
}

/**
 * يُنفّذ انتقال الحالة ويُرجع الطلب المحدَّث
 * @param {Object} request - الطلب الحالي
 * @param {string} nextStatus - الحالة التالية
 * @param {Object} [context] - بيانات الانتقال
 * @param {Date} [now] - وقت الانتقال (قابل للتمرير في الاختبارات)
 * @returns {{ request: Object|null, errors: string[] }}
 */
export function transitionMaintenance(request, nextStatus, context = {}, now = new Date()) {
  const { allowed, reason } = canTransitionMaintenance(request.status, nextStatus, context);
  if (!allowed) return { request: null, errors: [reason] };

  const todayStr = now.toISOString().split('T')[0];
  const updated = { ...request, status: nextStatus };

  switch (nextStatus) {
    case 'assigned':
      updated.assignedToId = context.assignedToId || null;
      updated.assignedToName = String(context.assignedToName ?? '').trim() || null;
      break;

    case 'open':
      // إلغاء إسناد — يُعيد الطلب لبداية السلسلة
      updated.assignedToId = null;
      updated.assignedToName = null;
      updated.holdReason = null;
      break;

    case 'in_progress':
      // لا حقول إضافية — الانتقال الطبيعي
      break;

    case 'on_hold':
      updated.holdReason = String(context.holdReason).trim();
      break;

    case 'resolved':
      updated.resolvedAt = todayStr;
      break;

    case 'closed':
      updated.closedAt = todayStr;
      updated.closureType = context.closureType;
      if (context.closureType === 'cancelled') {
        updated.cancellationNote = String(context.cancellationNote).trim();
      }
      break;

    case 'reopened':
      updated.reopenReason = String(context.reopenReason).trim();
      // تصفير حقول الإغلاق — الطلب حيّ مجدداً
      updated.resolvedAt = null;
      updated.closedAt = null;
      updated.closureType = null;
      updated.cancellationNote = null;
      break;
  }

  return { request: updated, errors: [] };
}

// ─── Update / Timeline ────────────────────────────────────────────────────────

/**
 * يُنشئ تحديث timeline لطلب الصيانة
 * @param {Object} input
 * @returns {{ update: Object|null, errors: string[] }}
 */
export function createMaintenanceUpdate(input) {
  const errors = [];
  if (!input?.maintenanceId) errors.push('معرف الطلب مطلوب');
  if (!UPDATE_TYPES[input?.type]) errors.push('نوع التحديث غير صالح');
  if (!String(input?.note ?? '').trim()) errors.push('نص التحديث مطلوب');

  if (errors.length > 0) return { update: null, errors };

  return {
    update: {
      maintenanceId: input.maintenanceId,
      type: input.type,
      note: String(input.note).trim(),
      previousStatus: input.previousStatus || null,
      newStatus: input.newStatus || null,
      createdAt: new Date().toISOString(),
    },
    errors: [],
  };
}

// ─── Cost ─────────────────────────────────────────────────────────────────────

/**
 * يُنشئ تكلفة مرتبطة بطلب صيانة
 * @param {Object} input - { maintenanceId, amount, paidBy, date, description?, transactionId?, invoiceRef? }
 * @param {Object|string|null} [requestOrStatus] - الطلب كاملاً أو حالته كنص
 * @returns {{ cost: Object|null, errors: string[] }}
 */
export function createMaintenanceCost(input, requestOrStatus = null) {
  const errors = [];

  if (!input?.maintenanceId) errors.push('معرف الطلب مطلوب');

  const amount = Number(input?.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    errors.push('المبلغ يجب أن يكون رقماً موجباً أكبر من صفر');
  }

  if (!COST_PAYERS[input?.paidBy]) errors.push('جهة الدفع غير صالحة');
  if (!input?.date) errors.push('تاريخ التكلفة مطلوب');

  // يمنع الإضافة على طلب مغلق
  const status = typeof requestOrStatus === 'string'
    ? requestOrStatus
    : requestOrStatus?.status;
  if (status === 'closed') errors.push('لا يمكن إضافة تكاليف على طلب مغلق');

  if (errors.length > 0) return { cost: null, errors };

  return {
    cost: {
      maintenanceId: input.maintenanceId,
      amount,
      paidBy: input.paidBy,
      date: input.date,
      description: input.description || null,
      transactionId: input.transactionId || null,
      invoiceRef: input.invoiceRef || null,
      createdAt: new Date().toISOString(),
    },
    errors: [],
  };
}

// ─── Summary ──────────────────────────────────────────────────────────────────

/**
 * يحسب الملخص المشتق لطلب الصيانة (لا يُخزَّن — يُحسب عند الحاجة)
 * @param {Object} request - الطلب
 * @param {Array} [updates] - قائمة التحديثات
 * @param {Array} [costs] - قائمة التكاليف
 * @param {Date} [now] - التاريخ المرجعي (للاختبارات)
 * @returns {{ totalCost: number, updatesCount: number, daysOpen: number, isOverdue: boolean, isClosed: boolean }}
 */
export function computeMaintenanceSummary(request, updates = [], costs = [], now = new Date()) {
  const totalCost = (Array.isArray(costs) ? costs : [])
    .reduce((sum, c) => sum + (Number(c?.amount) || 0), 0);

  const updatesCount = Array.isArray(updates) ? updates.length : 0;

  let daysOpen = 0;
  if (request?.reportedAt) {
    const reported = new Date(`${request.reportedAt}T00:00:00`);
    const ref = new Date(now);
    ref.setHours(0, 0, 0, 0);
    const diff = Math.floor((ref.getTime() - reported.getTime()) / 86400000);
    daysOpen = Math.max(0, diff);
  }

  const isClosed = request?.status === 'closed';

  let isOverdue = false;
  if (request?.scheduledDate && !isClosed) {
    const scheduled = new Date(`${request.scheduledDate}T00:00:00`);
    const ref = new Date(now);
    ref.setHours(0, 0, 0, 0);
    isOverdue = ref.getTime() > scheduled.getTime();
  }

  return { totalCost, updatesCount, daysOpen, isOverdue, isClosed };
}

// ─── Boolean Helpers ──────────────────────────────────────────────────────────

/**
 * يتحقق ما إذا كان الطلب مغلقاً
 * @param {Object} request
 * @returns {boolean}
 */
export function isMaintenanceClosed(request) {
  return request?.status === 'closed';
}

/**
 * يتحقق ما إذا كان الطلب متأخراً عن الموعد المجدول
 * @param {Object} request
 * @param {Date} [now]
 * @returns {boolean}
 */
export function isMaintenanceOverdue(request, now = new Date()) {
  if (!request?.scheduledDate) return false;
  if (isMaintenanceClosed(request)) return false;
  const scheduled = new Date(`${request.scheduledDate}T00:00:00`);
  const ref = new Date(now);
  ref.setHours(0, 0, 0, 0);
  return ref.getTime() > scheduled.getTime();
}

// ─── Labels & Colors ──────────────────────────────────────────────────────────

/** ترجمة حالة الصيانة */
export function getMaintenanceStatusLabel(status) {
  return MAINTENANCE_STATUSES[status] || status;
}

/** ترجمة الأولوية */
export function getMaintenancePriorityLabel(priority) {
  return MAINTENANCE_PRIORITIES[priority] || priority;
}

/** ترجمة التصنيف */
export function getMaintenanceCategoryLabel(category) {
  return MAINTENANCE_CATEGORIES[category] || category;
}

/** لون حالة الصيانة */
export function getMaintenanceStatusColor(status) {
  const colors = {
    open: 'blue',
    assigned: 'purple',
    in_progress: 'orange',
    on_hold: 'yellow',
    resolved: 'teal',
    closed: 'gray',
    reopened: 'red',
  };
  return colors[status] || 'gray';
}

/** لون الأولوية */
export function getMaintenancePriorityColor(priority) {
  const colors = { urgent: 'red', high: 'orange', medium: 'yellow', low: 'gray' };
  return colors[priority] || 'gray';
}

// ─── Filter ───────────────────────────────────────────────────────────────────

/**
 * يُصفّي قائمة طلبات الصيانة
 * @param {Array} requests
 * @param {Object} filters - { status?, priority?, category?, propertyId?, unitId?, assignedToId? }
 * @returns {Array}
 */
export function filterMaintenanceRequests(requests, filters = {}) {
  let list = Array.isArray(requests) ? [...requests] : [];
  if (filters.status) list = list.filter((r) => r.status === filters.status);
  if (filters.priority) list = list.filter((r) => r.priority === filters.priority);
  if (filters.category) list = list.filter((r) => r.category === filters.category);
  if (filters.propertyId) list = list.filter((r) => r.propertyId === filters.propertyId);
  if (filters.unitId) list = list.filter((r) => r.unitId === filters.unitId);
  if (filters.assignedToId) list = list.filter((r) => r.assignedToId === filters.assignedToId);
  return list;
}
