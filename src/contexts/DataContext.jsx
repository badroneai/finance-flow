/*
  قيد العقار (Finance Flow)
  DataContext.jsx — طبقة البيانات الموحّدة (SPR-004e-2)

  يوفّر واجهة موحّدة للبيانات — يتعامل مع Supabase أو localStorage حسب الإعداد.
  - إذا isSupabaseConfigured → يقرأ/يكتب من supabaseStore
  - إذا لا → يقرأ/يكتب من dataStore (localStorage)

  تحويل أسماء الحقول:
  - localStorage يستخدم camelCase: ledgerId, paymentMethod, createdAt
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
import { isSupabaseConfigured } from '../core/supabase.js';
import { supabaseStore } from '../core/supabase-store.js';
import { dataStore, getActiveLedgerIdSafe } from '../core/dataStore.js';
import {
  getLedgers,
  setLedgers as setLedgersLocal,
  getActiveLedgerId,
  setActiveLedgerId as setActiveLedgerIdLocal,
  getRecurringItems,
  setRecurringItems as setRecurringItemsLocal,
} from '../core/ledger-store.js';
import { useAuth } from './AuthContext.jsx';
import { genId, now } from '../utils/helpers.js';

// ═══════════════════════════════════════
// تحويل أسماء الحقول
// ═══════════════════════════════════════

/**
 * مقارنة سريعة بين مصفوفتين — تتجنب إعادة ضبط الحالة إذا لم تتغير البيانات.
 * تُعيد true إذا المصفوفتين متطابقتين (نفس الطول + نفس العناصر بالترتيب).
 */
function arraysShallowEqual(a, b) {
  if (a === b) return true;
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * مُنشئ دالة setState مستقرة — تمنع إعادة الرسم إذا البيانات لم تتغير فعلاً.
 * للبيانات المُحمّلة من localStorage (مراجع جديدة كل مرة)، نقارن بالمحتوى.
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
  const isCloud = isSupabaseConfigured && !!officeId;

  // ─── الدفاتر ───────────────────────────────────────────
  const [ledgers, setLedgers] = useState([]);
  const [activeLedgerId, _setActiveLedgerId] = useState(null);
  const [ledgersLoading, setLedgersLoading] = useState(true);

  // ─── الحركات ───────────────────────────────────────────
  const [transactions, setTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);

  // ─── الالتزامات المتكررة ────────────────────────────────
  const [recurringItems, setRecurringItems] = useState([]);
  const [recurringLoading, setRecurringLoading] = useState(false);

  // ─── العمولات ──────────────────────────────────────────
  const [commissions, setCommissions] = useState([]);
  const [commissionsLoading, setCommissionsLoading] = useState(false);

  // ─── العقارات — SPR-018 ─────────────────────────────────
  const [properties, setProperties] = useState([]);
  const [propertiesLoading, setPropertiesLoading] = useState(false);

  // ─── جهات الاتصال — SPR-018 ────────────────────────────
  const [contacts, setContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(false);

  // ─── العقود — SPR-018 ──────────────────────────────────
  const [contracts, setContracts] = useState([]);
  const [contractsLoading, setContractsLoading] = useState(false);

  // ─── مراجع المقارنة (لمنع إعادة الرسم غير الضرورية) ──
  const ledgersRef = useRef([]);
  const transactionsRef = useRef([]);
  const recurringRef = useRef([]);
  const commissionsRef = useRef([]);
  const propertiesRef = useRef([]);
  const contactsRef = useRef([]);
  const contractsRef = useRef([]);

  // ═══════════════════════════════════════
  // جلب البيانات
  // ═══════════════════════════════════════

  const fetchLedgers = useCallback(async () => {
    setLedgersLoading(true);
    try {
      if (isCloud) {
        const { data } = await supabaseStore.ledgers.list(officeId);
        const mapped = (data || []).map(toCamelCase);
        stableSetArray(setLedgers, mapped, ledgersRef);
      } else {
        const local = getLedgers() || [];
        stableSetArray(setLedgers, local, ledgersRef);
      }
    } catch (err) {
      console.error('[قيد العقار] fetchLedgers:', err);
    } finally {
      setLedgersLoading(false);
    }
  }, [isCloud, officeId]);

  const fetchTransactions = useCallback(
    async (filters = {}) => {
      setTransactionsLoading(true);
      try {
        if (isCloud) {
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
        } else {
          const all = dataStore.transactions.list() || [];
          const lid = getActiveLedgerIdSafe();
          let filtered = lid
            ? all.filter((t) => String(t?.ledgerId || t?.meta?.ledgerId || '') === lid)
            : all;
          // تطبيق الفلاتر محلياً
          if (filters.fromDate) filtered = filtered.filter((t) => t.date >= filters.fromDate);
          if (filters.toDate) filtered = filtered.filter((t) => t.date <= filters.toDate);
          if (filters.type) filtered = filtered.filter((t) => t.type === filters.type);
          if (filters.category) filtered = filtered.filter((t) => t.category === filters.category);
          if (filters.paymentMethod)
            filtered = filtered.filter((t) => t.paymentMethod === filters.paymentMethod);
          if (filters.search) {
            const s = filters.search.toLowerCase();
            filtered = filtered.filter((t) => (t.description || '').toLowerCase().includes(s));
          }
          filtered.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
          stableSetArray(setTransactions, filtered, transactionsRef);
        }
      } catch (err) {
        console.error('[قيد العقار] fetchTransactions:', err);
      } finally {
        setTransactionsLoading(false);
      }
    },
    [isCloud, officeId]
  );

  const fetchRecurringItems = useCallback(
    async (ledgerId = null) => {
      setRecurringLoading(true);
      try {
        if (isCloud) {
          const { data } = await supabaseStore.recurringItems.list(officeId, ledgerId);
          const mapped = (data || []).map(toCamelCase);
          stableSetArray(setRecurringItems, mapped, recurringRef);
        } else {
          const items = getRecurringItems() || [];
          const result = ledgerId ? items.filter((i) => i.ledgerId === ledgerId) : items;
          stableSetArray(setRecurringItems, result, recurringRef);
        }
      } catch (err) {
        console.error('[قيد العقار] fetchRecurringItems:', err);
      } finally {
        setRecurringLoading(false);
      }
    },
    [isCloud, officeId]
  );

  const fetchCommissions = useCallback(
    async (filters = {}) => {
      setCommissionsLoading(true);
      try {
        if (isCloud) {
          const { data } = await supabaseStore.commissions.list(officeId, filters);
          const mapped = (data || []).map(toCamelCase);
          stableSetArray(setCommissions, mapped, commissionsRef);
        } else {
          const all = dataStore.commissions?.list?.() || [];
          stableSetArray(setCommissions, all, commissionsRef);
        }
      } catch (err) {
        console.error('[قيد العقار] fetchCommissions:', err);
      } finally {
        setCommissionsLoading(false);
      }
    },
    [isCloud, officeId]
  );

  // ─── جلب العقارات — SPR-018 ────────────────────────────
  const fetchProperties = useCallback(
    async (filters = {}) => {
      setPropertiesLoading(true);
      try {
        if (isCloud) {
          const { data } = await supabaseStore.properties.list(officeId, filters);
          const mapped = (data || []).map(toCamelCase);
          stableSetArray(setProperties, mapped, propertiesRef);
        } else {
          const all = dataStore.properties?.list?.() || [];
          stableSetArray(setProperties, all, propertiesRef);
        }
      } catch (err) {
        console.error('[قيد العقار] fetchProperties:', err);
      } finally {
        setPropertiesLoading(false);
      }
    },
    [isCloud, officeId]
  );

  // ─── جلب جهات الاتصال — SPR-018 ────────────────────────
  const fetchContacts = useCallback(
    async (filters = {}) => {
      setContactsLoading(true);
      try {
        if (isCloud) {
          const { data } = await supabaseStore.contacts.list(officeId, filters);
          const mapped = (data || []).map(toCamelCase);
          stableSetArray(setContacts, mapped, contactsRef);
        } else {
          const all = dataStore.contacts?.list?.() || [];
          stableSetArray(setContacts, all, contactsRef);
        }
      } catch (err) {
        console.error('[قيد العقار] fetchContacts:', err);
      } finally {
        setContactsLoading(false);
      }
    },
    [isCloud, officeId]
  );

  // ─── جلب العقود — SPR-018 ──────────────────────────────
  const fetchContracts = useCallback(
    async (filters = {}) => {
      setContractsLoading(true);
      try {
        if (isCloud) {
          const { data } = await supabaseStore.contracts.list(officeId, filters);
          const mapped = (data || []).map(toCamelCase);
          stableSetArray(setContracts, mapped, contractsRef);
        } else {
          const all = dataStore.contracts?.list?.() || [];
          stableSetArray(setContracts, all, contractsRef);
        }
      } catch (err) {
        console.error('[قيد العقار] fetchContracts:', err);
      } finally {
        setContractsLoading(false);
      }
    },
    [isCloud, officeId]
  );

  // ═══════════════════════════════════════
  // CRUD — الحركات المالية
  // ═══════════════════════════════════════

  const createTransaction = useCallback(
    async (tx) => {
      try {
        if (isCloud) {
          const payload = toSnakeCase({
            ...tx,
            officeId,
            ledgerId: tx.ledgerId || tx.ledger_id || activeLedgerId,
            createdBy: userId,
          });
          // حذف المفاتيح غير المطلوبة
          delete payload.id;
          delete payload.updated_at;
          delete payload.created_at;

          const { data, error } = await supabaseStore.transactions.create(payload);
          if (error) throw error;
          await fetchTransactions();
          return { data: toCamelCase(data), error: null };
        } else {
          const result = dataStore.transactions.create({
            ...tx,
            ledgerId: tx.ledgerId || getActiveLedgerIdSafe(),
          });
          if (!result || !result.ok)
            return { data: null, error: { message: result?.message || 'فشل الحفظ' } };
          await fetchTransactions();
          return { data: result.item, error: null };
        }
      } catch (err) {
        console.error('[قيد العقار] createTransaction:', err);
        return { data: null, error: err };
      }
    },
    [isCloud, officeId, userId, activeLedgerId, fetchTransactions]
  );

  const updateTransaction = useCallback(
    async (id, updates) => {
      try {
        if (isCloud) {
          const payload = toSnakeCase(updates);
          delete payload.id;
          delete payload.created_at;
          const { data, error } = await supabaseStore.transactions.update(id, payload);
          if (error) throw error;
          await fetchTransactions();
          return { data: toCamelCase(data), error: null };
        } else {
          const result = dataStore.transactions.update(id, updates);
          if (!result || !result.ok)
            return { data: null, error: { message: result?.message || 'فشل التحديث' } };
          await fetchTransactions();
          return { data: result.item, error: null };
        }
      } catch (err) {
        console.error('[قيد العقار] updateTransaction:', err);
        return { data: null, error: err };
      }
    },
    [isCloud, fetchTransactions]
  );

  const deleteTransaction = useCallback(
    async (id) => {
      try {
        if (isCloud) {
          const { error } = await supabaseStore.transactions.remove(id);
          if (error) throw error;
        } else {
          dataStore.transactions.remove(id);
        }
        await fetchTransactions();
        return { error: null };
      } catch (err) {
        console.error('[قيد العقار] deleteTransaction:', err);
        return { error: err };
      }
    },
    [isCloud, fetchTransactions]
  );

  // ═══════════════════════════════════════
  // CRUD — الدفاتر
  // ═══════════════════════════════════════

  const createLedger = useCallback(
    async (ledger) => {
      try {
        if (isCloud) {
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
        } else {
          const item = { ...ledger, id: genId(), createdAt: now(), updatedAt: now() };
          const all = getLedgers() || [];
          all.push(item);
          setLedgersLocal(all);
          await fetchLedgers();
          return { data: item, error: null };
        }
      } catch (err) {
        console.error('[قيد العقار] createLedger:', err);
        return { data: null, error: err };
      }
    },
    [isCloud, officeId, userId, fetchLedgers]
  );

  const updateLedger = useCallback(
    async (id, updates) => {
      try {
        if (isCloud) {
          const payload = toSnakeCase(updates);
          delete payload.id;
          delete payload.created_at;
          const { data, error } = await supabaseStore.ledgers.update(id, payload);
          if (error) throw error;
          await fetchLedgers();
          return { data: toCamelCase(data), error: null };
        } else {
          const all = getLedgers() || [];
          const idx = all.findIndex((l) => l.id === id);
          if (idx !== -1) {
            all[idx] = { ...all[idx], ...updates, updatedAt: now() };
            setLedgersLocal(all);
          }
          await fetchLedgers();
          return { data: all[idx], error: null };
        }
      } catch (err) {
        console.error('[قيد العقار] updateLedger:', err);
        return { data: null, error: err };
      }
    },
    [isCloud, fetchLedgers]
  );

  const deleteLedger = useCallback(
    async (id) => {
      try {
        if (isCloud) {
          const { error } = await supabaseStore.ledgers.remove(id);
          if (error) throw error;
        } else {
          const all = (getLedgers() || []).filter((l) => l.id !== id);
          setLedgersLocal(all);
        }
        await fetchLedgers();
        return { error: null };
      } catch (err) {
        console.error('[قيد العقار] deleteLedger:', err);
        return { error: err };
      }
    },
    [isCloud, fetchLedgers]
  );

  // ═══════════════════════════════════════
  // CRUD — الالتزامات المتكررة
  // ═══════════════════════════════════════

  const createRecurringItem = useCallback(
    async (item) => {
      try {
        if (isCloud) {
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
        } else {
          const all = getRecurringItems() || [];
          const newItem = { ...item, id: genId(), createdAt: now(), updatedAt: now() };
          all.push(newItem);
          setRecurringItemsLocal(all);
          await fetchRecurringItems();
          return { data: newItem, error: null };
        }
      } catch (err) {
        console.error('[قيد العقار] createRecurringItem:', err);
        return { data: null, error: err };
      }
    },
    [isCloud, officeId, userId, fetchRecurringItems]
  );

  const updateRecurringItem = useCallback(
    async (id, updates) => {
      try {
        if (isCloud) {
          const payload = toSnakeCase(updates);
          delete payload.id;
          delete payload.created_at;
          const { data, error } = await supabaseStore.recurringItems.update(id, payload);
          if (error) throw error;
          await fetchRecurringItems();
          return { data: toCamelCase(data), error: null };
        } else {
          const all = getRecurringItems() || [];
          const idx = all.findIndex((i) => i.id === id);
          if (idx !== -1) {
            all[idx] = { ...all[idx], ...updates, updatedAt: now() };
            setRecurringItemsLocal(all);
          }
          await fetchRecurringItems();
          return { data: all[idx], error: null };
        }
      } catch (err) {
        console.error('[قيد العقار] updateRecurringItem:', err);
        return { data: null, error: err };
      }
    },
    [isCloud, fetchRecurringItems]
  );

  const deleteRecurringItem = useCallback(
    async (id) => {
      try {
        if (isCloud) {
          const { error } = await supabaseStore.recurringItems.remove(id);
          if (error) throw error;
        } else {
          const all = (getRecurringItems() || []).filter((i) => i.id !== id);
          setRecurringItemsLocal(all);
        }
        await fetchRecurringItems();
        return { error: null };
      } catch (err) {
        console.error('[قيد العقار] deleteRecurringItem:', err);
        return { error: err };
      }
    },
    [isCloud, fetchRecurringItems]
  );

  // ═══════════════════════════════════════
  // CRUD — العمولات
  // ═══════════════════════════════════════

  const createCommission = useCallback(
    async (commission) => {
      try {
        if (isCloud) {
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
        } else {
          const result = dataStore.commissions.create(commission);
          if (!result || !result.ok)
            return { data: null, error: { message: result?.message || 'فشل الحفظ' } };
          await fetchCommissions();
          return { data: result.item, error: null };
        }
      } catch (err) {
        console.error('[قيد العقار] createCommission:', err);
        return { data: null, error: err };
      }
    },
    [isCloud, officeId, userId, fetchCommissions]
  );

  const updateCommission = useCallback(
    async (id, updates) => {
      try {
        if (isCloud) {
          const payload = toSnakeCase(updates);
          delete payload.id;
          delete payload.created_at;
          const { data, error } = await supabaseStore.commissions.update(id, payload);
          if (error) throw error;
          await fetchCommissions();
          return { data: toCamelCase(data), error: null };
        } else {
          const result = dataStore.commissions.update(id, updates);
          if (!result || !result.ok)
            return { data: null, error: { message: result?.message || 'فشل التحديث' } };
          await fetchCommissions();
          return { data: result.item, error: null };
        }
      } catch (err) {
        console.error('[قيد العقار] updateCommission:', err);
        return { data: null, error: err };
      }
    },
    [isCloud, fetchCommissions]
  );

  const deleteCommission = useCallback(
    async (id) => {
      try {
        if (isCloud) {
          const { error } = await supabaseStore.commissions.remove(id);
          if (error) throw error;
        } else {
          dataStore.commissions.remove(id);
        }
        await fetchCommissions();
        return { error: null };
      } catch (err) {
        console.error('[قيد العقار] deleteCommission:', err);
        return { error: err };
      }
    },
    [isCloud, fetchCommissions]
  );

  // ═══════════════════════════════════════
  // CRUD — العقارات (SPR-018)
  // ═══════════════════════════════════════

  const createProperty = useCallback(
    async (property) => {
      try {
        if (isCloud) {
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
        } else {
          const result = dataStore.properties.create(property);
          if (!result || !result.ok)
            return { data: null, error: { message: result?.message || 'فشل الحفظ' } };
          await fetchProperties();
          return { data: result.item, error: null };
        }
      } catch (err) {
        console.error('[قيد العقار] createProperty:', err);
        return { data: null, error: err };
      }
    },
    [isCloud, officeId, userId, fetchProperties]
  );

  const updateProperty = useCallback(
    async (id, updates) => {
      try {
        if (isCloud) {
          const payload = toSnakeCase(updates);
          delete payload.id;
          delete payload.created_at;
          const { data, error } = await supabaseStore.properties.update(id, payload);
          if (error) throw error;
          await fetchProperties();
          return { data: toCamelCase(data), error: null };
        } else {
          const result = dataStore.properties.update(id, updates);
          if (!result || !result.ok)
            return { data: null, error: { message: result?.message || 'فشل التحديث' } };
          await fetchProperties();
          return { data: result.item, error: null };
        }
      } catch (err) {
        console.error('[قيد العقار] updateProperty:', err);
        return { data: null, error: err };
      }
    },
    [isCloud, fetchProperties]
  );

  const deleteProperty = useCallback(
    async (id) => {
      try {
        if (isCloud) {
          const { error } = await supabaseStore.properties.remove(id);
          if (error) throw error;
        } else {
          dataStore.properties.remove(id);
        }
        await fetchProperties();
        return { error: null };
      } catch (err) {
        console.error('[قيد العقار] deleteProperty:', err);
        return { error: err };
      }
    },
    [isCloud, fetchProperties]
  );

  // ═══════════════════════════════════════
  // CRUD — جهات الاتصال (SPR-018)
  // ═══════════════════════════════════════

  const createContact = useCallback(
    async (contact) => {
      try {
        if (isCloud) {
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
        } else {
          const result = dataStore.contacts.create(contact);
          if (!result || !result.ok)
            return { data: null, error: { message: result?.message || 'فشل الحفظ' } };
          await fetchContacts();
          return { data: result.item, error: null };
        }
      } catch (err) {
        console.error('[قيد العقار] createContact:', err);
        return { data: null, error: err };
      }
    },
    [isCloud, officeId, userId, fetchContacts]
  );

  const updateContact = useCallback(
    async (id, updates) => {
      try {
        if (isCloud) {
          const payload = toSnakeCase(updates);
          delete payload.id;
          delete payload.created_at;
          const { data, error } = await supabaseStore.contacts.update(id, payload);
          if (error) throw error;
          await fetchContacts();
          return { data: toCamelCase(data), error: null };
        } else {
          const result = dataStore.contacts.update(id, updates);
          if (!result || !result.ok)
            return { data: null, error: { message: result?.message || 'فشل التحديث' } };
          await fetchContacts();
          return { data: result.item, error: null };
        }
      } catch (err) {
        console.error('[قيد العقار] updateContact:', err);
        return { data: null, error: err };
      }
    },
    [isCloud, fetchContacts]
  );

  const deleteContact = useCallback(
    async (id) => {
      try {
        if (isCloud) {
          const { error } = await supabaseStore.contacts.remove(id);
          if (error) throw error;
        } else {
          dataStore.contacts.remove(id);
        }
        await fetchContacts();
        return { error: null };
      } catch (err) {
        console.error('[قيد العقار] deleteContact:', err);
        return { error: err };
      }
    },
    [isCloud, fetchContacts]
  );

  // ═══════════════════════════════════════
  // CRUD — العقود (SPR-018)
  // ═══════════════════════════════════════

  const createContract = useCallback(
    async (contract) => {
      try {
        if (isCloud) {
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
        } else {
          const result = dataStore.contracts.create(contract);
          if (!result || !result.ok)
            return { data: null, error: { message: result?.message || 'فشل الحفظ' } };
          await fetchContracts();
          return { data: result.item, error: null };
        }
      } catch (err) {
        console.error('[قيد العقار] createContract:', err);
        return { data: null, error: err };
      }
    },
    [isCloud, officeId, userId, fetchContracts]
  );

  const updateContract = useCallback(
    async (id, updates) => {
      try {
        if (isCloud) {
          const payload = toSnakeCase(updates);
          delete payload.id;
          delete payload.created_at;
          delete payload._property_name;
          delete payload._contact_name;
          const { data, error } = await supabaseStore.contracts.update(id, payload);
          if (error) throw error;
          await fetchContracts();
          return { data: toCamelCase(data), error: null };
        } else {
          const result = dataStore.contracts.update(id, updates);
          if (!result || !result.ok)
            return { data: null, error: { message: result?.message || 'فشل التحديث' } };
          await fetchContracts();
          return { data: result.item, error: null };
        }
      } catch (err) {
        console.error('[قيد العقار] updateContract:', err);
        return { data: null, error: err };
      }
    },
    [isCloud, fetchContracts]
  );

  const deleteContract = useCallback(
    async (id) => {
      try {
        if (isCloud) {
          const { error } = await supabaseStore.contracts.remove(id);
          if (error) throw error;
        } else {
          dataStore.contracts.remove(id);
        }
        await fetchContracts();
        return { error: null };
      } catch (err) {
        console.error('[قيد العقار] deleteContract:', err);
        return { error: err };
      }
    },
    [isCloud, fetchContracts]
  );

  // ═══════════════════════════════════════
  // إعدادات المكتب
  // ═══════════════════════════════════════

  const updateOfficeSettings = useCallback(
    async (settings) => {
      try {
        if (isCloud) {
          const { error } = await supabaseStore.office.updateSettings(officeId, settings);
          if (error) throw error;
        } else {
          if (settings.theme) localStorage.setItem('ui_theme', settings.theme);
          if (settings.numerals) localStorage.setItem('ui_numerals', settings.numerals);
          if (settings.date_header) localStorage.setItem('ui_date_header', settings.date_header);
        }
        return { error: null };
      } catch (err) {
        console.error('[قيد العقار] updateOfficeSettings:', err);
        return { error: err };
      }
    },
    [isCloud, officeId]
  );

  // ═══════════════════════════════════════
  // الدفتر النشط
  // ═══════════════════════════════════════

  const setActiveLedgerId = useCallback(
    (id) => {
      _setActiveLedgerId(id);
      // حفظ محلي أيضاً (للمحركات التي تقرأ من localStorage)
      if (!isCloud) {
        try {
          setActiveLedgerIdLocal(id);
        } catch {}
      }
    },
    [isCloud]
  );

  // ═══════════════════════════════════════
  // جلب أولي
  // ═══════════════════════════════════════

  useEffect(() => {
    if (isSupabaseConfigured && !officeId) return; // ننتظر AuthContext
    fetchLedgers();
    fetchTransactions();
    fetchRecurringItems();
    fetchCommissions();
    fetchProperties();
    fetchContacts();
    fetchContracts();
  }, [
    officeId,
    fetchLedgers,
    fetchTransactions,
    fetchRecurringItems,
    fetchCommissions,
    fetchProperties,
    fetchContacts,
    fetchContracts,
  ]);

  // تحديد الدفتر النشط الأولي
  useEffect(() => {
    if (ledgers.length > 0 && !activeLedgerId) {
      const localActive = getActiveLedgerId();
      const match = localActive && ledgers.find((l) => l.id === localActive);
      _setActiveLedgerId(match ? localActive : ledgers[0].id);
    }
  }, [ledgers, activeLedgerId]);

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
      contacts,
      contracts,

      // حالة التحميل
      ledgersLoading,
      transactionsLoading,
      recurringLoading,
      commissionsLoading,
      propertiesLoading,
      contactsLoading,
      contractsLoading,

      // جلب البيانات (إعادة التحميل)
      fetchLedgers,
      fetchTransactions,
      fetchRecurringItems,
      fetchCommissions,
      fetchProperties,
      fetchContacts,
      fetchContracts,

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

      // CRUD — جهات اتصال
      createContact,
      updateContact,
      deleteContact,

      // CRUD — عقود
      createContract,
      updateContract,
      deleteContract,

      // إعدادات
      updateOfficeSettings,

      // هل البيانات من السحابة؟
      isCloudMode: isCloud,

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
      contacts,
      contracts,
      ledgersLoading,
      transactionsLoading,
      recurringLoading,
      commissionsLoading,
      propertiesLoading,
      contactsLoading,
      contractsLoading,
      fetchLedgers,
      fetchTransactions,
      fetchRecurringItems,
      fetchCommissions,
      fetchProperties,
      fetchContacts,
      fetchContracts,
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
      createContact,
      updateContact,
      deleteContact,
      createContract,
      updateContract,
      deleteContract,
      updateOfficeSettings,
      isCloud,
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
