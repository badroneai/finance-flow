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
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { supabaseStore } from '../core/supabase-store.js';
import { isSupabaseConfigured } from '../core/supabase.js';
import { safeGet } from '../core/dataStore.js';
import { KEYS } from '../constants/index.js';
import { useAuth } from './AuthContext.jsx';
import { toCamelCase, toSnakeCase } from './hooks/data-utils.js';
import { useCommissionData } from './hooks/useCommissionData.js';
import { useRecurringData } from './hooks/useRecurringData.js';
import { useLedgerData } from './hooks/useLedgerData.js';
import { useContactData } from './hooks/useContactData.js';
import { useTransactionData } from './hooks/useTransactionData.js';
import { usePropertyData } from './hooks/usePropertyData.js';
import { useContractData } from './hooks/useContractData.js';

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

  // ─── الدفاتر (hook مجالي) ───────────────────────────────
  const {
    ledgers,
    activeLedgerId,
    setActiveLedgerId,
    ledgersLoading,
    fetchLedgers,
    createLedger,
    updateLedger,
    deleteLedger,
  } = useLedgerData(officeId, userId, useLocalFallback);

  // ─── الحركات (hook مجالي) ───────────────────────────────
  const {
    transactions,
    setTransactions,
    transactionsLoading,
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  } = useTransactionData(officeId, userId, activeLedgerId, useLocalFallback, safeGet, KEYS.transactions);

  // ─── الالتزامات المتكررة (hook مجالي) ────────────────────
  const {
    recurringItems,
    recurringLoading,
    fetchRecurringItems,
    createRecurringItem,
    updateRecurringItem,
    deleteRecurringItem,
  } = useRecurringData(officeId, userId);

  // ─── العمولات (hook مجالي) ──────────────────────────────
  const {
    commissions,
    setCommissions,
    commissionsLoading,
    fetchCommissions,
    createCommission,
    updateCommission,
    deleteCommission,
  } = useCommissionData(officeId, userId, useLocalFallback, safeGet, KEYS.commissions);

  // ─── العقارات والوحدات (hook مجالي) ─────────────────────
  const {
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
  } = usePropertyData(officeId, userId, useLocalFallback, safeGet, KEYS.properties, KEYS.units);

  // ─── جهات الاتصال (hook مجالي) ────────────────────────────
  const {
    contacts,
    setContacts,
    contactsLoading,
    fetchContacts,
    createContact,
    updateContact,
    deleteContact,
  } = useContactData(officeId, userId, useLocalFallback, safeGet, KEYS.contacts);

  // ─── العقود والدفعات والإيصالات (hook مجالي) ────────────
  const {
    contracts,
    setContracts,
    contractsLoading,
    fetchContracts,
    createContract,
    updateContract,
    deleteContract,
    contractPayments,
    setContractPayments,
    contractPaymentsLoading,
    fetchContractPayments,
    createContractPayment,
    updateContractPayment,
    deleteContractPayment,
    contractReceipts,
    setContractReceipts,
    contractReceiptsLoading,
    fetchContractReceipts,
    createContractReceipt,
  } = useContractData(officeId, userId, useLocalFallback, safeGet, KEYS.contracts, KEYS.contractPayments, KEYS.contractReceipts);

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
  }, [setCommissions, setContacts, setContracts, setContractPayments, setContractReceipts, setTransactions, setProperties, setUnits]);

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
