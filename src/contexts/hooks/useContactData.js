/*
  قيد العقار (Finance Flow)
  useContactData.js — hook مجالي لجهات الاتصال

  يدير state + fetch + CRUD لجهات الاتصال.
  يُستخدم داخل DataContext فقط — لا يُصدّر للصفحات مباشرة.
*/

import { useState, useCallback, useRef } from 'react';
import { supabaseStore } from '../../core/supabase-store.js';
import { stableSetArray, toCamelCase, toSnakeCase } from './data-utils.js';

/**
 * hook مجالي لجهات الاتصال — يُستخدم داخل DataProvider فقط
 * @param {string|null} officeId - معرّف المكتب
 * @param {string|null} userId - معرّف المستخدم
 * @param {boolean} useLocalFallback - هل نستخدم localStorage؟
 * @param {Function} safeGet - دالة قراءة آمنة من localStorage
 * @param {string} storageKey - مفتاح التخزين المحلي
 * @returns {Object} بيانات وعمليات جهات الاتصال
 */
export function useContactData(officeId, userId, useLocalFallback, safeGet, storageKey) {
  const [contacts, setContacts] = useState(() =>
    useLocalFallback ? safeGet(storageKey, []) : []
  );
  const [contactsLoading, setContactsLoading] = useState(false);
  const contactsRef = useRef([]);

  const fetchContacts = useCallback(
    async (filters = {}) => {
      setContactsLoading(true);
      try {
        if (!officeId) return;
        const { data } = await supabaseStore.contacts.list(officeId, filters);
        const mapped = (data || []).map(toCamelCase);
        stableSetArray(setContacts, mapped, contactsRef);
      } catch (err) {
        console.error('[قيد العقار] fetchContacts:', err);
      } finally {
        setContactsLoading(false);
      }
    },
    [officeId]
  );

  const createContact = useCallback(
    async (contact) => {
      try {
        const payload = toSnakeCase({
          ...contact,
          officeId,
          createdBy: userId,
        });
        delete payload.id;
        delete payload.updated_at;
        delete payload.created_at;
        const { data, error } = await supabaseStore.contacts.create(payload);
        if (error) throw error;
        await fetchContacts();
        return { data: toCamelCase(data), error: null };
      } catch (err) {
        console.error('[قيد العقار] createContact:', err);
        return { data: null, error: err };
      }
    },
    [officeId, userId, fetchContacts]
  );

  const updateContact = useCallback(
    async (id, updates) => {
      try {
        const payload = toSnakeCase(updates);
        delete payload.id;
        delete payload.created_at;
        const { data, error } = await supabaseStore.contacts.update(id, payload);
        if (error) throw error;
        await fetchContacts();
        return { data: toCamelCase(data), error: null };
      } catch (err) {
        console.error('[قيد العقار] updateContact:', err);
        return { data: null, error: err };
      }
    },
    [fetchContacts]
  );

  const deleteContact = useCallback(
    async (id) => {
      try {
        const { error } = await supabaseStore.contacts.remove(id);
        if (error) throw error;
        await fetchContacts();
        return { error: null };
      } catch (err) {
        console.error('[قيد العقار] deleteContact:', err);
        return { error: err };
      }
    },
    [fetchContacts]
  );

  return {
    contacts,
    setContacts,
    contactsLoading,
    fetchContacts,
    createContact,
    updateContact,
    deleteContact,
  };
}
