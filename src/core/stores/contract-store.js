/*
  قيد العقار (Finance Flow)
  contract-store.js — عمليات العقود وسندات القبض وجدول الدفعات

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
// العقود (contracts) — SPR-018
// ═══════════════════════════════════════
const contracts = {
  /** جلب جميع عقود المكتب مع فلاتر اختيارية */
  list: async (officeId, filters = {}) => {
    try {
      let query = supabase
        .from('contracts')
        .select('*, properties(name), contacts(name)')
        .eq('office_id', officeId);
      if (filters.type) query = query.eq('type', filters.type);
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.propertyId) query = query.eq('property_id', filters.propertyId);
      if (filters.contactId) query = query.eq('contact_id', filters.contactId);
      if (filters.search)
        query = query.or(
          `contract_number.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`
        );
      query = query.order('created_at', { ascending: false });
      const { data, error } = await query;
      if (error) return handleError('contracts.list', error);
      // إضافة أسماء العقار والعميل للبحث المحلي
      const enriched = (data || []).map((c) => ({
        ...c,
        _property_name: c.properties?.name || '',
        _contact_name: c.contacts?.name || '',
      }));
      return { data: enriched, error: null };
    } catch (err) {
      return handleError('contracts.list', err);
    }
  },
  /** جلب عقد واحد بالمعرّف */
  get: async (id) => {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*, properties(name), contacts(name)')
        .eq('id', id)
        .single();
      if (error) return handleError('contracts.get', error);
      return { data, error: null };
    } catch (err) {
      return handleError('contracts.get', err);
    }
  },
  /** إنشاء عقد جديد */
  create: async (contract) => {
    try {
      const { data, error } = await supabase.from('contracts').insert(contract).select().single();
      if (error) return handleError('contracts.create', error);
      return { data, error: null };
    } catch (err) {
      return handleError('contracts.create', err);
    }
  },
  /** تحديث عقد */
  update: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) return handleError('contracts.update', error);
      return { data, error: null };
    } catch (err) {
      return handleError('contracts.update', err);
    }
  },
  /** حذف عقد */
  remove: async (id) => {
    try {
      const { error } = await supabase.from('contracts').delete().eq('id', id);
      if (error) return handleError('contracts.remove', error);
      return { data: null, error: null };
    } catch (err) {
      return handleError('contracts.remove', err);
    }
  },
};

// ═══════════════════════════════════════
// سندات القبض (contract_receipts)
// ═══════════════════════════════════════
const contractReceipts = {
  /** جلب جميع سندات القبض لمكتب */
  list: async (officeId) => {
    try {
      const { data, error } = await supabase
        .from('contract_receipts')
        .select('*')
        .eq('office_id', officeId)
        .order('created_at', { ascending: false });
      if (error) return handleError('contractReceipts.list', error);
      return { data: data || [], error: null };
    } catch (err) {
      return handleError('contractReceipts.list (exception)', err);
    }
  },

  /** إنشاء سند قبض جديد */
  create: async (receipt) => {
    try {
      const { data, error } = await supabase
        .from('contract_receipts')
        .insert(receipt)
        .select('*')
        .single();
      if (error) return handleError('contractReceipts.create', error);
      return { data, error: null };
    } catch (err) {
      return handleError('contractReceipts.create (exception)', err);
    }
  },

  /** حذف سند قبض */
  remove: async (id) => {
    try {
      const { error } = await supabase.from('contract_receipts').delete().eq('id', id);
      if (error) return handleError('contractReceipts.remove', error);
      return { data: null, error: null };
    } catch (err) {
      return handleError('contractReceipts.remove (exception)', err);
    }
  },
};

// ═══════════════════════════════════════
// جدول الدفعات (payment_schedule)
// ═══════════════════════════════════════
const paymentSchedule = {
  /** جلب جميع الأقساط لمكتب مع فلتر اختياري بالعقد */
  list: async (officeId, contractId = null) => {
    try {
      let query = supabase.from('payment_schedule').select('*').eq('office_id', officeId);
      if (contractId) query = query.eq('contract_id', contractId);
      query = query.order('due_date', { ascending: true });
      const { data, error } = await query;
      if (error) return handleError('paymentSchedule.list', error);
      return { data: data || [], error: null };
    } catch (err) {
      return handleError('paymentSchedule.list (exception)', err);
    }
  },

  /** جلب قسط واحد بالمعرّف */
  get: async (id) => {
    try {
      const { data, error } = await supabase
        .from('payment_schedule')
        .select('*')
        .eq('id', id)
        .single();
      if (error) return handleError('paymentSchedule.get', error);
      return { data, error: null };
    } catch (err) {
      return handleError('paymentSchedule.get (exception)', err);
    }
  },

  /** إنشاء قسط جديد */
  create: async (payment) => {
    try {
      const { data, error } = await supabase
        .from('payment_schedule')
        .insert(payment)
        .select('*')
        .single();
      if (error) return handleError('paymentSchedule.create', error);
      return { data, error: null };
    } catch (err) {
      return handleError('paymentSchedule.create (exception)', err);
    }
  },

  /** تحديث بيانات قسط */
  update: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('payment_schedule')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();
      if (error) return handleError('paymentSchedule.update', error);
      return { data, error: null };
    } catch (err) {
      return handleError('paymentSchedule.update (exception)', err);
    }
  },

  /** حذف قسط */
  remove: async (id) => {
    try {
      const { error } = await supabase.from('payment_schedule').delete().eq('id', id);
      if (error) return handleError('paymentSchedule.remove', error);
      return { data: null, error: null };
    } catch (err) {
      return handleError('paymentSchedule.remove (exception)', err);
    }
  },
};

export { contracts, contractReceipts, paymentSchedule };
