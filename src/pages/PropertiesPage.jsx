/**
 * صفحة العقارات — SPR-018: النواة العقارية
 * إدارة الوحدات العقارية (إضافة، تعديل، حذف، فلترة، ملخص).
 * الهيكل: نموذج إضافة أولاً → قائمة العقارات → ملخص.
 * responsive: بطاقات على الجوال، جدول على الديسكتوب.
 */
import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import { FormField, SummaryCard, Icons, Badge, EmptyState, MobileFAB } from '../ui/ui-common.jsx';
import { ConfirmDialog } from '../ui/Modals.jsx';
import { Currency, formatCurrency } from '../utils/format.jsx';
import { safeNum } from '../utils/helpers.js';
import {
  PROPERTY_TYPE_OPTIONS,
  PROPERTY_STATUS_OPTIONS,
  SAUDI_CITIES,
  getPropertyTypeIcon,
  getPropertyTypeLabel,
  getPropertyStatusLabel,
  getPropertyStatusColor,
  validateProperty,
  computePropertiesSummary,
  filterProperties,
  defaultProperty,
} from '../domain/properties.js';

// ═══════════════════════════════════════
// نموذج إضافة/تعديل العقار
// ═══════════════════════════════════════
function PropertyForm({ form, setForm, onSave, onCancel, editMode, saving }) {
  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 md:p-5 shadow-sm mb-4">
      <h3 className="font-bold text-[var(--color-text)] mb-1">
        {editMode ? 'تعديل العقار' : 'إضافة عقار جديد'}
      </h3>
      <p className="text-sm text-[var(--color-muted)] mb-4">
        {editMode ? 'عدّل البيانات واحفظ التغييرات' : 'سجّل عقاراتك لتتبع الإيجارات والصيانة'}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* اسم العقار */}
        <FormField label="اسم العقار" id="prop-name">
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="مثال: عمارة النور، فيلا الياسمين"
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
            maxLength={100}
          />
        </FormField>

        {/* النوع */}
        <FormField label="نوع العقار" id="prop-type">
          <select
            value={form.type}
            onChange={(e) => handleChange('type', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
          >
            {PROPERTY_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.icon} {opt.label}</option>
            ))}
          </select>
        </FormField>

        {/* الحالة */}
        <FormField label="الحالة" id="prop-status">
          <select
            value={form.status}
            onChange={(e) => handleChange('status', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
          >
            {PROPERTY_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </FormField>

        {/* المدينة */}
        <FormField label="المدينة" id="prop-city">
          <select
            value={form.city}
            onChange={(e) => handleChange('city', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
          >
            <option value="">اختر المدينة</option>
            {SAUDI_CITIES.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </FormField>

        {/* الحي */}
        <FormField label="الحي" id="prop-district">
          <input
            type="text"
            value={form.district}
            onChange={(e) => handleChange('district', e.target.value)}
            placeholder="مثال: حي النرجس، حي العليا"
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
          />
        </FormField>

        {/* المساحة */}
        <FormField label="المساحة (م²)" id="prop-area">
          <input
            type="number"
            value={form.areaSqm}
            onChange={(e) => handleChange('areaSqm', e.target.value)}
            placeholder="مثال: 250"
            min="0"
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
          />
        </FormField>

        {/* عدد الوحدات */}
        <FormField label="عدد الوحدات" id="prop-units">
          <input
            type="number"
            value={form.unitsCount}
            onChange={(e) => handleChange('unitsCount', e.target.value)}
            min="1"
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
          />
        </FormField>

        {/* غرف النوم */}
        <FormField label="غرف النوم" id="prop-bedrooms">
          <input
            type="number"
            value={form.bedrooms}
            onChange={(e) => handleChange('bedrooms', e.target.value)}
            min="0"
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
          />
        </FormField>

        {/* الإيجار الشهري */}
        <FormField label="الإيجار الشهري (ر.س)" id="prop-rent">
          <input
            type="number"
            value={form.monthlyRent}
            onChange={(e) => handleChange('monthlyRent', e.target.value)}
            placeholder="مثال: 3500"
            min="0"
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
          />
        </FormField>

        {/* اسم المالك */}
        <FormField label="اسم المالك" id="prop-owner">
          <input
            type="text"
            value={form.ownerName}
            onChange={(e) => handleChange('ownerName', e.target.value)}
            placeholder="اسم المالك (اختياري)"
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
          />
        </FormField>

        {/* جوال المالك */}
        <FormField label="جوال المالك" id="prop-owner-phone">
          <input
            type="tel"
            value={form.ownerPhone}
            onChange={(e) => handleChange('ownerPhone', e.target.value)}
            placeholder="05XXXXXXXX"
            dir="ltr"
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm text-left"
          />
        </FormField>
      </div>

      {/* ملاحظات */}
      <div className="mt-3">
        <FormField label="ملاحظات" id="prop-notes">
          <textarea
            value={form.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="أي ملاحظات إضافية عن العقار..."
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
          {saving ? 'جاري الحفظ...' : editMode ? 'حفظ التعديلات' : 'إضافة العقار'}
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
// بطاقة عقار
// ═══════════════════════════════════════
function PropertyCard({ property, onEdit, onDelete, contractCount, onViewContracts }) {
  const icon = getPropertyTypeIcon(property.type);
  const typeLabel = getPropertyTypeLabel(property.type);
  const statusLabel = getPropertyStatusLabel(property.status);
  const statusColor = getPropertyStatusColor(property.status);

  const colorMap = {
    green: { background: 'var(--color-success-bg)', color: 'var(--color-success)' },
    blue: { background: 'var(--color-info-bg)', color: 'var(--color-info)' },
    yellow: { background: 'var(--color-warning-bg)', color: 'var(--color-warning)' },
    gray: { background: 'var(--color-bg)', color: 'var(--color-muted)' },
  };

  return (
    <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <span className="text-2xl flex-shrink-0" aria-hidden="true">{icon}</span>
          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-[var(--color-text)] truncate">{property.name}</h4>
            <p className="text-sm text-[var(--color-muted)] mt-0.5">
              {typeLabel}
              {property.city ? ` — ${property.city}` : ''}
              {property.district ? `، ${property.district}` : ''}
            </p>
          </div>
        </div>
        <span className="flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium" style={colorMap[statusColor] || colorMap.gray}>
          {statusLabel}
        </span>
      </div>

      {/* تفاصيل سريعة */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm text-[var(--color-muted)]">
        {property.unitsCount > 1 && <span>{property.unitsCount} وحدة</span>}
        {property.areaSqm && <span>{property.areaSqm} م²</span>}
        {property.bedrooms && <span>{property.bedrooms} غرف</span>}
        {property.monthlyRent && (
          <span className="font-medium" style={{ color: 'var(--color-success)' }}>
            {formatCurrency(safeNum(property.monthlyRent))} ر.س/شهر
          </span>
        )}
      </div>

      {property.ownerName && (
        <p className="text-sm text-[var(--color-muted)] mt-2">
          المالك: {property.ownerName}
          {property.ownerPhone ? ` (${property.ownerPhone})` : ''}
        </p>
      )}

      {property.notes && (
        <p className="text-sm text-[var(--color-muted)] mt-1 line-clamp-2">{property.notes}</p>
      )}

      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[var(--color-border)]">
        <button
          type="button"
          onClick={() => onEdit(property)}
          className="text-sm font-medium hover:opacity-80"
          style={{ color: 'var(--color-info)' }}
        >
          تعديل
        </button>
        <button
          type="button"
          onClick={() => onDelete(property)}
          className="text-sm font-medium hover:opacity-80"
          style={{ color: 'var(--color-danger)' }}
        >
          حذف
        </button>
        {contractCount > 0 && (
          <button
            type="button"
            onClick={() => onViewContracts(property)}
            className="text-sm font-medium mr-auto hover:opacity-80"
            style={{ color: 'var(--color-success)' }}
          >
            {contractCount} عقد
          </button>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// الصفحة الرئيسية
// ═══════════════════════════════════════
export default function PropertiesPage() {
  const navigate = useNavigate();
  const {
    properties,
    propertiesLoading,
    createProperty,
    updateProperty,
    deleteProperty,
    contracts,
  } = useData();
  const toast = useToast();

  // حالة النموذج
  const [form, setForm] = useState(defaultProperty);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  // فلاتر
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // تأكيد الحذف
  const [confirmDelete, setConfirmDelete] = useState(null);

  // العقارات المفلترة
  const filtered = useMemo(() => {
    return filterProperties(properties, {
      type: filterType || undefined,
      status: filterStatus || undefined,
      search: searchQuery || undefined,
    });
  }, [properties, filterType, filterStatus, searchQuery]);

  // الملخص
  const summary = useMemo(() => computePropertiesSummary(properties), [properties]);

  // عدد العقود لكل عقار (للربط بين الصفحات)
  const contractCountMap = useMemo(() => {
    const map = {};
    (contracts || []).forEach((c) => {
      const pid = c.propertyId || c.property_id;
      if (pid) map[pid] = (map[pid] || 0) + 1;
    });
    return map;
  }, [contracts]);

  // حفظ (إضافة أو تعديل)
  const handleSave = useCallback(async () => {
    const { valid, errors } = validateProperty(form);
    if (!valid) {
      toast.error(errors[0]);
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const { error } = await updateProperty(editingId, form);
        if (error) throw error;
        toast.success('تم تحديث العقار');
      } else {
        const { error } = await createProperty(form);
        if (error) throw error;
        toast.success('تم إضافة العقار');
      }
      setForm(defaultProperty());
      setEditingId(null);
    } catch (err) {
      toast.error('حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  }, [form, editingId, createProperty, updateProperty, toast]);

  // تعديل
  const handleEdit = useCallback((property) => {
    setForm({
      name: property.name || '',
      type: property.type || 'apartment',
      status: property.status || 'available',
      city: property.city || '',
      district: property.district || '',
      address: property.address || '',
      unitsCount: property.unitsCount || 1,
      areaSqm: property.areaSqm || '',
      bedrooms: property.bedrooms || '',
      bathrooms: property.bathrooms || '',
      yearBuilt: property.yearBuilt || '',
      floors: property.floors || '',
      ownerName: property.ownerName || '',
      ownerPhone: property.ownerPhone || '',
      purchasePrice: property.purchasePrice || '',
      monthlyRent: property.monthlyRent || '',
      notes: property.notes || '',
    });
    setEditingId(property.id);
    // انتقل لأعلى الصفحة لرؤية النموذج
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // إلغاء التعديل
  const handleCancelEdit = useCallback(() => {
    setForm(defaultProperty());
    setEditingId(null);
  }, []);

  // حذف
  const handleDelete = useCallback(async () => {
    if (!confirmDelete) return;
    try {
      const { error } = await deleteProperty(confirmDelete.id);
      if (error) throw error;
      toast.success('تم حذف العقار');
      if (editingId === confirmDelete.id) {
        setForm(defaultProperty());
        setEditingId(null);
      }
    } catch {
      toast.error('حدث خطأ أثناء الحذف');
    } finally {
      setConfirmDelete(null);
    }
  }, [confirmDelete, deleteProperty, editingId, toast]);

  return (
    <div className="properties-page min-h-screen bg-[var(--color-bg)] p-4 md:p-6 max-w-4xl mx-auto" dir="rtl">

      {/* العنوان + زر إضافة */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-[var(--color-text)]">العقارات</h1>
        {editingId === null && (
          <button
            type="button"
            onClick={() => { setForm(defaultProperty()); setEditingId(null); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 md:hidden"
          >
            <Icons.plus size={16} />
            إضافة
          </button>
        )}
      </div>

      {/* القسم 1: نموذج الإضافة/التعديل */}
      <PropertyForm
        form={form}
        setForm={setForm}
        onSave={handleSave}
        onCancel={handleCancelEdit}
        editMode={!!editingId}
        saving={saving}
      />

      {/* القسم 2: ملخص */}
      {properties.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-3 text-center">
            <p className="text-2xl font-bold text-[var(--color-text)]">{summary.total}</p>
            <p className="text-xs text-[var(--color-muted)]">إجمالي العقارات</p>
          </div>
          <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-3 text-center">
            <p className="text-2xl font-bold" style={{ color: 'var(--color-info)' }}>{summary.rentedCount}</p>
            <p className="text-xs text-[var(--color-muted)]">مؤجر</p>
          </div>
          <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-3 text-center">
            <p className="text-2xl font-bold" style={{ color: 'var(--color-success)' }}>{summary.availableCount}</p>
            <p className="text-xs text-[var(--color-muted)]">متاح</p>
          </div>
          <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-3 text-center">
            <p className="text-2xl font-bold" style={{ color: 'var(--color-success)' }}>{formatCurrency(summary.totalMonthlyRent)}</p>
            <p className="text-xs text-[var(--color-muted)]">إيراد شهري (ر.س)</p>
          </div>
        </div>
      )}

      {/* القسم 3: الفلاتر */}
      {properties.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالاسم أو الحي أو المالك..."
            className="flex-1 min-w-[200px] px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] text-sm"
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] text-sm"
          >
            <option value="">كل الأنواع</option>
            {PROPERTY_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] text-sm"
          >
            <option value="">كل الحالات</option>
            {PROPERTY_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* القسم 4: قائمة العقارات */}
      {propertiesLoading ? (
        <div className="p-8 text-center text-[var(--color-muted)]">جاري التحميل...</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={properties.length === 0 ? 'لم تُضف أي عقارات بعد' : 'لا توجد نتائج مطابقة'}
          description={properties.length === 0
            ? 'أضف أول عقار لبدء إدارة ممتلكاتك — عمارة سكنية، فيلا، أو مكتب تجاري.'
            : 'جرّب تغيير الفلتر أو البحث بكلمة مختلفة.'}
          icon={<span className="text-3xl">🏢</span>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              onEdit={handleEdit}
              onDelete={setConfirmDelete}
              contractCount={contractCountMap[property.id] || 0}
              onViewContracts={() => navigate('/contracts')}
            />
          ))}
        </div>
      )}

      {/* تأكيد الحذف */}
      {confirmDelete && (
        <ConfirmDialog
          title="حذف العقار"
          message={`هل تريد حذف "${confirmDelete.name}"؟ لا يمكن التراجع عن هذا الإجراء.`}
          confirmLabel="حذف"
          cancelLabel="إلغاء"
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
          danger
        />
      )}

      {/* زر إضافة عائم — جوال فقط */}
      {editingId === null && (
        <MobileFAB onClick={() => { setForm(defaultProperty()); setEditingId(null); }} label="إضافة عقار" />
      )}
    </div>
  );
}
