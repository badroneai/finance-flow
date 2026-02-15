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

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const SUCCESS_AUTO_CLOSE_MS = 1500;

export default function QuickPaymentModal({ dueItem, onClose, onPostpone }) {
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

  const handleSubmit = () => {
    const num = Number(String(paidAmount).replace(/,/g, '').replace(/٬/g, '')) || 0;
    if (num <= 0) return;
    const activeId = getActiveLedgerId() || '';
    if (!activeId || !dueItem?.recurringItemId) {
      setSubmitting(false);
      return;
    }
    const recurringList = getRecurringItems() || [];
    const recurring = recurringList.find((r) => r.id === dueItem.recurringItemId);
    if (!recurring) {
      setSubmitting(false);
      return;
    }
    setSubmitting(true);
    try {
      const meta = buildTxMetaFromRecurring({ activeLedgerId: activeId, recurring });
      const txType = dueItem.type === 'income' ? 'income' : 'expense';
      const res = dataStore.transactions.create({
        type: txType,
        category: 'other',
        amount: num,
        paymentMethod: 'cash',
        date: date || todayISO(),
        description: (note || dueItem.name || '').trim(),
        meta,
      });
      if (!res?.ok) {
        setSubmitting(false);
        return;
      }
      const ts = new Date().toISOString();
      const list = Array.isArray(recurringList) ? recurringList : [];
      const next = list.map((r) => {
        if (r.id !== recurring.id) return r;
        let updated = {
          ...r,
          status: 'resolved',
          lastPaidAt: ts,
          payState: 'paid',
          payStateAt: ts,
          updatedAt: ts,
        };
        updated = pushHistoryEntry(updated, {
          type: 'pay_now',
          amount: num,
          txId: res?.item?.id,
          meta: { dueDate: dueItem.dueDate, method: 'cash' },
        });
        return updated;
      });
      try {
        setRecurringItems(next);
      } catch {}
      try {
        window.dispatchEvent(new CustomEvent('ledger:activeChanged'));
      } catch {}
      setSuccess(true);
    } catch {
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
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 id="quick-payment-title" className="text-lg font-bold text-gray-900">
            تسجيل دفعة سريع
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
            aria-label="إغلاق"
          >
            <span className="text-xl leading-none">×</span>
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <p className="font-medium text-gray-900">{name}</p>
            <p className="text-sm text-gray-500 mt-0.5">
              المبلغ المستحق: {formatCurrency(dueItem.amount)} ر.س
            </p>
          </div>

          {success ? (
            <div className="py-6 text-center">
              <p className="text-emerald-600 font-semibold">تم التسجيل</p>
              <p className="text-sm text-gray-500 mt-1">يُغلق تلقائياً خلال لحظات</p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ المدفوع (ر.س)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900"
                  placeholder={formatNumber(amount)}
                />
                <p className="text-xs text-gray-500 mt-1">يمكن تعديله للدفع الجزئي</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ الدفع</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظة (اختياري)</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900"
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
                <p className="text-center text-sm text-gray-500">
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
