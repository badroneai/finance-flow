/*
  قيد العقار (Finance Flow)
  supabase-store.js — طبقة بيانات Supabase الوحيدة

  كل دالة async وتُرجع { data, error } بنفس نمط Supabase.
  جميع الـ 17 جدول مُنفذة بالكامل.
*/

import { supabase } from './supabase.js';
import { profile, office } from './stores/auth-store.js';
import { drafts } from './stores/content-store.js';
import { contacts, contactActivities } from './stores/contact-store.js';
import { properties, units } from './stores/property-store.js';
import { ledgers, transactions, recurringItems, commissions } from './stores/ledger-store.js';
import { contracts, contractReceipts, paymentSchedule } from './stores/contract-store.js';
import { maintenanceRequests, notifications, supportTickets } from './stores/ops-store.js';

// ═══════════════════════════════════════
// دالة مساعدة للأخطاء
// ═══════════════════════════════════════
function handleError(operation, error) {
  console.error(`[قيد العقار] ${operation}:`, error);
  return { data: null, error };
}

// ═══════════════════════════════════════
// سجل العمليات (audit_log) — append-only
// ═══════════════════════════════════════
const auditLog = {
  /** تسجيل عملية جديدة */
  log: async (entry) => {
    try {
      const { data, error } = await supabase.from('audit_log').insert(entry).select('*').single();
      if (error) return handleError('auditLog.log', error);
      return { data, error: null };
    } catch (err) {
      return handleError('auditLog.log (exception)', err);
    }
  },

  /** جلب سجل العمليات لمكتب مع فلاتر اختيارية */
  list: async (officeId, filters = {}) => {
    try {
      let query = supabase.from('audit_log').select('*').eq('office_id', officeId);
      if (filters.action) query = query.eq('action', filters.action);
      if (filters.entityType) query = query.eq('entity_type', filters.entityType);
      if (filters.entityId) query = query.eq('entity_id', filters.entityId);
      if (filters.performedBy) query = query.eq('performed_by', filters.performedBy);
      if (filters.from) query = query.gte('created_at', filters.from);
      if (filters.to) query = query.lte('created_at', filters.to);
      query = query.order('created_at', { ascending: false });
      if (filters.limit) query = query.limit(filters.limit);
      const { data, error } = await query;
      if (error) return handleError('auditLog.list', error);
      return { data: data || [], error: null };
    } catch (err) {
      return handleError('auditLog.list (exception)', err);
    }
  },
};

// ═══════════════════════════════════════
// المرفقات (attachments)
// ═══════════════════════════════════════
const attachments = {
  /** جلب مرفقات كيان معين */
  list: async (officeId, entityType = null, entityId = null) => {
    try {
      let query = supabase.from('attachments').select('*').eq('office_id', officeId);
      if (entityType) query = query.eq('entity_type', entityType);
      if (entityId) query = query.eq('entity_id', entityId);
      query = query.order('created_at', { ascending: false });
      const { data, error } = await query;
      if (error) return handleError('attachments.list', error);
      return { data: data || [], error: null };
    } catch (err) {
      return handleError('attachments.list (exception)', err);
    }
  },

  /** إنشاء سجل مرفق (بعد رفع الملف إلى Storage) */
  create: async (metadata) => {
    try {
      const { data, error } = await supabase
        .from('attachments')
        .insert(metadata)
        .select('*')
        .single();
      if (error) return handleError('attachments.create', error);
      return { data, error: null };
    } catch (err) {
      return handleError('attachments.create (exception)', err);
    }
  },

  /** حذف مرفق */
  remove: async (id) => {
    try {
      const { error } = await supabase.from('attachments').delete().eq('id', id);
      if (error) return handleError('attachments.remove', error);
      return { data: null, error: null };
    } catch (err) {
      return handleError('attachments.remove (exception)', err);
    }
  },
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
  units,
  contracts,
  contractReceipts,
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
