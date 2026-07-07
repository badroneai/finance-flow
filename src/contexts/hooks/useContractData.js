/*
  قيد العقار (Finance Flow)
  useContractData.js — hook مجالي للعقود والدفعات وسندات القبض

  يدير state + fetch + CRUD للعقود وجداول السداد وسندات القبض.
  يُستخدم داخل DataContext فقط — لا يُصدّر للصفحات مباشرة.
*/

import { useState, useCallback, useRef } from 'react';
import { supabaseStore } from '../../core/supabase-store.js';
import { stableSetArray, toCamelCase, toSnakeCase } from './data-utils.js';

/**
 * hook مجالي للعقود + الدفعات + الإيصالات — يُستخدم داخل DataProvider فقط
 * @param {string|null} officeId - معرّف المكتب
 * @param {string|null} userId - معرّف المستخدم
 * @param {boolean} useLocalFallback - هل نستخدم localStorage؟
 * @param {Function} safeGet - دالة قراءة آمنة من localStorage
 * @param {string} contractsKey - مفتاح التخزين المحلي للعقود
 * @param {string} paymentsKey - مفتاح التخزين المحلي للدفعات
 * @param {string} receiptsKey - مفتاح التخزين المحلي للإيصالات
 * @returns {Object} بيانات وعمليات العقود والدفعات والإيصالات
 */
export function useContractData(officeId, userId, useLocalFallback, safeGet, contractsKey, paymentsKey, receiptsKey) {
  // ─── العقود ────────────────────────────────────────────
  const [contracts, setContracts] = useState(() =>
    useLocalFallback ? safeGet(contractsKey, []) : []
  );
  const [contractsLoading, setContractsLoading] = useState(false);
  const contractsRef = useRef([]);

  // ─── دفعات العقود ─────────────────────────────────────
  const [contractPayments, setContractPayments] = useState(() =>
    useLocalFallback ? safeGet(paymentsKey, []) : []
  );
  const [contractPaymentsLoading, setContractPaymentsLoading] = useState(false);
  const contractPaymentsRef = useRef([]);

  // ─── سندات القبض ──────────────────────────────────────
  const [contractReceipts, setContractReceipts] = useState(() =>
    useLocalFallback ? safeGet(receiptsKey, []) : []
  );
  const [contractReceiptsLoading, setContractReceiptsLoading] = useState(false);
  const contractReceiptsRef = useRef([]);

  // ═══════════════════════════════════════
  // Fetch
  // ═══════════════════════════════════════

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
  // CRUD — العقود
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

  return {
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
  };
}
