import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../contexts/DataContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import { Badge, EmptyState, SummaryCard, Icons, FormField } from '../ui/ui-common.jsx';
import { formatCurrency } from '../utils/format.jsx';
import { safeNum, today } from '../utils/helpers.js';
import { PAYMENT_METHODS } from '../constants/index.js';
import {
  getContractTypeLabel,
  getContractStatusColor,
  getContractStatusLabel,
  getPaymentCycleLabel,
  getInstallmentCount,
  daysRemaining,
  isExpiringSoon,
} from '../domain/contracts.js';
import {
  buildContractFinancials,
  getDueStatusColor,
  getDueStatusLabel,
  getPaymentMethodLabel,
} from '../domain/contract-finance.js';
import { recordContractPayment } from '../core/contract-payment-service.js';
import ReceiptModal from '../ui/ReceiptModal.jsx';

function InfoCard({ label, value }) {
  return (
    <div className="ctr-detail__info-card">
      <div className="ctr-detail__info-label">{label}</div>
      <div className="ctr-detail__info-value">{value || '—'}</div>
    </div>
  );
}

function PaymentForm({ form, onChange, onSubmit, saving, schedule }) {
  return (
    <section className="detail-section ctr-detail__form-shell">
      <div className="ctr-detail__form-header">
        <span className="ctr-detail__form-icon" aria-hidden="true">
          <Icons.plus size={18} />
        </span>
        <h2 className="ctr-detail__form-title">تسجيل دفعة</h2>
      </div>

      <div className="ctr-detail__form-grid">
        <FormField label="المبلغ" id="contract-payment-amount">
          <input
            id="contract-payment-amount"
            type="number"
            min="0"
            step="0.01"
            value={form.amount}
            onChange={(e) => onChange('amount', e.target.value)}


          />
        </FormField>

        <FormField label="تاريخ الدفعة" id="contract-payment-date">
          <input
            id="contract-payment-date"
            type="date"
            value={form.date}
            onChange={(e) => onChange('date', e.target.value)}


          />
        </FormField>

        <FormField label="طريقة الدفع" id="contract-payment-method">
          <select
            id="contract-payment-method"
            value={form.paymentMethod}
            onChange={(e) => onChange('paymentMethod', e.target.value)}


          >
            {Object.entries(PAYMENT_METHODS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="ربط بالاستحقاق" id="contract-payment-due">
          <select
            id="contract-payment-due"
            value={form.dueId}
            onChange={(e) => onChange('dueId', e.target.value)}


          >
            <option value="">توزيع تلقائي على أقدم استحقاق</option>
            {schedule.map((due) => (
              <option key={due.id} value={due.id}>
                {`القسط ${due.installmentNumber} — ${due.dueDate} — ${getDueStatusLabel(due.status)}`}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <div className="ctr-detail__form-notes">
        <FormField label="ملاحظة" id="contract-payment-note">
          <textarea
            id="contract-payment-note"
            rows={2}
            value={form.note}
            onChange={(e) => onChange('note', e.target.value)}
            className="u-no-resize"
            placeholder="مثل: سداد عبر التحويل البنكي"
          />
        </FormField>
      </div>

      <div className="ctr-detail__form-actions">
        <button
          type="button"
          onClick={onSubmit}
          disabled={saving}
          className="btn-primary"
        >
          {saving ? 'جاري التسجيل...' : 'تسجيل الدفعة'}
        </button>
        <p className="ctr-detail__form-hint">
          يتم أيضًا إنشاء حركة دخل مرتبطة بهذه الدفعة لرفع التشغيلية المالية.
        </p>
      </div>
    </section>
  );
}

function DueTable({ schedule }) {
  if (!schedule.length) {
    return (
      <div className="ctr-detail__empty-note">
        لا يوجد جدول استحقاقات محسوب لهذا العقد بعد.
      </div>
    );
  }

  return (
    <div className="ctr-detail__table-wrap">
      <table className="ctr-detail__table">
        <thead>
          <tr>
            <th>القسط</th>
            <th>تاريخ الاستحقاق</th>
            <th>المبلغ</th>
            <th>المدفوع</th>
            <th>المتبقي</th>
            <th>الحالة</th>
          </tr>
        </thead>
        <tbody>
          {schedule.map((due) => (
            <tr key={due.id}>
              <td className="ctr-detail__cell--primary">
                {due.installmentNumber}
              </td>
              <td className="ctr-detail__cell--muted">{due.dueDate || '—'}</td>
              <td>{formatCurrency(due.amount)}</td>
              <td className="ctr-detail__cell--success">
                {formatCurrency(due.paidAmount)}
              </td>
              <td>
                {formatCurrency(due.remainingAmount)}
              </td>
              <td>
                <Badge color={getDueStatusColor(due.status)}>{getDueStatusLabel(due.status)}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PaymentsTable({ payments, receiptsMap, onViewReceipt }) {
  if (!payments.length) {
    return (
      <div className="ctr-detail__empty-note">لا توجد دفعات مسجلة لهذا العقد بعد.</div>
    );
  }

  return (
    <div className="ctr-detail__table-wrap">
      <table className="ctr-detail__table">
        <thead>
          <tr>
            <th>التاريخ</th>
            <th>المبلغ</th>
            <th>طريقة الدفع</th>
            <th>الاستحقاق</th>
            <th>ملاحظة</th>
            <th>السند</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => {
            const receipt = receiptsMap?.[payment.id];
            return (
              <tr key={payment.id}>
                <td>{payment.date || '—'}</td>
                <td className="ctr-detail__cell--success ctr-detail__cell--primary">
                  {formatCurrency(payment.amount)}
                </td>
                <td className="ctr-detail__cell--muted">
                  {getPaymentMethodLabel(payment.paymentMethod)}
                </td>
                <td className="ctr-detail__cell--muted">
                  {payment.dueId || 'توزيع تلقائي'}
                </td>
                <td className="ctr-detail__cell--muted">{payment.note || '—'}</td>
                <td>
                  {receipt ? (
                    <button
                      type="button"
                      onClick={() => onViewReceipt(receipt)}
                      className="ctr-detail__receipt-btn"
                    >
                      عرض السند
                    </button>
                  ) : (
                    <span className="ctr-detail__cell--muted ctr-detail__cell--sub">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function ContractDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const {
    contracts,
    properties,
    contacts,
    units,
    contractPayments,
    createContractPayment,
    updateContractPayment,
    deleteContractPayment,
    createTransaction,
    contractReceipts,
    createContractReceipt,
  } = useData();
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    date: today(),
    paymentMethod: 'bank_transfer',
    dueId: '',
    note: '',
  });
  const [savingPayment, setSavingPayment] = useState(false);
  // حالة الإيصال — يُعرض بعد نجاح الدفعة
  const [receipt, setReceipt] = useState(null);

  const contract = useMemo(() => contracts.find((item) => item.id === id), [contracts, id]);
  const property = useMemo(
    () =>
      properties.find((item) => item.id === (contract?.propertyId || contract?.property_id)) ||
      null,
    [properties, contract]
  );
  const contact = useMemo(
    () =>
      contacts.find((item) => item.id === (contract?.contactId || contract?.contact_id)) || null,
    [contacts, contract]
  );
  const unit = useMemo(
    () => units.find((item) => item.id === (contract?.unitId || contract?.unit_id)) || null,
    [units, contract]
  );
  const linkedPayments = useMemo(
    () =>
      [...contractPayments]
        .filter((item) => item.contractId === id)
        .sort((a, b) => String(b.date || '').localeCompare(String(a.date || ''))),
    [contractPayments, id]
  );
  const finance = useMemo(
    () => buildContractFinancials(contract, linkedPayments),
    [contract, linkedPayments]
  );
  // خريطة سندات القبض حسب معرف الدفعة — للبحث السريع في الجدول
  const receiptsMap = useMemo(() => {
    const map = {};
    contractReceipts
      .filter((r) => r.contractId === id)
      .forEach((r) => {
        map[r.contractPaymentId] = r;
      });
    return map;
  }, [contractReceipts, id]);

  const handlePaymentChange = useCallback((field, value) => {
    setPaymentForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmitPayment = useCallback(async () => {
    if (!contract) return;
    setSavingPayment(true);

    // استخراج الحالة الحالية للقسط المحدد — للـ rollback الآمن
    const selectedDue =
      paymentForm.dueId && finance?.schedule
        ? finance.schedule.find((d) => d.id === paymentForm.dueId)
        : null;

    const result = await recordContractPayment({
      contract,
      formData: {
        amount: paymentForm.amount,
        date: paymentForm.date,
        paymentMethod: paymentForm.paymentMethod,
        dueId: paymentForm.dueId,
        note: paymentForm.note,
      },
      propertyName: property?.name,
      unitName: unit?.name,
      tenantName: contact?.name,
      currentDueStatus: selectedDue?.status,
      currentPaidAmount: selectedDue?.paidAmount,
      // تاريخ آخر دفعة على القسط — من مصفوفة payments المحسوبة في buildContractSchedule
      currentPaidDate: selectedDue?.payments?.length
        ? selectedDue.payments[selectedDue.payments.length - 1]?.date || null
        : null,
      createContractPayment,
      updateContractPayment,
      deleteContractPayment,
      createTransaction,
      createContractReceipt,
    });

    setSavingPayment(false);

    if (result.success) {
      // عرض سند القبض المحفوظ من الخدمة
      if (result.receipt) {
        setReceipt(result.receipt);
      }

      setPaymentForm({
        amount: '',
        date: today(),
        paymentMethod: paymentForm.paymentMethod,
        dueId: '',
        note: '',
      });
      toast.success('تم تسجيل الدفعة وربطها بالحركة المالية');
    } else if (result.errors) {
      toast.error(result.errors[0]);
    } else {
      toast.error(result.error?.message || 'تعذر تسجيل الدفعة');
    }
  }, [
    contract,
    contact,
    finance,
    createContractPayment,
    updateContractPayment,
    deleteContractPayment,
    createTransaction,
    createContractReceipt,
    paymentForm,
    property,
    toast,
    unit,
  ]);

  if (!contract) {
    return (
      <div className="page-shell page-shell--wide ctr-detail" dir="rtl">
        <EmptyState
          title="عقد غير موجود"
          description="قد يكون العقد حُذف أو أن الرابط غير صحيح."
          actionLabel="العودة إلى العقود"
          onAction={() => navigate('/contracts')}
        />
      </div>
    );
  }

  const remainingDays = daysRemaining(contract.endDate);
  const expiring = isExpiringSoon(contract.endDate);

  return (
    <div className="page-shell page-shell--wide ctr-detail" dir="rtl">
      <nav className="ctr-detail__breadcrumb">
        <button type="button" onClick={() => navigate('/contracts')} className="ctr-detail__breadcrumb-link">
          العقود
        </button>
        <span className="ctr-detail__breadcrumb-sep">/</span>
        <span>{contract.contractNumber || property?.name || 'تفاصيل العقد'}</span>
      </nav>

      <div className="detail-hero ctr-detail__hero">
        <div className="ctr-detail__hero-layout">
          <div className="ctr-detail__hero-identity">
            <span className="ctr-detail__hero-icon" aria-hidden="true">
              <Icons.contracts size={30} />
            </span>
            <div className="ctr-detail__hero-copy">
              <span className="page-kicker">ملف الالتزام</span>
              <div className="ctr-detail__hero-title-row">
                <h1 className="ctr-detail__hero-title">
                  {contract.contractNumber ? `عقد #${contract.contractNumber}` : 'تفاصيل العقد'}
                </h1>
                <Badge color={getContractStatusColor(contract.status)}>
                  {getContractStatusLabel(contract.status)}
                </Badge>
                {expiring && <Badge color="yellow">ينتهي خلال {remainingDays} يوم</Badge>}
              </div>
              <p className="ctr-detail__hero-subtitle">
                {getContractTypeLabel(contract.type)}
                {property?.name ? ` — ${property.name}` : ''}
                {unit?.name ? ` — ${unit.name}` : ''}
              </p>
            </div>
          </div>

          <button type="button" onClick={() => navigate('/contracts')} className="btn-secondary">
            رجوع للقائمة
          </button>
        </div>
      </div>

      <div className="ctr-detail__summary route-summary-grid route-summary-grid--five">
        <SummaryCard
          label="إجمالي العقد"
          value={formatCurrency(finance.total)}
          color="blue"
          icon={<Icons.fileText size={18} />}
        />
        <SummaryCard
          label="المدفوع"
          value={formatCurrency(finance.paid)}
          color="green"
          icon={<Icons.arrowUp size={18} />}
        />
        <SummaryCard
          label="المتبقي"
          value={formatCurrency(finance.remaining)}
          color="blue"
          icon={<Icons.info size={18} />}
        />
        <SummaryCard
          label="المتأخر"
          value={formatCurrency(finance.overdue)}
          color="yellow"
          icon={<Icons.calendar size={18} />}
        />
        <SummaryCard
          label="الاستحقاق القادم"
          value={finance.nextDue?.dueDate || '—'}
          color="yellow"
          icon={<Icons.calendar size={18} />}
        />
      </div>

      <section className="detail-section ctr-detail__section">
        <h2 className="ctr-detail__section-title">بيانات العقد</h2>
        <div className="ctr-detail__info-grid">
          <InfoCard label="رقم العقد" value={contract.contractNumber} />
          <InfoCard label="نوع العقد" value={getContractTypeLabel(contract.type)} />
          <InfoCard label="الحالة" value={getContractStatusLabel(contract.status)} />
          <InfoCard label="تاريخ البداية" value={contract.startDate} />
          <InfoCard label="تاريخ النهاية" value={contract.endDate} />
          <InfoCard label="دورة الدفع" value={getPaymentCycleLabel(contract.paymentCycle)} />
          <InfoCard label="عدد الدفعات" value={String(getInstallmentCount(contract))} />
          <InfoCard
            label="الإيجار الشهري"
            value={contract.monthlyRent ? formatCurrency(safeNum(contract.monthlyRent)) : '—'}
          />
          <InfoCard
            label="إجمالي العقد"
            value={contract.totalAmount ? formatCurrency(safeNum(contract.totalAmount)) : '—'}
          />
          <InfoCard
            label="مبلغ التأمين"
            value={contract.depositAmount ? formatCurrency(safeNum(contract.depositAmount)) : '—'}
          />
          <InfoCard
            label="المدة"
            value={contract.durationMonths ? `${contract.durationMonths} شهر` : '—'}
          />
          <InfoCard label="تجديد تلقائي" value={contract.autoRenew ? 'نعم' : 'لا'} />
          <InfoCard
            label="الأيام المتبقية"
            value={remainingDays != null ? String(remainingDays) : '—'}
          />
        </div>
      </section>

      <section className="detail-section ctr-detail__section">
        <h2 className="ctr-detail__section-title">الارتباطات</h2>
        <div className="ctr-detail__assoc-grid">
          <div className="ctr-detail__assoc-card">
            <div className="ctr-detail__assoc-label">العقار</div>
            <div className="ctr-detail__assoc-value">{property?.name || '—'}</div>
            {property?.id && (
              <button
                type="button"
                onClick={() => navigate(`/properties/${property.id}`)}
                className="ctr-detail__assoc-link"
              >
                عرض العقار
              </button>
            )}
          </div>

          <div className="ctr-detail__assoc-card">
            <div className="ctr-detail__assoc-label">الوحدة</div>
            <div className="ctr-detail__assoc-value">
              {unit?.name || 'العقار بالكامل'}
            </div>
            {unit && (
              <div className="ctr-detail__assoc-meta">{unit.type || ''}</div>
            )}
          </div>

          <div className="ctr-detail__assoc-card">
            <div className="ctr-detail__assoc-label">العميل</div>
            <div className="ctr-detail__assoc-value">{contact?.name || '—'}</div>
            <div className="ctr-detail__assoc-meta">
              {contact?.phone || 'لا يوجد جوال'}
            </div>
            {contact?.id && (
              <button
                type="button"
                onClick={() => navigate(`/contacts/${contact.id}`)}
                className="ctr-detail__assoc-link"
              >
                عرض العميل
              </button>
            )}
          </div>
        </div>
      </section>

      <PaymentForm
        form={paymentForm}
        onChange={handlePaymentChange}
        onSubmit={handleSubmitPayment}
        saving={savingPayment}
        schedule={finance.schedule.filter((due) => due.remainingAmount > 0)}
      />

      <section className="detail-section ctr-detail__section">
        <div className="ctr-detail__section-header">
          <h2 className="ctr-detail__section-title">جدول الاستحقاقات</h2>
          <span className="ctr-detail__section-count">{finance.schedule.length} استحقاق</span>
        </div>
        <DueTable schedule={finance.schedule} />
      </section>

      <section className="detail-section ctr-detail__section">
        <div className="ctr-detail__section-header">
          <h2 className="ctr-detail__section-title">سجل الدفعات</h2>
          <span className="ctr-detail__section-count">{linkedPayments.length} دفعة</span>
        </div>
        <PaymentsTable
          payments={linkedPayments}
          receiptsMap={receiptsMap}
          onViewReceipt={setReceipt}
        />
      </section>

      <section className="detail-section ctr-detail__section ctr-detail__section--last">
        <h2 className="ctr-detail__section-title">ملاحظات</h2>
        <div className="ctr-detail__notes-body">
          {contract.notes || 'لا توجد ملاحظات على هذا العقد.'}
        </div>
      </section>

      {/* نافذة سند القبض — تظهر بعد نجاح تسجيل الدفعة */}
      {receipt && <ReceiptModal receipt={receipt} onClose={() => setReceipt(null)} />}
    </div>
  );
}
