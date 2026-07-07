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
    updateContractPayment,
    deleteContractPayment,
    createTransaction,
    createContractReceipt,
  } = useData();
  const backdropRef = useRef(null);

  // استخراج بيانات العقد المرتبط
  const contract = contracts.find((c) => c.id === dueItem?.contractId) || null;
  const property = contract
    ? properties.find((p) => p.id === (contract.propertyId || contract.property_id)) || null
    : null;
  const unit = contract
    ? units.find((u) => u.id === (contract.unitId || contract.unit_id)) || null
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
      currentDueStatus: dueItem.status,
      currentPaidAmount: dueItem.paidAmount,
      currentPaidDate: dueItem.paidDate || null,
      createContractPayment,
      updateContractPayment,
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
  }, [
    contract,
    dueItem,
    form,
    property,
    unit,
    createContractPayment,
    updateContractPayment,
    deleteContractPayment,
    createTransaction,
    createContractReceipt,
    toast,
    onSuccess,
  ]);

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
    return <ReceiptModal receipt={receipt} onClose={onClose} />;
  }

  const displayName =
    [dueItem.tenantName, dueItem.propertyName, dueItem.unitName].filter(Boolean).join(' — ') ||
    'مستحق عقد';

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="modal-batch__backdrop modal-batch__backdrop--sheet"
      role="dialog"
      aria-modal="true"
      aria-labelledby="contract-qp-title"
    >
      <div className="modal-sheet modal-surface modal-surface--md modal-batch__sheet-scroll" dir="rtl">
        {/* رأس النافذة */}
        <div className="modal-sheet__header">
          <h2 id="contract-qp-title" className="modal-sheet__title">
            تسجيل دفعة عقد
          </h2>
          <button type="button" onClick={onClose} className="modal-sheet__close" aria-label="إغلاق">
            ✕
          </button>
        </div>

        {/* معلومات الاستحقاق */}
        <div className="modal-sheet__notice modal-sheet__notice--spaced">
          <p className="modal-batch__notice-title">{displayName}</p>
          <div className="modal-batch__meta-row">
            {dueItem.dueDate && <span>الاستحقاق: {dueItem.dueDate}</span>}
            {dueItem.contractNumber && <span>عقد: {dueItem.contractNumber}</span>}
            {dueItem.installmentNumber && <span>القسط: {dueItem.installmentNumber}</span>}
          </div>
          <div className="modal-batch__amounts-row">
            <div>
              <span className="modal-batch__field-label">المبلغ الأصلي</span>
              <p className="modal-batch__field-value">{formatCurrency(dueItem.amount)}</p>
            </div>
            {dueItem.paidAmount > 0 && (
              <div>
                <span className="modal-batch__field-label">المدفوع</span>
                <p className="modal-batch__field-value" style={{ color: 'var(--color-success)' }}>
                  {formatCurrency(dueItem.paidAmount)}
                </p>
              </div>
            )}
            <div>
              <span className="modal-batch__field-label">المتبقي</span>
              <p
                className="modal-batch__field-value modal-batch__field-value--emphasis"
                style={{
                  color: dueItem.daysOverdue > 0 ? 'var(--color-danger)' : 'var(--color-text)',
                }}
              >
                {formatCurrency(dueItem.remainingAmount)}
              </p>
            </div>
          </div>
          {dueItem.daysOverdue > 0 && (
            <p className="modal-batch__overdue-note" style={{ color: 'var(--color-danger)' }}>
              متأخر {dueItem.daysOverdue} يوم
            </p>
          )}
        </div>

        {/* حقول النموذج */}
        <div className="modal-batch__fields">
          <div>
            <label htmlFor="cqp-amount" className="modal-batch__label">
              مبلغ الدفعة
            </label>
            <input
              id="cqp-amount"
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={(e) => handleChange('amount', e.target.value)}
              className="modal-batch__input"
              placeholder="أدخل المبلغ"
              autoFocus
            />
            {Number(form.amount) > 0 &&
              dueItem.remainingAmount > 0 &&
              Number(form.amount) > dueItem.remainingAmount && (
                <p className="modal-batch__text-hint" style={{ color: 'var(--color-danger)' }}>
                  المبلغ يتجاوز المتبقي ({formatCurrency(dueItem.remainingAmount)})
                </p>
              )}
          </div>

          <div>
            <label htmlFor="cqp-date" className="modal-batch__label">
              تاريخ الدفعة
            </label>
            <input
              id="cqp-date"
              type="date"
              value={form.date}
              onChange={(e) => handleChange('date', e.target.value)}
              className="modal-batch__input"
            />
          </div>

          <div>
            <label htmlFor="cqp-method" className="modal-batch__label">
              طريقة الدفع
            </label>
            <select
              id="cqp-method"
              value={form.paymentMethod}
              onChange={(e) => handleChange('paymentMethod', e.target.value)}
              className="modal-batch__input modal-batch__input--surface"
            >
              {Object.entries(PAYMENT_METHODS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="cqp-note" className="modal-batch__label">
              ملاحظة (اختياري)
            </label>
            <textarea
              id="cqp-note"
              rows={2}
              value={form.note}
              onChange={(e) => handleChange('note', e.target.value)}
              className="modal-batch__input modal-batch__textarea"
              placeholder="مثل: سداد عبر التحويل البنكي"
            />
          </div>
        </div>

        {/* أزرار */}
        <div className="modal-batch__actions--split">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="btn-primary modal-batch__primary-grow u-disabled-muted"
          >
            {saving ? 'جاري التسجيل...' : 'تسجيل الدفعة'}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary">
            إلغاء
          </button>
        </div>

        <p className="modal-batch__footer-note">
          يتم أيضًا إنشاء حركة دخل مرتبطة بهذه الدفعة تلقائياً.
        </p>
      </div>
    </div>
  );
}
