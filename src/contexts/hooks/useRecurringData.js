/*
  قيد العقار (Finance Flow)
  useRecurringData.js — hook مجالي للبنود المتكررة

  يدير state + fetch + CRUD للالتزامات المتكررة.
  يُستخدم داخل DataContext فقط — لا يُصدّر للصفحات مباشرة.
*/

import { useState, useCallback, useRef } from 'react';
import { supabaseStore } from '../../core/supabase-store.js';
import { stableSetArray, toCamelCase, toSnakeCase } from './data-utils.js';

/**
 * hook مجالي للبنود المتكررة — يُستخدم داخل DataProvider فقط
 * @param {string|null} officeId - معرّف المكتب
 * @param {string|null} userId - معرّف المستخدم
 * @returns {Object} بيانات وعمليات البنود المتكررة
 */
export function useRecurringData(officeId, userId) {
  const [recurringItems, setRecurringItems] = useState([]);
  const [recurringLoading, setRecurringLoading] = useState(false);
  const recurringRef = useRef([]);

  const fetchRecurringItems = useCallback(
    async (ledgerId = null) => {
      setRecurringLoading(true);
      try {
        if (!officeId) return;
        const { data } = await supabaseStore.recurringItems.list(officeId, ledgerId);
        const mapped = (data || []).map(toCamelCase);
        stableSetArray(setRecurringItems, mapped, recurringRef);
      } catch (err) {
        console.error('[قيد العقار] fetchRecurringItems:', err);
      } finally {
        setRecurringLoading(false);
      }
    },
    [officeId]
  );

  const createRecurringItem = useCallback(
    async (item) => {
      try {
        const payload = toSnakeCase({
          ...item,
          officeId,
          createdBy: userId,
        });
        delete payload.id;
        const { data, error } = await supabaseStore.recurringItems.create(payload);
        if (error) throw error;
        await fetchRecurringItems();
        return { data: toCamelCase(data), error: null };
      } catch (err) {
        console.error('[قيد العقار] createRecurringItem:', err);
        return { data: null, error: err };
      }
    },
    [officeId, userId, fetchRecurringItems]
  );

  const updateRecurringItem = useCallback(
    async (id, updates) => {
      try {
        const payload = toSnakeCase(updates);
        delete payload.id;
        delete payload.created_at;
        const { data, error } = await supabaseStore.recurringItems.update(id, payload);
        if (error) throw error;
        await fetchRecurringItems();
        return { data: toCamelCase(data), error: null };
      } catch (err) {
        console.error('[قيد العقار] updateRecurringItem:', err);
        return { data: null, error: err };
      }
    },
    [fetchRecurringItems]
  );

  const deleteRecurringItem = useCallback(
    async (id) => {
      try {
        const { error } = await supabaseStore.recurringItems.remove(id);
        if (error) throw error;
        await fetchRecurringItems();
        return { error: null };
      } catch (err) {
        console.error('[قيد العقار] deleteRecurringItem:', err);
        return { error: err };
      }
    },
    [fetchRecurringItems]
  );

  return {
    recurringItems,
    setRecurringItems,
    recurringLoading,
    fetchRecurringItems,
    createRecurringItem,
    updateRecurringItem,
    deleteRecurringItem,
  };
}
