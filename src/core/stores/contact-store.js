/*
  قيد العقار (Finance Flow)
  contact-store.js — عمليات جهات الاتصال وسجل النشاطات

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
// جهات الاتصال (contacts) — SPR-018
// ═══════════════════════════════════════
const contacts = {
  /** جلب جميع جهات اتصال المكتب مع فلاتر اختيارية */
  list: async (officeId, filters = {}) => {
    try {
      let query = supabase.from('contacts').select('*').eq('office_id', officeId);
      if (filters.type) query = query.eq('type', filters.type);
      if (filters.city) query = query.eq('city', filters.city);
      if (filters.search)
        query = query.or(
          `name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,email.ilike.%${filters.search}%,company_name.ilike.%${filters.search}%`
        );
      query = query.order('created_at', { ascending: false });
      const { data, error } = await query;
      if (error) return handleError('contacts.list', error);
      return { data: data || [], error: null };
    } catch (err) {
      return handleError('contacts.list', err);
    }
  },
  /** جلب جهة اتصال واحدة بالمعرّف */
  get: async (id) => {
    try {
      const { data, error } = await supabase.from('contacts').select('*').eq('id', id).single();
      if (error) return handleError('contacts.get', error);
      return { data, error: null };
    } catch (err) {
      return handleError('contacts.get', err);
    }
  },
  /** إنشاء جهة اتصال جديدة */
  create: async (contact) => {
    try {
      const { data, error } = await supabase.from('contacts').insert(contact).select().single();
      if (error) return handleError('contacts.create', error);
      return { data, error: null };
    } catch (err) {
      return handleError('contacts.create', err);
    }
  },
  /** تحديث جهة اتصال */
  update: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) return handleError('contacts.update', error);
      return { data, error: null };
    } catch (err) {
      return handleError('contacts.update', err);
    }
  },
  /** حذف جهة اتصال */
  remove: async (id) => {
    try {
      const { error } = await supabase.from('contacts').delete().eq('id', id);
      if (error) return handleError('contacts.remove', error);
      return { data: null, error: null };
    } catch (err) {
      return handleError('contacts.remove', err);
    }
  },
};

// ═══════════════════════════════════════
// سجل التواصل (contact_activities)
// ═══════════════════════════════════════
const contactActivities = {
  /** جلب نشاطات جهة اتصال مع فلتر اختياري */
  list: async (officeId, contactId = null) => {
    try {
      let query = supabase.from('contact_activities').select('*').eq('office_id', officeId);
      if (contactId) query = query.eq('contact_id', contactId);
      query = query.order('activity_date', { ascending: false });
      const { data, error } = await query;
      if (error) return handleError('contactActivities.list', error);
      return { data: data || [], error: null };
    } catch (err) {
      return handleError('contactActivities.list (exception)', err);
    }
  },

  /** إنشاء نشاط جديد */
  create: async (activity) => {
    try {
      const { data, error } = await supabase
        .from('contact_activities')
        .insert(activity)
        .select('*')
        .single();
      if (error) return handleError('contactActivities.create', error);
      return { data, error: null };
    } catch (err) {
      return handleError('contactActivities.create (exception)', err);
    }
  },

  /** حذف نشاط */
  remove: async (id) => {
    try {
      const { error } = await supabase.from('contact_activities').delete().eq('id', id);
      if (error) return handleError('contactActivities.remove', error);
      return { data: null, error: null };
    } catch (err) {
      return handleError('contactActivities.remove (exception)', err);
    }
  },
};

export { contacts, contactActivities };
