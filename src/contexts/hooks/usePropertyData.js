/*
  قيد العقار (Finance Flow)
  usePropertyData.js — hook مجالي للعقارات والوحدات

  يدير state + fetch + CRUD للعقارات والوحدات معًا.
  يُستخدم داخل DataContext فقط — لا يُصدّر للصفحات مباشرة.
*/

import { useState, useCallback, useRef } from 'react';
import { supabaseStore } from '../../core/supabase-store.js';
import { stableSetArray, toCamelCase, toSnakeCase } from './data-utils.js';

/**
 * hook مجالي للعقارات والوحدات — يُستخدم داخل DataProvider فقط
 * @param {string|null} officeId - معرّف المكتب
 * @param {string|null} userId - معرّف المستخدم
 * @param {boolean} useLocalFallback - هل نستخدم localStorage؟
 * @param {Function} safeGet - دالة قراءة آمنة من localStorage
 * @param {string} propertiesKey - مفتاح التخزين المحلي للعقارات
 * @param {string} unitsKey - مفتاح التخزين المحلي للوحدات
 * @returns {Object} بيانات وعمليات العقارات والوحدات
 */
export function usePropertyData(officeId, userId, useLocalFallback, safeGet, propertiesKey, unitsKey) {
  // ─── العقارات ─────────────────────────────────────────
  const [properties, setProperties] = useState(() =>
    useLocalFallback ? safeGet(propertiesKey, []) : []
  );
  const [propertiesLoading, setPropertiesLoading] = useState(false);
  const propertiesRef = useRef([]);

  // ─── الوحدات ──────────────────────────────────────────
  const [units, setUnits] = useState(() =>
    useLocalFallback ? safeGet(unitsKey, []) : []
  );
  const [unitsLoading, setUnitsLoading] = useState(false);
  const unitsRef = useRef([]);

  // ═══════════════════════════════════════
  // Fetch
  // ═══════════════════════════════════════

  const fetchProperties = useCallback(
    async (filters = {}) => {
      setPropertiesLoading(true);
      try {
        if (!officeId) return;
        const { data } = await supabaseStore.properties.list(officeId, filters);
        const mapped = (data || []).map(toCamelCase);
        stableSetArray(setProperties, mapped, propertiesRef);
      } catch (err) {
        console.error('[قيد العقار] fetchProperties:', err);
      } finally {
        setPropertiesLoading(false);
      }
    },
    [officeId]
  );

  const fetchUnits = useCallback(
    async (propertyId = null) => {
      setUnitsLoading(true);
      try {
        if (!officeId) return;
        const { data } = await supabaseStore.units.list(officeId, propertyId);
        const mapped = (data || []).map(toCamelCase);
        stableSetArray(setUnits, mapped, unitsRef);
      } catch (err) {
        console.error('[قيد العقار] fetchUnits:', err);
      } finally {
        setUnitsLoading(false);
      }
    },
    [officeId]
  );

  // ═══════════════════════════════════════
  // CRUD — العقارات
  // ═══════════════════════════════════════

  const createProperty = useCallback(
    async (property) => {
      try {
        const payload = toSnakeCase({
          ...property,
          officeId,
          createdBy: userId,
        });
        delete payload.id;
        delete payload.updated_at;
        delete payload.created_at;
        const { data, error } = await supabaseStore.properties.create(payload);
        if (error) throw error;
        await fetchProperties();
        return { data: toCamelCase(data), error: null };
      } catch (err) {
        console.error('[قيد العقار] createProperty:', err);
        return { data: null, error: err };
      }
    },
    [officeId, userId, fetchProperties]
  );

  const updateProperty = useCallback(
    async (id, updates) => {
      try {
        const payload = toSnakeCase(updates);
        delete payload.id;
        delete payload.created_at;
        const { data, error } = await supabaseStore.properties.update(id, payload);
        if (error) throw error;
        await fetchProperties();
        return { data: toCamelCase(data), error: null };
      } catch (err) {
        console.error('[قيد العقار] updateProperty:', err);
        return { data: null, error: err };
      }
    },
    [fetchProperties]
  );

  const deleteProperty = useCallback(
    async (id) => {
      try {
        const { error } = await supabaseStore.properties.remove(id);
        if (error) throw error;
        await fetchProperties();
        return { error: null };
      } catch (err) {
        console.error('[قيد العقار] deleteProperty:', err);
        return { error: err };
      }
    },
    [fetchProperties]
  );

  // ═══════════════════════════════════════
  // CRUD — الوحدات
  // ═══════════════════════════════════════

  const createUnit = useCallback(
    async (unit) => {
      try {
        const payload = toSnakeCase({
          ...unit,
          officeId,
          createdBy: userId,
        });
        delete payload.id;
        delete payload.updated_at;
        delete payload.created_at;
        const { data, error } = await supabaseStore.units.create(payload);
        if (error) throw error;
        await fetchUnits();
        return { data: toCamelCase(data), error: null };
      } catch (err) {
        console.error('[قيد العقار] createUnit:', err);
        return { data: null, error: err };
      }
    },
    [officeId, userId, fetchUnits]
  );

  const updateUnit = useCallback(
    async (id, updates) => {
      try {
        const payload = toSnakeCase(updates);
        delete payload.id;
        delete payload.created_at;
        const { data, error } = await supabaseStore.units.update(id, payload);
        if (error) throw error;
        await fetchUnits();
        return { data: toCamelCase(data), error: null };
      } catch (err) {
        console.error('[قيد العقار] updateUnit:', err);
        return { data: null, error: err };
      }
    },
    [fetchUnits]
  );

  const deleteUnit = useCallback(
    async (id) => {
      try {
        const { error } = await supabaseStore.units.remove(id);
        if (error) throw error;
        await fetchUnits();
        return { error: null };
      } catch (err) {
        console.error('[قيد العقار] deleteUnit:', err);
        return { error: err };
      }
    },
    [fetchUnits]
  );

  return {
    properties,
    setProperties,
    propertiesLoading,
    fetchProperties,
    createProperty,
    updateProperty,
    deleteProperty,
    units,
    setUnits,
    unitsLoading,
    fetchUnits,
    createUnit,
    updateUnit,
    deleteUnit,
  };
}
