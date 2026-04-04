/*
  قيد العقار (Finance Flow)
  DataContext.jsx — طبقة البيانات الموحّدة

  يتعامل مع Supabase كقاعدة بيانات وحيدة.
  تحويل أسماء الحقول:
  - الواجهة تستخدم camelCase: ledgerId, paymentMethod, createdAt
  - Supabase يستخدم snake_case: ledger_id, payment_method, created_at
  - toCamelCase/toSnakeCase تحوّل بين الصيغتين تلقائياً
*/

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { supabaseStore } from '../core/supabase-store.js';
import { isSupabaseConfigured } from '../core/supabase.js';
import { safeGet } from '../core/dataStore.js';
import { KEYS } from '../constants/index.js';
import { useAuth } from './AuthContext.jsx';

// ═══════════════════════════════════════
// تحويل أسماء الحقول
// ═══════════════════════════════════════

/**
 * مُنشئ دالة setState مستقرة — تمنع إعادة الرسم إذا البيانات لم تتغير فعلاً.
 * للبيانات المُحمّلة من Supabase (مراجع جديدة كل مرة)، نقارن بالمحتوى.
 */
function stableSetArray(setter, newArr, prevRef) {
  // المقارنة: نفس الأعداد ونفس الـ IDs بنفس الترتيب
  const prev = prevRef.current;
  if (prev.length === newArr.length) {
    let same = true;
    for (let i = 0; i < prev.length; i++) {
      if (prev[i]?.id !== newArr[i]?.id || prev[i]?.updatedAt !== newArr[i]?.updatedAt) {
        same = false;
        break;
      }
    }
    if (same) return; // لا تغيير — لا نُحدّث الحالة
  }
  prevRef.current = newArr;
  setter(newArr);
}

/** يحوّل مفاتيح الكائن من snake_case إلى camelCase */
function toCamelCase(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toCamelCase);
  if (obj instanceof Date) return obj;

  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    result[camelKey] =
      value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)
        ? toCamelCase(value)
        : value;
  }
  return result;
}

/** يحوّل مفاتيح الكائن من camelCase إلى snake_case */
function toSnakeCase(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toSnakeCase);
  if (obj instanceof Date) return obj;

  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase());
    result[snakeKey] = value;
  }
  return result;
}

// ═══════════════════════════════════════
// السياق
// ═══════════════════════════════════════
const DataContext = createContext(null);

// ═══════════════════════════════════════
// المزوّد
// ═══════════════════════════════════════
export function DataProvider({ children }) {
  const { profile } = useAuth();
  const officeId = profile?.office_id;
  const userId = profile?.id;

  // ─── localStorage fallback: قراءة البيانات المحلية كحالة ابتدائية ──
  // عندما لا يكون Supabase مُعداً، نستخدم بيانات seed من localStorage مباشرة
  const useLocalFallback = !isSupabaseConfigured;

  // ─── الدفاتر ───────────────────────────────────────────
  const [ledgers, setLedgers] = useState([]);
  const [activeLedgerId, _setActiveLedgerId] = useState(null);
  const [ledgersLoading, setLedgersLoading] = useState(!useLocalFallback);

  // ─── الحركات ───────────────────────────────────────────
  const [transactions, setTransactions] = useState(() =>
    useLocalFallback ? safeGet(KEYS.transactions, []) : []
  );
  const [transactionsLoading, setTransactionsLoading] = useState(!useLocalFallback);

  // ─── الالتزامات المتكررة ────────────────────────────────
  const [recurringItems, setRecurringItems] = useState([]);
  const [recurringLoading, setRecurringLoading] = useState(false);

  // ─── العمولات ──────────────────────────────────────────
  const [commissions, setCommissions] = useState(() =>
    useLocalFallback ? safeGet(KEYS.commissions, []) : []
  );
  const [commissionsLoading, setCommissionsLoading] = useState(false);

  // ─── العقارات — SPR-018 ─────────────────────────────────
  const [properties, setProperties] = useState(() =>
    useLocalFallback ? safeGet(KEYS.properties, []) : []
  );
  const [propertiesLoading, setPropertiesLoading] = useState(false);

  // ─── الوحدات — SPR-019 ───────────────────────────────────
  const [units, setUnits] = useState(() => (useLocalFallback ? safeGet(KEYS.units, []) : []));
  const [unitsLoading, setUnitsLoading] = useState(false);

  // ─── جهات الاتصال — SPR-018 ────────────────────────────
  const [contacts, setContacts] = useState(() =>
    useLocalFallback ? safeGet(KEYS.contacts, []) : []
  );
  const [contactsLoading, setContactsLoading] = useState(false);

  // ─── العقود — SPR-018 ──────────────────────────────────
  const [contracts, setContracts] = useState(() =>
    useLocalFallback ? safeGet(KEYS.contracts, []) : []
  );
  const [contractsLoading, setContractsLoading] = useState(false);

  // ─── دفعات العقود — المرحلة التشغيلية ────────────────────
  const [contractPayments, setContractPayments] = useState(() =>
    useLocalFallback ? safeGet(KEYS.contractPayments, []) : []
  );
  const [contractPaymentsLoading, setContractPaymentsLoading] = useState(false);

  // ─── سندات القبض — إيصالات محفوظة مرتبطة بالدفعات ──────
  const [contractReceipts, setContractReceipts] = useState(() =>
    useLocalFallback ? safeGet(KEYS.contractReceipts, []) : []
  );
  const [contractReceiptsLoading, setContractReceiptsLoading] = useState(false);

  // ─── مراجع المقارنة (لمنع إعادة الرسم غير الضرورية) ──
  const ledgersRef = useRef([]);
  const transactionsRef = useRef([]);
  const recurringRef = useRef([]);
  const commissionsRef = useRef([]);
  const propertiesRef = useRef([]);
  const unitsRef = useRef([]);
  const contactsRef = useRef([]);
  const contractsRef = useRef([]);
  const contractPaymentsRef = useRef([]);
  const contractReceiptsRef = useRef([]);

  // ═══════════════════════════════════════
  // جلب البيانات
  // ═══════════════════════════════════════

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

  // ─── جلب العقارات — SPR-018 ────────────────────────────
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

  // ─── جلب الوحدات ───────────────────────────────────────────
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

  // ─── جلب جهات الاتصال — SPR-018 ────────────────────────
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

  // ─── جلب العقود — SPR-018 ──────────────────────────────
  const fetchContracts = useCallback(
    async (filters = {}) => {
      setContractsLoading(true);
      try {
        if (!officeId) return;
        const { data } = await supabaseStore.contracts.list(officeId, filters);
        const mapped = (data || []).map(toCamelCase);
        stableSetArray(setContracts, mapped, contractsRef);
      } catch (err) {
        console.error('[قيد العقار] fetchContracts:', err);
      } finally {
        setContractsLoading(false);
      }
    },
    [officeId]
  );

  // ─── جلب دفعات العقود ───────────────────────────────────────
  const fetchContractPayments = useCallback(
    async (contractId = null) => {
      setContractPaymentsLoading(true);
      try {
        if (!officeId) return;
        const { data } = await supabaseStore.paymentSchedule.list(officeId, contractId);
        const mapped = (data || []).map(toCamelCase);
        stableSetArray(setContractPayments, mapped, contractPaymentsRef);
      } catch (err) {
        console.error('[قيد العقار] fetchContractPayments:', err);
      } finally {
        setContractPaymentsLoading(false);
      }
    },
    [officeId]
  );

  // ─── جلب سندات القبض ───────────────────────────────────────
  const fetchContractReceipts = useCallback(async () => {
    setContractReceiptsLoading(true);
    try {
      if (!officeId) return;
      const { data } = await supabaseStore.contractReceipts.list(officeId);
      const mapped = (data || []).map(toCamelCase);
      stableSetArray(setContractReceipts, mapped, contractReceiptsRef);
    } catch (err) {
      console.error('[قيد العقار] fetchContractReceipts:', err);
    } finally {
      setContractReceiptsLoading(false);
    }
  }, [officeId]);

  // ═══════════════════════════════════════
  // CRUD — الحركات المالية
  // ═══════════════════════════════════════

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

  // ═══════════════════════════════════════
  // CRUD — الدفاتر
  // ═══════════════════════════════════════

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

  // ═══════════════════════════════════════
  // CRUD — الالتزامات المتكررة
  // ═══════════════════════════════════════

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

  // ═══════════════════════════════════════
  // CRUD — العمولات
  // ═══════════════════════════════════════

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

  // ═══════════════════════════════════════
  // CRUD — العقارات (SPR-018)
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

  // ═══════════════════════════════════════
  // CRUD — الوحدات (SPR-019)
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
  // CRUD — جهات الاتصال (SPR-018)
  // ═══════════════════════════════════════

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

  // ═══════════════════════════════════════
  // CRUD — العقود (SPR-018)
  // ═══════════════════════════════════════

  const createContract = useCallback(
    async (contract) => {
      try {
        const payload = toSnakeCase({
          ...contract,
          officeId,
          createdBy: userId,
        });
        delete payload.id;
        delete payload.updated_at;
        delete payload.created_at;
        // حذف الحقول المحسوبة
        delete payload._property_name;
        delete payload._contact_name;
        const { data, error } = await supabaseStore.contracts.create(payload);
        if (error) throw error;
        await fetchContracts();
        return { data: toCamelCase(data), error: null };
      } catch (err) {
        console.error('[قيد العقار] createContract:', err);
        return { data: null, error: err };
      }
    },
    [officeId, userId, fetchContracts]
  );

  const updateContract = useCallback(
    async (id, updates) => {
      try {
        const payload = toSnakeCase(updates);
        delete payload.id;
        delete payload.created_at;
        delete payload._property_name;
        delete payload._contact_name;
        const { data, error } = await supabaseStore.contracts.update(id, payload);
        if (error) throw error;
        await fetchContracts();
        return { data: toCamelCase(data), error: null };
      } catch (err) {
        console.error('[قيد العقار] updateContract:', err);
        return { data: null, error: err };
      }
    },
    [fetchContracts]
  );

  const deleteContract = useCallback(
    async (id) => {
      try {
        const { error } = await supabaseStore.contracts.remove(id);
        if (error) throw error;
        await fetchContracts();
        return { error: null };
      } catch (err) {
        console.error('[قيد العقار] deleteContract:', err);
        return { error: err };
      }
    },
    [fetchContracts]
  );

  // ═══════════════════════════════════════
  // CRUD — دفعات العقود
  // ═══════════════════════════════════════

  const createContractPayment = useCallback(
    async (payment) => {
      try {
        // تحويل حقول buildPaymentPayload إلى schema جدول payment_schedule
        const payload = {
          office_id: officeId,
          contract_id: payment.contractId,
          installment_no: payment.installmentNo || payment.installmentNumber || 0,
          due_date: payment.date || payment.dueDate,
          amount: payment.amount || 0,
          status: payment.status || 'paid',
          paid_amount: payment.amount || 0,
          paid_date: payment.date || payment.dueDate,
          payment_method: payment.paymentMethod || 'cash',
          notes: payment.note || payment.notes || '',
        };
        const { data, error } = await supabaseStore.paymentSchedule.create(payload);
        if (error) throw error;
        await fetchContractPayments();
        return { data: toCamelCase(data), error: null };
      } catch (err) {
        console.error('[قيد العقار] createContractPayment:', err);
        return { data: null, error: err };
      }
    },
    [officeId, fetchContractPayments]
  );

  const updateContractPayment = useCallback(
    async (id, updates) => {
      try {
        // تحويل يدوي لضمان التوافق مع schema payment_schedule
        const payload = {};
        if (updates.amount !== undefined) payload.amount = updates.amount;
        if (updates.amount !== undefined) payload.paid_amount = updates.amount;
        if (updates.date !== undefined) {
          payload.due_date = updates.date;
          payload.paid_date = updates.date;
        }
        if (updates.dueDate !== undefined) payload.due_date = updates.dueDate;
        if (updates.paidDate !== undefined) payload.paid_date = updates.paidDate;
        if (updates.paymentMethod !== undefined) payload.payment_method = updates.paymentMethod;
        if (updates.status !== undefined) payload.status = updates.status;
        if (updates.note !== undefined) payload.notes = updates.note;
        if (updates.notes !== undefined) payload.notes = updates.notes;
        if (updates.installmentNo !== undefined) payload.installment_no = updates.installmentNo;
        if (updates.paidAmount !== undefined) payload.paid_amount = updates.paidAmount;
        const { data, error } = await supabaseStore.paymentSchedule.update(id, payload);
        if (error) throw error;
        await fetchContractPayments();
        return { data: toCamelCase(data), error: null };
      } catch (err) {
        console.error('[قيد العقار] updateContractPayment:', err);
        return { data: null, error: err };
      }
    },
    [fetchContractPayments]
  );

  const deleteContractPayment = useCallback(
    async (id) => {
      try {
        const { error } = await supabaseStore.paymentSchedule.remove(id);
        if (error) throw error;
        await fetchContractPayments();
        return { error: null };
      } catch (err) {
        console.error('[قيد العقار] deleteContractPayment:', err);
        return { error: err };
      }
    },
    [fetchContractPayments]
  );

  // ═══════════════════════════════════════
  // CRUD — سندات القبض
  // ═══════════════════════════════════════

  const createContractReceipt = useCallback(
    async (receipt) => {
      try {
        // ربط يدوي لحقول buildReceiptModel مع أعمدة contract_receipts
        const payload = {
          office_id: officeId,
          created_by: userId,
          contract_id: receipt.contractId || null,
          payment_id: receipt.dueId || null,
          contract_payment_id: receipt.contractPaymentId || null,
          receipt_number: receipt.receiptNumber || '',
          issue_date: receipt.issueDate || new Date().toISOString().split('T')[0],
          office_name: receipt.officeName || '',
          tenant_name: receipt.tenantName || '',
          contract_number: receipt.contractNumber || '',
          contract_type: receipt.contractType || '',
          property_name: receipt.propertyName || '',
          unit_name: receipt.unitName || '',
          amount: receipt.amount || 0,
          payment_method: receipt.paymentMethod || 'cash',
          payment_method_label: receipt.paymentMethodLabel || '',
          due_id: receipt.dueId || '',
          installment_number: receipt.installmentNumber || '',
          note: receipt.note || '',
          vat_rate: receipt.vatRate || 0.15,
          vat_amount: receipt.vatAmount || 0,
          total_with_vat: receipt.totalWithVat || 0,
          seller_name: receipt.sellerName || '',
          seller_tax_number: receipt.sellerTaxNumber || '',
          notes: receipt.notes || receipt.note || '',
          date: receipt.issueDate || new Date().toISOString().split('T')[0],
        };
        const { data, error } = await supabaseStore.contractReceipts.create(payload);
        if (error) throw error;
        await fetchContractReceipts();
        return { data: toCamelCase(data), error: null };
      } catch (err) {
        console.error('[قيد العقار] createContractReceipt:', err);
        return { data: null, error: err };
      }
    },
    [officeId, userId, fetchContractReceipts]
  );

  // ═══════════════════════════════════════
  // إعدادات المكتب
  // ═══════════════════════════════════════

  const updateOfficeSettings = useCallback(
    async (settings) => {
      try {
        const { error } = await supabaseStore.office.updateSettings(officeId, settings);
        if (error) throw error;
        return { error: null };
      } catch (err) {
        console.error('[قيد العقار] updateOfficeSettings:', err);
        return { error: err };
      }
    },
    [officeId]
  );

  // ═══════════════════════════════════════
  // الدفتر النشط
  // ═══════════════════════════════════════

  const setActiveLedgerId = useCallback((id) => {
    _setActiveLedgerId(id);
  }, []);

  // ═══════════════════════════════════════
  // جلب أولي
  // ═══════════════════════════════════════

  useEffect(() => {
    if (!officeId) return; // ننتظر AuthContext — بدون officeId لا بيانات
    fetchLedgers();
    fetchTransactions();
    fetchRecurringItems();
    fetchCommissions();
    fetchProperties();
    fetchUnits();
    fetchContacts();
    fetchContracts();
    fetchContractPayments();
    fetchContractReceipts();
  }, [
    officeId,
    fetchLedgers,
    fetchTransactions,
    fetchRecurringItems,
    fetchCommissions,
    fetchProperties,
    fetchUnits,
    fetchContacts,
    fetchContracts,
    fetchContractPayments,
    fetchContractReceipts,
  ]);

  // تحديد الدفتر النشط الأولي — أول دفتر متاح
  useEffect(() => {
    if (ledgers.length > 0 && !activeLedgerId) {
      _setActiveLedgerId(ledgers[0].id);
    }
  }, [ledgers, activeLedgerId]);

  // ═══════════════════════════════════════
  // إعادة تحميل البيانات من localStorage
  // يُستخدم بعد resetDemo أو clearAll — بديل عن reload الصفحة
  // ═══════════════════════════════════════
  const reloadFromLocalStorage = useCallback(() => {
    setProperties(safeGet(KEYS.properties, []));
    setContacts(safeGet(KEYS.contacts, []));
    setContracts(safeGet(KEYS.contracts, []));
    setUnits(safeGet(KEYS.units, []));
    setTransactions(safeGet(KEYS.transactions, []));
    setCommissions(safeGet(KEYS.commissions, []));
    setContractPayments(safeGet(KEYS.contractPayments, []));
    setContractReceipts(safeGet(KEYS.contractReceipts, []));
  }, []);

  // ═══════════════════════════════════════
  // القيمة المُصدَّرة
  // ═══════════════════════════════════════

  const value = useMemo(
    () => ({
      // البيانات
      ledgers,
      activeLedgerId,
      setActiveLedgerId,
      transactions,
      recurringItems,
      commissions,
      properties,
      units,
      contacts,
      contracts,
      contractPayments,
      contractReceipts,

      // حالة التحميل
      ledgersLoading,
      transactionsLoading,
      recurringLoading,
      commissionsLoading,
      propertiesLoading,
      unitsLoading,
      contactsLoading,
      contractsLoading,
      contractPaymentsLoading,
      contractReceiptsLoading,

      // جلب البيانات (إعادة التحميل)
      fetchLedgers,
      fetchTransactions,
      fetchRecurringItems,
      fetchCommissions,
      fetchProperties,
      fetchUnits,
      fetchContacts,
      fetchContracts,
      fetchContractPayments,
      fetchContractReceipts,

      // CRUD — حركات
      createTransaction,
      updateTransaction,
      deleteTransaction,

      // CRUD — دفاتر
      createLedger,
      updateLedger,
      deleteLedger,

      // CRUD — التزامات متكررة
      createRecurringItem,
      updateRecurringItem,
      deleteRecurringItem,

      // CRUD — عمولات
      createCommission,
      updateCommission,
      deleteCommission,

      // CRUD — عقارات
      createProperty,
      updateProperty,
      deleteProperty,

      // CRUD — وحدات
      createUnit,
      updateUnit,
      deleteUnit,

      // CRUD — جهات اتصال
      createContact,
      updateContact,
      deleteContact,

      // CRUD — عقود
      createContract,
      updateContract,
      deleteContract,

      // CRUD — دفعات العقود
      createContractPayment,
      updateContractPayment,
      deleteContractPayment,

      // CRUD — سندات القبض
      createContractReceipt,

      // إعدادات
      updateOfficeSettings,

      // إعادة تحميل من localStorage
      reloadFromLocalStorage,

      // أدوات التحويل (للاستخدام الخارجي إذا لزم)
      toCamelCase,
      toSnakeCase,
    }),
    [
      ledgers,
      activeLedgerId,
      setActiveLedgerId,
      transactions,
      recurringItems,
      commissions,
      properties,
      units,
      contacts,
      contracts,
      contractPayments,
      contractReceipts,
      ledgersLoading,
      transactionsLoading,
      recurringLoading,
      commissionsLoading,
      propertiesLoading,
      unitsLoading,
      contactsLoading,
      contractsLoading,
      contractPaymentsLoading,
      contractReceiptsLoading,
      fetchLedgers,
      fetchTransactions,
      fetchRecurringItems,
      fetchCommissions,
      fetchProperties,
      fetchUnits,
      fetchContacts,
      fetchContracts,
      fetchContractPayments,
      fetchContractReceipts,
      createTransaction,
      updateTransaction,
      deleteTransaction,
      createLedger,
      updateLedger,
      deleteLedger,
      createRecurringItem,
      updateRecurringItem,
      deleteRecurringItem,
      createCommission,
      updateCommission,
      deleteCommission,
      createProperty,
      updateProperty,
      deleteProperty,
      createUnit,
      updateUnit,
      deleteUnit,
      createContact,
      updateContact,
      deleteContact,
      createContract,
      updateContract,
      deleteContract,
      createContractPayment,
      updateContractPayment,
      deleteContractPayment,
      createContractReceipt,
      updateOfficeSettings,
      reloadFromLocalStorage,
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

// ═══════════════════════════════════════
// Hook مختصر
// ═══════════════════════════════════════
export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) {
    throw new Error('useData يجب أن يُستخدم داخل DataProvider');
  }
  return ctx;
};

export default DataContext;
