import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../contexts/DataContext.jsx';
import { Badge, EmptyState, SummaryCard, Icons } from '../ui/ui-common.jsx';
import { getContactIdTypeLabel, getContactTypeLabel } from '../domain/contacts.js';
import {
  getContractStatusColor,
  getContractStatusLabel,
  getContractTypeLabel,
} from '../domain/contracts.js';
import { formatCurrency } from '../utils/format.jsx';
import { safeNum } from '../utils/helpers.js';

// بطاقة معلومات — تعرض label + value
function InfoCard({ label, value }) {
  return (
    <div className="cnt-detail__info-card">
      <div className="cnt-detail__info-label">{label}</div>
      <div className="cnt-detail__info-value">{value || '—'}</div>
    </div>
  );
}

export default function ContactDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { contacts, properties, contracts, units } = useData();

  const contact = useMemo(() => contacts.find((item) => item.id === id), [contacts, id]);

  const ownedProperties = useMemo(() => {
    if (!contact) return [];
    return properties.filter(
      (property) =>
        property.ownerId === contact.id ||
        (!property.ownerId && property.ownerName && property.ownerName === contact.name)
    );
  }, [properties, contact]);

  const linkedContracts = useMemo(() => {
    if (!contact) return [];
    return contracts.filter(
      (contract) => (contract.contactId || contract.contact_id) === contact.id
    );
  }, [contracts, contact]);

  const unitsById = useMemo(
    () =>
      units.reduce((acc, unit) => {
        acc[unit.id] = unit;
        return acc;
      }, {}),
    [units]
  );

  // حالة العميل غير موجود
  if (!contact) {
    return (
      <div className="page-shell page-shell--regular cnt-detail" dir="rtl">
        <EmptyState
          title="عميل غير موجود"
          description="قد يكون العميل حُذف أو أن الرابط غير صحيح."
          actionLabel="العودة إلى العملاء"
          onAction={() => navigate('/contacts')}
        />
      </div>
    );
  }

  return (
    <div className="page-shell page-shell--regular cnt-detail" dir="rtl">
      {/* مسار التنقل */}
      <nav className="cnt-detail__breadcrumb">
        <button type="button" onClick={() => navigate('/contacts')} className="cnt-detail__breadcrumb-link">
          العملاء
        </button>
        <span className="cnt-detail__breadcrumb-sep">/</span>
        <span>{contact.name}</span>
      </nav>

      {/* بطاقة الهوية الرئيسية */}
      <div className="detail-hero cnt-detail__hero">
        <div className="cnt-detail__hero-layout">
          <div className="cnt-detail__hero-identity">
            <span className="cnt-detail__hero-icon" aria-hidden="true">
              <Icons.contacts size={30} />
            </span>
            <div className="cnt-detail__hero-copy">
              <span className="page-kicker">ملف العميل</span>
              <div className="cnt-detail__hero-title-row">
                <h1 className="cnt-detail__hero-title">
                  {contact.name}
                </h1>
                <Badge color="blue">{getContactTypeLabel(contact.type)}</Badge>
              </div>
              <p className="cnt-detail__hero-subtitle">
                {contact.companyName || 'جهة اتصال فردية'}
              </p>
            </div>
          </div>

          <div className="cnt-detail__hero-actions">
            <button
              type="button"
              onClick={() => navigate('/contacts')}
              className="cnt-detail__back-btn"
            >
              رجوع للقائمة
            </button>
          </div>
        </div>
      </div>

      {/* بطاقات الملخص */}
      <div className="cnt-detail__summary route-summary-grid route-summary-grid--quad">
        <SummaryCard
          label="العقارات المرتبطة"
          value={ownedProperties.length}
          color="blue"
          icon={<Icons.properties size={18} />}
        />
        <SummaryCard
          label="العقود المرتبطة"
          value={linkedContracts.length}
          color="green"
          icon={<Icons.fileText size={18} />}
        />
        <SummaryCard
          label="الجوال"
          value={contact.phone || '—'}
          color="blue"
          icon={<Icons.contacts size={18} />}
        />
        <SummaryCard
          label="المدينة"
          value={contact.city || '—'}
          color="yellow"
          icon={<Icons.home size={18} />}
        />
      </div>

      {/* بيانات العميل */}
      <section className="detail-section cnt-detail__section">
        <h2 className="cnt-detail__section-title">بيانات العميل</h2>
        <div className="cnt-detail__info-grid">
          <InfoCard label="الاسم" value={contact.name} />
          <InfoCard label="النوع" value={getContactTypeLabel(contact.type)} />
          <InfoCard label="الجوال" value={contact.phone} />
          <InfoCard label="جوال إضافي" value={contact.phone2} />
          <InfoCard label="البريد الإلكتروني" value={contact.email} />
          <InfoCard label="نوع الهوية" value={getContactIdTypeLabel(contact.idType)} />
          <InfoCard label="رقم الهوية / السجل" value={contact.idNumber} />
          <InfoCard label="المدينة" value={contact.city} />
          <InfoCard label="الحي" value={contact.district} />
          <InfoCard label="العنوان" value={contact.address} />
          <InfoCard label="الجنسية" value={contact.nationality} />
          <InfoCard label="الشركة" value={contact.companyName} />
        </div>
      </section>

      {/* العقارات المرتبطة */}
      <section className="detail-section cnt-detail__section">
        <h2 className="cnt-detail__section-title">العقارات المرتبطة</h2>
        {ownedProperties.length ? (
          <div className="cnt-detail__entity-grid">
            {ownedProperties.map((property) => (
              <button
                key={property.id}
                type="button"
                onClick={() => navigate(`/properties/${property.id}`)}
                className="cnt-detail__entity-card"
              >
                <div className="cnt-detail__entity-name">{property.name}</div>
                <div className="cnt-detail__entity-meta">
                  {property.city || '—'}
                  {property.district ? `، ${property.district}` : ''}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="cnt-detail__empty-note">
            لا توجد عقارات مرتبطة بهذا العميل.
          </div>
        )}
      </section>

      {/* العقود المرتبطة */}
      <section className="detail-section cnt-detail__section">
        <h2 className="cnt-detail__section-title">العقود المرتبطة</h2>
        {linkedContracts.length ? (
          <div className="cnt-detail__contracts-list">
            {linkedContracts.map((contract) => (
              <button
                key={contract.id}
                type="button"
                onClick={() => navigate(`/contracts/${contract.id}`)}
                className="cnt-detail__contract-card"
              >
                <div className="cnt-detail__contract-head">
                  <div>
                    <div className="cnt-detail__entity-name">
                      {getContractTypeLabel(contract.type)}
                    </div>
                    <div className="cnt-detail__entity-meta">
                      {properties.find(
                        (property) => property.id === (contract.propertyId || contract.property_id)
                      )?.name || '—'}
                      {unitsById[contract.unitId || contract.unit_id]
                        ? ` — ${unitsById[contract.unitId || contract.unit_id].name}`
                        : ''}
                    </div>
                  </div>
                  <Badge color={getContractStatusColor(contract.status)}>
                    {getContractStatusLabel(contract.status)}
                  </Badge>
                </div>
                <div className="cnt-detail__contract-meta">
                  <span>رقم العقد: {contract.contractNumber || '—'}</span>
                  <span>
                    الإيجار الشهري:{' '}
                    {contract.monthlyRent
                      ? `${formatCurrency(safeNum(contract.monthlyRent))}`
                      : '—'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="cnt-detail__empty-note">لا توجد عقود مرتبطة بهذا العميل.</div>
        )}
      </section>

      {/* ملاحظات */}
      <section className="detail-section cnt-detail__section cnt-detail__section--last">
        <h2 className="cnt-detail__section-title">ملاحظات</h2>
        <div className="cnt-detail__notes-body">
          {contact.notes || 'لا توجد ملاحظات على هذا العميل.'}
        </div>
      </section>
    </div>
  );
}
