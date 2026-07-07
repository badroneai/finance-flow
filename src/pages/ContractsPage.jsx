/**
 * صفحة العقود — SPR-018: النواة العقارية (الخطوة 3: العقود)
 * ربط العقارات بالعملاء مع شروط الإيجار ودورات الدفع.
 */
import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import { FormField, SummaryCard, Icons, EmptyState, MobileFAB, Badge } from '../ui/ui-common.jsx';
import { ConfirmDialog } from '../ui/Modals.jsx';
import { formatCurrency } from '../utils/format.jsx';
import { safeNum } from '../utils/helpers.js';
import {
  CONTRACT_TYPE_OPTIONS,
  CONTRACT_STATUS_OPTIONS,
  PAYMENT_CYCLE_OPTIONS,
  getContractTypeLabel,
  getContractStatusLabel,
  getContractStatusColor,
  getPaymentCycleLabel,
  getInstallmentCount,
  daysRemaining,
  isExpiringSoon,
  validateContract,
  computeContractsSummary,
  filterContracts,
  defaultContract,
} from '../domain/contracts.js';
import { getUnitStatusLabel } from '../domain/units.js';

// ═══════════════════════════════════════
// نموذج إضافة/تعديل العقد
// ═══════════════════════════════════════
function ContractForm({
  form,
  setForm,
  onSave,
  onCancel,
  editMode,
  saving,
  properties,
  contacts,
  units,
}) {
  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const syncInstallments = (nextForm) => {
    const nextCount = getInstallmentCount(nextForm);
    return {
      ...nextForm,
      installmentCount: nextForm.paymentCycle === 'custom' ? nextForm.installmentCount : nextCount,
    };
  };

  const selectedPropertyUnits = useMemo(
    () => units.filter((unit) => unit.propertyId === form.propertyId),
    [units, form.propertyId]
  );

  const handlePropertyChange = (value) => {
    const matchingUnits = units.filter((unit) => unit.propertyId === value);
    setForm((prev) => ({
      ...prev,
      propertyId: value,
      unitId: matchingUnits.some((unit) => unit.id === prev.unitId) ? prev.unitId : '',
    }));
  };

  // عند تغيير المدة، نحدّث تاريخ النهاية تلقائياً
  const handleDurationChange = (months) => {
    const nextForm = { ...form, durationMonths: months };
    if (form.startDate) {
      const start = new Date(form.startDate);
      start.setMonth(start.getMonth() + Number(months));
      nextForm.endDate = start.toISOString().split('T')[0];
    }
    setForm(syncInstallments(nextForm));
  };

  // عند تغيير الإيجار الشهري، نحدّث الإجمالي تلقائياً
  const handleMonthlyRentChange = (value) => {
    const nextForm = { ...form, monthlyRent: value };
    const months = Number(form.durationMonths) || 12;
    const rent = Number(value) || 0;
    if (rent > 0) {
      nextForm.totalAmount = String(rent * months);
    }
    setForm(syncInstallments(nextForm));
  };

  const handlePaymentCycleChange = (value) => {
    const nextForm = { ...form, paymentCycle: value };
    if (value === 'one_time') {
      nextForm.installmentCount = 1;
    } else if (value !== 'custom') {
      nextForm.installmentCount = getInstallmentCount(nextForm);
    }
    setForm(nextForm);
  };

  return (
    <div className="panel-card contracts-page__form-shell">
      <div className="contracts-page__form-header">
        <div>
          <h3 className="contracts-page__form-title">
            {editMode ? 'تعديل العقد' : 'إضافة عقد جديد'}
          </h3>
          <p className="contracts-page__form-hint">
            {editMode ? 'عدّل البيانات واحفظ التغييرات' : 'اربط العقار بالعميل وحدد شروط التعاقد'}
          </p>
        </div>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-secondary">
            إلغاء
          </button>
        )}
      </div>

      <div className="contracts-page__form-grid">
        {/* العقار */}
        <FormField label="العقار" id="contract-property">
          <select
            value={form.propertyId}
            onChange={(e) => handlePropertyChange(e.target.value)}
          >
            <option value="">اختر العقار</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </FormField>

        {selectedPropertyUnits.length > 0 && (
          <FormField label="الوحدة" id="contract-unit">
            <select
              value={form.unitId || ''}
              onChange={(e) => handleChange('unitId', e.target.value)}
            >
              <option value="">العقار بالكامل / بدون وحدة محددة</option>
              {selectedPropertyUnits.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                  {unit.status ? ` — ${getUnitStatusLabel(unit.status)}` : ''}
                </option>
              ))}
            </select>
          </FormField>
        )}

        {/* العميل */}
        <FormField label="العميل" id="contract-contact">
          <select
            value={form.contactId}
            onChange={(e) => handleChange('contactId', e.target.value)}
          >
            <option value="">اختر العميل</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </FormField>

        {/* رقم العقد */}
        <FormField label="رقم العقد (اختياري)" id="contract-number">
          <input
            type="text"
            value={form.contractNumber}
            onChange={(e) => handleChange('contractNumber', e.target.value)}
            placeholder="مثال: 2026-001"
            dir="ltr"
          />
        </FormField>

        {/* النوع */}
        <FormField label="نوع العقد" id="contract-type">
          <select
            value={form.type}
            onChange={(e) => handleChange('type', e.target.value)}
          >
            {CONTRACT_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </FormField>

        {/* الحالة */}
        <FormField label="الحالة" id="contract-status">
          <select
            value={form.status}
            onChange={(e) => handleChange('status', e.target.value)}
          >
            {CONTRACT_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </FormField>

        {/* دورة الدفع */}
        <FormField label="دورة الدفع" id="contract-payment-cycle">
          <select
            value={form.paymentCycle}
            onChange={(e) => handlePaymentCycleChange(e.target.value)}
          >
            {PAYMENT_CYCLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="عدد الدفعات" id="contract-installment-count">
          <input
            type="number"
            value={form.installmentCount}
            onChange={(e) => handleChange('installmentCount', e.target.value)}
            min="1"
            readOnly={form.paymentCycle !== 'custom'}
          />
        </FormField>

        {/* تاريخ البداية */}
        <FormField label="تاريخ البداية" id="contract-start">
          <input
            type="date"
            value={form.startDate}
            onChange={(e) => handleChange('startDate', e.target.value)}
          />
        </FormField>

        {/* المدة */}
        <FormField label="المدة (أشهر)" id="contract-duration">
          <input
            type="number"
            value={form.durationMonths}
            onChange={(e) => handleDurationChange(e.target.value)}
            min="1"
          />
        </FormField>

        {/* تاريخ النهاية */}
        <FormField label="تاريخ النهاية" id="contract-end">
          <input
            type="date"
            value={form.endDate}
            onChange={(e) => handleChange('endDate', e.target.value)}
          />
        </FormField>

        {/* الإيجار الشهري */}
        <FormField label="الإيجار الشهري (ر.س)" id="contract-rent">
          <input
            type="number"
            value={form.monthlyRent}
            onChange={(e) => handleMonthlyRentChange(e.target.value)}
            placeholder="مثال: 3500"
            min="0"
          />
        </FormField>

        {/* إجمالي قيمة العقد */}
        <FormField label="إجمالي قيمة العقد (ر.س)" id="contract-total">
          <input
            type="number"
            value={form.totalAmount}
            onChange={(e) => handleChange('totalAmount', e.target.value)}
            placeholder="يُحسب تلقائياً أو أدخله يدوياً"
            min="0"
          />
        </FormField>

        {/* مبلغ التأمين */}
        <FormField label="مبلغ التأمين (ر.س)" id="contract-deposit">
          <input
            type="number"
            value={form.depositAmount}
            onChange={(e) => handleChange('depositAmount', e.target.value)}
            placeholder="اختياري"
            min="0"
          />
        </FormField>

        {/* تجديد تلقائي */}
        <FormField label="تجديد تلقائي" id="contract-auto-renew">
          <label className="contracts-page__checkbox-label">
            <input
              type="checkbox"
              checked={form.autoRenew}
              onChange={(e) => handleChange('autoRenew', e.target.checked)}
            />
            <span className="contracts-page__checkbox-text">
              يتجدد تلقائياً عند انتهاء المدة
            </span>
          </label>
        </FormField>
      </div>

      {/* ملاحظات */}
      <div className="contracts-page__form-notes">
        <FormField label="ملاحظات" id="contract-notes">
          <textarea
            value={form.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="أي ملاحظات إضافية عن العقد..."
            rows={2}
          />
        </FormField>
      </div>

      <div className="contracts-page__form-actions">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="btn-primary"
        >
          {saving ? 'جاري الحفظ...' : editMode ? 'حفظ التعديلات' : 'إضافة العقد'}
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// بطاقة عقد
// ═══════════════════════════════════════
function ContractCard({
  contract,
  properties,
  contacts,
  units,
  onEdit,
  onDelete,
  onViewProperty,
  onViewContact,
  onOpen,
}) {
  const typeLabel = getContractTypeLabel(contract.type);
  const statusLabel = getContractStatusLabel(contract.status);
  const statusColor = getContractStatusColor(contract.status);
  const cycleLabel = getPaymentCycleLabel(contract.paymentCycle);
  const remaining = daysRemaining(contract.endDate);
  const expiring = isExpiringSoon(contract.endDate);

  // البحث عن أسماء العقار والعميل
  const propertyName =
    contract._propertyName ||
    contract.propertyName ||
    properties.find((p) => p.id === contract.propertyId)?.name ||
    'عقار غير محدد';
  const unitName =
    contract._unitName ||
    contract.unitName ||
    units.find((unit) => unit.id === (contract.unitId || contract.unit_id))?.name ||
    '';
  const contactName =
    contract._contactName ||
    contract.contactName ||
    contacts.find((c) => c.id === contract.contactId)?.name ||
    'عميل غير محدد';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen?.()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen?.();
        }
      }}
      className="panel-card contracts-page__card"
    >
      <div className="contracts-page__card-head">
        <div className="contracts-page__card-identity">
          <span className="contracts-page__card-icon" aria-hidden="true">
            <Icons.contracts size={24} />
          </span>
          <div>
            <div className="contracts-page__card-name">{propertyName}</div>
            <div className="contracts-page__card-type">
              {typeLabel} — {contactName}
            </div>
            {unitName && (
              <div className="contracts-page__card-unit">الوحدة: {unitName}</div>
            )}
          </div>
        </div>
        <div className="contracts-page__card-badges">
          <Badge color={statusColor === 'gray' ? 'gray' : statusColor}>{statusLabel}</Badge>
          {expiring && <Badge color="yellow">ينتهي خلال {remaining} يوم</Badge>}
        </div>
      </div>

      {/* تفاصيل سريعة */}
      <div className="contracts-page__card-meta">
        {contract.contractNumber && <span>عقد #{contract.contractNumber}</span>}
        <span>
          {contract.startDate} → {contract.endDate}
        </span>
        <span>{cycleLabel}</span>
        {unitName && <span>{unitName}</span>}
      </div>

      {/* المبالغ */}
      <div className="contracts-page__card-amounts">
        {contract.monthlyRent > 0 && (
          <span className="contracts-page__card-rent">
            {formatCurrency(safeNum(contract.monthlyRent))}/شهر
          </span>
        )}
        {contract.totalAmount > 0 && (
          <span className="contracts-page__card-detail">
            الإجمالي: {formatCurrency(safeNum(contract.totalAmount))}
          </span>
        )}
        {contract.depositAmount > 0 && (
          <span className="contracts-page__card-detail">
            تأمين: {formatCurrency(safeNum(contract.depositAmount))}
          </span>
        )}
      </div>

      {contract.notes && (
        <p className="contracts-page__card-notes">{contract.notes}</p>
      )}

      <div className="contracts-page__card-actions" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => onEdit(contract)}
          className="contracts-page__card-action contracts-page__card-action--edit"
        >
          تعديل
        </button>
        <button
          type="button"
          onClick={() => onDelete(contract)}
          className="contracts-page__card-action contracts-page__card-action--delete"
        >
          حذف
        </button>
        <div className="contracts-page__card-links u-push-inline-start">
          {(contract.propertyId || contract.property_id) && (
            <button
              type="button"
              onClick={() => onViewProperty?.()}
              className="contracts-page__card-action contracts-page__card-action--link"
            >
              العقار
            </button>
          )}
          {(contract.contactId || contract.contact_id) && (
            <button
              type="button"
              onClick={() => onViewContact?.()}
              className="contracts-page__card-action contracts-page__card-action--link"
            >
              العميل
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// الصفحة الرئيسية
// ═══════════════════════════════════════
export default function ContractsPage() {
  const navigate = useNavigate();
  const {
    contracts,
    contractsLoading,
    createContract,
    updateContract,
    deleteContract,
    properties,
    units,
    contacts: contactsList,
  } = useData();
  const toast = useToast();

  // نموذج إضافة/تعديل
  const [form, setForm] = useState(defaultContract);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // فلاتر
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // حوار حذف
  const [confirmDelete, setConfirmDelete] = useState(null);

  // إثراء العقود بأسماء العقارات والعملاء (للبحث المحلي)
  const enrichedContracts = useMemo(() => {
    return contracts.map((c) => ({
      ...c,
      _propertyName: c._propertyName || properties.find((p) => p.id === c.propertyId)?.name || '',
      _contactName: c._contactName || contactsList.find((ct) => ct.id === c.contactId)?.name || '',
      _unitName:
        c._unitName || units.find((unit) => unit.id === (c.unitId || c.unit_id))?.name || '',
    }));
  }, [contracts, properties, contactsList, units]);

  // ملخص
  const summary = useMemo(() => computeContractsSummary(enrichedContracts), [enrichedContracts]);

  // فلترة
  const filtered = useMemo(
    () =>
      filterContracts(enrichedContracts, {
        type: filterType,
        status: filterStatus,
        search: searchQuery,
      }),
    [enrichedContracts, filterType, filterStatus, searchQuery]
  );

  // حفظ
  const handleSave = useCallback(async () => {
    const { valid, errors } = validateContract(form);
    if (!valid) {
      toast.error(errors[0]);
      return;
    }
    setSaving(true);
    try {
      // تنظيف الحقول قبل الإرسال
      const payload = { ...form };
      if (!payload.propertyId) delete payload.propertyId;
      if (!payload.unitId) delete payload.unitId;
      if (!payload.contactId) delete payload.contactId;

      if (editMode && editId) {
        const { error } = await updateContract(editId, payload);
        if (error) throw error;
        toast.success('تم تحديث العقد');
      } else {
        const { error } = await createContract(payload);
        if (error) throw error;
        toast.success('تمت إضافة العقد');
      }
      setForm(defaultContract());
      setEditMode(false);
      setEditId(null);
      setShowForm(false);
    } catch (err) {
      toast.error(err?.message || 'حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  }, [form, editMode, editId, createContract, updateContract, toast]);

  // بدء التعديل
  const handleEdit = useCallback((contract) => {
    setForm({ ...defaultContract(), ...contract });
    setEditMode(true);
    setEditId(contract.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // إلغاء
  const handleCancel = useCallback(() => {
    setForm(defaultContract());
    setEditMode(false);
    setEditId(null);
    setShowForm(false);
  }, []);

  // تأكيد الحذف
  const handleConfirmDelete = useCallback(async () => {
    if (!confirmDelete) return;
    try {
      const { error } = await deleteContract(confirmDelete.id);
      if (error) throw error;
      toast.success('تم حذف العقد');
    } catch (err) {
      toast.error(err?.message || 'حدث خطأ أثناء الحذف');
    }
    setConfirmDelete(null);
  }, [confirmDelete, deleteContract, toast]);

  return (
    <div className="page-shell page-shell--regular contracts-page" dir="rtl">
      <div className="page-header">
        <div className="page-header-copy">
          <span className="page-kicker">الارتباطات النظامية</span>
          <h1 className="page-title">العقود</h1>
          <p className="page-subtitle">
            اربط العقارات بالعملاء بدقة، وتابع الحالة والتجديد والدفع من واجهة واحدة.
          </p>
        </div>
        {!showForm && (
          <button
            type="button"
            onClick={() => {
              setForm(defaultContract());
              setEditMode(false);
              setEditId(null);
              setShowForm(true);
            }}
            className="btn-primary"
          >
            <Icons.plus size={16} />
            إضافة عقد
          </button>
        )}
      </div>

      {/* تنبيه: لا عقارات أو عملاء */}
      {properties.length === 0 &&
        contactsList.length === 0 &&
        !showForm &&
        contracts.length === 0 && (
          <div className="panel-card contracts-page__notice">
            أضف عقارات وعملاء أولاً قبل إنشاء العقود. انتقل لصفحة «العقارات» أو «العملاء» للبدء.
          </div>
        )}

      {/* نموذج إضافة/تعديل */}
      {showForm && (
        <ContractForm
          form={form}
          setForm={setForm}
          onSave={handleSave}
          onCancel={handleCancel}
          editMode={editMode}
          saving={saving}
          properties={properties}
          contacts={contactsList}
          units={units}
        />
      )}

      {/* ملخص */}
      {contracts.length > 0 && (
        <div className="contracts-page__summary">
          <div className="route-summary-grid route-summary-grid--quad">
            <SummaryCard
              label="إجمالي العقود"
              value={summary.total}
              icon={<Icons.contracts size={20} />}
            />
            <SummaryCard label="ساري" value={summary.activeCount} icon={<Icons.check size={18} />} />
            <SummaryCard
              label="ينتهي قريباً"
              value={summary.expiringSoon}
              icon={<Icons.calendar size={18} />}
              highlight={summary.expiringSoon > 0}
            />
            <SummaryCard
              label="الإيجار الشهري"
              value={formatCurrency(summary.totalMonthlyRent)}
              icon={<Icons.commissions size={18} />}
            />
          </div>
        </div>
      )}

      {/* فلاتر */}
      {contracts.length > 0 && (
        <div className="control-toolbar control-toolbar--compact contracts-page__toolbar">
          <div className="contracts-page__search">
            <Icons.search size={16} className="field-icon-inline-start" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث برقم العقد، اسم العقار أو العميل..."
              className="contracts-page__search-input"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="contracts-page__filter-control"
          >
            <option value="">كل الأنواع</option>
            {CONTRACT_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="contracts-page__filter-control"
          >
            <option value="">كل الحالات</option>
            {CONTRACT_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* حالة التحميل */}
      {contractsLoading && (
        <div className="contracts-page__state">جاري التحميل...</div>
      )}

      {/* حالة فارغة */}
      {!contractsLoading && contracts.length === 0 && !showForm && (
        <EmptyState
          title="لا توجد عقود"
          description="أنشئ عقوداً لربط العقارات بالعملاء وتتبع المدفوعات والتواريخ."
          actionLabel="إضافة أول عقد"
          onAction={() => {
            setForm(defaultContract());
            setShowForm(true);
          }}
        />
      )}

      {/* لا نتائج */}
      {!contractsLoading && contracts.length > 0 && filtered.length === 0 && (
        <EmptyState
          title="لا توجد نتائج مطابقة"
          description="غيّر كلمات البحث أو وسّع الفلاتر للعثور على العقود المطلوبة."
          actionLabel="إعادة ضبط البحث"
          onAction={() => {
            setSearchQuery('');
            setFilterType('');
            setFilterStatus('');
          }}
        />
      )}

      {/* قائمة العقود */}
      <div className="contracts-page__list">
        {filtered.map((contract) => (
          <ContractCard
            key={contract.id}
            contract={contract}
            properties={properties}
            contacts={contactsList}
            units={units}
            onEdit={handleEdit}
            onDelete={setConfirmDelete}
            onOpen={() => navigate(`/contracts/${contract.id}`)}
            onViewProperty={() =>
              navigate(`/properties/${contract.propertyId || contract.property_id || ''}`)
            }
            onViewContact={() =>
              navigate(`/contacts/${contract.contactId || contract.contact_id || ''}`)
            }
          />
        ))}
      </div>

      {/* حوار تأكيد الحذف */}
      {confirmDelete && (
        <ConfirmDialog
          title="حذف العقد"
          message={`هل أنت متأكد من حذف هذا العقد؟ لا يمكن التراجع عن هذا الإجراء.`}
          confirmLabel="حذف نهائي"
          cancelLabel="تراجع"
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmDelete(null)}
          variant="danger"
        />
      )}

      {/* زر إضافة عائم — جوال فقط */}
      <MobileFAB
        onClick={() => {
          setForm(defaultContract());
          setEditMode(false);
          setEditId(null);
          setShowForm(true);
        }}
        label="إضافة عقد"
      />
    </div>
  );
}
