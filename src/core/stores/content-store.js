/*
  قيد العقار (Finance Flow)
  content-store.js — عمليات المسودات

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
      const { data, error } = await supabase.from('drafts').select('*').eq('id', id).single();
      if (error) return handleError('drafts.get', error);
      return { data, error: null };
    } catch (err) {
      return handleError('drafts.get (exception)', err);
    }
  },

  /** إنشاء مسودة جديدة */
  create: async (draft) => {
    try {
      const { data, error } = await supabase.from('drafts').insert(draft).select('*').single();
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
      const { error } = await supabase.from('drafts').delete().eq('id', id);
      if (error) return handleError('drafts.remove', error);
      return { data: null, error: null };
    } catch (err) {
      return handleError('drafts.remove (exception)', err);
    }
  },
};

export { drafts };
