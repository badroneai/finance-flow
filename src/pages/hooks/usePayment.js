// usePayment — حالة ومعالجات تحويل الالتزام لمعاملة مالية
import { useState } from 'react';
import { buildTxMetaFromRecurring } from '../../core/ledger-analytics.js';
import { today, isValidDateStr, safeNum } from '../../utils/helpers.js';
import { parseRecurringAmount } from './ledger-helpers.js';

/**
 * @param {object} deps
 * @param {Function} deps.toast
 * @param {string} deps.activeId
 * @param {Function} deps.createDataTransaction
 * @param {Function} deps.updateRecurringOps
 * @param {Function} deps.refresh
 */
export default function usePayment({
  toast,
  activeId,
  createDataTransaction,
  updateRecurringOps,
  refresh,
}) {
  const [payOpen, setPayOpen] = useState(false);
  const [paySource, setPaySource] = useState(null);
  const [payForm, setPayForm] = useState({
    type: 'expense',
    category: 'other',
    paymentMethod: 'cash',
    amount: '',
    date: '',
    description: '',
  });

  const startPayNow = (r) => {
    if (!r) return;
    setPaySource(r);
    setPayForm({
      type: 'expense',
      category: 'other',
      paymentMethod: 'cash',
      amount: String(Number(r.amount) || ''),
      date: today(),
      description: String(r.title || '').trim(),
    });
    setPayOpen(true);
  };

  const submitPayNow = async () => {
    try {
      if (!activeId) {
        toast.error('اختر دفترًا نشطًا');
        return;
      }
      if (!paySource?.id) {
        toast.error('اختر بندًا أولاً');
        return;
      }

      const amount = parseRecurringAmount(payForm.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        toast.error('المبلغ غير صالح');
        return;
      }

      const date = String(payForm.date || '').trim() || today();
      if (!isValidDateStr(date)) {
        toast.error('تاريخ غير صالح');
        return;
      }
      const description = String(payForm.description || paySource.title || '').trim();
      const paymentMethod = String(payForm.paymentMethod || 'cash');

      const meta = buildTxMetaFromRecurring({ activeLedgerId: activeId, recurring: paySource });
      const { data: txData, error: txError } = await createDataTransaction({
        type: 'expense',
        category: 'other',
        amount: safeNum(amount),
        paymentMethod,
        date,
        description,
        ledgerId: activeId,
        meta,
      });

      if (txError) {
        toast.error(txError?.message || 'تعذر تسجيل الدفعة');
        return;
      }

      try {
        await updateRecurringOps(
          paySource.id,
          {
            status: 'resolved',
            lastPaidAt: new Date().toISOString(),
            payState: 'paid',
            payStateAt: new Date().toISOString(),
          },
          {
            type: 'pay_now',
            amount,
            txId: txData?.id || undefined,
            meta: { dueDate: paySource?.nextDueDate, method: paymentMethod },
          }
        );
      } catch {}

      setPayOpen(false);
      toast.success('تم تسجيل الدفعة');
      refresh();
    } catch {
      toast.error('تعذر تسجيل الدفعة');
    }
  };

  return {
    payOpen,
    setPayOpen,
    paySource,
    setPaySource,
    payForm,
    setPayForm,
    startPayNow,
    submitPayNow,
  };
}
