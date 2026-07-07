/*
  قيد العقار (Finance Flow)
  useCommissionData.js — hook مجالي للعمولات

  يدير state + fetch + CRUD للعمولات.
  يُستخدم داخل DataContext فقط — لا يُصدّر للصفحات مباشرة.
*/

import { useState, useCallback, useRef } from 'react';
import { supabaseStore } from '../../core/supabase-store.js';
import { stableSetArray, toCamelCase, toSnakeCase } from './data-utils.js';

/**
 * hook مجالي للعمولات — يُستخدم داخل DataProvider فقط
 * @param {string|null} officeId - معرّف المكتب
 * @param {string|null} userId - معرّف المستخدم
 * @param {boolean} useLocalFallback - هل نستخدم localStorage؟
 * @param {Function} safeGet - دالة قراءة آمنة من localStorage
 * @param {string} storageKey - مفتاح التخزين المحلي
 * @returns {Object} بيانات وعمليات العمولات
 */
export function useCommissionData(officeId, userId, useLocalFallback, safeGet, storageKey) {
  const [commissions, setCommissions] = useState(() =>
    useLocalFallback ? safeGet(storageKey, []) : []
  );
  const [commissionsLoading, setCommissionsLoading] = useState(false);
  const commissionsRef = useRef([]);

  const fetchCommissions = useCallback(
    async (filters = {}) => {
      setCommissionsLoading(true);
      try {
        if (!officeId) return;
        const { data } = await supabaseStore.commissions.list(officeId, filters);
        const mapped = (data || []).map(toCamelCase);
        stableSetArray(setCommissions, mapped, commissionsRef);
      } catch (err) {
        console.error('[قيد العقار] fetchCommissions:', err);
      } finally {
        setCommissionsLoading(false);
      }
    },
    [officeId]
  );

  const createCommission = useCallback(
    async (commission) => {
      try {
        const payload = toSnakeCase({
          ...commission,
          officeId,
          createdBy: userId,
        });
        delete payload.id;
        const { data, error } = await supabaseStore.commissions.create(payload);
        if (error) throw error;
        await fetchCommissions();
        return { data: toCamelCase(data), error: null };
      } catch (err) {
        console.error('[قيد العقار] createCommission:', err);
        return { data: null, error: err };
      }
    },
    [officeId, userId, fetchCommissions]
  );

  const updateCommission = useCallback(
    async (id, updates) => {
      try {
        const payload = toSnakeCase(updates);
        delete payload.id;
        delete payload.created_at;
        const { data, error } = await supabaseStore.commissions.update(id, payload);
        if (error) throw error;
        await fetchCommissions();
        return { data: toCamelCase(data), error: null };
      } catch (err) {
        console.error('[قيد العقار] updateCommission:', err);
        return { data: null, error: err };
      }
    },
    [fetchCommissions]
  );

  const deleteCommission = useCallback(
    async (id) => {
      try {
        const { error } = await supabaseStore.commissions.remove(id);
        if (error) throw error;
        await fetchCommissions();
        return { error: null };
      } catch (err) {
        console.error('[قيد العقار] deleteCommission:', err);
        return { error: err };
      }
    },
    [fetchCommissions]
  );

  return {
    commissions,
    setCommissions,
    commissionsLoading,
    fetchCommissions,
    createCommission,
    updateCommission,
    deleteCommission,
  };
}
