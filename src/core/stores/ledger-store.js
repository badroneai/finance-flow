/*
  قيد العقار (Finance Flow)
  ledger-store.js — عمليات الدفاتر والحركات والالتزامات المتكررة والعمولات

  مُستخرج من supabase-store.js — نفس الـ API تمامًا.
*/

import { supabase } from '../supabase.js';

// ═══════════════════════════════════════
// دالة مساعدة للأخطاء
// ═══════════════════════════════════════
function handleError(operation, error) {
  console.error(`[قيد العقار] ${operation}:`, error);
  return { data: null, error };
}

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
      const { data, error } = await supabase.from('ledgers').select('*').eq('id', id).single();
      if (error) return handleError('ledgers.get', error);
      return { data, error: null };
    } catch (err) {
      return handleError('ledgers.get (exception)', err);
    }
  },

  /** إنشاء دفتر جديد */
  create: async (ledger) => {
    try {
      const { data, error } = await supabase.from('ledgers').insert(ledger).select('*').single();
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
      const { error } = await supabase.from('ledgers').delete().eq('id', id);
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
      let query = supabase.from('transactions').select('*').eq('office_id', officeId);

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
      const { data, error } = await supabase.from('transactions').select('*').eq('id', id).single();
      if (error) return handleError('transactions.get', error);
      return { data, error: null };
    } catch (err) {
      return handleError('transactions.get (exception)', err);
    }
  },

  /** إنشاء حركة مالية جديدة */
  create: async (tx) => {
    try {
      const { data, error } = await supabase.from('transactions').insert(tx).select('*').single();
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
      const { error } = await supabase.from('transactions').delete().eq('id', id);
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
      let query = supabase.from('recurring_items').select('*').eq('office_id', officeId);

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
      const { error } = await supabase.from('recurring_items').delete().eq('id', id);
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
      let query = supabase.from('commissions').select('*').eq('office_id', officeId);

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
      const { data, error } = await supabase.from('commissions').select('*').eq('id', id).single();
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
      const { error } = await supabase.from('commissions').delete().eq('id', id);
      if (error) return handleError('commissions.remove', error);
      return { data: null, error: null };
    } catch (err) {
      return handleError('commissions.remove (exception)', err);
    }
  },
};

export { ledgers, transactions, recurringItems, commissions };
