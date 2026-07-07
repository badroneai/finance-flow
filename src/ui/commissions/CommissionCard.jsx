/**
 * بطاقة عرض عمولة واحدة (وضع الموبايل)
 * مُستخرجة من CommissionsPage.jsx — نفس الـ behavior تمامًا.
 */
import { Badge } from '../ui-common.jsx';
import { Currency } from '../../utils/format.jsx';
import { safeNum } from '../../utils/helpers.js';

// ─── دوال مساعدة نقية ───

/** الحصول على قيمة الحقل بدعم camelCase و snake_case */
function f(c, camel, snake) {
  return c[camel] ?? c[snake] ?? null;
}

/** حساب مبلغ العمولة */
function calcCommissionAmount(dealValue, officePercent) {
  return (safeNum(dealValue, 0) * safeNum(officePercent, 0)) / 100;
}

// ─── حالات العمولة ───
const STATUS_MAP = {
  pending: { label: 'مستحقة', color: 'yellow' },
  partial: { label: 'مدفوعة جزئياً', color: 'blue' },
  paid: { label: 'مدفوعة', color: 'green' },
};

export function CommissionCard({ commission: c, ledgerName, canWrite, onEdit, onPay, onDelete }) {
  const amount = calcCommissionAmount(
    f(c, 'dealValue', 'deal_value'),
    f(c, 'officePercent', 'office_percent')
  );
  const paid = safeNum(f(c, 'paidAmount', 'paid_amount'), 0);
  const remaining = Math.max(0, amount - paid);
  const st = STATUS_MAP[c.status] || STATUS_MAP.pending;

  return (
    <div className="panel-card">
      <div className="commissions-page__mobile-card-head">
        <div>
          <p className="commissions-page__mobile-card-client">
            {f(c, 'clientName', 'client_name') || '—'}
          </p>
          <p className="commissions-page__mobile-meta">
            {ledgerName(f(c, 'ledgerId', 'ledger_id'))}
          </p>
        </div>
        <Badge color={st.color}>{st.label}</Badge>
      </div>
      <div className="commissions-page__mobile-card-grid">
        <div className="commissions-page__mobile-card-item">
          <span className="commissions-page__mobile-label">قيمة الصفقة: </span>
          <span className="commissions-page__mobile-value">
            <Currency
              value={f(c, 'dealValue', 'deal_value')}
              symbolClassName="commissions-page__currency-symbol"
            />
          </span>
        </div>
        <div className="commissions-page__mobile-card-item">
          <span className="commissions-page__mobile-label">العمولة: </span>
          <span className="commissions-page__mobile-value commissions-page__mobile-value--semibold">
            <Currency value={amount} symbolClassName="commissions-page__currency-symbol" />
          </span>
        </div>
        <div className="commissions-page__mobile-card-item">
          <span className="commissions-page__mobile-label">المدفوع: </span>
          <span className="commissions-page__mobile-money--paid">
            <Currency value={paid} symbolClassName="commissions-page__currency-symbol" />
          </span>
        </div>
        <div className="commissions-page__mobile-card-item">
          <span className="commissions-page__mobile-label">المتبقي: </span>
          <span className="commissions-page__mobile-money--remaining">
            <Currency value={remaining} symbolClassName="commissions-page__currency-symbol" />
          </span>
        </div>
      </div>
      {f(c, 'agentName', 'agent_name') && (
        <p className="commissions-page__mobile-agent">
          الوكيل: {f(c, 'agentName', 'agent_name')}
        </p>
      )}
      {canWrite && (
        <div className="commissions-page__mobile-card-actions">
          <button
            type="button"
            onClick={() => onEdit(c)}
            className="btn-ghost commissions-page__mobile-action commissions-page__mobile-action--edit"
          >
            تعديل
          </button>
          {c.status !== 'paid' && (
            <button
              type="button"
              onClick={() => onPay(c)}
              className="btn-ghost commissions-page__mobile-action commissions-page__mobile-action--pay"
            >
              دفعة
            </button>
          )}
          <button
            type="button"
            onClick={() => onDelete(c.id)}
            className="btn-ghost commissions-page__mobile-action--delete"
          >
            حذف
          </button>
        </div>
      )}
    </div>
  );
}
