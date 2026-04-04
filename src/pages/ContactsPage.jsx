/**
 * صفحة جهات الاتصال — SPR-018: النواة العقارية (الخطوة 2: العملاء)
 * إدارة العملاء والمستأجرين والملاك (إضافة، تعديل، حذف، فلترة، ملخص).
 */
import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import { FormField, SummaryCard, Icons, EmptyState, MobileFAB } from '../ui/ui-common.jsx';
import { ConfirmDialog } from '../ui/Modals.jsx';
import {
  CONTACT_TYPE_OPTIONS,
  CONTACT_ID_TYPE_OPTIONS,
  SAUDI_CITIES,
  getContactTypeLabel,
  getContactIdTypeLabel,
  validateContact,
  computeContactsSummary,
  filterContacts,
  defaultContact,
} from '../domain/contacts.js';

// ═══════════════════════════════════════
// نموذج إضافة/تعديل جهة الاتصال
// ═══════════════════════════════════════
function ContactForm({ form, setForm, onSave, onCancel, editMode, saving }) {
  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 md:p-5 shadow-sm mb-4">
      <h3 className="font-bold text-[var(--color-text)] mb-1">
        {editMode ? 'تعديل جهة الاتصال' : 'إضافة جهة اتصال جديدة'}
      </h3>
      <p className="text-sm text-[var(--color-muted)] mb-4">
        {editMode
          ? 'عدّل البيانات واحفظ التغييرات'
          : 'سجّل عملاءك ومستأجريك لتتبع العقود والمدفوعات'}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* الاسم */}
        <FormField label="الاسم" id="contact-name">
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="مثال: أحمد محمد الشمري"
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
            maxLength={100}
          />
        </FormField>

        {/* النوع */}
        <FormField label="نوع جهة الاتصال" id="contact-type">
          <select
            value={form.type}
            onChange={(e) => handleChange('type', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
          >
            {CONTACT_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </FormField>

        {/* رقم الجوال */}
        <FormField label="رقم الجوال" id="contact-phone">
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="05XXXXXXXX"
            dir="ltr"
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm text-left"
          />
        </FormField>

        {/* رقم جوال إضافي */}
        <FormField label="رقم جوال إضافي" id="contact-phone2">
          <input
            type="tel"
            value={form.phone2}
            onChange={(e) => handleChange('phone2', e.target.value)}
            placeholder="05XXXXXXXX (اختياري)"
            dir="ltr"
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm text-left"
          />
        </FormField>

        {/* البريد الإلكتروني */}
        <FormField label="البريد الإلكتروني" id="contact-email">
          <input
            type="email"
            value={form.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="example@email.com"
            dir="ltr"
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm text-left"
          />
        </FormField>

        {/* نوع الهوية */}
        <FormField label="نوع الهوية" id="contact-id-type">
          <select
            value={form.idType}
            onChange={(e) => handleChange('idType', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
          >
            {CONTACT_ID_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </FormField>

        {/* رقم الهوية */}
        <FormField label="رقم الهوية / السجل" id="contact-id-number">
          <input
            type="text"
            value={form.idNumber}
            onChange={(e) => handleChange('idNumber', e.target.value)}
            placeholder="رقم الهوية أو السجل التجاري"
            dir="ltr"
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm text-left"
          />
        </FormField>

        {/* المدينة */}
        <FormField label="المدينة" id="contact-city">
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

        {/* الحي */}
        <FormField label="الحي" id="contact-district">
          <input
            type="text"
            value={form.district}
            onChange={(e) => handleChange('district', e.target.value)}
            placeholder="مثال: حي النرجس"
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
          />
        </FormField>

        {/* اسم الشركة */}
        <FormField label="اسم الشركة" id="contact-company">
          <input
            type="text"
            value={form.companyName}
            onChange={(e) => handleChange('companyName', e.target.value)}
            placeholder="اسم الشركة (اختياري)"
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
          />
        </FormField>

        {/* الجنسية */}
        <FormField label="الجنسية" id="contact-nationality">
          <input
            type="text"
            value={form.nationality}
            onChange={(e) => handleChange('nationality', e.target.value)}
            placeholder="مثال: سعودي"
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
          />
        </FormField>

        {/* وسوم */}
        <FormField label="وسوم" id="contact-tags">
          <input
            type="text"
            value={form.tags}
            onChange={(e) => handleChange('tags', e.target.value)}
            placeholder="VIP, متأخر, ... (مفصولة بفاصلة)"
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
          />
        </FormField>
      </div>

      {/* ملاحظات */}
      <div className="mt-3">
        <FormField label="ملاحظات" id="contact-notes">
          <textarea
            value={form.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="أي ملاحظات إضافية عن جهة الاتصال..."
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
          className="btn-primary disabled:opacity-50"
        >
          {saving ? 'جاري الحفظ...' : editMode ? 'حفظ التعديلات' : 'إضافة جهة الاتصال'}
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
// بطاقة جهة اتصال
// ═══════════════════════════════════════
function ContactCard({ contact, onEdit, onDelete, contractCount, onViewContracts, onOpen }) {
  const typeLabel = getContactTypeLabel(contact.type);

  const tags = (contact.tags || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

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
      className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 shadow-sm cursor-pointer hover:border-[var(--color-primary)] transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <span className="flex-shrink-0 text-[var(--color-primary)]" aria-hidden="true">
            <Icons.contacts size={24} />
          </span>
          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-[var(--color-text)] truncate">{contact.name}</h4>
            <p className="text-sm text-[var(--color-muted)] mt-0.5">
              {typeLabel}
              {contact.companyName ? ` — ${contact.companyName}` : ''}
            </p>
          </div>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 flex-shrink-0">
            {tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ background: 'var(--color-info-bg)', color: 'var(--color-info)' }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* معلومات التواصل */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm text-[var(--color-muted)]">
        {contact.phone && (
          <a href={`tel:${contact.phone}`} className="transition-colors hover:opacity-80" dir="ltr">
            {contact.phone}
          </a>
        )}
        {contact.email && (
          <a
            href={`mailto:${contact.email}`}
            className="transition-colors hover:opacity-80"
            dir="ltr"
          >
            {contact.email}
          </a>
        )}
        {contact.city && (
          <span>
            {contact.city}
            {contact.district ? `، ${contact.district}` : ''}
          </span>
        )}
      </div>

      {contact.idNumber && (
        <p className="text-sm text-[var(--color-muted)] mt-2">
          {getContactIdTypeLabel(contact.idType)}: <span dir="ltr">{contact.idNumber}</span>
        </p>
      )}

      {contact.notes && (
        <p className="text-sm text-[var(--color-muted)] mt-1 line-clamp-2">{contact.notes}</p>
      )}

      <div
        className="flex items-center gap-3 mt-3 pt-3 border-t border-[var(--color-border)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => onEdit(contact)}
          className="text-sm font-medium hover:opacity-80"
          style={{ color: 'var(--color-info)' }}
        >
          تعديل
        </button>
        <button
          type="button"
          onClick={() => onDelete(contact)}
          className="text-sm font-medium hover:opacity-80"
          style={{ color: 'var(--color-danger)' }}
        >
          حذف
        </button>
        {contractCount > 0 && (
          <button
            type="button"
            onClick={() => onViewContracts(contact)}
            className="text-sm font-medium hover:opacity-80 mr-auto"
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
export default function ContactsPage() {
  const navigate = useNavigate();
  const { contacts, contactsLoading, createContact, updateContact, deleteContact, contracts } =
    useData();
  const toast = useToast();

  // نموذج إضافة/تعديل
  const [form, setForm] = useState(defaultContact);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // فلاتر
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');

  // حوار حذف
  const [confirmDelete, setConfirmDelete] = useState(null);

  // ملخص
  const summary = useMemo(() => computeContactsSummary(contacts), [contacts]);

  // عدد العقود لكل عميل (للربط بين الصفحات)
  const contractCountMap = useMemo(() => {
    const map = {};
    (contracts || []).forEach((c) => {
      const cid = c.contactId || c.contact_id;
      if (cid) map[cid] = (map[cid] || 0) + 1;
    });
    return map;
  }, [contracts]);

  // فلترة
  const filtered = useMemo(
    () => filterContacts(contacts, { type: filterType, search: searchQuery }),
    [contacts, filterType, searchQuery]
  );

  // حفظ (إضافة أو تعديل)
  const handleSave = useCallback(async () => {
    const { valid, errors } = validateContact(form);
    if (!valid) {
      toast.error(errors[0]);
      return;
    }
    setSaving(true);
    try {
      if (editMode && editId) {
        const { error } = await updateContact(editId, form);
        if (error) throw error;
        toast.success('تم تحديث جهة الاتصال');
      } else {
        const { error } = await createContact(form);
        if (error) throw error;
        toast.success('تمت إضافة جهة الاتصال');
      }
      setForm(defaultContact());
      setEditMode(false);
      setEditId(null);
      setShowForm(false);
    } catch (err) {
      toast.error(err?.message || 'حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  }, [form, editMode, editId, createContact, updateContact, toast]);

  // بدء التعديل
  const handleEdit = useCallback((contact) => {
    setForm({ ...defaultContact(), ...contact });
    setEditMode(true);
    setEditId(contact.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // إلغاء التعديل
  const handleCancel = useCallback(() => {
    setForm(defaultContact());
    setEditMode(false);
    setEditId(null);
    setShowForm(false);
  }, []);

  // تأكيد الحذف
  const handleConfirmDelete = useCallback(async () => {
    if (!confirmDelete) return;
    try {
      const { error } = await deleteContact(confirmDelete.id);
      if (error) throw error;
      toast.success('تم حذف جهة الاتصال');
    } catch (err) {
      toast.error(err?.message || 'حدث خطأ أثناء الحذف');
    }
    setConfirmDelete(null);
  }, [confirmDelete, deleteContact, toast]);

  return (
    <div className="page-shell px-4 md:px-6 max-w-4xl mx-auto py-4" dir="rtl">
      <div className="page-header">
        <div className="page-header-copy">
          <span className="page-kicker">العلاقات</span>
          <h1 className="page-title">العملاء</h1>
          <p className="page-subtitle">
            أدر الملاك والمستأجرين والمشترين من سجل موحد يدعم البحث والربط بالعقود.
          </p>
        </div>
        {!showForm && (
          <button
            type="button"
            onClick={() => {
              setForm(defaultContact());
              setEditMode(false);
              setEditId(null);
              setShowForm(true);
            }}
            className="btn-primary"
          >
            <Icons.plus size={16} />
            إضافة عميل
          </button>
        )}
      </div>

      {/* نموذج إضافة/تعديل */}
      {showForm && (
        <ContactForm
          form={form}
          setForm={setForm}
          onSave={handleSave}
          onCancel={handleCancel}
          editMode={editMode}
          saving={saving}
        />
      )}

      {/* ملخص */}
      {contacts.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <SummaryCard label="الإجمالي" value={summary.total} icon={<Icons.contacts size={20} />} />
          <SummaryCard
            label="مستأجرين"
            value={summary.tenantCount}
            icon={<Icons.home size={18} />}
          />
          <SummaryCard
            label="ملاك"
            value={summary.ownerCount}
            icon={<Icons.contacts size={18} />}
          />
          <SummaryCard
            label="مشترين"
            value={summary.buyerCount}
            icon={<Icons.contracts size={18} />}
          />
        </div>
      )}

      {/* فلاتر */}
      {contacts.length > 0 && (
        <div className="control-toolbar flex flex-wrap gap-3 mb-4 p-3">
          <div className="flex-1 min-w-[180px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث بالاسم، الجوال، البريد..."
              className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
          >
            <option value="">كل الأنواع</option>
            {CONTACT_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* حالة التحميل */}
      {contactsLoading && (
        <div className="text-center py-8 text-[var(--color-muted)]">جاري التحميل...</div>
      )}

      {/* حالة فارغة */}
      {!contactsLoading && contacts.length === 0 && !showForm && (
        <EmptyState
          title="لا توجد جهات اتصال"
          description="أضف عملاءك ومستأجريك لتتبع العقود والمدفوعات والصيانة."
          actionLabel="إضافة أول عميل"
          onAction={() => {
            setForm(defaultContact());
            setShowForm(true);
          }}
        />
      )}

      {/* لا نتائج بعد الفلترة */}
      {!contactsLoading && contacts.length > 0 && filtered.length === 0 && (
        <div className="text-center py-8 text-[var(--color-muted)]">لا توجد نتائج مطابقة للبحث</div>
      )}

      {/* قائمة جهات الاتصال */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map((contact) => (
          <ContactCard
            key={contact.id}
            contact={contact}
            onEdit={handleEdit}
            onDelete={setConfirmDelete}
            contractCount={contractCountMap[contact.id] || 0}
            onOpen={() => navigate(`/contacts/${contact.id}`)}
            onViewContracts={() => navigate('/contracts')}
          />
        ))}
      </div>

      {/* حوار تأكيد الحذف */}
      {confirmDelete && (
        <ConfirmDialog
          title="حذف جهة الاتصال"
          message={`هل أنت متأكد من حذف "${confirmDelete.name}"؟ لا يمكن التراجع عن هذا الإجراء.`}
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
          setForm(defaultContact());
          setEditMode(false);
          setEditId(null);
          setShowForm(true);
        }}
        label="إضافة جهة اتصال"
      />
    </div>
  );
}
