/**
 * صفحة العقود — SPR-018: النواة العقارية (الخطوة 3: العقود)
 * ربط العقارات بالعملاء مع شروط الإيجار ودورات الدفع.
 */
import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import { FormField, SummaryCard, Icons, EmptyState, MobileFAB } from '../ui/ui-common.jsx';
import { ConfirmDialog } from '../ui/Modals.jsx';
import { formatCurrency } from '../utils/format.jsx';
import { safeNum } from '../utils/helpers.js';
import {
  CONTRACT_TYPE_OPTIONS,
  CONTRACT_STATUS_OPTIONS,
  PAYMENT_CYCLE_OPTIONS,
  getContractTypeIcon,
  getContractTypeLabel,
  getContractStatusLabel,
  getContractStatusColor,
  getPaymentCycleLabel,
  daysRemaining,
  isExpiringSoon,
  validateContract,
  computeContractsSummary,
  filterContracts,
  defaultContract,
} from '../domain/contracts.js';

// ═══════════════════════════════════════
// نموذج إضافة/تعديل العقد
// ═══════════════════════════════════════
function ContractForm({ form, setForm, onSave, onCancel, editMode, saving, properties, contacts }) {
  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // عند تغيير المدة، نحدّث تاريخ النهاية تلقائياً
  const handleDurationChange = (months) => {
    handleChange('durationMonths', months);
    if (form.startDate) {
      const start = new Date(form.startDate);
      start.setMonth(start.getMonth() + Number(months));
      handleChange('endDate', start.toISOString().split('T')[0]);
    }
  };

  // عند تغيير الإيجار الشهري، نحدّث الإجمالي تلقائياً
  const handleMonthlyRentChange = (value) => {
    handleChange('monthlyRent', value);
    const months = Number(form.durationMonths) || 12;
    const rent = Number(value) || 0;
    if (rent > 0) {
      handleChange('totalAmount', String(rent * months));
    }
  };

  return (
    <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 md:p-5 shadow-sm mb-4">
      <h3 className="font-bold text-[var(--color-text)] mb-1">
        {editMode ? 'تعديل العقد' : 'إضافة عقد جديد'}
      </h3>
      <p className="text-sm text-[var(--color-muted)] mb-4">
        {editMode ? 'عدّل البيانات واحفظ التغييرات' : 'اربط العقار بالعميل وحدد شروط التعاقد'}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* العقار */}
        <FormField label="العقار" id="contract-property">
          <select
            value={form.propertyId}
            onChange={(e) => handleChange('propertyId', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
          >
            <option value="">اختر العقار</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </FormField>

        {/* العميل */}
        <FormField label="العميل" id="contract-contact">
          <select
            value={form.contactId}
            onChange={(e) => handleChange('contactId', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
          >
            <option value="">اختر العميل</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
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
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm text-left"
          />
        </FormField>

        {/* النوع */}
        <FormField label="نوع العقد" id="contract-type">
          <select
            value={form.type}
            onChange={(e) => handleChange('type', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
          >
            {CONTRACT_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.icon} {opt.label}</option>
            ))}
          </select>
        </FormField>

        {/* الحالة */}
        <FormField label="الحالة" id="contract-status">
          <select
            value={form.status}
            onChange={(e) => handleChange('status', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
          >
            {CONTRACT_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </FormField>

        {/* دورة الدفع */}
        <FormField label="دورة الدفع" id="contract-payment-cycle">
          <select
            value={form.paymentCycle}
            onChange={(e) => handleChange('paymentCycle', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
          >
            {PAYMENT_CYCLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </FormField>

        {/* تاريخ البداية */}
        <FormField label="تاريخ البداية" id="contract-start">
          <input
            type="date"
            value={form.startDate}
            onChange={(e) => handleChange('startDate', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
          />
        </FormField>

        {/* المدة */}
        <FormField label="المدة (أشهر)" id="contract-duration">
          <input
            type="number"
            value={form.durationMonths}
            onChange={(e) => handleDurationChange(e.target.value)}
            min="1"
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
          />
        </FormField>

        {/* تاريخ النهاية */}
        <FormField label="تاريخ النهاية" id="contract-end">
          <input
            type="date"
            value={form.endDate}
            onChange={(e) => handleChange('endDate', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
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
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
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
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
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
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
          />
        </FormField>

        {/* تجديد تلقائي */}
        <FormField label="تجديد تلقائي" id="contract-auto-renew">
          <label className="flex items-center gap-2 cursor-pointer py-2">
            <input
              type="checkbox"
              checked={form.autoRenew}
              onChange={(e) => handleChange('autoRenew', e.target.checked)}
              className="w-4 h-4 rounded border-[var(--color-border)]"
            />
            <span className="text-sm text-[var(--color-text)]">يتجدد تلقائياً عند انتهاء المدة</span>
          </label>
        </FormField>
      </div>

      {/* ملاحظات */}
      <div className="mt-3">
        <FormField label="ملاحظات" id="contract-notes">
          <textarea
            value={form.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="أي ملاحظات إضافية عن العقد..."
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm resize-none"
          />
        </FormField>
      </div>

      <div className="flex gap-2 mt-4">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'جاري الحفظ...' : editMode ? 'حفظ التعديلات' : 'إضافة العقد'}
        </button>
        {editMode && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-[var(--color-border)] text-[var(--color-text)] text-sm hover:bg-[var(--color-bg)]"
          >
            إلغاء
          </button>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// بطاقة عقد
// ═══════════════════════════════════════
function ContractCard({ contract, properties, contacts, onEdit, onDelete, onViewProperty, onViewContact }) {
  const icon = getContractTypeIcon(contract.type);
  const typeLabel = getContractTypeLabel(contract.type);
  const statusLabel = getContractStatusLabel(contract.status);
  const statusColor = getContractStatusColor(contract.status);
  const cycleLabel = getPaymentCycleLabel(contract.paymentCycle);
  const remaining = daysRemaining(contract.endDate);
  const expiring = isExpiringSoon(contract.endDate);

  // البحث عن أسماء العقار والعميل
  const propertyName = contract._propertyName || contract.propertyName
    || (properties.find((p) => p.id === contract.propertyId)?.name)
    || 'عقار غير محدد';
  const contactName = contract._contactName || contract.contactName
    || (contacts.find((c) => c.id === contract.contactId)?.name)
    || 'عميل غير محدد';

  const colorMap = {
    green: { background: 'var(--color-success-bg)', color: 'var(--color-success)' },
    blue: { background: 'var(--color-info-bg)', color: 'var(--color-info)' },
    yellow: { background: 'var(--color-warning-bg)', color: 'var(--color-warning)' },
    red: { background: 'var(--color-danger-bg)', color: 'var(--color-danger)' },
    gray: { background: 'var(--color-bg)', color: 'var(--color-muted)' },
  };

  return (
    <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <span className="text-2xl flex-shrink-0" aria-hidden="true">{icon}</span>
          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-[var(--color-text)] truncate">{propertyName}</h4>
            <p className="text-sm text-[var(--color-muted)] mt-0.5">
              {typeLabel} — {contactName}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={colorMap[statusColor] || colorMap.gray}>
            {statusLabel}
          </span>
          {expiring && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: 'var(--color-warning-bg)', color: 'var(--color-warning)' }}>
              ينتهي خلال {remaining} يوم
            </span>
          )}
        </div>
      </div>

      {/* تفاصيل سريعة */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm text-[var(--color-muted)]">
        {contract.contractNumber && <span>عقد #{contract.contractNumber}</span>}
        <span>{contract.startDate} → {contract.endDate}</span>
        <span>{cycleLabel}</span>
      </div>

      {/* المبالغ */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm">
        {contract.monthlyRent > 0 && (
          <span className="font-medium" style={{ color: 'var(--color-success)' }}>
            {formatCurrency(safeNum(contract.monthlyRent))} ر.س/شهر
          </span>
        )}
        {contract.totalAmount > 0 && (
          <span className="text-[var(--color-muted)]">
            الإجمالي: {formatCurrency(safeNum(contract.totalAmount))} ر.س
          </span>
        )}
        {contract.depositAmount > 0 && (
          <span className="text-[var(--color-muted)]">
            تأمين: {formatCurrency(safeNum(contract.depositAmount))} ر.س
          </span>
        )}
      </div>

      {contract.notes && (
        <p className="text-sm text-[var(--color-muted)] mt-1 line-clamp-2">{contract.notes}</p>
      )}

      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[var(--color-border)]">
        <button
          type="button"
          onClick={() => onEdit(contract)}
          className="text-sm font-medium hover:opacity-80" style={{ color: 'var(--color-info)' }}
        >
          تعديل
        </button>
        <button
          type="button"
          onClick={() => onDelete(contract)}
          className="text-sm font-medium hover:opacity-80" style={{ color: 'var(--color-danger)' }}
        >
          حذف
        </button>
        <div className="mr-auto flex items-center gap-2">
          {(contract.propertyId || contract.property_id) && (
            <button
              type="button"
              onClick={() => onViewProperty?.()}
              className="text-xs font-medium hover:opacity-80" style={{ color: 'var(--color-muted)' }}
            >
              العقار
            </button>
          )}
          {(contract.contactId || contract.contact_id) && (
            <button
              type="button"
              onClick={() => onViewContact?.()}
              className="text-xs font-medium hover:opacity-80" style={{ color: 'var(--color-muted)' }}
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
export default function ContractsPage({ setPage }) {
  const navigate = useNavigate();
  const {
    contracts,
    contractsLoading,
    createContract,
    updateContract,
    deleteContract,
    properties,
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
      _propertyName: c._propertyName || (properties.find((p) => p.id === c.propertyId)?.name) || '',
      _contactName: c._contactName || (contactsList.find((ct) => ct.id === c.contactId)?.name) || '',
    }));
  }, [contracts, properties, contactsList]);

  // ملخص
  const summary = useMemo(() => computeContractsSummary(enrichedContracts), [enrichedContracts]);

  // فلترة
  const filtered = useMemo(
    () => filterContracts(enrichedContracts, { type: filterType, status: filterStatus, search: searchQuery }),
    [enrichedContracts, filterType, filterStatus, searchQuery],
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
    <div className="px-4 md:px-6 max-w-4xl mx-auto py-4" dir="rtl">
      {/* العنوان + زر إضافة */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-[var(--color-text)]">العقود</h2>
        {!showForm && (
          <button
            type="button"
            onClick={() => { setForm(defaultContract()); setEditMode(false); setEditId(null); setShowForm(true); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
          >
            <Icons.plus size={16} />
            إضافة عقد
          </button>
        )}
      </div>

      {/* تنبيه: لا عقارات أو عملاء */}
      {properties.length === 0 && contactsList.length === 0 && !showForm && contracts.length === 0 && (
        <div className="rounded-lg p-4 mb-4 text-sm" style={{ background: 'var(--color-warning-bg)', color: 'var(--color-warning)', border: '1px solid var(--color-warning)' }}>
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
        />
      )}

      {/* ملخص */}
      {contracts.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <SummaryCard label="إجمالي العقود" value={summary.total} icon={<Icons.contracts size={20} />} />
          <SummaryCard label="ساري" value={summary.activeCount} icon={<span className="text-lg">✅</span>} />
          <SummaryCard
            label="ينتهي قريباً"
            value={summary.expiringSoon}
            icon={<span className="text-lg">⚠️</span>}
            highlight={summary.expiringSoon > 0}
          />
          <SummaryCard
            label="الإيجار الشهري"
            value={`${formatCurrency(summary.totalMonthlyRent)} ر.س`}
            icon={<span className="text-lg">💰</span>}
          />
        </div>
      )}

      {/* فلاتر */}
      {contracts.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex-1 min-w-[180px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث برقم العقد، اسم العقار أو العميل..."
              className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
          >
            <option value="">كل الأنواع</option>
            {CONTRACT_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.icon} {opt.label}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
          >
            <option value="">كل الحالات</option>
            {CONTRACT_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* حالة التحميل */}
      {contractsLoading && (
        <div className="text-center py-8 text-[var(--color-muted)]">جاري التحميل...</div>
      )}

      {/* حالة فارغة */}
      {!contractsLoading && contracts.length === 0 && !showForm && (
        <EmptyState
          title="لا توجد عقود"
          description="أنشئ عقوداً لربط العقارات بالعملاء وتتبع المدفوعات والتواريخ."
          actionLabel="إضافة أول عقد"
          onAction={() => { setForm(defaultContract()); setShowForm(true); }}
        />
      )}

      {/* لا نتائج */}
      {!contractsLoading && contracts.length > 0 && filtered.length === 0 && (
        <div className="text-center py-8 text-[var(--color-muted)]">لا توجد نتائج مطابقة للبحث</div>
      )}

      {/* قائمة العقود */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map((contract) => (
          <ContractCard
            key={contract.id}
            contract={contract}
            properties={properties}
            contacts={contactsList}
            onEdit={handleEdit}
            onDelete={setConfirmDelete}
            onViewProperty={() => navigate('/properties')}
            onViewContact={() => navigate('/contacts')}
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
      <MobileFAB onClick={() => { setForm(defaultContract()); setEditMode(false); setEditId(null); setShowForm(true); }} label="إضافة عقد" />
    </div>
  );
}
