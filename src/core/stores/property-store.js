/*
  قيد العقار (Finance Flow)
  property-store.js — عمليات العقارات والوحدات

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
// الوحدات العقارية (properties) — SPR-018
// ═══════════════════════════════════════
const properties = {
  /** جلب جميع عقارات المكتب مع فلاتر اختيارية */
  list: async (officeId, filters = {}) => {
    try {
      let query = supabase.from('properties').select('*').eq('office_id', officeId);
      if (filters.type) query = query.eq('type', filters.type);
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.city) query = query.eq('city', filters.city);
      if (filters.search)
        query = query.or(
          `name.ilike.%${filters.search}%,district.ilike.%${filters.search}%,owner_name.ilike.%${filters.search}%`
        );
      query = query.order('created_at', { ascending: false });
      const { data, error } = await query;
      if (error) return handleError('properties.list', error);
      return { data: data || [], error: null };
    } catch (err) {
      return handleError('properties.list (exception)', err);
    }
  },

  /** جلب عقار واحد بالمعرّف */
  get: async (id) => {
    try {
      const { data, error } = await supabase.from('properties').select('*').eq('id', id).single();
      if (error) return handleError('properties.get', error);
      return { data, error: null };
    } catch (err) {
      return handleError('properties.get (exception)', err);
    }
  },

  /** إنشاء عقار جديد */
  create: async (property) => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .insert(property)
        .select('*')
        .single();
      if (error) return handleError('properties.create', error);
      return { data, error: null };
    } catch (err) {
      return handleError('properties.create (exception)', err);
    }
  },

  /** تحديث بيانات عقار */
  update: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();
      if (error) return handleError('properties.update', error);
      return { data, error: null };
    } catch (err) {
      return handleError('properties.update (exception)', err);
    }
  },

  /** حذف عقار */
  remove: async (id) => {
    try {
      const { error } = await supabase.from('properties').delete().eq('id', id);
      if (error) return handleError('properties.remove', error);
      return { data: null, error: null };
    } catch (err) {
      return handleError('properties.remove (exception)', err);
    }
  },
};

// ═══════════════════════════════════════
// الوحدات العقارية (units)
// ═══════════════════════════════════════
const units = {
  /** جلب وحدات مكتب مع فلتر اختياري بالعقار */
  list: async (officeId, propertyId = null) => {
    try {
      let query = supabase.from('units').select('*').eq('office_id', officeId);
      if (propertyId) query = query.eq('property_id', propertyId);
      query = query.order('created_at', { ascending: false });
      const { data, error } = await query;
      if (error) return handleError('units.list', error);
      return { data: data || [], error: null };
    } catch (err) {
      return handleError('units.list (exception)', err);
    }
  },

  /** جلب وحدة واحدة بالمعرّف */
  get: async (id) => {
    try {
      const { data, error } = await supabase.from('units').select('*').eq('id', id).single();
      if (error) return handleError('units.get', error);
      return { data, error: null };
    } catch (err) {
      return handleError('units.get (exception)', err);
    }
  },

  /** إنشاء وحدة جديدة */
  create: async (unit) => {
    try {
      const { data, error } = await supabase.from('units').insert(unit).select('*').single();
      if (error) return handleError('units.create', error);
      return { data, error: null };
    } catch (err) {
      return handleError('units.create (exception)', err);
    }
  },

  /** تحديث بيانات وحدة */
  update: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('units')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();
      if (error) return handleError('units.update', error);
      return { data, error: null };
    } catch (err) {
      return handleError('units.update (exception)', err);
    }
  },

  /** حذف وحدة */
  remove: async (id) => {
    try {
      const { error } = await supabase.from('units').delete().eq('id', id);
      if (error) return handleError('units.remove', error);
      return { data: null, error: null };
    } catch (err) {
      return handleError('units.remove (exception)', err);
    }
  },
};

export { properties, units };
