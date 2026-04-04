/**
 * لوحة التحكم — v4: يستخدم panel-card من design system + db-- للـ layout
 * panel-card = border + bg + shadow + radius + padding (من المشروع)
 * db-- = grid + flex + spacing + typography (خاص بالـ dashboard)
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext.jsx';
import { Icons, Badge } from '../ui/ui-common.jsx';
import { Currency, formatCurrency } from '../utils/format.jsx';
import { computePropertiesSummary } from '../domain/properties.js';
import { computeContactsSummary } from '../domain/contacts.js';
import { computeContractsSummary, daysRemaining } from '../domain/contracts.js';
import { buildOperationalDues, getExpiringContracts } from '../domain/dues.js';
import ContractQuickPaymentModal from '../ui/ContractQuickPaymentModal.jsx';

/* ═══ KPI Card ═══ */
function KpiCard({ label, value, subtitle, icon, colorVar = '--color-info', onClick }) {
  return (
    <button type="button" onClick={onClick} className="panel-card db--kpi">
      <div className="db--kpi__head">
        <span className="db--kpi__label">{label}</span>
        <span
          className="db--kpi__icon"
          style={{ background: `var(${colorVar}-bg)`, color: `var(${colorVar})` }}
        >
          {icon}
        </span>
      </div>
      <span className="db--kpi__value">{value}</span>
      {subtitle && <span className="db--kpi__sub">{subtitle}</span>}
    </button>
  );
}

/* ═══ Quick Action ═══ */
function QuickAction({ label, icon: Ic, onClick, description }) {
  return (
    <button type="button" onClick={onClick} className="db--action">
      <span className="db--action__icon">
        <Ic size={18} />
      </span>
      <span className="db--action__body">
        <span className="db--action__title">{label}</span>
        {description && <span className="db--action__desc">{description}</span>}
      </span>
    </button>
  );
}

/* ═══ Contract Status Bar ═══ */
function ContractStatusBar({ summary }) {
  const total = summary.total || 1;
  const segs = [
    { count: summary.activeCount, v: '--color-success', l: 'ساري' },
    { count: summary.expiredCount, v: '--color-danger', l: 'منتهي' },
    { count: summary.expiringSoon, v: '--color-warning', l: 'ينتهي قريباً' },
    {
      count: total - summary.activeCount - summary.expiredCount - summary.expiringSoon,
      v: '--color-muted',
      l: 'أخرى',
    },
  ].filter((s) => s.count > 0);
  return (
    <div className="db--statusbar">
      <div className="db--statusbar__track">
        {segs.map((s, i) => (
          <div
            key={i}
            className="db--statusbar__seg"
            style={{ width: `${(s.count / total) * 100}%`, background: `var(${s.v})` }}
          />
        ))}
      </div>
      <div className="db--statusbar__legend">
        {segs.map((s, i) => (
          <span key={i} className="db--statusbar__item">
            <span className="db--dot" style={{ background: `var(${s.v})` }} />
            {s.l} ({s.count})
          </span>
        ))}
      </div>
    </div>
  );
}

/* ═══ Contract Alerts ═══ */
function ContractAlerts({ contracts, properties, contacts, navigate }) {
  const alerts = useMemo(() => {
    const list = [];
    const pm = new Map((properties || []).map((p) => [p.id, p.name]));
    const cm = new Map((contacts || []).map((c) => [c.id, c.name]));
    for (const c of contracts || []) {
      if (c.status !== 'active') continue;
      const ed = c.endDate || c.end_date || '';
      if (!ed) continue;
      const rem = daysRemaining(ed);
      if (rem === null) continue;
      const pn = pm.get(c.propertyId || c.property_id) || 'عقار';
      const cn = cm.get(c.contactId || c.contact_id) || '';
      if (rem <= 0) list.push({ id: c.id, type: 'expired', days: Math.abs(rem), pn, cn });
      else if (rem <= 30) list.push({ id: c.id, type: 'expiring', days: rem, pn, cn });
    }
    list.sort((a, b) => (a.type === 'expired' ? -1 : b.type === 'expired' ? 1 : a.days - b.days));
    return list.slice(0, 5);
  }, [contracts, properties, contacts]);

  return (
    <div className="panel-card db--card">
      <div className="db--card__head">
        <h3 className="db--card__title">تنبيهات العقود</h3>
        <button type="button" onClick={() => navigate('/contracts')} className="db--link">
          عرض الكل
        </button>
      </div>
      {alerts.length === 0 ? (
        <p className="db--empty">لا توجد تنبيهات — كل العقود مستقرة</p>
      ) : (
        <div className="db--rows">
          {alerts.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => navigate('/contracts')}
              className="db--row"
            >
              <span className="db--row__body">
                <span className="db--row__title">
                  {a.pn}
                  {a.cn ? ` — ${a.cn}` : ''}
                </span>
                <span
                  className="db--row__meta"
                  style={{
                    color: a.type === 'expired' ? 'var(--color-danger)' : 'var(--color-warning)',
                  }}
                >
                  {a.type === 'expired' ? `منتهي منذ ${a.days} يوم` : `ينتهي خلال ${a.days} يوم`}
                </span>
              </span>
              <Badge color={a.type === 'expired' ? 'red' : 'yellow'}>
                {a.type === 'expired' ? 'منتهي' : 'قريباً'}
              </Badge>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══ Recent Contacts ═══ */
function RecentContacts({ contacts, navigate }) {
  const recent = useMemo(() => (contacts || []).slice(0, 5), [contacts]);
  return (
    <div className="panel-card db--card">
      <div className="db--card__head">
        <h3 className="db--card__title">آخر العملاء</h3>
        <button type="button" onClick={() => navigate('/contacts')} className="db--link">
          {recent.length > 0 ? 'عرض الكل' : 'إضافة عميل'}
        </button>
      </div>
      {recent.length === 0 ? (
        <p className="db--empty">لا يوجد عملاء بعد</p>
      ) : (
        <div className="db--rows">
          {recent.map((c) => (
            <div key={c.id} className="db--row">
              <span
                className="db--avatar"
                style={{ background: 'var(--color-info-bg)', color: 'var(--color-info)' }}
              >
                {(c.name || '?').charAt(0)}
              </span>
              <span className="db--row__body">
                <span className="db--row__title">{c.name}</span>
                <span className="db--row__meta">{c.phone || c.email || '—'}</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══ Recent Properties ═══ */
function RecentProperties({ properties, navigate }) {
  const recent = useMemo(() => (properties || []).slice(0, 4), [properties]);
  return (
    <div className="panel-card db--card">
      <div className="db--card__head">
        <h3 className="db--card__title">آخر العقارات</h3>
        <button type="button" onClick={() => navigate('/properties')} className="db--link">
          {recent.length > 0 ? 'عرض الكل' : 'إضافة عقار'}
        </button>
      </div>
      {recent.length === 0 ? (
        <p className="db--empty">لا يوجد عقارات بعد</p>
      ) : (
        <div className="db--rows">
          {recent.map((p) => {
            const sc =
              p.status === 'available'
                ? '--color-success'
                : p.status === 'rented'
                  ? '--color-info'
                  : p.status === 'maintenance'
                    ? '--color-warning'
                    : '--color-muted';
            return (
              <div key={p.id} className="db--row">
                <span
                  className="db--avatar"
                  style={{ background: 'var(--color-surface-alt)', color: 'var(--color-primary)' }}
                >
                  <Icons.properties size={14} />
                </span>
                <span className="db--row__body">
                  <span className="db--row__title">{p.name}</span>
                  <span className="db--row__meta">
                    {p.city || ''}
                    {p.monthlyRent ? ` — ${formatCurrency(Number(p.monthlyRent))}` : ''}
                  </span>
                </span>
                <span className="db--dot" style={{ background: `var(${sc})` }} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ═══ Due Action Row ═══ */
function DueActionRow({ due, navigate, onQuickPay }) {
  const dc =
    due.status === 'overdue'
      ? 'var(--color-danger)'
      : due.status === 'partial'
        ? 'var(--color-warning)'
        : 'var(--color-info)';
  return (
    <div className="db--row">
      <button type="button" onClick={() => navigate(due.actionTarget)} className="db--row__link">
        <span className="db--dot" style={{ background: dc }} />
        <span className="db--row__body">
          <span className="db--row__title">
            {due.tenantName || 'بدون اسم'}
            {due.propertyName ? ` — ${due.propertyName}` : ''}
            {due.unitName ? ` / ${due.unitName}` : ''}
          </span>
          <span className="db--row__meta">
            {due.contractNumber ? `عقد ${due.contractNumber} · ` : ''}
            {due.daysOverdue > 0
              ? `متأخر ${due.daysOverdue} يوم`
              : due.daysUntil === 0
                ? 'مستحق اليوم'
                : `بعد ${due.daysUntil} يوم`}
          </span>
        </span>
        <span
          className="db--row__amount"
          style={{
            color:
              due.status === 'overdue' || due.status === 'partial'
                ? 'var(--color-danger)'
                : 'var(--color-text-primary)',
          }}
        >
          {formatCurrency(due.remainingAmount)}
        </span>
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onQuickPay(due);
        }}
        className="db--link"
        title="تسجيل دفعة سريعة"
      >
        سجّل
      </button>
    </div>
  );
}

/* ═══ Today Actions ═══ */
function TodayActions({ operationalDues, expiringContracts, navigate, onQuickPay }) {
  const { overdue, dueToday, dueThisWeek, summary } = operationalDues;
  const hasActions =
    overdue.length > 0 ||
    dueToday.length > 0 ||
    dueThisWeek.length > 0 ||
    expiringContracts.length > 0;
  const total = summary.overdueCount + summary.dueTodayCount + summary.dueThisWeekCount;

  return (
    <div className="panel-card db--card db--priority">
      <div className="db--card__head">
        <h3 className="db--card__title">إجراءات اليوم ({total})</h3>
        <button type="button" onClick={() => navigate('/inbox')} className="db--link">
          عرض الكل
        </button>
      </div>
      {!hasActions && (
        <p className="db--empty">لا توجد مستحقات أو عقود تنتهي قريباً — كل شيء تحت السيطرة</p>
      )}
      {hasActions && (
        <>
          {(summary.overdueTotal > 0 || summary.dueTodayTotal > 0) && (
            <div className="db--chips">
              {summary.overdueTotal > 0 && (
                <div className="db--chip">
                  <span className="db--chip__label">متأخر</span>
                  <span className="db--chip__val" style={{ color: 'var(--color-danger)' }}>
                    {formatCurrency(summary.overdueTotal)}
                  </span>
                </div>
              )}
              {summary.dueTodayTotal > 0 && (
                <div className="db--chip">
                  <span className="db--chip__label">مستحق اليوم</span>
                  <span className="db--chip__val" style={{ color: 'var(--color-warning)' }}>
                    {formatCurrency(summary.dueTodayTotal)}
                  </span>
                </div>
              )}
              {summary.dueThisWeekTotal > 0 && (
                <div className="db--chip">
                  <span className="db--chip__label">هذا الأسبوع</span>
                  <span className="db--chip__val" style={{ color: 'var(--color-info)' }}>
                    {formatCurrency(summary.dueThisWeekTotal)}
                  </span>
                </div>
              )}
            </div>
          )}
          {overdue.length > 0 && (
            <div className="db--group">
              <p className="db--group__label" style={{ color: 'var(--color-danger)' }}>
                متأخرات ({overdue.length})
              </p>
              <div className="db--rows">
                {overdue.slice(0, 5).map((d) => (
                  <DueActionRow key={d.dueId} due={d} navigate={navigate} onQuickPay={onQuickPay} />
                ))}
                {overdue.length > 5 && (
                  <button
                    type="button"
                    onClick={() => navigate('/inbox')}
                    className="db--link db--more"
                  >
                    +{overdue.length - 5} أخرى
                  </button>
                )}
              </div>
            </div>
          )}
          {dueToday.length > 0 && (
            <div className="db--group">
              <p className="db--group__label" style={{ color: 'var(--color-warning)' }}>
                مستحق اليوم ({dueToday.length})
              </p>
              <div className="db--rows">
                {dueToday.map((d) => (
                  <DueActionRow key={d.dueId} due={d} navigate={navigate} onQuickPay={onQuickPay} />
                ))}
              </div>
            </div>
          )}
          {dueThisWeek.length > 0 && (
            <div className="db--group">
              <p className="db--group__label" style={{ color: 'var(--color-info)' }}>
                هذا الأسبوع ({dueThisWeek.length})
              </p>
              <div className="db--rows">
                {dueThisWeek.slice(0, 3).map((d) => (
                  <DueActionRow key={d.dueId} due={d} navigate={navigate} onQuickPay={onQuickPay} />
                ))}
                {dueThisWeek.length > 3 && (
                  <button
                    type="button"
                    onClick={() => navigate('/inbox')}
                    className="db--link db--more"
                  >
                    +{dueThisWeek.length - 3} أخرى
                  </button>
                )}
              </div>
            </div>
          )}
          {expiringContracts.length > 0 && (
            <div className="db--group db--group--bordered">
              <p className="db--group__label" style={{ color: 'var(--color-warning)' }}>
                عقود تنتهي قريباً ({expiringContracts.length})
              </p>
              <div className="db--rows">
                {expiringContracts.slice(0, 3).map((c) => (
                  <button
                    key={c.contractId}
                    type="button"
                    onClick={() => navigate(c.actionTarget)}
                    className="db--row"
                  >
                    <span className="db--row__body">
                      <span className="db--row__title">
                        {c.propertyName}
                        {c.tenantName ? ` — ${c.tenantName}` : ''}
                      </span>
                      <span className="db--row__meta">
                        {c.contractNumber ? `عقد ${c.contractNumber} · ` : ''}ينتهي خلال{' '}
                        {c.daysRemaining} يوم
                      </span>
                    </span>
                    <Badge color="yellow">قريباً</Badge>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   Main Page
   ═══════════════════════════════════════ */
export default function DashboardPage() {
  const navigate = useNavigate();
  const {
    properties,
    contacts,
    contracts,
    contractPayments,
    units,
    transactions,
    propertiesLoading,
    contactsLoading,
    contractsLoading,
  } = useData();
  const [quickPayDue, setQuickPayDue] = useState(null);

  const propSum = useMemo(() => computePropertiesSummary(properties), [properties]);
  const conSum = useMemo(() => computeContactsSummary(contacts), [contacts]);
  const ctrSum = useMemo(() => computeContractsSummary(contracts), [contracts]);
  const opDues = useMemo(
    () => buildOperationalDues({ contracts, contractPayments, contacts, properties, units }),
    [contracts, contractPayments, contacts, properties, units]
  );
  const expCtr = useMemo(
    () =>
      getExpiringContracts({
        contracts,
        contacts,
        properties,
        thresholdDays: 30,
        referenceDate: new Date(),
      }),
    [contracts, contacts, properties]
  );
  const finSum = useMemo(() => {
    const now = new Date();
    const ago = new Date(now);
    ago.setDate(ago.getDate() - 30);
    const cut = ago.toISOString().split('T')[0];
    const rec = (transactions || []).filter((t) => (t.date || '') >= cut);
    const inc = rec
      .filter((t) => t.type === 'income')
      .reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const exp = rec
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + (Number(t.amount) || 0), 0);
    return { income: inc, expense: exp, net: inc - exp };
  }, [transactions]);

  const isLoading = propertiesLoading || contactsLoading || contractsLoading;
  const hasData = properties.length > 0 || contacts.length > 0 || contracts.length > 0;
  const hasUrg =
    opDues.overdue.length > 0 ||
    opDues.dueToday.length > 0 ||
    opDues.dueThisWeek.length > 0 ||
    expCtr.length > 0;

  return (
    <div className="db--page" dir="rtl">
      {/* Header */}
      <header className="db--header">
        <h1 className="db--header__title">لوحة التحكم</h1>
        <p className="db--header__sub">
          {!hasData
            ? 'مرحباً بك — ابدأ بإضافة بياناتك أو حمّل بيانات تجريبية من الإعدادات.'
            : hasUrg
              ? 'هناك عناصر تحتاج متابعة اليوم.'
              : 'الوضع مستقر — لا مستحقات عاجلة.'}
        </p>
      </header>

      {/* Loading */}
      {isLoading && (
        <div className="db--kpis">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="panel-card db--kpi db--kpi--skeleton">
              <div className="db--skel-line db--skel-line--sm" />
              <div className="db--skel-line db--skel-line--lg" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && (
        <>
          {/* 1. KPIs */}
          <section className="db--kpis">
            <KpiCard
              label="العقارات"
              value={propSum.total}
              subtitle={
                propSum.availableCount > 0 ? `${propSum.availableCount} متاح` : 'لا عقارات بعد'
              }
              icon={<Icons.properties size={16} />}
              colorVar="--color-info"
              onClick={() => navigate('/properties')}
            />
            <KpiCard
              label="العملاء"
              value={conSum.total}
              subtitle={conSum.tenantCount > 0 ? `${conSum.tenantCount} مستأجر` : 'لا عملاء بعد'}
              icon={<Icons.contacts size={16} />}
              colorVar="--color-accent"
              onClick={() => navigate('/contacts')}
            />
            <KpiCard
              label="عقود سارية"
              value={ctrSum.activeCount}
              subtitle={
                ctrSum.expiringSoon > 0 ? `${ctrSum.expiringSoon} ينتهي قريباً` : 'لا عقود سارية'
              }
              icon={<Icons.contracts size={16} />}
              colorVar="--color-success"
              onClick={() => navigate('/contracts')}
            />
            <KpiCard
              label="الإيجار الشهري"
              value={<Currency value={ctrSum.totalMonthlyRent} />}
              subtitle={ctrSum.total > 0 ? `${ctrSum.total} عقد إجمالي` : 'لا إيجارات'}
              icon={<Icons.commissions size={16} />}
              colorVar="--color-warning"
              onClick={() => navigate('/contracts')}
            />
          </section>

          {/* 2. Priority + Quick Actions */}
          <section className="db--split">
            <div className="db--split__main">
              <TodayActions
                operationalDues={opDues}
                expiringContracts={expCtr}
                navigate={navigate}
                onQuickPay={setQuickPayDue}
              />
            </div>
            <aside className="db--split__side">
              <div className="panel-card db--card">
                <div className="db--card__head">
                  <h3 className="db--card__title">إجراءات سريعة</h3>
                </div>
                <div className="db--actions">
                  <QuickAction
                    label="إضافة عقار"
                    description="سجّل أصل جديد"
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
                    description="ربط عقار بعميل"
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
              </div>
            </aside>
          </section>

          {/* 3. Financial + Contracts */}
          <section className="db--pair">
            <div className="panel-card db--card">
              <div className="db--card__head">
                <h3 className="db--card__title">الملخص المالي</h3>
                <span className="db--badge">آخر 30 يوم</span>
              </div>
              <div className="db--metrics">
                <div className="db--metric">
                  <span className="db--metric__label">الدخل</span>
                  <span className="db--metric__val" style={{ color: 'var(--color-success)' }}>
                    <Currency value={finSum.income} />
                  </span>
                </div>
                <div className="db--metric">
                  <span className="db--metric__label">المصروفات</span>
                  <span className="db--metric__val" style={{ color: 'var(--color-danger)' }}>
                    <Currency value={finSum.expense} />
                  </span>
                </div>
                <div className="db--metric">
                  <span className="db--metric__label">الصافي</span>
                  <span
                    className="db--metric__val"
                    style={{
                      color: finSum.net >= 0 ? 'var(--color-success)' : 'var(--color-danger)',
                    }}
                  >
                    {finSum.net >= 0 ? '+' : '-'}
                    <Currency value={Math.abs(finSum.net)} />
                  </span>
                </div>
              </div>
            </div>
            <div className="panel-card db--card">
              <div className="db--card__head">
                <h3 className="db--card__title">حالة العقود</h3>
                <button type="button" onClick={() => navigate('/contracts')} className="db--link">
                  {ctrSum.total > 0 ? 'التفاصيل' : 'إضافة عقد'}
                </button>
              </div>
              {ctrSum.total > 0 ? (
                <>
                  <ContractStatusBar summary={ctrSum} />
                  <div className="db--card__foot">الإجمالي: {ctrSum.total} عقد</div>
                </>
              ) : (
                <p className="db--empty">لا توجد عقود — أضف عقداً لرؤية التوزيع</p>
              )}
            </div>
          </section>

          {/* 4. Alerts + Recent */}
          <section className="db--support">
            <div className="db--support__main">
              <ContractAlerts
                contracts={contracts}
                properties={properties}
                contacts={contacts}
                navigate={navigate}
              />
            </div>
            <div className="db--support__side">
              <RecentContacts contacts={contacts} navigate={navigate} />
              <RecentProperties properties={properties} navigate={navigate} />
            </div>
          </section>
        </>
      )}

      {quickPayDue && (
        <ContractQuickPaymentModal dueItem={quickPayDue} onClose={() => setQuickPayDue(null)} />
      )}
    </div>
  );
}
