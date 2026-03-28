/*
  قيد العقار (Finance Flow)
  supabase-store.js — طبقة بيانات Supabase (SPR-004e-1)

  البديل السحابي لـ dataStore.js (localStorage).
  كل دالة async وتُرجع { data, error } بنفس نمط Supabase.
  الأقسام المنفّذة: profile, office, ledgers, transactions, recurringItems, commissions, drafts.
  الأقسام المؤجلة (TODO): contacts, properties, contracts, paymentSchedule,
    maintenanceRequests, contactActivities, notifications, supportTickets, auditLog, attachments.
*/

import { supabase } from './supabase.js';

// ═══════════════════════════════════════
// دالة مساعدة للأخطاء
// ═══════════════════════════════════════
function handleError(operation, error) {
  console.error(`[قيد العقار] ${operation}:`, error);
  return { data: null, error };
}

// ═══════════════════════════════════════
// الملف الشخصي (profiles)
// ═══════════════════════════════════════
const profile = {
  /** جلب بيانات الملف الشخصي بمعرّف المستخدم */
  get: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) return handleError('profile.get', error);
      return { data, error: null };
    } catch (err) {
      return handleError('profile.get (exception)', err);
    }
  },

  /** تحديث بيانات الملف الشخصي */
  update: async (userId, updates) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select('*')
        .single();
      if (error) return handleError('profile.update', error);
      return { data, error: null };
    } catch (err) {
      return handleError('profile.update (exception)', err);
    }
  },

  /** جلب جميع مستخدمي المكتب (للمالك/المدير) */
  listByOffice: async (officeId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('office_id', officeId)
        .order('full_name', { ascending: true });
      if (error) return handleError('profile.listByOffice', error);
      return { data: data || [], error: null };
    } catch (err) {
      return handleError('profile.listByOffice (exception)', err);
    }
  },
};

// ═══════════════════════════════════════
// المكتب (offices)
// ═══════════════════════════════════════
const office = {
  /** جلب بيانات المكتب */
  get: async (officeId) => {
    try {
      const { data, error } = await supabase
        .from('offices')
        .select('*')
        .eq('id', officeId)
        .single();
      if (error) return handleError('office.get', error);
      return { data, error: null };
    } catch (err) {
      return handleError('office.get (exception)', err);
    }
  },

  /** تحديث بيانات المكتب */
  update: async (officeId, updates) => {
    try {
      const { data, error } = await supabase
        .from('offices')
        .update(updates)
        .eq('id', officeId)
        .select('*')
        .single();
      if (error) return handleError('office.update', error);
      return { data, error: null };
    } catch (err) {
      return handleError('office.update (exception)', err);
    }
  },

  /** جلب إعدادات المكتب فقط (settings jsonb) */
  getSettings: async (officeId) => {
    try {
      const { data, error } = await supabase
        .from('offices')
        .select('settings')
        .eq('id', officeId)
        .single();
      if (error) return handleError('office.getSettings', error);
      return { data: data?.settings || {}, error: null };
    } catch (err) {
      return handleError('office.getSettings (exception)', err);
    }
  },

  /** تحديث إعدادات المكتب (settings jsonb) */
  updateSettings: async (officeId, settings) => {
    try {
      const { data, error } = await supabase
        .from('offices')
        .update({ settings })
        .eq('id', officeId)
        .select('*')
        .single();
      if (error) return handleError('office.updateSettings', error);
      return { data, error: null };
    } catch (err) {
      return handleError('office.updateSettings (exception)', err);
    }
  },
};

// ═══════════════════════════════════════
// الدفاتر المحاسبية (ledgers)
// ═══════════════════════════════════════
const ledgers = {
  /** جلب جميع دفاتر المكتب */
  list: async (officeId) => {
    try {
      const { data, error } = await supabase
        .from('ledgers')
        .select('*')
        .eq('office_id', officeId)
        .order('created_at', { ascending: false });
      if (error) return handleError('ledgers.list', error);
      return { data: data || [], error: null };
    } catch (err) {
      return handleError('ledgers.list (exception)', err);
    }
  },

  /** جلب دفتر واحد بالمعرّف */
  get: async (id) => {
    try {
      const { data, error } = await supabase
        .from('ledgers')
        .select('*')
        .eq('id', id)
        .single();
      if (error) return handleError('ledgers.get', error);
      return { data, error: null };
    } catch (err) {
      return handleError('ledgers.get (exception)', err);
    }
  },

  /** إنشاء دفتر جديد */
  create: async (ledger) => {
    try {
      const { data, error } = await supabase
        .from('ledgers')
        .insert(ledger)
        .select('*')
        .single();
      if (error) return handleError('ledgers.create', error);
      return { data, error: null };
    } catch (err) {
      return handleError('ledgers.create (exception)', err);
    }
  },

  /** تحديث بيانات دفتر */
  update: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('ledgers')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();
      if (error) return handleError('ledgers.update', error);
      return { data, error: null };
    } catch (err) {
      return handleError('ledgers.update (exception)', err);
    }
  },

  /** حذف دفتر */
  remove: async (id) => {
    try {
      const { error } = await supabase
        .from('ledgers')
        .delete()
        .eq('id', id);
      if (error) return handleError('ledgers.remove', error);
      return { data: null, error: null };
    } catch (err) {
      return handleError('ledgers.remove (exception)', err);
    }
  },

  /** جلب الدفاتر النشطة فقط (غير المؤرشفة) */
  getActive: async (officeId) => {
    try {
      const { data, error } = await supabase
        .from('ledgers')
        .select('*')
        .eq('office_id', officeId)
        .eq('archived', false)
        .order('created_at', { ascending: false });
      if (error) return handleError('ledgers.getActive', error);
      return { data: data || [], error: null };
    } catch (err) {
      return handleError('ledgers.getActive (exception)', err);
    }
  },
};

// ═══════════════════════════════════════
// الحركات المالية (transactions)
// ═══════════════════════════════════════
const transactions = {
  /** جلب حركات المكتب مع فلاتر اختيارية */
  list: async (officeId, filters = {}) => {
    try {
      let query = supabase
        .from('transactions')
        .select('*')
        .eq('office_id', officeId);

      // فلاتر اختيارية
      if (filters.ledgerId) query = query.eq('ledger_id', filters.ledgerId);
      if (filters.type) query = query.eq('type', filters.type);
      if (filters.category) query = query.eq('category', filters.category);
      if (filters.paymentMethod) query = query.eq('payment_method', filters.paymentMethod);
      if (filters.startDate) query = query.gte('date', filters.startDate);
      if (filters.endDate) query = query.lte('date', filters.endDate);
      if (filters.search) query = query.ilike('description', `%${filters.search}%`);

      // الترتيب: الأحدث أولاً
      query = query.order('date', { ascending: false }).order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) return handleError('transactions.list', error);
      return { data: data || [], error: null };
    } catch (err) {
      return handleError('transactions.list (exception)', err);
    }
  },

  /** جلب حركة واحدة بالمعرّف */
  get: async (id) => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', id)
        .single();
      if (error) return handleError('transactions.get', error);
      return { data, error: null };
    } catch (err) {
      return handleError('transactions.get (exception)', err);
    }
  },

  /** إنشاء حركة مالية جديدة */
  create: async (tx) => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert(tx)
        .select('*')
        .single();
      if (error) return handleError('transactions.create', error);
      return { data, error: null };
    } catch (err) {
      return handleError('transactions.create (exception)', err);
    }
  },

  /** تحديث حركة مالية */
  update: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();
      if (error) return handleError('transactions.update', error);
      return { data, error: null };
    } catch (err) {
      return handleError('transactions.update (exception)', err);
    }
  },

  /** حذف حركة مالية */
  remove: async (id) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);
      if (error) return handleError('transactions.remove', error);
      return { data: null, error: null };
    } catch (err) {
      return handleError('transactions.remove (exception)', err);
    }
  },

  /** جلب حركات دفتر معيّن (اختصار) */
  listForLedger: async (officeId, ledgerId) => {
    return transactions.list(officeId, { ledgerId });
  },
};

// ═══════════════════════════════════════
// الالتزامات المتكررة (recurring_items)
// ═══════════════════════════════════════
const recurringItems = {
  /** جلب الالتزامات المتكررة للمكتب مع فلتر اختياري بدفتر */
  list: async (officeId, ledgerId = null) => {
    try {
      let query = supabase
        .from('recurring_items')
        .select('*')
        .eq('office_id', officeId);

      if (ledgerId) query = query.eq('ledger_id', ledgerId);

      query = query.order('next_due_date', { ascending: true });

      const { data, error } = await query;
      if (error) return handleError('recurringItems.list', error);
      return { data: data || [], error: null };
    } catch (err) {
      return handleError('recurringItems.list (exception)', err);
    }
  },

  /** إنشاء التزام متكرر جديد */
  create: async (item) => {
    try {
      const { data, error } = await supabase
        .from('recurring_items')
        .insert(item)
        .select('*')
        .single();
      if (error) return handleError('recurringItems.create', error);
      return { data, error: null };
    } catch (err) {
      return handleError('recurringItems.create (exception)', err);
    }
  },

  /** تحديث التزام متكرر */
  update: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('recurring_items')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();
      if (error) return handleError('recurringItems.update', error);
      return { data, error: null };
    } catch (err) {
      return handleError('recurringItems.update (exception)', err);
    }
  },

  /** حذف التزام متكرر */
  remove: async (id) => {
    try {
      const { error } = await supabase
        .from('recurring_items')
        .delete()
        .eq('id', id);
      if (error) return handleError('recurringItems.remove', error);
      return { data: null, error: null };
    } catch (err) {
      return handleError('recurringItems.remove (exception)', err);
    }
  },
};

// ═══════════════════════════════════════
// العمولات (commissions)
// ═══════════════════════════════════════
const commissions = {
  /** جلب جميع عمولات المكتب مع فلاتر اختيارية */
  list: async (officeId, filters = {}) => {
    try {
      let query = supabase
        .from('commissions')
        .select('*')
        .eq('office_id', officeId);

      if (filters.ledgerId) query = query.eq('ledger_id', filters.ledgerId);
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.agentId) query = query.eq('agent_id', filters.agentId);

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) return handleError('commissions.list', error);
      return { data: data || [], error: null };
    } catch (err) {
      return handleError('commissions.list (exception)', err);
    }
  },

  /** جلب عمولة واحدة */
  get: async (id) => {
    try {
      const { data, error } = await supabase
        .from('commissions')
        .select('*')
        .eq('id', id)
        .single();
      if (error) return handleError('commissions.get', error);
      return { data, error: null };
    } catch (err) {
      return handleError('commissions.get (exception)', err);
    }
  },

  /** إنشاء عمولة جديدة */
  create: async (commission) => {
    try {
      const { data, error } = await supabase
        .from('commissions')
        .insert(commission)
        .select('*')
        .single();
      if (error) return handleError('commissions.create', error);
      return { data, error: null };
    } catch (err) {
      return handleError('commissions.create (exception)', err);
    }
  },

  /** تحديث عمولة */
  update: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('commissions')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();
      if (error) return handleError('commissions.update', error);
      return { data, error: null };
    } catch (err) {
      return handleError('commissions.update (exception)', err);
    }
  },

  /** حذف عمولة */
  remove: async (id) => {
    try {
      const { error } = await supabase
        .from('commissions')
        .delete()
        .eq('id', id);
      if (error) return handleError('commissions.remove', error);
      return { data: null, error: null };
    } catch (err) {
      return handleError('commissions.remove (exception)', err);
    }
  },
};

// ═══════════════════════════════════════
// المسودات (drafts)
// ═══════════════════════════════════════
const drafts = {
  /** جلب جميع مسودات المكتب */
  list: async (officeId) => {
    try {
      const { data, error } = await supabase
        .from('drafts')
        .select('*')
        .eq('office_id', officeId)
        .order('created_at', { ascending: false });
      if (error) return handleError('drafts.list', error);
      return { data: data || [], error: null };
    } catch (err) {
      return handleError('drafts.list (exception)', err);
    }
  },

  /** جلب مسودة واحدة */
  get: async (id) => {
    try {
      const { data, error } = await supabase
        .from('drafts')
        .select('*')
        .eq('id', id)
        .single();
      if (error) return handleError('drafts.get', error);
      return { data, error: null };
    } catch (err) {
      return handleError('drafts.get (exception)', err);
    }
  },

  /** إنشاء مسودة جديدة */
  create: async (draft) => {
    try {
      const { data, error } = await supabase
        .from('drafts')
        .insert(draft)
        .select('*')
        .single();
      if (error) return handleError('drafts.create', error);
      return { data, error: null };
    } catch (err) {
      return handleError('drafts.create (exception)', err);
    }
  },

  /** تحديث مسودة */
  update: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('drafts')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();
      if (error) return handleError('drafts.update', error);
      return { data, error: null };
    } catch (err) {
      return handleError('drafts.update (exception)', err);
    }
  },

  /** حذف مسودة */
  remove: async (id) => {
    try {
      const { error } = await supabase
        .from('drafts')
        .delete()
        .eq('id', id);
      if (error) return handleError('drafts.remove', error);
      return { data: null, error: null };
    } catch (err) {
      return handleError('drafts.remove (exception)', err);
    }
  },
};

// ═══════════════════════════════════════
// جهات الاتصال (contacts) — هيكل فقط للمستقبل
// ═══════════════════════════════════════
const contacts = {
  list: async (officeId, filters = {}) => { /* TODO */ },
  get: async (id) => { /* TODO */ },
  create: async (contact) => { /* TODO */ },
  update: async (id, updates) => { /* TODO */ },
  remove: async (id) => { /* TODO */ },
};

// ═══════════════════════════════════════
// الوحدات العقارية (properties) — هيكل فقط للمستقبل
// ═══════════════════════════════════════
const properties = {
  list: async (officeId, filters = {}) => { /* TODO */ },
  get: async (id) => { /* TODO */ },
  create: async (property) => { /* TODO */ },
  update: async (id, updates) => { /* TODO */ },
  remove: async (id) => { /* TODO */ },
};

// ═══════════════════════════════════════
// العقود (contracts) — هيكل فقط للمستقبل
// ═══════════════════════════════════════
const contracts = {
  list: async (officeId, filters = {}) => { /* TODO */ },
  get: async (id) => { /* TODO */ },
  create: async (contract) => { /* TODO */ },
  update: async (id, updates) => { /* TODO */ },
  remove: async (id) => { /* TODO */ },
};

// ═══════════════════════════════════════
// جدول الدفعات (payment_schedule) — هيكل فقط للمستقبل
// ═══════════════════════════════════════
const paymentSchedule = {
  list: async (officeId, contractId = null) => { /* TODO */ },
  create: async (payment) => { /* TODO */ },
  update: async (id, updates) => { /* TODO */ },
};

// ═══════════════════════════════════════
// طلبات الصيانة (maintenance_requests) — هيكل فقط للمستقبل
// ═══════════════════════════════════════
const maintenanceRequests = {
  list: async (officeId, filters = {}) => { /* TODO */ },
  get: async (id) => { /* TODO */ },
  create: async (request) => { /* TODO */ },
  update: async (id, updates) => { /* TODO */ },
};

// ═══════════════════════════════════════
// سجل التواصل (contact_activities) — هيكل فقط للمستقبل
// ═══════════════════════════════════════
const contactActivities = {
  list: async (officeId, contactId = null) => { /* TODO */ },
  create: async (activity) => { /* TODO */ },
};

// ═══════════════════════════════════════
// الإشعارات (notifications) — هيكل فقط للمستقبل
// ═══════════════════════════════════════
const notifications = {
  list: async (userId) => { /* TODO */ },
  markRead: async (id) => { /* TODO */ },
  markAllRead: async (userId) => { /* TODO */ },
};

// ═══════════════════════════════════════
// تذاكر الدعم (support_tickets) — هيكل فقط للمستقبل
// ═══════════════════════════════════════
const supportTickets = {
  list: async (officeId) => { /* TODO */ },
  create: async (ticket) => { /* TODO */ },
  update: async (id, updates) => { /* TODO */ },
};

// ═══════════════════════════════════════
// سجل العمليات (audit_log) — هيكل فقط للمستقبل
// ═══════════════════════════════════════
const auditLog = {
  log: async (entry) => { /* TODO */ },
  list: async (officeId, filters = {}) => { /* TODO */ },
};

// ═══════════════════════════════════════
// المرفقات (attachments) — هيكل فقط للمستقبل
// ═══════════════════════════════════════
const attachments = {
  list: async (entityType, entityId) => { /* TODO */ },
  upload: async (file, metadata) => { /* TODO */ },
  remove: async (id) => { /* TODO */ },
};

// ═══════════════════════════════════════
// التصدير
// ═══════════════════════════════════════
const supabaseStore = {
  profile,
  office,
  ledgers,
  transactions,
  recurringItems,
  commissions,
  drafts,
  contacts,
  properties,
  contracts,
  paymentSchedule,
  maintenanceRequests,
  contactActivities,
  notifications,
  supportTickets,
  auditLog,
  attachments,
};

export default supabaseStore;
export { supabaseStore };
