/**
 * صفحة العقارات — النواة العقارية
 * تجعل العقار نقطة دخول لصفحة التفاصيل بدل أن يبقى مجرد عنصر قائمة.
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
  PROPERTY_TYPE_OPTIONS,
  PROPERTY_STATUS_OPTIONS,
  SAUDI_CITIES,
  getPropertyTypeLabel,
  getPropertyStatusLabel,
  getPropertyStatusColor,
  validateProperty,
  computePropertiesSummary,
  filterProperties,
  defaultProperty,
} from '../domain/properties.js';

function getStatusScopedFields(status) {
  if (status === 'rented') {
    return {
      maintenanceContactId: '',
      maintenanceContactName: '',
      maintenanceContactPhone: '',
      buyerContactId: '',
      buyerName: '',
      buyerPhone: '',
    };
  }
  if (status === 'maintenance') {
    return {
      tenantContactId: '',
      tenantName: '',
      tenantPhone: '',
      buyerContactId: '',
      buyerName: '',
      buyerPhone: '',
    };
  }
  if (status === 'sold') {
    return {
      tenantContactId: '',
      tenantName: '',
      tenantPhone: '',
      maintenanceContactId: '',
      maintenanceContactName: '',
      maintenanceContactPhone: '',
    };
  }
  return {
    tenantContactId: '',
    tenantName: '',
    tenantPhone: '',
    maintenanceContactId: '',
    maintenanceContactName: '',
    maintenanceContactPhone: '',
    buyerContactId: '',
    buyerName: '',
    buyerPhone: '',
  };
}

function PropertyForm({
  form,
  setForm,
  onSave,
  onCancel,
  editMode,
  saving,
  ownerContacts,
  tenantContacts,
  maintenanceContacts,
  buyerContacts,
  manualOwnerEntry,
  setManualOwnerEntry,
}) {
  const handleChange = (field, value) => {
    setForm((prev) => {
      if (field === 'status') {
        return { ...prev, status: value, ...getStatusScopedFields(value) };
      }
      return { ...prev, [field]: value };
    });
  };

  const handleOwnerChange = (value) => {
    if (!value) {
      setManualOwnerEntry(true);
      setForm((prev) => ({ ...prev, ownerId: '' }));
      return;
    }

    const owner = ownerContacts.find((contact) => contact.id === value);
    setManualOwnerEntry(false);
    setForm((prev) => ({
      ...prev,
      ownerId: value,
      ownerName: owner?.name || prev.ownerName || '',
      ownerPhone: owner?.phone || prev.ownerPhone || '',
    }));
  };

  const handleLinkedContactChange = (kind, value, source) => {
    const configMap = {
      tenant: ['tenantContactId', 'tenantName', 'tenantPhone'],
      maintenance: ['maintenanceContactId', 'maintenanceContactName', 'maintenanceContactPhone'],
      buyer: ['buyerContactId', 'buyerName', 'buyerPhone'],
    };
    const [idField, nameField, phoneField] = configMap[kind];
    setForm((prev) => ({
      ...prev,
      [idField]: value,
      [nameField]: source?.name || '',
      [phoneField]: source?.phone || '',
    }));
  };

  return (
    <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 md:p-5 shadow-sm mb-4">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="font-bold text-[var(--color-text)] mb-1">
            {editMode ? 'تعديل العقار' : 'إضافة عقار جديد'}
          </h3>
          <p className="text-sm text-[var(--color-muted)]">
            {editMode
              ? 'حدّث بيانات العقار واحفظ التغييرات.'
              : 'أضف العقار كأصل واضح يمكن الدخول إليه وإدارته.'}
          </p>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm text-[var(--color-text)] hover:bg-[var(--color-bg)]"
          >
            إلغاء
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <FormField label="اسم العقار" id="prop-name">
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="مثال: عمارة النور"
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
            maxLength={100}
          />
        </FormField>

        <FormField label="نوع العقار" id="prop-type">
          <select
            value={form.type}
            onChange={(e) => handleChange('type', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
          >
            {PROPERTY_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="الحالة" id="prop-status">
          <select
            value={form.status}
            onChange={(e) => handleChange('status', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
          >
            {PROPERTY_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="رقم الصك" id="prop-deed-number">
          <input
            type="text"
            value={form.deedNumber}
            onChange={(e) => handleChange('deedNumber', e.target.value)}
            placeholder="اختياري"
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
          />
        </FormField>

        <FormField label="العنوان الوطني" id="prop-national-address">
          <input
            type="text"
            value={form.nationalAddress}
            onChange={(e) => handleChange('nationalAddress', e.target.value)}
            placeholder="مثال: 1234، حي النرجس"
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
          />
        </FormField>

        <FormField label="المدينة" id="prop-city">
          <select
            value={form.city}
            onChange={(e) => handleChange('city', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
          >
            <option value="">اختر المدينة</option>
            {SAUDI_CITIES.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="الحي" id="prop-district">
          <input
            type="text"
            value={form.district}
            onChange={(e) => handleChange('district', e.target.value)}
            placeholder="مثال: حي العليا"
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
          />
        </FormField>

        <FormField label="المساحة (م²)" id="prop-area">
          <input
            type="number"
            value={form.areaSqm}
            onChange={(e) => handleChange('areaSqm', e.target.value)}
            min="0"
            placeholder="مثال: 250"
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
          />
        </FormField>

        <FormField label="سنة البناء" id="prop-year-built">
          <input
            type="number"
            value={form.yearBuilt}
            onChange={(e) => handleChange('yearBuilt', e.target.value)}
            min="0"
            placeholder="مثال: 2020"
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
          />
        </FormField>

        <FormField label="عدد الطوابق" id="prop-floors">
          <input
            type="number"
            value={form.floors}
            onChange={(e) => handleChange('floors', e.target.value)}
            min="0"
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
          />
        </FormField>

        <FormField label="غرف النوم" id="prop-bedrooms">
          <input
            type="number"
            value={form.bedrooms}
            onChange={(e) => handleChange('bedrooms', e.target.value)}
            min="0"
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
          />
        </FormField>

        <FormField label="عدد الحمامات" id="prop-bathrooms">
          <input
            type="number"
            value={form.bathrooms}
            onChange={(e) => handleChange('bathrooms', e.target.value)}
            min="0"
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
          />
        </FormField>

        <FormField label="عدد الوحدات" id="prop-units">
          <input
            type="number"
            value={form.unitsCount}
            onChange={(e) => handleChange('unitsCount', e.target.value)}
            min="1"
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
          />
        </FormField>

        <FormField label="الإيجار الشهري (ر.س)" id="prop-rent">
          <input
            type="number"
            value={form.monthlyRent}
            onChange={(e) => handleChange('monthlyRent', e.target.value)}
            min="0"
            placeholder="مثال: 3500"
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
          />
        </FormField>

        <FormField label="سعر الشراء (ر.س)" id="prop-purchase-price">
          <input
            type="number"
            value={form.purchasePrice}
            onChange={(e) => handleChange('purchasePrice', e.target.value)}
            min="0"
            placeholder="اختياري"
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
          />
        </FormField>

        <FormField label="المالك" id="prop-owner-id">
          <select
            value={form.ownerId || ''}
            onChange={(e) => handleOwnerChange(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
          >
            <option value="">إدخال يدوي / غير محدد</option>
            {ownerContacts.map((owner) => (
              <option key={owner.id} value={owner.id}>
                {owner.name}
                {owner.phone ? ` — ${owner.phone}` : ''}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="اسم المالك" id="prop-owner-name">
          <input
            type="text"
            value={form.ownerName}
            onChange={(e) => {
              setManualOwnerEntry(true);
              handleChange('ownerName', e.target.value);
            }}
            placeholder="اسم المالك"
            disabled={!manualOwnerEntry && !!form.ownerId}
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm disabled:opacity-60"
          />
        </FormField>

        <FormField label="جوال المالك" id="prop-owner-phone">
          <input
            type="tel"
            value={form.ownerPhone}
            onChange={(e) => {
              setManualOwnerEntry(true);
              handleChange('ownerPhone', e.target.value);
            }}
            placeholder="05XXXXXXXX"
            dir="ltr"
            disabled={!manualOwnerEntry && !!form.ownerId}
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm text-left disabled:opacity-60"
          />
        </FormField>
      </div>

      {!ownerContacts.length && (
        <p className="text-xs text-[var(--color-muted)] mt-3">
          لا توجد جهات اتصال من نوع مالك حاليًا، لذلك يبقى الإدخال اليدوي متاحًا.
        </p>
      )}

      <div className="mt-3">
        <FormField label="ملاحظات" id="prop-notes">
          <textarea
            value={form.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="أي تفاصيل تشغيلية أو وصف إضافي..."
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm resize-none"
          />
        </FormField>
      </div>

      {form.status === 'rented' && (
        <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
          <h4 className="font-bold text-[var(--color-text)] mb-3">بيانات المستأجر الحالي</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FormField label="المستأجر" id="prop-tenant-contact">
              <select
                value={form.tenantContactId || ''}
                onChange={(e) =>
                  handleLinkedContactChange(
                    'tenant',
                    e.target.value,
                    tenantContacts.find((contact) => contact.id === e.target.value)
                  )
                }
                className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
              >
                <option value="">اختر من العملاء أو اتركه يدويًا</option>
                {tenantContacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.name}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="اسم المستأجر" id="prop-tenant-name">
              <input
                type="text"
                value={form.tenantName || ''}
                onChange={(e) => handleChange('tenantName', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
              />
            </FormField>
            <FormField label="جوال المستأجر" id="prop-tenant-phone">
              <input
                type="tel"
                value={form.tenantPhone || ''}
                onChange={(e) => handleChange('tenantPhone', e.target.value)}
                dir="ltr"
                className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm text-left"
              />
            </FormField>
          </div>
        </div>
      )}

      {form.status === 'maintenance' && (
        <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
          <h4 className="font-bold text-[var(--color-text)] mb-3">بيانات جهة الصيانة</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FormField label="جهة الصيانة" id="prop-maint-contact">
              <select
                value={form.maintenanceContactId || ''}
                onChange={(e) =>
                  handleLinkedContactChange(
                    'maintenance',
                    e.target.value,
                    maintenanceContacts.find((contact) => contact.id === e.target.value)
                  )
                }
                className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
              >
                <option value="">اختر جهة أو اتركه يدويًا</option>
                {maintenanceContacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.name}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="اسم المهندس / الجهة" id="prop-maint-name">
              <input
                type="text"
                value={form.maintenanceContactName || ''}
                onChange={(e) => handleChange('maintenanceContactName', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
              />
            </FormField>
            <FormField label="رقم الجوال" id="prop-maint-phone">
              <input
                type="tel"
                value={form.maintenanceContactPhone || ''}
                onChange={(e) => handleChange('maintenanceContactPhone', e.target.value)}
                dir="ltr"
                className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm text-left"
              />
            </FormField>
          </div>
        </div>
      )}

      {form.status === 'sold' && (
        <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
          <h4 className="font-bold text-[var(--color-text)] mb-3">بيانات المشتري</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FormField label="المشتري" id="prop-buyer-contact">
              <select
                value={form.buyerContactId || ''}
                onChange={(e) =>
                  handleLinkedContactChange(
                    'buyer',
                    e.target.value,
                    buyerContacts.find((contact) => contact.id === e.target.value)
                  )
                }
                className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
              >
                <option value="">اختر من العملاء أو اتركه يدويًا</option>
                {buyerContacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.name}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="اسم المشتري" id="prop-buyer-name">
              <input
                type="text"
                value={form.buyerName || ''}
                onChange={(e) => handleChange('buyerName', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
              />
            </FormField>
            <FormField label="جوال المشتري" id="prop-buyer-phone">
              <input
                type="tel"
                value={form.buyerPhone || ''}
                onChange={(e) => handleChange('buyerPhone', e.target.value)}
                dir="ltr"
                className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm text-left"
              />
            </FormField>
          </div>
        </div>
      )}

      <div className="flex gap-2 mt-4">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="btn-primary disabled:opacity-50"
        >
          {saving ? 'جاري الحفظ...' : editMode ? 'حفظ التعديلات' : 'إضافة العقار'}
        </button>
      </div>
    </div>
  );
}

function PropertyCard({ property, onEdit, onDelete, contractCount, onOpen }) {
  const statusColor = getPropertyStatusColor(property.status);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(property)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(property);
        }
      }}
      className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 shadow-sm cursor-pointer hover:border-[var(--color-primary)] transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <span className="flex-shrink-0 text-[var(--color-primary)]" aria-hidden="true">
            <Icons.properties size={24} />
          </span>
          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-[var(--color-text)] truncate">{property.name}</h4>
            <p className="text-sm text-[var(--color-muted)] mt-0.5">
              {getPropertyTypeLabel(property.type)}
              {property.city ? ` — ${property.city}` : ''}
              {property.district ? `، ${property.district}` : ''}
            </p>
          </div>
        </div>
        <Badge color={statusColor}>{getPropertyStatusLabel(property.status)}</Badge>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm text-[var(--color-muted)]">
        {property.deedNumber && <span>صك: {property.deedNumber}</span>}
        {property.unitsCount > 1 && <span>{property.unitsCount} وحدة</span>}
        {property.areaSqm && <span>{property.areaSqm} م²</span>}
        {property.monthlyRent && (
          <span className="font-medium" style={{ color: 'var(--color-success)' }}>
            {formatCurrency(safeNum(property.monthlyRent))} ر.س/شهر
          </span>
        )}
      </div>

      {(property.ownerName || property.ownerPhone) && (
        <p className="text-sm text-[var(--color-muted)] mt-2">
          المالك: {property.ownerName || '—'}
          {property.ownerPhone ? ` (${property.ownerPhone})` : ''}
        </p>
      )}

      {property.notes && (
        <p className="text-sm text-[var(--color-muted)] mt-1 line-clamp-2">{property.notes}</p>
      )}

      <div
        className="flex items-center gap-3 mt-3 pt-3 border-t border-[var(--color-border)]"
        onClick={(e) => e.stopPropagation()}
      >
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
          <span className="text-sm mr-auto" style={{ color: 'var(--color-success)' }}>
            {contractCount} عقد
          </span>
        )}
      </div>
    </div>
  );
}

export default function PropertiesPage() {
  const navigate = useNavigate();
  const {
    properties,
    propertiesLoading,
    contacts,
    contracts,
    createProperty,
    updateProperty,
    deleteProperty,
  } = useData();
  const toast = useToast();

  const ownerContacts = useMemo(
    () => (contacts || []).filter((contact) => contact.type === 'owner'),
    [contacts]
  );
  const tenantContacts = useMemo(
    () => (contacts || []).filter((contact) => contact.type === 'tenant'),
    [contacts]
  );
  const maintenanceContacts = useMemo(() => contacts || [], [contacts]);
  const buyerContacts = useMemo(
    () => (contacts || []).filter((contact) => contact.type === 'buyer'),
    [contacts]
  );

  const [form, setForm] = useState(defaultProperty);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [manualOwnerEntry, setManualOwnerEntry] = useState(true);

  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const filtered = useMemo(
    () =>
      filterProperties(properties, {
        type: filterType || undefined,
        status: filterStatus || undefined,
        search: searchQuery || undefined,
      }),
    [properties, filterType, filterStatus, searchQuery]
  );

  const summary = useMemo(() => computePropertiesSummary(properties), [properties]);

  const contractCountMap = useMemo(() => {
    const map = {};
    (contracts || []).forEach((contract) => {
      const propertyId = contract.propertyId || contract.property_id;
      if (propertyId) map[propertyId] = (map[propertyId] || 0) + 1;
    });
    return map;
  }, [contracts]);

  const resetFormState = useCallback(() => {
    setForm(defaultProperty());
    setEditingId(null);
    setManualOwnerEntry(true);
  }, []);

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
      resetFormState();
      setShowForm(false);
    } catch (err) {
      toast.error(err?.message || 'حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  }, [form, editingId, createProperty, updateProperty, toast, resetFormState]);

  const handleEdit = useCallback((property) => {
    setForm({ ...defaultProperty(), ...property });
    setEditingId(property.id);
    setManualOwnerEntry(!property.ownerId);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleCancel = useCallback(() => {
    resetFormState();
    setShowForm(false);
  }, [resetFormState]);

  const handleDelete = useCallback(async () => {
    if (!confirmDelete) return;
    try {
      const { error } = await deleteProperty(confirmDelete.id);
      if (error) throw error;
      toast.success('تم حذف العقار');
      if (editingId === confirmDelete.id) {
        resetFormState();
        setShowForm(false);
      }
    } catch (err) {
      toast.error(err?.message || 'حدث خطأ أثناء الحذف');
    } finally {
      setConfirmDelete(null);
    }
  }, [confirmDelete, deleteProperty, editingId, toast, resetFormState]);

  return (
    <div className="page-shell px-4 md:px-6 max-w-4xl mx-auto py-4" dir="rtl">
      <div className="page-header">
        <div className="page-header-copy">
          <span className="page-kicker">الأصول العقارية</span>
          <h1 className="page-title">العقارات</h1>
          <p className="page-subtitle">
            أدر المخزون العقاري ببيانات أوضح، وحافظ على نقطة دخول موحدة لكل أصل.
          </p>
        </div>
        {!showForm && (
          <button
            type="button"
            onClick={() => {
              resetFormState();
              setShowForm(true);
            }}
            className="btn-primary"
          >
            <Icons.plus size={16} />
            إضافة عقار
          </button>
        )}
      </div>

      {showForm && (
        <PropertyForm
          form={form}
          setForm={setForm}
          onSave={handleSave}
          onCancel={handleCancel}
          editMode={!!editingId}
          saving={saving}
          ownerContacts={ownerContacts}
          tenantContacts={tenantContacts}
          maintenanceContacts={maintenanceContacts}
          buyerContacts={buyerContacts}
          manualOwnerEntry={manualOwnerEntry}
          setManualOwnerEntry={setManualOwnerEntry}
        />
      )}

      {properties.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <SummaryCard label="إجمالي العقارات" value={summary.total} icon={<Icons.properties size={18} />} />
          <SummaryCard
            label="مؤجرة"
            value={summary.rentedCount}
            color="blue"
            icon={<Icons.contracts size={18} />}
          />
          <SummaryCard
            label="متاحة"
            value={summary.availableCount}
            color="green"
            icon={<Icons.check size={18} />}
          />
          <SummaryCard
            label="إيراد شهري"
            value={formatCurrency(summary.totalMonthlyRent)}
            color="green"
            icon={<Icons.arrowUp size={18} />}
          />
        </div>
      )}

      {properties.length > 0 && (
        <div className="control-toolbar flex flex-wrap gap-2 mb-4 p-3">
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
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] text-sm"
          >
            <option value="">كل الحالات</option>
            {PROPERTY_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {propertiesLoading ? (
        <div className="p-8 text-center text-[var(--color-muted)]">جاري التحميل...</div>
      ) : properties.length === 0 && !showForm ? (
        <EmptyState
          title="لم تُضف أي عقارات بعد"
          description="أضف أول عقار ليصبح أصلًا واضحًا داخل النظام يمكن الدخول إليه وإدارته."
          actionLabel="إضافة أول عقار"
          onAction={() => {
            resetFormState();
            setShowForm(true);
          }}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="لا توجد نتائج مطابقة"
          description="جرّب تغيير الفلاتر أو البحث بكلمة مختلفة."
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
              onOpen={(item) => navigate(`/properties/${item.id}`)}
            />
          ))}
        </div>
      )}

      {confirmDelete && (
        <ConfirmDialog
          open={!!confirmDelete}
          title="حذف العقار"
          message={`هل تريد حذف "${confirmDelete.name}"؟ لا يمكن التراجع عن هذا الإجراء.`}
          confirmLabel="حذف"
          cancelLabel="إلغاء"
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
          danger
        />
      )}

      {!showForm && (
        <MobileFAB
          onClick={() => {
            resetFormState();
            setShowForm(true);
          }}
          label="إضافة عقار"
        />
      )}
    </div>
  );
}
