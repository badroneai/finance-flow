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
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
      <div className="text-xs text-[var(--color-muted)] mb-1">{label}</div>
      <div className="text-sm font-medium text-[var(--color-text)]">{value || '—'}</div>
    </div>
  );
}

function PaymentForm({ form, onChange, onSubmit, saving, schedule }) {
  return (
    <section className="detail-section mb-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[var(--color-primary)]" aria-hidden="true">
          <Icons.plus size={18} />
        </span>
        <h2 className="font-bold text-[var(--color-text)]">تسجيل دفعة</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <FormField label="المبلغ" id="contract-payment-amount">
          <input
            id="contract-payment-amount"
            type="number"
            min="0"
            step="0.01"
            value={form.amount}
            onChange={(e) => onChange('amount', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
          />
        </FormField>

        <FormField label="تاريخ الدفعة" id="contract-payment-date">
          <input
            id="contract-payment-date"
            type="date"
            value={form.date}
            onChange={(e) => onChange('date', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
          />
        </FormField>

        <FormField label="طريقة الدفع" id="contract-payment-method">
          <select
            id="contract-payment-method"
            value={form.paymentMethod}
            onChange={(e) => onChange('paymentMethod', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
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
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
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

      <div className="mt-3">
        <FormField label="ملاحظة" id="contract-payment-note">
          <textarea
            id="contract-payment-note"
            rows={2}
            value={form.note}
            onChange={(e) => onChange('note', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm resize-none"
            placeholder="مثل: سداد عبر التحويل البنكي"
          />
        </FormField>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={onSubmit}
          disabled={saving}
          className="btn-primary disabled:opacity-60"
        >
          {saving ? 'جاري التسجيل...' : 'تسجيل الدفعة'}
        </button>
        <p className="text-xs text-[var(--color-muted)]">
          يتم أيضًا إنشاء حركة دخل مرتبطة بهذه الدفعة لرفع التشغيلية المالية.
        </p>
      </div>
    </section>
  );
}

function DueTable({ schedule }) {
  if (!schedule.length) {
    return (
      <div className="text-sm text-[var(--color-muted)]">
        لا يوجد جدول استحقاقات محسوب لهذا العقد بعد.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[var(--color-muted)] border-b border-[var(--color-border)]">
            <th className="text-start py-2 px-2">القسط</th>
            <th className="text-start py-2 px-2">تاريخ الاستحقاق</th>
            <th className="text-start py-2 px-2">المبلغ</th>
            <th className="text-start py-2 px-2">المدفوع</th>
            <th className="text-start py-2 px-2">المتبقي</th>
            <th className="text-start py-2 px-2">الحالة</th>
          </tr>
        </thead>
        <tbody>
          {schedule.map((due) => (
            <tr key={due.id} className="border-b border-[var(--color-border)] last:border-b-0">
              <td className="py-3 px-2 font-medium text-[var(--color-text)]">
                {due.installmentNumber}
              </td>
              <td className="py-3 px-2 text-[var(--color-muted)]">{due.dueDate || '—'}</td>
              <td className="py-3 px-2 text-[var(--color-text)]">{formatCurrency(due.amount)}</td>
              <td className="py-3 px-2 text-[var(--color-success)]">
                {formatCurrency(due.paidAmount)}
              </td>
              <td className="py-3 px-2 text-[var(--color-text)]">
                {formatCurrency(due.remainingAmount)}
              </td>
              <td className="py-3 px-2">
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
      <div className="text-sm text-[var(--color-muted)]">لا توجد دفعات مسجلة لهذا العقد بعد.</div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[var(--color-muted)] border-b border-[var(--color-border)]">
            <th className="text-start py-2 px-2">التاريخ</th>
            <th className="text-start py-2 px-2">المبلغ</th>
            <th className="text-start py-2 px-2">طريقة الدفع</th>
            <th className="text-start py-2 px-2">الاستحقاق</th>
            <th className="text-start py-2 px-2">ملاحظة</th>
            <th className="text-start py-2 px-2">السند</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => {
            const receipt = receiptsMap?.[payment.id];
            return (
              <tr
                key={payment.id}
                className="border-b border-[var(--color-border)] last:border-b-0"
              >
                <td className="py-3 px-2 text-[var(--color-text)]">{payment.date || '—'}</td>
                <td className="py-3 px-2 font-medium text-[var(--color-success)]">
                  {formatCurrency(payment.amount)}
                </td>
                <td className="py-3 px-2 text-[var(--color-muted)]">
                  {getPaymentMethodLabel(payment.paymentMethod)}
                </td>
                <td className="py-3 px-2 text-[var(--color-muted)]">
                  {payment.dueId || 'توزيع تلقائي'}
                </td>
                <td className="py-3 px-2 text-[var(--color-muted)]">{payment.note || '—'}</td>
                <td className="py-3 px-2">
                  {receipt ? (
                    <button
                      type="button"
                      onClick={() => onViewReceipt(receipt)}
                      className="btn-secondary !min-h-0 !px-2 !py-1 text-xs"
                      style={{ color: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}
                    >
                      عرض السند
                    </button>
                  ) : (
                    <span className="text-xs text-[var(--color-muted)]">—</span>
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
      <div className="page-shell page-shell--wide" dir="rtl">
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
    <div className="page-shell page-shell--wide" dir="rtl">
      <div className="text-sm text-[var(--color-muted)] mb-3">
        <button type="button" onClick={() => navigate('/contracts')} className="hover:underline">
          العقود
        </button>
        <span className="mx-2">/</span>
        <span>{contract.contractNumber || property?.name || 'تفاصيل العقد'}</span>
      </div>

      <div className="detail-hero mb-4">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <span className="text-[var(--color-primary)]" aria-hidden="true">
              <Icons.contracts size={30} />
            </span>
            <div className="min-w-0">
              <span className="page-kicker">ملف الالتزام</span>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="text-xl md:text-2xl font-bold text-[var(--color-text)]">
                  {contract.contractNumber ? `عقد #${contract.contractNumber}` : 'تفاصيل العقد'}
                </h1>
                <Badge color={getContractStatusColor(contract.status)}>
                  {getContractStatusLabel(contract.status)}
                </Badge>
                {expiring && <Badge color="yellow">ينتهي خلال {remainingDays} يوم</Badge>}
              </div>
              <p className="text-sm text-[var(--color-muted)]">
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

      <div className="route-summary-grid route-summary-grid--five mb-4">
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

      <section className="detail-section mb-4">
        <h2 className="font-bold text-[var(--color-text)] mb-3">بيانات العقد</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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

      <section className="detail-section mb-4">
        <h2 className="font-bold text-[var(--color-text)] mb-3">الارتباطات</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="report-highlight report-highlight--neutral">
            <div className="text-xs text-[var(--color-muted)] mb-1">العقار</div>
            <div className="font-medium text-[var(--color-text)]">{property?.name || '—'}</div>
            {property?.id && (
              <button
                type="button"
                onClick={() => navigate(`/properties/${property.id}`)}
                className="text-sm mt-2"
                style={{ color: 'var(--color-info)' }}
              >
                عرض العقار
              </button>
            )}
          </div>

          <div className="report-highlight report-highlight--neutral">
            <div className="text-xs text-[var(--color-muted)] mb-1">الوحدة</div>
            <div className="font-medium text-[var(--color-text)]">
              {unit?.name || 'العقار بالكامل'}
            </div>
            {unit && (
              <div className="text-sm text-[var(--color-muted)] mt-2">{unit.type || ''}</div>
            )}
          </div>

          <div className="report-highlight report-highlight--neutral">
            <div className="text-xs text-[var(--color-muted)] mb-1">العميل</div>
            <div className="font-medium text-[var(--color-text)]">{contact?.name || '—'}</div>
            <div className="text-sm text-[var(--color-muted)] mt-2">
              {contact?.phone || 'لا يوجد جوال'}
            </div>
            {contact?.id && (
              <button
                type="button"
                onClick={() => navigate(`/contacts/${contact.id}`)}
                className="text-sm mt-2"
                style={{ color: 'var(--color-info)' }}
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

      <section className="detail-section mb-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="font-bold text-[var(--color-text)]">جدول الاستحقاقات</h2>
          <div className="text-xs text-[var(--color-muted)]">{finance.schedule.length} استحقاق</div>
        </div>
        <DueTable schedule={finance.schedule} />
      </section>

      <section className="detail-section mb-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="font-bold text-[var(--color-text)]">سجل الدفعات</h2>
          <div className="text-xs text-[var(--color-muted)]">{linkedPayments.length} دفعة</div>
        </div>
        <PaymentsTable
          payments={linkedPayments}
          receiptsMap={receiptsMap}
          onViewReceipt={setReceipt}
        />
      </section>

      <section className="detail-section">
        <h2 className="font-bold text-[var(--color-text)] mb-3">ملاحظات</h2>
        <div className="text-sm text-[var(--color-text)] whitespace-pre-wrap">
          {contract.notes || 'لا توجد ملاحظات على هذا العقد.'}
        </div>
      </section>

      {/* نافذة سند القبض — تظهر بعد نجاح تسجيل الدفعة */}
      {receipt && <ReceiptModal receipt={receipt} onClose={() => setReceipt(null)} />}
    </div>
  );
}
