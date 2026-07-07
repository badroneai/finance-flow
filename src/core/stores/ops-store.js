/*
  قيد العقار (Finance Flow)
  ops-store.js — عمليات الصيانة والإشعارات وتذاكر الدعم

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
// طلبات الصيانة (maintenance_requests)
// ═══════════════════════════════════════
const maintenanceRequests = {
  /** جلب جميع طلبات الصيانة لمكتب مع فلاتر اختيارية */
  list: async (officeId, filters = {}) => {
    try {
      let query = supabase.from('maintenance_requests').select('*').eq('office_id', officeId);
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.priority) query = query.eq('priority', filters.priority);
      if (filters.propertyId) query = query.eq('property_id', filters.propertyId);
      if (filters.category) query = query.eq('category', filters.category);
      query = query.order('created_at', { ascending: false });
      const { data, error } = await query;
      if (error) return handleError('maintenanceRequests.list', error);
      return { data: data || [], error: null };
    } catch (err) {
      return handleError('maintenanceRequests.list (exception)', err);
    }
  },

  /** جلب طلب صيانة واحد بالمعرّف */
  get: async (id) => {
    try {
      const { data, error } = await supabase
        .from('maintenance_requests')
        .select('*')
        .eq('id', id)
        .single();
      if (error) return handleError('maintenanceRequests.get', error);
      return { data, error: null };
    } catch (err) {
      return handleError('maintenanceRequests.get (exception)', err);
    }
  },

  /** إنشاء طلب صيانة جديد */
  create: async (request) => {
    try {
      const { data, error } = await supabase
        .from('maintenance_requests')
        .insert(request)
        .select('*')
        .single();
      if (error) return handleError('maintenanceRequests.create', error);
      return { data, error: null };
    } catch (err) {
      return handleError('maintenanceRequests.create (exception)', err);
    }
  },

  /** تحديث طلب صيانة */
  update: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('maintenance_requests')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();
      if (error) return handleError('maintenanceRequests.update', error);
      return { data, error: null };
    } catch (err) {
      return handleError('maintenanceRequests.update (exception)', err);
    }
  },

  /** حذف طلب صيانة */
  remove: async (id) => {
    try {
      const { error } = await supabase.from('maintenance_requests').delete().eq('id', id);
      if (error) return handleError('maintenanceRequests.remove', error);
      return { data: null, error: null };
    } catch (err) {
      return handleError('maintenanceRequests.remove (exception)', err);
    }
  },
};

// ═══════════════════════════════════════
// الإشعارات (notifications)
// ═══════════════════════════════════════
const notifications = {
  /** جلب إشعارات المستخدم */
  list: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) return handleError('notifications.list', error);
      return { data: data || [], error: null };
    } catch (err) {
      return handleError('notifications.list (exception)', err);
    }
  },

  /** تعليم إشعار كمقروء */
  markRead: async (id) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', id)
        .select('*')
        .single();
      if (error) return handleError('notifications.markRead', error);
      return { data, error: null };
    } catch (err) {
      return handleError('notifications.markRead (exception)', err);
    }
  },

  /** تعليم كل الإشعارات كمقروءة */
  markAllRead: async (userId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('is_read', false);
      if (error) return handleError('notifications.markAllRead', error);
      return { data: null, error: null };
    } catch (err) {
      return handleError('notifications.markAllRead (exception)', err);
    }
  },
};

// ═══════════════════════════════════════
// تذاكر الدعم (support_tickets)
// ═══════════════════════════════════════
const supportTickets = {
  /** جلب جميع تذاكر المكتب */
  list: async (officeId) => {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('office_id', officeId)
        .order('created_at', { ascending: false });
      if (error) return handleError('supportTickets.list', error);
      return { data: data || [], error: null };
    } catch (err) {
      return handleError('supportTickets.list (exception)', err);
    }
  },

  /** إنشاء تذكرة دعم جديدة */
  create: async (ticket) => {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .insert(ticket)
        .select('*')
        .single();
      if (error) return handleError('supportTickets.create', error);
      return { data, error: null };
    } catch (err) {
      return handleError('supportTickets.create (exception)', err);
    }
  },

  /** تحديث تذكرة دعم */
  update: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();
      if (error) return handleError('supportTickets.update', error);
      return { data, error: null };
    } catch (err) {
      return handleError('supportTickets.update (exception)', err);
    }
  },
};

export { maintenanceRequests, notifications, supportTickets };
