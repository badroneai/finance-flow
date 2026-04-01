/**
 * نافذة تسجيل دفعة عقد سريعة — تُستخدم من Dashboard و InboxPage
 * تعرض بيانات استحقاق العقد المحدد مع نموذج دفعة مبسط
 * تنشئ دفعة عقد + حركة مالية مرتبطة عبر contract-payment-service
 * بعد النجاح تعرض خيار عرض سند القبض
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { useData } from '../contexts/DataContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import { formatCurrency } from '../utils/format.jsx';
import { today } from '../utils/helpers.js';
import { PAYMENT_METHODS } from '../constants/index.js';
import { recordContractPayment } from '../core/contract-payment-service.js';
import ReceiptModal from './ReceiptModal.jsx';

/**
 * @param {Object} props
 * @param {Object} props.dueItem - عنصر مستحق عقد من buildOperationalDues
 * @param {Function} props.onClose - إغلاق النافذة
 * @param {Function} [props.onSuccess] - استدعاء بعد نجاح التسجيل
 */
export default function ContractQuickPaymentModal({ dueItem, onClose, onSuccess }) {
  const toast = useToast();
  const {
    contracts,
    properties,
    units,
    createContractPayment,
    deleteContractPayment,
    createTransaction,
    createContractReceipt,
  } = useData();
  const backdropRef = useRef(null);

  // استخراج بيانات العقد المرتبط
  const contract = contracts.find((c) => c.id === dueItem?.contractId) || null;
  const property = contract
    ? properties.find(
        (p) => p.id === (contract.propertyId || contract.property_id)
      ) || null
    : null;
  const unit = contract
    ? units.find(
        (u) => u.id === (contract.unitId || contract.unit_id)
      ) || null
    : null;

  // حالة النموذج — مملوء مسبقاً بالمبلغ المتبقي
  const [form, setForm] = useState({
    amount: dueItem?.remainingAmount || '',
    date: today(),
    paymentMethod: 'bank_transfer',
    note: '',
  });
  const [saving, setSaving] = useState(false);
  // حالة الإيصال — يُعرض بعد نجاح الدفعة
  const [receipt, setReceipt] = useState(null);

  // إعادة ملء النموذج عند تغير dueItem
  useEffect(() => {
    if (dueItem) {
      setForm({
        amount: dueItem.remainingAmount || '',
        date: today(),
        paymentMethod: 'bank_transfer',
        note: '',
      });
      setSaving(false);
      setReceipt(null);
    }
  }, [dueItem]);

  // إغلاق عند الضغط على Escape
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && !receipt) onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose, receipt]);

  const handleChange = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!contract || !dueItem) return;
    setSaving(true);

    const formData = {
      amount: form.amount,
      date: form.date,
      paymentMethod: form.paymentMethod,
      dueId: dueItem.dueId || '',
      note: form.note,
    };

    const result = await recordContractPayment({
      contract,
      formData,
      propertyName: dueItem.propertyName || property?.name,
      unitName: dueItem.unitName || unit?.name,
      tenantName: dueItem.tenantName,
      installmentNumber: dueItem.installmentNumber ? String(dueItem.installmentNumber) : '',
      remainingAmount: dueItem.remainingAmount,
      createContractPayment,
      deleteContractPayment,
      createTransaction,
      createContractReceipt,
    });

    setSaving(false);

    if (result.success) {
      toast.success('تم تسجيل الدفعة وربطها بالحركة المالية');
      // عرض سند القبض المحفوظ من الخدمة
      if (result.receipt) {
        setReceipt(result.receipt);
      }
      if (onSuccess) onSuccess();
    } else if (result.errors) {
      toast.error(result.errors[0]);
    } else {
      toast.error(result.error?.message || 'تعذر تسجيل الدفعة');
    }
  }, [contract, dueItem, form, property, unit, createContractPayment, deleteContractPayment, createTransaction, createContractReceipt, toast, onSuccess]);

  // إغلاق عند الضغط على الخلفية
  const handleBackdropClick = useCallback(
    (e) => {
      if (e.target === backdropRef.current) onClose();
    },
    [onClose]
  );

  if (!dueItem) return null;

  // إذا يوجد إيصال — عرض نافذة الإيصال
  if (receipt) {
    return (
      <ReceiptModal
        receipt={receipt}
        onClose={onClose}
      />
    );
  }

  const displayName = [dueItem.tenantName, dueItem.propertyName, dueItem.unitName]
    .filter(Boolean)
    .join(' — ') || 'مستحق عقد';

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      style={{ background: 'var(--color-overlay)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="contract-qp-title"
    >
      <div
        className="modal-sheet w-full max-w-md bg-[var(--color-surface)] rounded-t-2xl md:rounded-2xl p-5 max-h-[85vh] overflow-y-auto"
        dir="rtl"
      >
        {/* رأس النافذة */}
        <div className="flex items-center justify-between mb-4">
          <h2 id="contract-qp-title" className="text-lg font-bold text-[var(--color-text)]">
            تسجيل دفعة عقد
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-muted)] hover:bg-[var(--color-bg)]"
            aria-label="إغلاق"
          >
            ✕
          </button>
        </div>

        {/* معلومات الاستحقاق */}
        <div
          className="rounded-lg p-3 mb-4"
          style={{ background: 'var(--color-bg)' }}
        >
          <p className="text-sm font-medium text-[var(--color-text)]">{displayName}</p>
          <div className="flex flex-wrap gap-4 mt-2 text-xs text-[var(--color-muted)]">
            {dueItem.dueDate && <span>الاستحقاق: {dueItem.dueDate}</span>}
            {dueItem.contractNumber && <span>عقد: {dueItem.contractNumber}</span>}
            {dueItem.installmentNumber && <span>القسط: {dueItem.installmentNumber}</span>}
          </div>
          <div className="flex flex-wrap gap-4 mt-2">
            <div>
              <span className="text-xs text-[var(--color-muted)]">المبلغ الأصلي</span>
              <p className="text-sm font-medium text-[var(--color-text)]">
                {formatCurrency(dueItem.amount)}
              </p>
            </div>
            {dueItem.paidAmount > 0 && (
              <div>
                <span className="text-xs text-[var(--color-muted)]">المدفوع</span>
                <p className="text-sm font-medium" style={{ color: 'var(--color-success)' }}>
                  {formatCurrency(dueItem.paidAmount)}
                </p>
              </div>
            )}
            <div>
              <span className="text-xs text-[var(--color-muted)]">المتبقي</span>
              <p
                className="text-sm font-bold"
                style={{
                  color:
                    dueItem.daysOverdue > 0
                      ? 'var(--color-danger)'
                      : 'var(--color-text)',
                }}
              >
                {formatCurrency(dueItem.remainingAmount)}
              </p>
            </div>
          </div>
          {dueItem.daysOverdue > 0 && (
            <p
              className="text-xs mt-2 font-medium"
              style={{ color: 'var(--color-danger)' }}
            >
              متأخر {dueItem.daysOverdue} يوم
            </p>
          )}
        </div>

        {/* حقول النموذج */}
        <div className="space-y-3">
          <div>
            <label htmlFor="cqp-amount" className="block text-sm font-medium text-[var(--color-text)] mb-1">
              مبلغ الدفعة
            </label>
            <input
              id="cqp-amount"
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={(e) => handleChange('amount', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
              placeholder="أدخل المبلغ"
              autoFocus
            />
            {Number(form.amount) > 0 &&
              dueItem.remainingAmount > 0 &&
              Number(form.amount) > dueItem.remainingAmount && (
                <p className="text-xs mt-1" style={{ color: 'var(--color-danger)' }}>
                  المبلغ يتجاوز المتبقي ({formatCurrency(dueItem.remainingAmount)})
                </p>
              )}
          </div>

          <div>
            <label htmlFor="cqp-date" className="block text-sm font-medium text-[var(--color-text)] mb-1">
              تاريخ الدفعة
            </label>
            <input
              id="cqp-date"
              type="date"
              value={form.date}
              onChange={(e) => handleChange('date', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
            />
          </div>

          <div>
            <label htmlFor="cqp-method" className="block text-sm font-medium text-[var(--color-text)] mb-1">
              طريقة الدفع
            </label>
            <select
              id="cqp-method"
              value={form.paymentMethod}
              onChange={(e) => handleChange('paymentMethod', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
            >
              {Object.entries(PAYMENT_METHODS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="cqp-note" className="block text-sm font-medium text-[var(--color-text)] mb-1">
              ملاحظة (اختياري)
            </label>
            <textarea
              id="cqp-note"
              rows={2}
              value={form.note}
              onChange={(e) => handleChange('note', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm resize-none"
              placeholder="مثل: سداد عبر التحويل البنكي"
            />
          </div>
        </div>

        {/* أزرار */}
        <div className="flex items-center gap-3 mt-5">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="btn-primary flex-1 disabled:opacity-60"
          >
            {saving ? 'جاري التسجيل...' : 'تسجيل الدفعة'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
          >
            إلغاء
          </button>
        </div>

        <p className="text-xs text-[var(--color-muted)] mt-3 text-center">
          يتم أيضًا إنشاء حركة دخل مرتبطة بهذه الدفعة تلقائياً.
        </p>
      </div>
    </div>
  );
}
