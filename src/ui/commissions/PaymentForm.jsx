/**
 * نموذج تسجيل دفعة عمولة
 * مُستخرج من CommissionsPage.jsx — نفس الـ behavior تمامًا.
 */
import { useState } from 'react';
import { FormField } from '../ui-common.jsx';
import { Currency, formatCurrency, formatNumber } from '../../utils/format.jsx';
import { today, safeNum } from '../../utils/helpers.js';

// ─── دوال مساعدة نقية ───

/** الحصول على قيمة الحقل بدعم camelCase و snake_case */
function f(c, camel, snake) {
  return c[camel] ?? c[snake] ?? null;
}

/** حساب مبلغ العمولة */
function calcCommissionAmount(dealValue, officePercent) {
  return (safeNum(dealValue, 0) * safeNum(officePercent, 0)) / 100;
}

export function PaymentForm({ commission, onSave, onCancel }) {
  const c = commission;
  const totalAmount = calcCommissionAmount(
    f(c, 'dealValue', 'deal_value'),
    f(c, 'officePercent', 'office_percent')
  );
  const currentPaid = safeNum(f(c, 'paidAmount', 'paid_amount'), 0);
  const remaining = Math.max(0, totalAmount - currentPaid);

  const [amount, setAmount] = useState('');
  const [payDate, setPayDate] = useState(today());
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const val = safeNum(amount, 0);
    if (val <= 0) {
      setError('مبلغ الدفعة مطلوب وأكبر من صفر');
      return;
    }
    if (val > remaining) {
      setError(`المبلغ يتجاوز المتبقي (${formatCurrency(remaining)})`);
      return;
    }
    setError('');
    onSave(c.id, val, payDate);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="commissions-page__payment-summary">
        <p className="commissions-page__payment-summary-title">
          {f(c, 'clientName', 'client_name') || '—'}
        </p>
        <div className="commissions-page__payment-summary-grid">
          <div>
            <span className="commissions-page__payment-summary-label">العمولة</span>
            <p className="commissions-page__payment-summary-value">
              <Currency value={totalAmount} symbolClassName="commissions-page__currency-symbol" />
            </p>
          </div>
          <div>
            <span className="commissions-page__payment-summary-label">المدفوع</span>
            <p className="commissions-page__payment-summary-value commissions-page__payment-summary-value--paid">
              <Currency value={currentPaid} symbolClassName="commissions-page__currency-symbol" />
            </p>
          </div>
          <div>
            <span className="commissions-page__payment-summary-label">المتبقي</span>
            <p className="commissions-page__payment-summary-value commissions-page__payment-summary-value--remaining">
              <Currency value={remaining} symbolClassName="commissions-page__currency-symbol" />
            </p>
          </div>
        </div>
      </div>

      <FormField id="pay-amount" label="مبلغ الدفعة" error={error}>
        <input
          type="number"
          step="0.01"
          min="0"
          max={remaining}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="commissions-page__form-control"
          placeholder={`الحد الأقصى: ${formatNumber(remaining)}`}
          aria-required="true"
        />
      </FormField>

      <FormField label="تاريخ الدفع">
        <input
          type="date"
          value={payDate}
          onChange={(e) => setPayDate(e.target.value)}
          className="commissions-page__form-control"
        />
      </FormField>

      {/* زر دفع كامل */}
      {remaining > 0 && (
        <button
          type="button"
          onClick={() => setAmount(String(remaining))}
          className="commissions-page__payment-fill-btn"
        >
          دفع المبلغ كاملاً ({formatCurrency(remaining)})
        </button>
      )}

      <div className="commissions-page__form-actions">
        <button type="button" onClick={onCancel} className="btn-secondary">
          إلغاء
        </button>
        <button type="submit" className="btn-primary commissions-page__form-submit--success">
          تسجيل الدفعة
        </button>
      </div>
    </form>
  );
}
