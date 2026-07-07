/**
 * CommissionsTable — جدول العمولات لشاشات الديسكتوب
 * مستخرج من CommissionsPage.jsx (Slice 6) — لا تغيير سلوكي.
 */
import { Icons, Badge } from '../ui-common.jsx';
import { Currency } from '../../utils/format.jsx';
import { safeNum } from '../../utils/helpers.js';

// ═══════════════════════════════════════
// حالات العمولة
// ═══════════════════════════════════════
const STATUS_MAP = {
  pending: { label: 'مستحقة', color: 'yellow' },
  partial: { label: 'مدفوعة جزئياً', color: 'blue' },
  paid: { label: 'مدفوعة', color: 'green' },
};

// ═══════════════════════════════════════
// حساب مبلغ العمولة
// ═══════════════════════════════════════
function calcCommissionAmount(dealValue, officePercent) {
  return (safeNum(dealValue, 0) * safeNum(officePercent, 0)) / 100;
}

/** الحصول على قيمة الحقل بدعم camelCase و snake_case */
function f(c, camel, snake) {
  return c[camel] ?? c[snake] ?? null;
}

export function CommissionsTable({
  commissions,
  ledgerName,
  canWrite,
  onEdit,
  onPay,
  onDelete,
}) {
  return (
    <div className="commissions-page__table-shell panel-card">
      <div className="commissions-page__table-meta">
        <div>
          <h2 className="commissions-page__table-title">عرض الجدول</h2>
          <p className="commissions-page__table-subtitle">
            نفس القائمة أعلاه بتنسيق أعمدة للشاشات الواسعة.
          </p>
        </div>
      </div>
      <div className="commissions-page__table-scroll">
        <table className="commissions-page__table">
          <thead>
            <tr className="commissions-page__table-head-row">
              <th className="commissions-page__table-th" scope="col">
                العميل
              </th>
              <th className="commissions-page__table-th" scope="col">
                الوكيل
              </th>
              <th className="commissions-page__table-th" scope="col">
                الدفتر
              </th>
              <th className="commissions-page__table-th" scope="col">
                قيمة الصفقة
              </th>
              <th className="commissions-page__table-th" scope="col">
                نسبة المكتب
              </th>
              <th className="commissions-page__table-th" scope="col">
                العمولة
              </th>
              <th className="commissions-page__table-th" scope="col">
                المدفوع
              </th>
              <th className="commissions-page__table-th" scope="col">
                المتبقي
              </th>
              <th
                className="commissions-page__table-th commissions-page__table-th--center"
                scope="col"
              >
                الحالة
              </th>
              {canWrite && (
                <th
                  className="commissions-page__table-th commissions-page__table-th--center"
                  scope="col"
                >
                  إجراءات
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {commissions.map((c) => {
              const amount = calcCommissionAmount(
                f(c, 'dealValue', 'deal_value'),
                f(c, 'officePercent', 'office_percent')
              );
              const paid = safeNum(f(c, 'paidAmount', 'paid_amount'), 0);
              const remaining = Math.max(0, amount - paid);
              const st = STATUS_MAP[c.status] || STATUS_MAP.pending;
              return (
                <tr key={c.id} className="commissions-page__table-body-row">
                  <td className="commissions-page__table-td commissions-page__table-td--strong">
                    {f(c, 'clientName', 'client_name') || '—'}
                  </td>
                  <td className="commissions-page__table-td commissions-page__table-td--muted">
                    {f(c, 'agentName', 'agent_name') || '—'}
                  </td>
                  <td className="commissions-page__table-td commissions-page__table-td--muted">
                    {ledgerName(f(c, 'ledgerId', 'ledger_id'))}
                  </td>
                  <td className="commissions-page__table-td commissions-page__money">
                    <Currency
                      value={f(c, 'dealValue', 'deal_value')}
                      symbolClassName="commissions-page__currency-symbol"
                    />
                  </td>
                  <td className="commissions-page__table-td commissions-page__table-td--muted">
                    {f(c, 'officePercent', 'office_percent') || 0}%
                  </td>
                  <td className="commissions-page__table-td commissions-page__money commissions-page__table-td--commission">
                    <Currency
                      value={amount}
                      symbolClassName="commissions-page__currency-symbol"
                    />
                  </td>
                  <td className="commissions-page__table-td commissions-page__money commissions-page__money--paid">
                    <Currency
                      value={paid}
                      symbolClassName="commissions-page__currency-symbol"
                    />
                  </td>
                  <td className="commissions-page__table-td commissions-page__money commissions-page__money--remaining">
                    <Currency
                      value={remaining}
                      symbolClassName="commissions-page__currency-symbol"
                    />
                  </td>
                  <td className="commissions-page__table-td commissions-page__table-td--center">
                    <Badge color={st.color}>{st.label}</Badge>
                  </td>
                  {canWrite && (
                    <td className="commissions-page__table-td">
                      <div className="commissions-page__row-actions">
                        <button
                          type="button"
                          onClick={() => onEdit(c)}
                          className="btn-ghost commissions-page__icon-action commissions-page__icon-action--edit"
                          aria-label="تعديل"
                          title="تعديل"
                        >
                          <Icons.edit size={15} />
                        </button>
                        {c.status !== 'paid' && (
                          <button
                            type="button"
                            onClick={() => onPay(c)}
                            className="btn-ghost commissions-page__icon-action commissions-page__icon-action--pay"
                            aria-label="تسجيل دفعة"
                            title="تسجيل دفعة"
                          >
                            <Icons.check size={15} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onDelete(c.id)}
                          className="btn-ghost commissions-page__icon-action commissions-page__icon-action--delete"
                          aria-label="حذف"
                          title="حذف"
                        >
                          <Icons.trash size={15} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default CommissionsTable;
