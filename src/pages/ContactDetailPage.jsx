import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../contexts/DataContext.jsx';
import { Badge, EmptyState, SummaryCard, Icons } from '../ui/ui-common.jsx';
import { getContactIdTypeLabel, getContactTypeLabel } from '../domain/contacts.js';
import { getContractStatusColor, getContractStatusLabel, getContractTypeLabel } from '../domain/contracts.js';
import { formatCurrency } from '../utils/format.jsx';
import { safeNum } from '../utils/helpers.js';

function InfoCard({ label, value }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
      <div className="text-xs text-[var(--color-muted)] mb-1">{label}</div>
      <div className="text-sm font-medium text-[var(--color-text)]">{value || '—'}</div>
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
    return contracts.filter((contract) => (contract.contactId || contract.contact_id) === contact.id);
  }, [contracts, contact]);

  const unitsById = useMemo(
    () =>
      units.reduce((acc, unit) => {
        acc[unit.id] = unit;
        return acc;
      }, {}),
    [units]
  );

  if (!contact) {
    return (
      <div className="px-4 md:px-6 max-w-4xl mx-auto py-6" dir="rtl">
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
    <div className="px-4 md:px-6 max-w-4xl mx-auto py-4" dir="rtl">
      <div className="text-sm text-[var(--color-muted)] mb-3">
        <button type="button" onClick={() => navigate('/contacts')} className="hover:underline">
          العملاء
        </button>
        <span className="mx-2">/</span>
        <span>{contact.name}</span>
      </div>

      <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4 md:p-5 shadow-sm mb-4">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <span className="text-[var(--color-primary)]" aria-hidden="true">
              <Icons.contacts size={30} />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="text-xl md:text-2xl font-bold text-[var(--color-text)]">
                  {contact.name}
                </h1>
                <Badge color="blue">{getContactTypeLabel(contact.type)}</Badge>
              </div>
              <p className="text-sm text-[var(--color-muted)]">
                {contact.companyName || 'جهة اتصال فردية'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/contacts')}
            className="px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm text-[var(--color-text)]"
          >
            رجوع للقائمة
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
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

      <section className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 mb-4">
        <h2 className="font-bold text-[var(--color-text)] mb-3">بيانات العميل</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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

      <section className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 mb-4">
        <h2 className="font-bold text-[var(--color-text)] mb-3">العقارات المرتبطة</h2>
        {ownedProperties.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {ownedProperties.map((property) => (
              <button
                key={property.id}
                type="button"
                onClick={() => navigate(`/properties/${property.id}`)}
                className="text-right rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4 hover:border-[var(--color-primary)] transition-colors"
              >
                <div className="font-medium text-[var(--color-text)]">{property.name}</div>
                <div className="text-sm text-[var(--color-muted)] mt-1">
                  {property.city || '—'}
                  {property.district ? `، ${property.district}` : ''}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-sm text-[var(--color-muted)]">لا توجد عقارات مرتبطة بهذا العميل.</div>
        )}
      </section>

      <section className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 mb-4">
        <h2 className="font-bold text-[var(--color-text)] mb-3">العقود المرتبطة</h2>
        {linkedContracts.length ? (
          <div className="space-y-3">
            {linkedContracts.map((contract) => (
              <button
                key={contract.id}
                type="button"
                onClick={() => navigate(`/contracts/${contract.id}`)}
                className="w-full text-right rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4 hover:border-[var(--color-primary)] transition-colors"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium text-[var(--color-text)]">
                      {getContractTypeLabel(contract.type)}
                    </div>
                    <div className="text-sm text-[var(--color-muted)] mt-1">
                      {properties.find((property) => property.id === (contract.propertyId || contract.property_id))
                        ?.name || '—'}
                      {unitsById[contract.unitId || contract.unit_id]
                        ? ` — ${unitsById[contract.unitId || contract.unit_id].name}`
                        : ''}
                    </div>
                  </div>
                  <Badge color={getContractStatusColor(contract.status)}>
                    {getContractStatusLabel(contract.status)}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm text-[var(--color-muted)]">
                  <span>رقم العقد: {contract.contractNumber || '—'}</span>
                  <span>
                    الإيجار الشهري:{' '}
                    {contract.monthlyRent ? `${formatCurrency(safeNum(contract.monthlyRent))} ر.س` : '—'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-sm text-[var(--color-muted)]">لا توجد عقود مرتبطة بهذا العميل.</div>
        )}
      </section>

      <section className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4">
        <h2 className="font-bold text-[var(--color-text)] mb-3">ملاحظات</h2>
        <div className="text-sm text-[var(--color-text)] whitespace-pre-wrap">
          {contact.notes || 'لا توجد ملاحظات على هذا العميل.'}
        </div>
      </section>
    </div>
  );
}
