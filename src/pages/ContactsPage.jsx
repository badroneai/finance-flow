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
    <div className="panel-card contacts-page__form-shell">
      <div className="contacts-page__form-header">
        <h3 className="contacts-page__form-title">
          {editMode ? 'تعديل جهة الاتصال' : 'إضافة جهة اتصال جديدة'}
        </h3>
        <p className="contacts-page__form-hint">
          {editMode
            ? 'عدّل البيانات واحفظ التغييرات'
            : 'سجّل عملاءك ومستأجريك لتتبع العقود والمدفوعات'}
        </p>
      </div>

      <div className="contacts-page__form-grid">
        {/* الاسم */}
        <FormField label="الاسم" id="contact-name">
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="مثال: أحمد محمد الشمري"
            maxLength={100}
          />
        </FormField>

        {/* النوع */}
        <FormField label="نوع جهة الاتصال" id="contact-type">
          <select
            value={form.type}
            onChange={(e) => handleChange('type', e.target.value)}
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
          />
        </FormField>

        {/* نوع الهوية */}
        <FormField label="نوع الهوية" id="contact-id-type">
          <select
            value={form.idType}
            onChange={(e) => handleChange('idType', e.target.value)}
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
          />
        </FormField>

        {/* المدينة */}
        <FormField label="المدينة" id="contact-city">
          <select
            value={form.city}
            onChange={(e) => handleChange('city', e.target.value)}
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
          />
        </FormField>

        {/* اسم الشركة */}
        <FormField label="اسم الشركة" id="contact-company">
          <input
            type="text"
            value={form.companyName}
            onChange={(e) => handleChange('companyName', e.target.value)}
            placeholder="اسم الشركة (اختياري)"
          />
        </FormField>

        {/* الجنسية */}
        <FormField label="الجنسية" id="contact-nationality">
          <input
            type="text"
            value={form.nationality}
            onChange={(e) => handleChange('nationality', e.target.value)}
            placeholder="مثال: سعودي"
          />
        </FormField>

        {/* وسوم */}
        <FormField label="وسوم" id="contact-tags">
          <input
            type="text"
            value={form.tags}
            onChange={(e) => handleChange('tags', e.target.value)}
            placeholder="VIP, متأخر, ... (مفصولة بفاصلة)"
          />
        </FormField>
      </div>

      {/* ملاحظات */}
      <div className="contacts-page__form-notes">
        <FormField label="ملاحظات" id="contact-notes">
          <textarea
            value={form.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="أي ملاحظات إضافية عن جهة الاتصال..."
            rows={2}
          />
        </FormField>
      </div>

      <div className="contacts-page__form-actions">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="btn-primary"
        >
          {saving ? 'جاري الحفظ...' : editMode ? 'حفظ التعديلات' : 'إضافة جهة الاتصال'}
        </button>
        {editMode && (
          <button
            type="button"
            onClick={onCancel}
            className="contacts-page__btn-cancel"
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
      className="panel-card contacts-page__card"
    >
      <div className="contacts-page__card-head">
        <div className="contacts-page__card-identity">
          <span className="contacts-page__card-icon" aria-hidden="true">
            <Icons.contacts size={24} />
          </span>
          <div>
            <div className="contacts-page__card-name">{contact.name}</div>
            <div className="contacts-page__card-type">
              {typeLabel}
              {contact.companyName ? ` — ${contact.companyName}` : ''}
            </div>
          </div>
        </div>
        {tags.length > 0 && (
          <div className="contacts-page__card-tags">
            {tags.map((tag) => (
              <span key={tag} className="contacts-page__tag">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* معلومات التواصل */}
      <div className="contacts-page__card-meta">
        {contact.phone && (
          <a href={`tel:${contact.phone}`} dir="ltr">
            {contact.phone}
          </a>
        )}
        {contact.email && (
          <a href={`mailto:${contact.email}`} dir="ltr">
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
        <p className="contacts-page__card-detail">
          {getContactIdTypeLabel(contact.idType)}: <span dir="ltr">{contact.idNumber}</span>
        </p>
      )}

      {contact.notes && (
        <p className="contacts-page__card-notes">{contact.notes}</p>
      )}

      <div
        className="contacts-page__card-actions"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => onEdit(contact)}
          className="contacts-page__card-action contacts-page__card-action--edit"
        >
          تعديل
        </button>
        <button
          type="button"
          onClick={() => onDelete(contact)}
          className="contacts-page__card-action contacts-page__card-action--delete"
        >
          حذف
        </button>
        {contractCount > 0 && (
          <button
            type="button"
            onClick={() => onViewContracts(contact)}
            className="contacts-page__card-action contacts-page__card-action--contracts"
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
    <div className="page-shell page-shell--regular contacts-page" dir="rtl">
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
        <div className="contacts-page__summary">
          <div className="route-summary-grid route-summary-grid--quad">
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
        </div>
      )}

      {/* فلاتر */}
      {contacts.length > 0 && (
        <div className="control-toolbar control-toolbar--filters contacts-page__toolbar">
          <div className="contacts-page__search">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث بالاسم، الجوال، البريد..."
              className="contacts-page__search-input"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="contacts-page__filter-control"
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
        <div className="contacts-page__state">جاري التحميل...</div>
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
        <div className="contacts-page__state">لا توجد نتائج مطابقة للبحث</div>
      )}

      {/* قائمة جهات الاتصال */}
      <div className="contacts-page__list">
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
