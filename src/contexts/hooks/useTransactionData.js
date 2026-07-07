/*
  قيد العقار (Finance Flow)
  useTransactionData.js — hook مجالي للحركات المالية

  يدير state + fetch + CRUD للحركات المالية (transactions).
  يُستخدم داخل DataContext فقط — لا يُصدّر للصفحات مباشرة.
*/

import { useState, useCallback, useRef } from 'react';
import { supabaseStore } from '../../core/supabase-store.js';
import { stableSetArray, toCamelCase, toSnakeCase } from './data-utils.js';

/**
 * hook مجالي للحركات المالية — يُستخدم داخل DataProvider فقط
 * @param {string|null} officeId - معرّف المكتب
 * @param {string|null} userId - معرّف المستخدم
 * @param {string|null} activeLedgerId - معرّف الدفتر النشط (من useLedgerData)
 * @param {boolean} useLocalFallback - هل نستخدم localStorage؟
 * @param {Function} safeGet - دالة قراءة آمنة من localStorage
 * @param {string} storageKey - مفتاح التخزين المحلي
 * @returns {Object} بيانات وعمليات الحركات المالية
 */
export function useTransactionData(officeId, userId, activeLedgerId, useLocalFallback, safeGet, storageKey) {
  const [transactions, setTransactions] = useState(() =>
    useLocalFallback ? safeGet(storageKey, []) : []
  );
  const [transactionsLoading, setTransactionsLoading] = useState(!useLocalFallback);
  const transactionsRef = useRef([]);

  const fetchTransactions = useCallback(
    async (filters = {}) => {
      setTransactionsLoading(true);
      try {
        if (!officeId) return;
        // حوّل فلاتر camelCase إلى snake_case لـ Supabase
        const sbFilters = {};
        if (filters.ledgerId) sbFilters.ledgerId = filters.ledgerId;
        if (filters.type) sbFilters.type = filters.type;
        if (filters.category) sbFilters.category = filters.category;
        if (filters.paymentMethod) sbFilters.paymentMethod = filters.paymentMethod;
        if (filters.startDate || filters.fromDate)
          sbFilters.startDate = filters.startDate || filters.fromDate;
        if (filters.endDate || filters.toDate)
          sbFilters.endDate = filters.endDate || filters.toDate;
        if (filters.search) sbFilters.search = filters.search;

        const { data } = await supabaseStore.transactions.list(officeId, sbFilters);
        const mapped = (data || []).map(toCamelCase);
        stableSetArray(setTransactions, mapped, transactionsRef);
      } catch (err) {
        console.error('[قيد العقار] fetchTransactions:', err);
      } finally {
        setTransactionsLoading(false);
      }
    },
    [officeId]
  );

  const createTransaction = useCallback(
    async (tx) => {
      try {
        const payload = toSnakeCase({
          ...tx,
          officeId,
          ledgerId: tx.ledgerId || tx.ledger_id || activeLedgerId,
          createdBy: userId,
        });
        delete payload.id;
        delete payload.updated_at;
        delete payload.created_at;

        const { data, error } = await supabaseStore.transactions.create(payload);
        if (error) throw error;
        await fetchTransactions();
        return { data: toCamelCase(data), error: null };
      } catch (err) {
        console.error('[قيد العقار] createTransaction:', err);
        return { data: null, error: err };
      }
    },
    [officeId, userId, activeLedgerId, fetchTransactions]
  );

  const updateTransaction = useCallback(
    async (id, updates) => {
      try {
        const payload = toSnakeCase(updates);
        delete payload.id;
        delete payload.created_at;
        const { data, error } = await supabaseStore.transactions.update(id, payload);
        if (error) throw error;
        await fetchTransactions();
        return { data: toCamelCase(data), error: null };
      } catch (err) {
        console.error('[قيد العقار] updateTransaction:', err);
        return { data: null, error: err };
      }
    },
    [fetchTransactions]
  );

  const deleteTransaction = useCallback(
    async (id) => {
      try {
        const { error } = await supabaseStore.transactions.remove(id);
        if (error) throw error;
        await fetchTransactions();
        return { error: null };
      } catch (err) {
        console.error('[قيد العقار] deleteTransaction:', err);
        return { error: err };
      }
    },
    [fetchTransactions]
  );

  return {
    transactions,
    setTransactions,
    transactionsLoading,
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  };
}
