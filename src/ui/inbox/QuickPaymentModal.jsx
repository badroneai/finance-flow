/*
  تسجيل دفعة سريع من صندوق الوارد — برومبت 2.3
  يستقبل dueItem، onClose، onPostpone (اختياري).
  ينشئ الحركة داخل المودال، يربط بالدفتر والالتزام، يعرض نجاح ثم إغلاق تلقائي بعد 1.5 ثانية.
*/
import React, { useState, useEffect } from 'react';
import { formatCurrency, formatNumber } from '../../utils/format.jsx';
import { getActiveLedgerId, getRecurringItems, setRecurringItems } from '../../core/ledger-store.js';
import { buildTxMetaFromRecurring } from '../../core/ledger-analytics.js';
import { pushHistoryEntry } from '../../core/ledger-item-history.js';
import { dataStore } from '../../core/dataStore.js';
import { useData } from '../../contexts/DataContext.jsx';

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const SUCCESS_AUTO_CLOSE_MS = 1500;

export default function QuickPaymentModal({ dueItem, onClose, onPostpone }) {
  const {
    createTransaction,
    activeLedgerId: ctxActiveLedgerId,
    recurringItems: ctxRecurringItems,
    updateRecurringItem: ctxUpdateRecurringItem,
    fetchRecurringItems,
  } = useData();

  const amount = Number(dueItem?.amount) || 0;
  const [paidAmount, setPaidAmount] = useState(() => (amount > 0 ? String(amount) : ''));
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!dueItem) return;
    setPaidAmount(amount > 0 ? String(amount) : '');
    setDate(todayISO());
    setNote('');
    setSubmitting(false);
    setSuccess(false);
  }, [dueItem, amount]);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => {
      onClose?.();
    }, SUCCESS_AUTO_CLOSE_MS);
    return () => clearTimeout(t);
  }, [success, onClose]);

  const handleSubmit = async () => {
    const num = Number(String(paidAmount).replace(/,/g, '').replace(/٬/g, '')) || 0;
    if (num <= 0) return;

    // DataContext first, fallback to localStorage
    const activeId = ctxActiveLedgerId || getActiveLedgerId() || '';
    if (!activeId || !dueItem?.recurringItemId) {
      setSubmitting(false);
      return;
    }
    const recurringList = (Array.isArray(ctxRecurringItems) && ctxRecurringItems.length > 0)
      ? ctxRecurringItems
      : (getRecurringItems() || []);
    const recurring = recurringList.find((r) => r.id === dueItem.recurringItemId);
    if (!recurring) {
      setSubmitting(false);
      return;
    }
    setSubmitting(true);
    try {
      const meta = buildTxMetaFromRecurring({ activeLedgerId: activeId, recurring });
      // P2 fix: use the recurring item's actual type instead of always 'expense'
      const txType = dueItem.type === 'income' ? 'income' : 'expense';

      // Use DataContext createTransaction (works with both Supabase and localStorage)
      const { data: txData, error: txError } = await createTransaction({
        type: txType,
        category: 'other',
        amount: num,
        paymentMethod: 'cash',
        date: date || todayISO(),
        description: (note || dueItem.name || '').trim(),
        ledgerId: activeId,
        meta,
      });

      if (txError) {
        console.error('[قيد العقار] QuickPaymentModal createTransaction:', txError);
        setSubmitting(false);
        return;
      }

      const ts = new Date().toISOString();
      const recurringUpdate = {
        status: 'resolved',
        lastPaidAt: ts,
        payState: 'paid',
        payStateAt: ts,
        updatedAt: ts,
      };

      // Build history entry
      let historyPatch = recurringUpdate;
      try {
        const itemWithPatch = { ...recurring, ...recurringUpdate };
        historyPatch = pushHistoryEntry(itemWithPatch, {
          type: 'pay_now',
          amount: num,
          txId: txData?.id,
          meta: { dueDate: dueItem.dueDate, method: 'cash' },
        });
        // Extract only the changed fields (history + status fields)
        const { history, ...statusFields } = historyPatch;
        historyPatch = { ...recurringUpdate, history };
      } catch {}

      // Update recurring item via DataContext
      try {
        await ctxUpdateRecurringItem(recurring.id, historyPatch);
      } catch {
        // Fallback: update localStorage directly
        try {
          const list = Array.isArray(recurringList) ? recurringList : [];
          const next = list.map((r) => {
            if (r.id !== recurring.id) return r;
            return { ...r, ...historyPatch };
          });
          setRecurringItems(next);
        } catch {}
      }

      try {
        window.dispatchEvent(new CustomEvent('ledger:activeChanged'));
      } catch {}
      setSuccess(true);
    } catch (err) {
      console.error('[قيد العقار] QuickPaymentModal handleSubmit:', err);
      setSubmitting(false);
    }
  };

  if (!dueItem) return null;

  const name = dueItem.name || '—';
  const num = Number(String(paidAmount).replace(/,/g, '').replace(/٬/g, '')) || 0;
  const canSubmit = !success && !submitting && num > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-payment-title"
    >
      <div className="bg-[var(--color-surface)] rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <h2 id="quick-payment-title" className="text-lg font-bold text-[var(--color-text)]">
            تسجيل دفعة سريع
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-[var(--color-muted)] hover:bg-[var(--color-bg)]"
            aria-label="إغلاق"
          >
            <span className="text-xl leading-none">×</span>
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <p className="font-medium text-[var(--color-text)]">{name}</p>
            <p className="text-sm text-[var(--color-muted)] mt-0.5">
              المبلغ المستحق: {formatCurrency(dueItem.amount)} ر.س
            </p>
          </div>

          {success ? (
            <div className="py-6 text-center">
              <p className="text-emerald-600 font-semibold">تم التسجيل</p>
              <p className="text-sm text-[var(--color-muted)] mt-1">يُغلق تلقائياً خلال لحظات</p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">المبلغ المدفوع (ر.س)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-[var(--color-text)]"
                  placeholder={formatNumber(amount)}
                />
                <p className="text-xs text-[var(--color-muted)] mt-1">يمكن تعديله للدفع الجزئي</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">تاريخ الدفع</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-[var(--color-text)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">ملاحظة (اختياري)</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-[var(--color-text)]"
                  placeholder="ملاحظة"
                />
              </div>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="w-full py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'جاري التسجيل…' : 'تسجيل الدفعة'}
              </button>
              {onPostpone && (
                <p className="text-center text-sm text-[var(--color-muted)]">
                  أو:{' '}
                  <button
                    type="button"
                    onClick={() => {
                      onPostpone(dueItem);
                      onClose?.();
                    }}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    تأجيل لتاريخ آخر
                  </button>
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
