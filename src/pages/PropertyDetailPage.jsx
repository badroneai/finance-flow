/**
 * صفحة تفاصيل العقار — تجعل العقار كيانًا قابلًا للإدارة
 */
import { useMemo, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../contexts/DataContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import { FormField, SummaryCard, Icons, Badge, EmptyState } from '../ui/ui-common.jsx';
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
  defaultProperty,
} from '../domain/properties.js';
import {
  UNIT_TYPE_OPTIONS,
  UNIT_STATUS_OPTIONS,
  getUnitTypeLabel,
  getUnitStatusLabel,
  getUnitStatusColor,
  validateUnit,
  defaultUnit,
  computeUnitsSummary,
} from '../domain/units.js';
import {
  getContractTypeLabel,
  getContractStatusLabel,
  getContractStatusColor,
} from '../domain/contracts.js';

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

function PropertyInfoItem({ label, value }) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
      <div className="text-xs text-[var(--color-muted)] mb-1">{label}</div>
      <div className="text-sm font-medium text-[var(--color-text)]">{value || '—'}</div>
    </div>
  );
}

function PropertyEditForm({
  form,
  setForm,
  onSave,
  onCancel,
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
      ownerName: owner?.name || '',
      ownerPhone: owner?.phone || '',
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
    <div className="detail-section mb-4">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="font-bold text-[var(--color-text)]">تعديل بيانات العقار</h3>
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm text-[var(--color-text)]"
        >
          إلغاء
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <FormField label="اسم العقار" id="detail-prop-name">
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
          />
        </FormField>

        <FormField label="نوع العقار" id="detail-prop-type">
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

        <FormField label="الحالة" id="detail-prop-status">
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

        <FormField label="رقم الصك" id="detail-prop-deed">
          <input
            type="text"
            value={form.deedNumber}
            onChange={(e) => handleChange('deedNumber', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
          />
        </FormField>

        <FormField label="العنوان الوطني" id="detail-prop-national-address">
          <input
            type="text"
            value={form.nationalAddress}
            onChange={(e) => handleChange('nationalAddress', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
          />
        </FormField>

        <FormField label="المدينة" id="detail-prop-city">
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

        <FormField label="الحي" id="detail-prop-district">
          <input
            type="text"
            value={form.district}
            onChange={(e) => handleChange('district', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
          />
        </FormField>

        <FormField label="المساحة (م²)" id="detail-prop-area">
          <input
            type="number"
            value={form.areaSqm}
            onChange={(e) => handleChange('areaSqm', e.target.value)}
            min="0"
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
          />
        </FormField>

        <FormField label="سنة البناء" id="detail-prop-year-built">
          <input
            type="number"
            value={form.yearBuilt}
            onChange={(e) => handleChange('yearBuilt', e.target.value)}
            min="0"
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
          />
        </FormField>

        <FormField label="عدد الطوابق" id="detail-prop-floors">
          <input
            type="number"
            value={form.floors}
            onChange={(e) => handleChange('floors', e.target.value)}
            min="0"
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
          />
        </FormField>

        <FormField label="عدد الحمامات" id="detail-prop-bathrooms">
          <input
            type="number"
            value={form.bathrooms}
            onChange={(e) => handleChange('bathrooms', e.target.value)}
            min="0"
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
          />
        </FormField>

        <FormField label="الإيجار الشهري (ر.س)" id="detail-prop-rent">
          <input
            type="number"
            value={form.monthlyRent}
            onChange={(e) => handleChange('monthlyRent', e.target.value)}
            min="0"
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
          />
        </FormField>

        <FormField label="سعر الشراء (ر.س)" id="detail-prop-purchase">
          <input
            type="number"
            value={form.purchasePrice}
            onChange={(e) => handleChange('purchasePrice', e.target.value)}
            min="0"
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
          />
        </FormField>

        <FormField label="عدد الوحدات" id="detail-prop-units-count">
          <input
            type="number"
            value={form.unitsCount}
            onChange={(e) => handleChange('unitsCount', e.target.value)}
            min="1"
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
          />
        </FormField>

        <FormField label="المالك" id="detail-prop-owner">
          <select
            value={form.ownerId || ''}
            onChange={(e) => handleOwnerChange(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
          >
            <option value="">إدخال يدوي / غير محدد</option>
            {ownerContacts.map((owner) => (
              <option key={owner.id} value={owner.id}>
                {owner.name}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="اسم المالك" id="detail-prop-owner-name">
          <input
            type="text"
            value={form.ownerName}
            onChange={(e) => {
              setManualOwnerEntry(true);
              handleChange('ownerName', e.target.value);
            }}
            disabled={!manualOwnerEntry && !!form.ownerId}
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm disabled:opacity-60"
          />
        </FormField>

        <FormField label="جوال المالك" id="detail-prop-owner-phone">
          <input
            type="tel"
            value={form.ownerPhone}
            onChange={(e) => {
              setManualOwnerEntry(true);
              handleChange('ownerPhone', e.target.value);
            }}
            disabled={!manualOwnerEntry && !!form.ownerId}
            dir="ltr"
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm u-text-start disabled:opacity-60"
          />
        </FormField>
      </div>

      <div className="mt-3">
        <FormField label="ملاحظات" id="detail-prop-notes">
          <textarea
            value={form.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm resize-none"
          />
        </FormField>
      </div>

      {form.status === 'rented' && (
        <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
          <h4 className="font-bold text-[var(--color-text)] mb-3">بيانات المستأجر الحالي</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FormField label="المستأجر" id="detail-prop-tenant-contact">
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
            <FormField label="اسم المستأجر" id="detail-prop-tenant-name">
              <input
                type="text"
                value={form.tenantName || ''}
                onChange={(e) => handleChange('tenantName', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
              />
            </FormField>
            <FormField label="جوال المستأجر" id="detail-prop-tenant-phone">
              <input
                type="tel"
                value={form.tenantPhone || ''}
                onChange={(e) => handleChange('tenantPhone', e.target.value)}
                dir="ltr"
                className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm u-text-start"
              />
            </FormField>
          </div>
        </div>
      )}

      {form.status === 'maintenance' && (
        <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
          <h4 className="font-bold text-[var(--color-text)] mb-3">بيانات جهة الصيانة</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FormField label="جهة الصيانة" id="detail-prop-maint-contact">
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
            <FormField label="اسم المهندس / الجهة" id="detail-prop-maint-name">
              <input
                type="text"
                value={form.maintenanceContactName || ''}
                onChange={(e) => handleChange('maintenanceContactName', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
              />
            </FormField>
            <FormField label="رقم الجوال" id="detail-prop-maint-phone">
              <input
                type="tel"
                value={form.maintenanceContactPhone || ''}
                onChange={(e) => handleChange('maintenanceContactPhone', e.target.value)}
                dir="ltr"
                className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm u-text-start"
              />
            </FormField>
          </div>
        </div>
      )}

      {form.status === 'sold' && (
        <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
          <h4 className="font-bold text-[var(--color-text)] mb-3">بيانات المشتري</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FormField label="المشتري" id="detail-prop-buyer-contact">
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
            <FormField label="اسم المشتري" id="detail-prop-buyer-name">
              <input
                type="text"
                value={form.buyerName || ''}
                onChange={(e) => handleChange('buyerName', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
              />
            </FormField>
            <FormField label="جوال المشتري" id="detail-prop-buyer-phone">
              <input
                type="tel"
                value={form.buyerPhone || ''}
                onChange={(e) => handleChange('buyerPhone', e.target.value)}
                dir="ltr"
                className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm u-text-start"
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
          {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
        </button>
      </div>
    </div>
  );
}

function UnitForm({ form, setForm, onSave, onCancel, saving, editMode }) {
  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="font-bold text-[var(--color-text)]">
          {editMode ? 'تعديل الوحدة' : 'إضافة وحدة جديدة'}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm text-[var(--color-text)]"
        >
          إلغاء
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <FormField label="اسم/رقم الوحدة" id="unit-name">
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="مثال: شقة 3 أو محل A"
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] text-sm"
          />
        </FormField>

        <FormField label="نوع الوحدة" id="unit-type">
          <select
            value={form.type}
            onChange={(e) => handleChange('type', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] text-sm"
          >
            {UNIT_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="الطابق" id="unit-floor">
          <input
            type="text"
            value={form.floor}
            onChange={(e) => handleChange('floor', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] text-sm"
          />
        </FormField>

        <FormField label="المساحة (م²)" id="unit-area">
          <input
            type="number"
            value={form.areaSqm}
            onChange={(e) => handleChange('areaSqm', e.target.value)}
            min="0"
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] text-sm"
          />
        </FormField>

        <FormField label="عدد الغرف" id="unit-rooms">
          <input
            type="number"
            value={form.rooms}
            onChange={(e) => handleChange('rooms', e.target.value)}
            min="0"
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] text-sm"
          />
        </FormField>

        <FormField label="عدد الحمامات" id="unit-bathrooms">
          <input
            type="number"
            value={form.bathrooms}
            onChange={(e) => handleChange('bathrooms', e.target.value)}
            min="0"
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] text-sm"
          />
        </FormField>

        <FormField label="الإيجار الشهري المتوقع" id="unit-rent">
          <input
            type="number"
            value={form.monthlyRent}
            onChange={(e) => handleChange('monthlyRent', e.target.value)}
            min="0"
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] text-sm"
          />
        </FormField>

        <FormField label="الحالة" id="unit-status">
          <select
            value={form.status}
            onChange={(e) => handleChange('status', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] text-sm"
          >
            {UNIT_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <div className="mt-3">
        <FormField label="ملاحظات" id="unit-notes">
          <textarea
            value={form.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] text-sm resize-none"
          />
        </FormField>
      </div>

      <div className="flex gap-2 mt-4">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="btn-primary disabled:opacity-50"
        >
          {saving ? 'جاري الحفظ...' : editMode ? 'حفظ الوحدة' : 'إضافة الوحدة'}
        </button>
      </div>
    </div>
  );
}

function UnitTable({ units, activeContractsByUnitId, contactsById, onEdit, onDelete }) {
  if (!units.length) return null;

  return (
    <>
      <div className="hidden md:block overflow-hidden rounded-xl border border-[var(--color-border)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-bg)] text-[var(--color-muted)]">
            <tr>
              <th className="p-3 u-text-start">الوحدة</th>
              <th className="p-3 u-text-start">النوع</th>
              <th className="p-3 u-text-start">المساحة</th>
              <th className="p-3 u-text-start">الغرف</th>
              <th className="p-3 u-text-start">الإيجار</th>
              <th className="p-3 u-text-start">الحالة</th>
              <th className="p-3 u-text-start">العقد الحالي</th>
              <th className="p-3 u-text-start">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="bg-[var(--color-surface)]">
            {units.map((unit) => {
              const activeContract = activeContractsByUnitId[unit.id];
              const effectiveStatus =
                activeContract && unit.status !== 'maintenance' ? 'occupied' : unit.status;
              const tenant = activeContract
                ? contactsById[activeContract.contactId || activeContract.contact_id]?.name
                : '';

              return (
                <tr key={unit.id} className="border-t border-[var(--color-border)]">
                  <td className="p-3 font-medium text-[var(--color-text)]">{unit.name}</td>
                  <td className="p-3 text-[var(--color-muted)]">{getUnitTypeLabel(unit.type)}</td>
                  <td className="p-3 text-[var(--color-muted)]">{unit.areaSqm || '—'}</td>
                  <td className="p-3 text-[var(--color-muted)]">{unit.rooms || '—'}</td>
                  <td className="p-3 text-[var(--color-text)]">
                    {unit.monthlyRent ? `${formatCurrency(safeNum(unit.monthlyRent))}` : '—'}
                  </td>
                  <td className="p-3">
                    <Badge color={getUnitStatusColor(effectiveStatus)}>
                      {getUnitStatusLabel(effectiveStatus)}
                    </Badge>
                  </td>
                  <td className="p-3 text-[var(--color-muted)]">
                    {activeContract ? (
                      <div>
                        <div className="text-[var(--color-text)]">
                          {tenant || activeContract._contactName || 'عميل مرتبط'}
                        </div>
                        <div className="text-xs mt-1">#{activeContract.contractNumber || '—'}</div>
                      </div>
                    ) : (
                      'لا يوجد'
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => onEdit(unit)}
                        className="text-sm font-medium"
                        style={{ color: 'var(--color-info)' }}
                      >
                        تعديل
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(unit)}
                        className="text-sm font-medium"
                        style={{ color: 'var(--color-danger)' }}
                      >
                        حذف
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 gap-3 md:hidden">
        {units.map((unit) => {
          const activeContract = activeContractsByUnitId[unit.id];
          const effectiveStatus =
            activeContract && unit.status !== 'maintenance' ? 'occupied' : unit.status;
          const tenant = activeContract
            ? contactsById[activeContract.contactId || activeContract.contact_id]?.name
            : '';

          return (
            <div
              key={unit.id}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium text-[var(--color-text)]">{unit.name}</div>
                  <div className="text-sm text-[var(--color-muted)]">
                    {getUnitTypeLabel(unit.type)}
                  </div>
                </div>
                <Badge color={getUnitStatusColor(effectiveStatus)}>
                  {getUnitStatusLabel(effectiveStatus)}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm text-[var(--color-muted)]">
                <span>المساحة: {unit.areaSqm || '—'}</span>
                <span>الغرف: {unit.rooms || '—'}</span>
                <span>
                  الإيجار: {unit.monthlyRent ? `${formatCurrency(safeNum(unit.monthlyRent))}` : '—'}
                </span>
              </div>
              <div className="text-sm text-[var(--color-muted)] mt-2">
                العقد الحالي:{' '}
                {activeContract
                  ? `${tenant || 'عميل مرتبط'} — #${activeContract.contractNumber || '—'}`
                  : 'لا يوجد'}
              </div>
              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => onEdit(unit)}
                  className="text-sm font-medium"
                  style={{ color: 'var(--color-info)' }}
                >
                  تعديل
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(unit)}
                  className="text-sm font-medium"
                  style={{ color: 'var(--color-danger)' }}
                >
                  حذف
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export default function PropertyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const {
    properties,
    units,
    contracts,
    contacts,
    updateProperty,
    createUnit,
    updateUnit,
    deleteUnit,
  } = useData();

  const property = useMemo(() => properties.find((item) => item.id === id), [properties, id]);
  const propertyUnits = useMemo(
    () => (units || []).filter((unit) => unit.propertyId === id),
    [units, id]
  );
  const propertyContracts = useMemo(
    () =>
      (contracts || []).filter((contract) => {
        const propertyId = contract.propertyId || contract.property_id;
        return propertyId === id;
      }),
    [contracts, id]
  );
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
  const owner = useMemo(() => {
    if (!property?.ownerId) return null;
    return contacts.find((contact) => contact.id === property.ownerId) || null;
  }, [contacts, property?.ownerId]);
  const contactsById = useMemo(
    () =>
      (contacts || []).reduce((acc, contact) => {
        acc[contact.id] = contact;
        return acc;
      }, {}),
    [contacts]
  );
  const activeContractsByUnitId = useMemo(
    () =>
      propertyContracts.reduce((acc, contract) => {
        const unitId = contract.unitId || contract.unit_id;
        if (unitId && contract.status === 'active' && !acc[unitId]) {
          acc[unitId] = contract;
        }
        return acc;
      }, {}),
    [propertyContracts]
  );
  const effectivePropertyUnits = useMemo(
    () =>
      propertyUnits.map((unit) => ({
        ...unit,
        effectiveStatus:
          activeContractsByUnitId[unit.id] && unit.status !== 'maintenance'
            ? 'occupied'
            : unit.status,
      })),
    [propertyUnits, activeContractsByUnitId]
  );

  const [editingProperty, setEditingProperty] = useState(false);
  const [propertyForm, setPropertyForm] = useState(defaultProperty);
  const [savingProperty, setSavingProperty] = useState(false);
  const [manualOwnerEntry, setManualOwnerEntry] = useState(true);

  const [showUnitForm, setShowUnitForm] = useState(false);
  const [unitForm, setUnitForm] = useState(defaultUnit(id));
  const [editingUnitId, setEditingUnitId] = useState(null);
  const [savingUnit, setSavingUnit] = useState(false);
  const [confirmDeleteUnit, setConfirmDeleteUnit] = useState(null);

  const unitsSummary = useMemo(
    () => computeUnitsSummary(effectivePropertyUnits),
    [effectivePropertyUnits]
  );
  const currentMonthlyIncome = useMemo(() => {
    if (propertyUnits.length > 0) {
      return propertyUnits.reduce((sum, unit) => {
        const activeContract = activeContractsByUnitId[unit.id];
        if (!activeContract && unit.status !== 'occupied') return sum;
        if (activeContract?.monthlyRent) return sum + safeNum(activeContract.monthlyRent);
        return sum + safeNum(unit.monthlyRent);
      }, 0);
    }
    return safeNum(property?.monthlyRent);
  }, [propertyUnits, property, activeContractsByUnitId]);

  const activeContractsCount = useMemo(
    () => propertyContracts.filter((contract) => contract.status === 'active').length,
    [propertyContracts]
  );

  const nearestContractText = useMemo(() => {
    const dates = propertyContracts
      .filter((contract) => contract.endDate)
      .map((contract) => contract.endDate)
      .sort((a, b) => String(a).localeCompare(String(b)));
    return dates[0] || null;
  }, [propertyContracts]);

  const canHaveUnits = property ? !['land'].includes(property.type) : true;

  const openPropertyEditor = useCallback(() => {
    if (!property) return;
    setPropertyForm({ ...defaultProperty(), ...property });
    setManualOwnerEntry(!property.ownerId);
    setEditingProperty(true);
  }, [property]);

  const closePropertyEditor = useCallback(() => {
    setEditingProperty(false);
    setPropertyForm(defaultProperty());
    setManualOwnerEntry(true);
  }, []);

  const handleSaveProperty = useCallback(async () => {
    if (!property) return;
    const { valid, errors } = validateProperty(propertyForm);
    if (!valid) {
      toast.error(errors[0]);
      return;
    }
    setSavingProperty(true);
    try {
      const { error } = await updateProperty(property.id, propertyForm);
      if (error) throw error;
      toast.success('تم تحديث بيانات العقار');
      closePropertyEditor();
    } catch (err) {
      toast.error(err?.message || 'تعذر تحديث العقار');
    } finally {
      setSavingProperty(false);
    }
  }, [property, propertyForm, updateProperty, closePropertyEditor, toast]);

  const startCreateUnit = useCallback(() => {
    setUnitForm(defaultUnit(id));
    setEditingUnitId(null);
    setShowUnitForm(true);
  }, [id]);

  const startEditUnit = useCallback(
    (unit) => {
      setUnitForm({ ...defaultUnit(id), ...unit });
      setEditingUnitId(unit.id);
      setShowUnitForm(true);
    },
    [id]
  );

  const handleCancelUnit = useCallback(() => {
    setUnitForm(defaultUnit(id));
    setEditingUnitId(null);
    setShowUnitForm(false);
  }, [id]);

  const handleSaveUnit = useCallback(async () => {
    const payload = { ...unitForm, propertyId: id };
    const { valid, errors } = validateUnit(payload);
    if (!valid) {
      toast.error(errors[0]);
      return;
    }

    setSavingUnit(true);
    try {
      if (editingUnitId) {
        const { error } = await updateUnit(editingUnitId, payload);
        if (error) throw error;
        toast.success('تم تحديث الوحدة');
      } else {
        const { error } = await createUnit(payload);
        if (error) throw error;
        toast.success('تمت إضافة الوحدة');
      }
      handleCancelUnit();
    } catch (err) {
      toast.error(err?.message || 'تعذر حفظ الوحدة');
    } finally {
      setSavingUnit(false);
    }
  }, [unitForm, id, editingUnitId, updateUnit, createUnit, handleCancelUnit, toast]);

  const handleDeleteUnit = useCallback(async () => {
    if (!confirmDeleteUnit) return;
    try {
      const { error } = await deleteUnit(confirmDeleteUnit.id);
      if (error) throw error;
      toast.success('تم حذف الوحدة');
      if (editingUnitId === confirmDeleteUnit.id) {
        handleCancelUnit();
      }
    } catch (err) {
      toast.error(err?.message || 'تعذر حذف الوحدة');
    } finally {
      setConfirmDeleteUnit(null);
    }
  }, [confirmDeleteUnit, deleteUnit, editingUnitId, handleCancelUnit, toast]);

  if (!property) {
    return (
      <div className="page-shell page-shell--regular" dir="rtl">
        <EmptyState
          title="عقار غير موجود"
          description="قد يكون العقار حُذف أو أن الرابط غير صحيح."
          actionLabel="العودة إلى العقارات"
          onAction={() => navigate('/properties')}
        />
      </div>
    );
  }

  const propertyStatusColor = getPropertyStatusColor(property.status);

  return (
    <div className="page-shell page-shell--regular" dir="rtl">
      <div className="text-sm text-[var(--color-muted)] mb-3">
        <button type="button" onClick={() => navigate('/properties')} className="hover:underline">
          العقارات
        </button>
        <span className="mx-2">/</span>
        <span>{property.name}</span>
      </div>

      <div className="detail-hero mb-4">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <span className="text-[var(--color-primary)]" aria-hidden="true">
              <Icons.properties size={30} />
            </span>
            <div className="min-w-0">
              <span className="page-kicker">ملف الأصل</span>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="text-xl md:text-2xl font-bold text-[var(--color-text)]">
                  {property.name}
                </h1>
                <Badge color={propertyStatusColor}>{getPropertyStatusLabel(property.status)}</Badge>
              </div>
              <p className="text-sm text-[var(--color-muted)]">
                {getPropertyTypeLabel(property.type)}
                {property.city ? ` — ${property.city}` : ''}
                {property.district ? `، ${property.district}` : ''}
              </p>
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-[var(--color-muted)]">
                <span>عدد الوحدات: {propertyUnits.length || property.unitsCount || 1}</span>
                <span>الوحدات المؤجرة: {unitsSummary.occupiedCount}</span>
                <span>الوحدات الشاغرة: {unitsSummary.vacantCount}</span>
                <span>أقرب عقد ينتهي: {nearestContractText || '—'}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={openPropertyEditor} className="btn-primary">
              تعديل العقار
            </button>
            <button type="button" onClick={() => navigate('/properties')} className="btn-secondary">
              رجوع للقائمة
            </button>
          </div>
        </div>
      </div>

      {editingProperty && (
        <PropertyEditForm
          form={propertyForm}
          setForm={setPropertyForm}
          onSave={handleSaveProperty}
          onCancel={closePropertyEditor}
          saving={savingProperty}
          ownerContacts={ownerContacts}
          tenantContacts={tenantContacts}
          maintenanceContacts={maintenanceContacts}
          buyerContacts={buyerContacts}
          manualOwnerEntry={manualOwnerEntry}
          setManualOwnerEntry={setManualOwnerEntry}
        />
      )}

      <div className="route-summary-grid route-summary-grid--quad mb-4">
        <SummaryCard
          label="الإيراد الشهري الحالي"
          value={formatCurrency(currentMonthlyIncome)}
          color="green"
          icon={<Icons.arrowUp size={18} />}
        />
        <SummaryCard
          label="نسبة الإشغال"
          value={`${propertyUnits.length ? unitsSummary.occupancyRate : property.status === 'rented' ? 100 : 0}%`}
          color="blue"
          icon={<Icons.percent size={18} />}
        />
        <SummaryCard
          label="الوحدات الشاغرة"
          value={
            propertyUnits.length
              ? unitsSummary.vacantCount
              : property.status === 'available'
                ? 1
                : 0
          }
          color="yellow"
          icon={<Icons.home size={18} />}
        />
        <SummaryCard
          label="العقود السارية"
          value={activeContractsCount}
          color="blue"
          icon={<Icons.fileText size={18} />}
        />
      </div>

      <section className="detail-section mb-4">
        <h2 className="font-bold text-[var(--color-text)] mb-3">بيانات العقار</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <PropertyInfoItem label="النوع" value={getPropertyTypeLabel(property.type)} />
          <PropertyInfoItem label="رقم الصك" value={property.deedNumber} />
          <PropertyInfoItem label="العنوان الوطني" value={property.nationalAddress} />
          <PropertyInfoItem label="المدينة" value={property.city} />
          <PropertyInfoItem label="الحي" value={property.district} />
          <PropertyInfoItem
            label="المساحة"
            value={property.areaSqm ? `${property.areaSqm} م²` : '—'}
          />
          <PropertyInfoItem label="سنة البناء" value={property.yearBuilt} />
          <PropertyInfoItem label="الطوابق" value={property.floors} />
          <PropertyInfoItem label="الحمامات" value={property.bathrooms} />
          <PropertyInfoItem
            label="سعر الشراء"
            value={property.purchasePrice ? formatCurrency(safeNum(property.purchasePrice)) : '—'}
          />
          <PropertyInfoItem
            label="الإيجار الشهري"
            value={property.monthlyRent ? formatCurrency(safeNum(property.monthlyRent)) : '—'}
          />
          <PropertyInfoItem label="عدد الوحدات المخطط" value={property.unitsCount} />
        </div>
      </section>

      <section className="detail-section mb-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="font-bold text-[var(--color-text)]">المالك</h2>
          {owner?.id && (
            <button
              type="button"
              onClick={() => navigate(`/contacts/${owner.id}`)}
              className="text-sm font-medium"
              style={{ color: 'var(--color-info)' }}
            >
              عرض في العملاء
            </button>
          )}
        </div>

        {owner ? (
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
            <div className="font-medium text-[var(--color-text)]">{owner.name}</div>
            <div className="text-sm text-[var(--color-muted)] mt-1">
              {owner.phone ? (
                <a href={`tel:${owner.phone}`} className="hover:underline" dir="ltr">
                  {owner.phone}
                </a>
              ) : (
                'لا يوجد جوال'
              )}
            </div>
            <div className="text-sm text-[var(--color-muted)] mt-1">
              {owner.idType || owner.idNumber
                ? `${owner.idType || 'نوع الهوية'}${owner.idNumber ? ` — ${owner.idNumber}` : ''}`
                : 'لا توجد بيانات هوية'}
            </div>
          </div>
        ) : property.ownerName ? (
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4 text-sm text-[var(--color-text)]">
            <div className="font-medium">{property.ownerName}</div>
            <div className="text-[var(--color-muted)] mt-1">
              {property.ownerPhone || 'لا يوجد جوال'}
            </div>
          </div>
        ) : (
          <div className="text-sm text-[var(--color-muted)]">لم يُحدد مالك لهذا العقار.</div>
        )}
      </section>

      {(property.tenantName ||
        property.tenantPhone ||
        property.maintenanceContactName ||
        property.maintenanceContactPhone ||
        property.buyerName ||
        property.buyerPhone) && (
        <section className="detail-section mb-4">
          <h2 className="font-bold text-[var(--color-text)] mb-3">بيانات مرتبطة بالحالة الحالية</h2>
          {property.status === 'rented' && (
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4 text-sm">
              <div className="font-medium text-[var(--color-text)]">
                {property.tenantName || 'مستأجر غير محدد'}
              </div>
              <div className="text-[var(--color-muted)] mt-1">
                {property.tenantPhone || 'لا يوجد جوال'}
              </div>
            </div>
          )}
          {property.status === 'maintenance' && (
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4 text-sm">
              <div className="font-medium text-[var(--color-text)]">
                {property.maintenanceContactName || 'جهة الصيانة غير محددة'}
              </div>
              <div className="text-[var(--color-muted)] mt-1">
                {property.maintenanceContactPhone || 'لا يوجد جوال'}
              </div>
            </div>
          )}
          {property.status === 'sold' && (
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4 text-sm">
              <div className="font-medium text-[var(--color-text)]">
                {property.buyerName || 'مشتري غير محدد'}
              </div>
              <div className="text-[var(--color-muted)] mt-1">
                {property.buyerPhone || 'لا يوجد جوال'}
              </div>
            </div>
          )}
        </section>
      )}

      <section className="detail-section mb-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <h2 className="font-bold text-[var(--color-text)]">الوحدات</h2>
            <p className="text-sm text-[var(--color-muted)] mt-1">
              {canHaveUnits
                ? 'تابع الوحدات الشاغرة والمؤجرة من داخل نفس العقار.'
                : 'هذا النوع من العقارات لا يحتاج وحدات فرعية غالبًا، لكن يمكنك إضافتها إذا لزم.'}
            </p>
          </div>
          <button type="button" onClick={startCreateUnit} className="btn-primary">
            إضافة وحدة
          </button>
        </div>

        {showUnitForm && (
          <div className="mb-4">
            <UnitForm
              form={unitForm}
              setForm={setUnitForm}
              onSave={handleSaveUnit}
              onCancel={handleCancelUnit}
              saving={savingUnit}
              editMode={!!editingUnitId}
            />
          </div>
        )}

        {propertyUnits.length > 0 ? (
          <UnitTable
            units={propertyUnits}
            activeContractsByUnitId={activeContractsByUnitId}
            contactsById={contactsById}
            onEdit={startEditUnit}
            onDelete={setConfirmDeleteUnit}
          />
        ) : (
          <EmptyState
            title="لا توجد وحدات بعد"
            description={
              canHaveUnits
                ? 'أضف الوحدات لتتبع الإشغال والعقود على مستوى الشقة أو المحل.'
                : 'يمكنك إبقاء هذا العقار بدون وحدات فرعية أو إضافة وحدة عند الحاجة.'
            }
            actionLabel="إضافة وحدة"
            onAction={startCreateUnit}
          />
        )}
      </section>

      <section className="detail-section mb-4">
        <h2 className="font-bold text-[var(--color-text)] mb-3">العقود المرتبطة</h2>
        {propertyContracts.length > 0 ? (
          <div className="space-y-3">
            {propertyContracts.map((contract) => {
              const contact = contacts.find(
                (item) => item.id === (contract.contactId || contract.contact_id)
              );
              return (
                <div
                  key={contract.id}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium text-[var(--color-text)]">
                        {getContractTypeLabel(contract.type)}
                        {contact?.name ? ` — ${contact.name}` : ''}
                      </div>
                      <div className="text-sm text-[var(--color-muted)] mt-1">
                        {contract.startDate || '—'} → {contract.endDate || '—'}
                      </div>
                    </div>
                    <Badge color={getContractStatusColor(contract.status)}>
                      {getContractStatusLabel(contract.status)}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm text-[var(--color-muted)]">
                    <span>رقم العقد: {contract.contractNumber || '—'}</span>
                    <span>
                      الوحدة:{' '}
                      {propertyUnits.find(
                        (unit) => unit.id === (contract.unitId || contract.unit_id)
                      )?.name || '—'}
                    </span>
                    <span>
                      القيمة:{' '}
                      {contract.totalAmount
                        ? `${formatCurrency(safeNum(contract.totalAmount))}`
                        : '—'}
                    </span>
                    <span>
                      الإيجار الشهري:{' '}
                      {contract.monthlyRent
                        ? `${formatCurrency(safeNum(contract.monthlyRent))}`
                        : '—'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-sm text-[var(--color-muted)]">لا توجد عقود مرتبطة بهذا العقار.</div>
        )}
      </section>

      <section className="detail-section">
        <h2 className="font-bold text-[var(--color-text)] mb-3">إجراءات سريعة</h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={openPropertyEditor}
            className="px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm text-[var(--color-text)]"
          >
            تعديل العقار
          </button>
          <button
            type="button"
            onClick={startCreateUnit}
            className="px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm text-[var(--color-text)]"
          >
            إضافة وحدة
          </button>
          <button
            type="button"
            onClick={() => navigate('/contracts')}
            className="px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm text-[var(--color-text)]"
          >
            عرض العقود
          </button>
        </div>
      </section>

      {confirmDeleteUnit && (
        <ConfirmDialog
          open={!!confirmDeleteUnit}
          title="حذف الوحدة"
          message={`هل تريد حذف الوحدة "${confirmDeleteUnit.name}"؟`}
          confirmLabel="حذف"
          cancelLabel="إلغاء"
          onConfirm={handleDeleteUnit}
          onCancel={() => setConfirmDeleteUnit(null)}
          danger
        />
      )}
    </div>
  );
}
