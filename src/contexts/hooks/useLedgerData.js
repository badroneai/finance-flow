/*
  قيد العقار (Finance Flow)
  useLedgerData.js — hook مجالي للدفاتر

  يدير state + fetch + CRUD للدفاتر + الدفتر النشط.
  يُستخدم داخل DataContext فقط — لا يُصدّر للصفحات مباشرة.
*/

import { useState, useCallback, useEffect, useRef } from 'react';
import { supabaseStore } from '../../core/supabase-store.js';
import { stableSetArray, toCamelCase, toSnakeCase } from './data-utils.js';

/**
 * hook مجالي للدفاتر — يُستخدم داخل DataProvider فقط
 * @param {string|null} officeId - معرّف المكتب
 * @param {string|null} userId - معرّف المستخدم
 * @param {boolean} useLocalFallback - هل نستخدم localStorage؟
 * @returns {Object} بيانات وعمليات الدفاتر
 */
export function useLedgerData(officeId, userId, useLocalFallback) {
  const [ledgers, setLedgers] = useState([]);
  const [activeLedgerId, _setActiveLedgerId] = useState(null);
  const [ledgersLoading, setLedgersLoading] = useState(!useLocalFallback);
  const ledgersRef = useRef([]);

  const fetchLedgers = useCallback(async () => {
    setLedgersLoading(true);
    try {
      if (!officeId) return;
      const { data } = await supabaseStore.ledgers.list(officeId);
      const mapped = (data || []).map(toCamelCase);
      stableSetArray(setLedgers, mapped, ledgersRef);
    } catch (err) {
      console.error('[قيد العقار] fetchLedgers:', err);
    } finally {
      setLedgersLoading(false);
    }
  }, [officeId]);

  const createLedger = useCallback(
    async (ledger) => {
      try {
        const payload = toSnakeCase({
          ...ledger,
          officeId,
          createdBy: userId,
        });
        delete payload.id;
        const { data, error } = await supabaseStore.ledgers.create(payload);
        if (error) throw error;
        await fetchLedgers();
        return { data: toCamelCase(data), error: null };
      } catch (err) {
        console.error('[قيد العقار] createLedger:', err);
        return { data: null, error: err };
      }
    },
    [officeId, userId, fetchLedgers]
  );

  const updateLedger = useCallback(
    async (id, updates) => {
      try {
        const payload = toSnakeCase(updates);
        delete payload.id;
        delete payload.created_at;
        const { data, error } = await supabaseStore.ledgers.update(id, payload);
        if (error) throw error;
        await fetchLedgers();
        return { data: toCamelCase(data), error: null };
      } catch (err) {
        console.error('[قيد العقار] updateLedger:', err);
        return { data: null, error: err };
      }
    },
    [fetchLedgers]
  );

  const deleteLedger = useCallback(
    async (id) => {
      try {
        const { error } = await supabaseStore.ledgers.remove(id);
        if (error) throw error;
        await fetchLedgers();
        return { error: null };
      } catch (err) {
        console.error('[قيد العقار] deleteLedger:', err);
        return { error: err };
      }
    },
    [fetchLedgers]
  );

  const setActiveLedgerId = useCallback((id) => {
    _setActiveLedgerId(id);
  }, []);

  // تحديد الدفتر النشط الأولي — أول دفتر متاح
  useEffect(() => {
    if (ledgers.length > 0 && !activeLedgerId) {
      _setActiveLedgerId(ledgers[0].id);
    }
  }, [ledgers, activeLedgerId]);

  return {
    ledgers,
    activeLedgerId,
    setActiveLedgerId,
    ledgersLoading,
    fetchLedgers,
    createLedger,
    updateLedger,
    deleteLedger,
  };
}
