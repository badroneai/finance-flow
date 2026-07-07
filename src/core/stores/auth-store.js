/*
  قيد العقار (Finance Flow)
  auth-store.js — عمليات الملف الشخصي والمكتب

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
// الملف الشخصي (profiles)
// ═══════════════════════════════════════
const profile = {
  /** جلب بيانات الملف الشخصي بمعرّف المستخدم */
  get: async (userId) => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
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

export { profile, office };
