/**
 * لوحة التحكم — SPR-018: المرحلة 3 (تحسين شامل + توافق الوضع الليلي)
 * عرض شامل لحالة المكتب العقاري: عقارات، عملاء، عقود، مالية.
 * جميع الألوان تستخدم CSS Variables للتوافق مع Light/Dim/Dark.
 */
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext.jsx';
import { Icons } from '../ui/ui-common.jsx';
import { formatCurrency } from '../utils/format.jsx';
import { computePropertiesSummary } from '../domain/properties.js';
import { computeContactsSummary } from '../domain/contacts.js';
import { computeContractsSummary, daysRemaining } from '../domain/contracts.js';

// ═══════════════════════════════════════
// بطاقة KPI تفاعلية — ألوان عبر CSS Variables
// ═══════════════════════════════════════
function KpiCard({ label, value, subtitle, icon, colorVar = '--color-info', onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 shadow-sm text-right w-full hover:shadow-md transition-all group"
      style={{ '--_accent': `var(${colorVar})` }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-[var(--color-muted)] group-hover:text-[var(--color-text)] transition-colors">
          {label}
        </span>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: `var(${colorVar}-bg)`, color: `var(${colorVar})` }}
        >
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-[var(--color-text)]">{value}</div>
      {subtitle && <p className="text-xs text-[var(--color-muted)] mt-1">{subtitle}</p>}
    </button>
  );
}

// ═══════════════════════════════════════
// بطاقة اختصار سريع
// ═══════════════════════════════════════
function QuickAction({ label, icon: ActionIcon, onClick, description }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] transition-all text-right w-full group"
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
        style={{ background: 'var(--color-info-bg)', color: 'var(--color-info)' }}
      >
        <ActionIcon size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <span className="text-sm font-medium text-[var(--color-text)] block">{label}</span>
        {description && <span className="text-xs text-[var(--color-muted)]">{description}</span>}
      </div>
    </button>
  );
}

// ═══════════════════════════════════════
// شريط حالة العقود المصغر
// ═══════════════════════════════════════
function ContractStatusBar({ summary }) {
  const total = summary.total || 1;
  const segments = [
    { count: summary.activeCount, cssVar: '--color-success', label: 'ساري' },
    { count: summary.expiredCount, cssVar: '--color-danger', label: 'منتهي' },
    { count: summary.expiringSoon, cssVar: '--color-warning', label: 'ينتهي قريباً' },
    {
      count: total - summary.activeCount - summary.expiredCount - summary.expiringSoon,
      cssVar: '--color-muted',
      label: 'أخرى',
    },
  ].filter((s) => s.count > 0);

  return (
    <div>
      <div
        className="flex rounded-full overflow-hidden h-2 mb-2"
        style={{ background: 'var(--color-border)' }}
      >
        {segments.map((s, i) => (
          <div
            key={i}
            className="transition-all"
            style={{ width: `${(s.count / total) * 100}%`, background: `var(${s.cssVar})` }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-[var(--color-muted)]">
        {segments.map((s, i) => (
          <span key={i} className="flex items-center gap-1">
            <span
              className="w-2 h-2 rounded-full inline-block"
              style={{ background: `var(${s.cssVar})` }}
            />
            {s.label} ({s.count})
          </span>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// قسم تنبيهات العقود
// ═══════════════════════════════════════
function ContractAlerts({ contracts, properties, contacts, navigate }) {
  const alerts = useMemo(() => {
    const list = [];
    const propMap = new Map((properties || []).map((p) => [p.id, p.name]));
    const contactMap = new Map((contacts || []).map((c) => [c.id, c.name]));

    for (const c of contracts || []) {
      if (c.status !== 'active') continue;
      const endDate = c.endDate || c.end_date || '';
      if (!endDate) continue;
      const remaining = daysRemaining(endDate);
      if (remaining === null) continue;
      const propName = propMap.get(c.propertyId || c.property_id) || 'عقار';
      const contactName = contactMap.get(c.contactId || c.contact_id) || '';
      if (remaining <= 0) {
        list.push({ id: c.id, type: 'expired', days: Math.abs(remaining), propName, contactName });
      } else if (remaining <= 30) {
        list.push({ id: c.id, type: 'expiring', days: remaining, propName, contactName });
      }
    }
    list.sort((a, b) => {
      if (a.type === 'expired' && b.type !== 'expired') return -1;
      if (a.type !== 'expired' && b.type === 'expired') return 1;
      return a.days - b.days;
    });
    return list.slice(0, 5);
  }, [contracts, properties, contacts]);

  if (alerts.length === 0) return null;

  return (
    <section className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-[var(--color-text)] flex items-center gap-2">
          <span
            className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold"
            style={{ background: 'var(--color-warning-bg)', color: 'var(--color-warning)' }}
          >
            !
          </span>
          تنبيهات العقود
        </h3>
        <button
          type="button"
          onClick={() => navigate('/contracts')}
          className="text-xs font-medium"
          style={{ color: 'var(--color-info)' }}
        >
          عرض الكل
        </button>
      </div>
      <div className="space-y-1">
        {alerts.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => navigate('/contracts')}
            className="w-full text-right flex items-center justify-between gap-3 p-3 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[var(--color-text)] truncate">
                {a.propName}
                {a.contactName ? ` — ${a.contactName}` : ''}
              </p>
              <p
                className="text-xs mt-0.5"
                style={{
                  color: a.type === 'expired' ? 'var(--color-danger)' : 'var(--color-warning)',
                }}
              >
                {a.type === 'expired' ? `منتهي منذ ${a.days} يوم` : `ينتهي خلال ${a.days} يوم`}
              </p>
            </div>
            <span
              className="flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium"
              style={{
                background:
                  a.type === 'expired' ? 'var(--color-danger-bg)' : 'var(--color-warning-bg)',
                color: a.type === 'expired' ? 'var(--color-danger)' : 'var(--color-warning)',
              }}
            >
              {a.type === 'expired' ? 'منتهي' : 'قريباً'}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════
// آخر العملاء المضافين
// ═══════════════════════════════════════
function RecentContacts({ contacts, navigate }) {
  const recent = useMemo(() => (contacts || []).slice(0, 5), [contacts]);
  if (recent.length === 0) return null;

  return (
    <section className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-[var(--color-text)]">آخر العملاء</h3>
        <button
          type="button"
          onClick={() => navigate('/contacts')}
          className="text-xs font-medium"
          style={{ color: 'var(--color-info)' }}
        >
          عرض الكل
        </button>
      </div>
      <div className="space-y-1">
        {recent.map((c) => (
          <div
            key={c.id}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors"
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{ background: 'var(--color-info-bg)', color: 'var(--color-info)' }}
            >
              {(c.name || '?').charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[var(--color-text)] truncate">{c.name}</p>
              <p className="text-xs text-[var(--color-muted)]">{c.phone || c.email || '—'}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════
// آخر العقارات المضافة
// ═══════════════════════════════════════
function RecentProperties({ properties, navigate }) {
  const recent = useMemo(() => (properties || []).slice(0, 4), [properties]);
  if (recent.length === 0) return null;

  return (
    <section className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-[var(--color-text)]">آخر العقارات</h3>
        <button
          type="button"
          onClick={() => navigate('/properties')}
          className="text-xs font-medium"
          style={{ color: 'var(--color-info)' }}
        >
          عرض الكل
        </button>
      </div>
      <div className="space-y-1">
        {recent.map((p) => {
          const statusColor =
            p.status === 'available'
              ? '--color-success'
              : p.status === 'rented'
                ? '--color-info'
                : p.status === 'maintenance'
                  ? '--color-warning'
                  : '--color-muted';
          return (
            <div
              key={p.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-[var(--color-bg)] flex items-center justify-center text-lg flex-shrink-0">
                {p.type === 'building'
                  ? '🏢'
                  : p.type === 'villa'
                    ? '🏡'
                    : p.type === 'land'
                      ? '🗺️'
                      : '🏠'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[var(--color-text)] truncate">{p.name}</p>
                <p className="text-xs text-[var(--color-muted)]">
                  {p.city || ''}
                  {p.monthlyRent ? ` — ${formatCurrency(Number(p.monthlyRent))} ر.س` : ''}
                </p>
              </div>
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: `var(${statusColor})` }}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════
// الصفحة الرئيسية
// ═══════════════════════════════════════
export default function DashboardPage({ setPage }) {
  const navigate = useNavigate();
  const {
    properties,
    contacts,
    contracts,
    transactions,
    propertiesLoading,
    contactsLoading,
    contractsLoading,
  } = useData();

  const propSummary = useMemo(() => computePropertiesSummary(properties), [properties]);
  const contactSummary = useMemo(() => computeContactsSummary(contacts), [contacts]);
  const contractSummary = useMemo(() => computeContractsSummary(contracts), [contracts]);

  const financialSummary = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoff = thirtyDaysAgo.toISOString().split('T')[0];
    const recent = (transactions || []).filter((t) => (t.date || '') >= cutoff);
    const income = recent
      .filter((t) => t.type === 'income')
      .reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const expense = recent
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + (Number(t.amount) || 0), 0);
    return { income, expense, net: income - expense };
  }, [transactions]);

  const isLoading = propertiesLoading || contactsLoading || contractsLoading;
  const isEmpty = properties.length === 0 && contacts.length === 0 && contracts.length === 0;

  return (
    <div className="px-4 md:px-6 max-w-5xl mx-auto py-4" dir="rtl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-text)]">لوحة التحكم</h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">نظرة شاملة على مكتبك العقاري</p>
      </div>

      {/* حالة التحميل */}
      {isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 shadow-sm animate-pulse"
            >
              <div
                className="h-3 rounded w-20 mb-3"
                style={{ background: 'var(--color-border)' }}
              />
              <div className="h-6 rounded w-12" style={{ background: 'var(--color-border)' }} />
            </div>
          ))}
        </div>
      )}

      {/* حالة فارغة — ترحيب */}
      {isEmpty && !isLoading && (
        <div
          className="rounded-2xl p-6 md:p-8 text-center mb-6 border"
          style={{ background: 'var(--color-info-bg)', borderColor: 'var(--color-border)' }}
        >
          <div
            className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'var(--color-info-bg)' }}
          >
            <Icons.properties size={32} style={{ color: 'var(--color-info)' }} />
          </div>
          <h2 className="text-xl font-bold text-[var(--color-text)] mb-2">
            مرحباً بك في قيد العقار
          </h2>
          <p className="text-sm text-[var(--color-muted)] mb-6 max-w-md mx-auto">
            ابدأ بإضافة عقاراتك وعملائك، ثم أنشئ عقوداً لربطهم وتتبع كل شيء من مكان واحد.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto">
            <button
              type="button"
              onClick={() => navigate('/properties')}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-colors"
              style={{ background: 'var(--color-info)', color: '#fff' }}
            >
              <Icons.properties size={16} /> أضف عقار
            </button>
            <button
              type="button"
              onClick={() => navigate('/contacts')}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--color-surface)] text-sm font-medium border border-[var(--color-border)] transition-colors"
              style={{ color: 'var(--color-info)' }}
            >
              <Icons.contacts size={16} /> أضف عميل
            </button>
            <button
              type="button"
              onClick={() => navigate('/contracts')}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--color-surface)] text-sm font-medium border border-[var(--color-border)] transition-colors"
              style={{ color: 'var(--color-info)' }}
            >
              <Icons.contracts size={16} /> أضف عقد
            </button>
          </div>
        </div>
      )}

      {/* المحتوى الرئيسي */}
      {!isEmpty && !isLoading && (
        <>
          {/* بطاقات KPI */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <KpiCard
              label="العقارات"
              value={propSummary.total}
              subtitle={
                propSummary.availableCount > 0 ? `${propSummary.availableCount} متاح` : undefined
              }
              icon={<Icons.properties size={16} />}
              colorVar="--color-info"
              onClick={() => navigate('/properties')}
            />
            <KpiCard
              label="العملاء"
              value={contactSummary.total}
              subtitle={
                contactSummary.tenantCount > 0 ? `${contactSummary.tenantCount} مستأجر` : undefined
              }
              icon={<Icons.contacts size={16} />}
              colorVar="--color-accent"
              onClick={() => navigate('/contacts')}
            />
            <KpiCard
              label="عقود سارية"
              value={contractSummary.activeCount}
              subtitle={
                contractSummary.expiringSoon > 0
                  ? `${contractSummary.expiringSoon} ينتهي قريباً`
                  : undefined
              }
              icon={<Icons.contracts size={16} />}
              colorVar="--color-success"
              onClick={() => navigate('/contracts')}
            />
            <KpiCard
              label="الإيجار الشهري"
              value={`${formatCurrency(contractSummary.totalMonthlyRent)}`}
              subtitle="ر.س"
              icon={<Icons.commissions size={16} />}
              colorVar="--color-warning"
              onClick={() => navigate('/contracts')}
            />
          </div>

          {/* ملخص مالي + شريط حالة العقود */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 shadow-sm">
              <h3 className="text-sm font-bold text-[var(--color-text)] mb-3">
                الملخص المالي (30 يوم)
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p className="text-xs text-[var(--color-muted)] mb-1">الدخل</p>
                  <p className="text-base font-bold" style={{ color: 'var(--color-success)' }}>
                    {formatCurrency(financialSummary.income)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-[var(--color-muted)] mb-1">المصروفات</p>
                  <p className="text-base font-bold" style={{ color: 'var(--color-danger)' }}>
                    {formatCurrency(financialSummary.expense)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-[var(--color-muted)] mb-1">الصافي</p>
                  <p
                    className="text-base font-bold"
                    style={{
                      color:
                        financialSummary.net >= 0 ? 'var(--color-success)' : 'var(--color-danger)',
                    }}
                  >
                    {financialSummary.net >= 0 ? '+' : '-'}
                    {formatCurrency(Math.abs(financialSummary.net))}
                  </p>
                </div>
              </div>
            </div>

            {contractSummary.total > 0 && (
              <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 shadow-sm">
                <h3 className="text-sm font-bold text-[var(--color-text)] mb-3">حالة العقود</h3>
                <ContractStatusBar summary={contractSummary} />
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--color-border)]">
                  <span className="text-xs text-[var(--color-muted)]">
                    الإجمالي: {contractSummary.total} عقد
                  </span>
                  <button
                    type="button"
                    onClick={() => navigate('/contracts')}
                    className="text-xs font-medium"
                    style={{ color: 'var(--color-info)' }}
                  >
                    التفاصيل
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* الاختصارات السريعة */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <QuickAction
              label="إضافة عقار"
              description="سجّل عقار جديد"
              icon={Icons.properties}
              onClick={() => navigate('/properties')}
            />
            <QuickAction
              label="إضافة عميل"
              description="مستأجر أو مالك"
              icon={Icons.contacts}
              onClick={() => navigate('/contacts')}
            />
            <QuickAction
              label="إضافة عقد"
              description="اربط عقار بعميل"
              icon={Icons.contracts}
              onClick={() => navigate('/contracts')}
            />
            <QuickAction
              label="إضافة حركة"
              description="دخل أو مصروف"
              icon={Icons.plus}
              onClick={() => navigate('/transactions')}
            />
          </div>

          {/* تنبيهات + آخر العملاء + آخر العقارات */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <ContractAlerts
              contracts={contracts}
              properties={properties}
              contacts={contacts}
              navigate={navigate}
            />
            <RecentContacts contacts={contacts} navigate={navigate} />
            <RecentProperties properties={properties} navigate={navigate} />
          </div>
        </>
      )}
    </div>
  );
}
