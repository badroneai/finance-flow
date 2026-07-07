/**
 * صفحة العمولات — shell. CRUD + فلاتر + دفعات + تقارير + تصدير.
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useData } from '../contexts/DataContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import { SummaryCard, Icons, EmptyState } from '../ui/ui-common.jsx';
import { ConfirmDialog } from '../ui/Modals.jsx';
import { Currency } from '../utils/format.jsx';
import { today, safeNum } from '../utils/helpers.js';
import { exportCommissionsCSV } from '../ui/commissions/commissions-export-utils.js';
import { EmptyCommissions } from '../ui/commissions/EmptyCommissions.jsx';
import { CommissionReports } from '../ui/commissions/CommissionReports.jsx';
import { CommissionCard } from '../ui/commissions/CommissionCard.jsx';
import { CommissionsToolbar } from '../ui/commissions/CommissionsToolbar.jsx';
import { CommissionsTable } from '../ui/commissions/CommissionsTable.jsx';
import { CommissionsPageModals } from '../ui/commissions/CommissionsPageModals.jsx';
// pdf-service يُحمّل ديناميكياً لتقليل حجم الحزمة الأولية
const loadPdfService = () => import('../core/pdf-service.js');

// ═══════════════════════════════════════
// تبويبات الصفحة
// ═══════════════════════════════════════
const TABS = [
  { id: 'list', label: 'العمولات' },
  { id: 'reports', label: 'التقارير' },
];

// ═══════════════════════════════════════
// حساب مبلغ العمولة
// ═══════════════════════════════════════
function calcCommissionAmount(dealValue, officePercent) {
  return (safeNum(dealValue, 0) * safeNum(officePercent, 0)) / 100;
}

/** الحصول على قيمة الحقل بدعم camelCase و snake_case */
function f(c, camel, snake) {
  return c[camel] ?? c[snake] ?? null;
}

// ═══════════════════════════════════════
// CommissionsPage
// ═══════════════════════════════════════
export function CommissionsPage() {
  const toast = useToast();
  const { isAgent, isOwner, isManager, isSuperAdmin, profile, office } = useAuth();
  const isAgentOnly = isAgent && !isOwner && !isManager && !isSuperAdmin;
  const {
    commissions,
    fetchCommissions,
    createCommission,
    updateCommission,
    deleteCommission,
    ledgers,
    activeLedgerId,
  } = useData();

  const [activeTab, setActiveTab] = useState('list');
  const [filters, setFilters] = useState({
    status: '',
    ledgerId: '',
    search: '',
    agent: '',
    dateFrom: '',
    dateTo: '',
    sort: 'newest',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [modal, setModal] = useState(null); // null | 'add' | commission object (edit)
  const [paymentModal, setPaymentModal] = useState(null); // null | commission object
  const [confirm, setConfirm] = useState(null);
  const [pdfExporting, setPdfExporting] = useState(false);

  // SPR-012: هل المستخدم وكيل (عرض محدود)
  const currentAgentName = profile?.full_name || profile?.fullName || '';

  // جلب أولي
  const refresh = useCallback(() => {
    fetchCommissions();
  }, [fetchCommissions]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // SPR-012: قائمة أسماء الوكلاء الفريدة (للفلتر)
  const agentNames = useMemo(() => {
    const names = new Set();
    (commissions || []).forEach((c) => {
      const name = f(c, 'agentName', 'agent_name');
      if (name) names.add(name);
    });
    return [...names].sort();
  }, [commissions]);

  // فلترة العمولات (مع دعم SPR-012: تاريخ، وكيل، ترتيب، عرض الوكيل)
  const filtered = useMemo(() => {
    let list = commissions || [];

    // SPR-012: إذا كان وكيلاً — يرى فقط عمولاته
    if (isAgentOnly && currentAgentName) {
      list = list.filter((c) => {
        const name = (f(c, 'agentName', 'agent_name') || '').toLowerCase();
        return name === currentAgentName.toLowerCase();
      });
    }

    if (filters.status) list = list.filter((c) => c.status === filters.status);
    if (filters.ledgerId)
      list = list.filter((c) => f(c, 'ledgerId', 'ledger_id') === filters.ledgerId);
    if (filters.agent) {
      list = list.filter((c) => (f(c, 'agentName', 'agent_name') || '') === filters.agent);
    }
    if (filters.search) {
      const s = filters.search.toLowerCase();
      list = list.filter(
        (c) =>
          (f(c, 'clientName', 'client_name') || '').toLowerCase().includes(s) ||
          (f(c, 'agentName', 'agent_name') || '').toLowerCase().includes(s)
      );
    }
    // SPR-012: فلتر التاريخ
    if (filters.dateFrom) {
      list = list.filter((c) => {
        const d = f(c, 'dueDate', 'due_date') || f(c, 'createdAt', 'created_at') || '';
        return d >= filters.dateFrom;
      });
    }
    if (filters.dateTo) {
      list = list.filter((c) => {
        const d = f(c, 'dueDate', 'due_date') || f(c, 'createdAt', 'created_at') || '';
        return d <= filters.dateTo + 'T23:59:59';
      });
    }

    // SPR-012: ترتيب
    const sorted = [...list];
    switch (filters.sort) {
      case 'newest':
        sorted.sort((a, b) =>
          (f(b, 'createdAt', 'created_at') || '') > (f(a, 'createdAt', 'created_at') || '') ? 1 : -1
        );
        break;
      case 'oldest':
        sorted.sort((a, b) =>
          (f(a, 'createdAt', 'created_at') || '') > (f(b, 'createdAt', 'created_at') || '') ? 1 : -1
        );
        break;
      case 'amount_desc':
        sorted.sort(
          (a, b) =>
            calcCommissionAmount(
              f(b, 'dealValue', 'deal_value'),
              f(b, 'officePercent', 'office_percent')
            ) -
            calcCommissionAmount(
              f(a, 'dealValue', 'deal_value'),
              f(a, 'officePercent', 'office_percent')
            )
        );
        break;
      case 'amount_asc':
        sorted.sort(
          (a, b) =>
            calcCommissionAmount(
              f(a, 'dealValue', 'deal_value'),
              f(a, 'officePercent', 'office_percent')
            ) -
            calcCommissionAmount(
              f(b, 'dealValue', 'deal_value'),
              f(b, 'officePercent', 'office_percent')
            )
        );
        break;
      case 'client_asc':
        sorted.sort((a, b) =>
          (f(a, 'clientName', 'client_name') || '').localeCompare(
            f(b, 'clientName', 'client_name') || '',
            'ar'
          )
        );
        break;
      default:
        break;
    }
    return sorted;
  }, [commissions, filters, isAgentOnly, currentAgentName]);

  // حساب الملخص
  const summary = useMemo(() => {
    const list =
      isAgentOnly && currentAgentName
        ? (commissions || []).filter(
            (c) =>
              (f(c, 'agentName', 'agent_name') || '').toLowerCase() ===
              currentAgentName.toLowerCase()
          )
        : commissions || [];
    let totalDue = 0;
    let totalPaid = 0;
    for (const c of list) {
      const amount = calcCommissionAmount(
        f(c, 'dealValue', 'deal_value'),
        f(c, 'officePercent', 'office_percent')
      );
      const paid = safeNum(f(c, 'paidAmount', 'paid_amount'), 0);
      if (c.status === 'paid') {
        totalPaid += amount;
      } else {
        totalDue += amount - paid;
        totalPaid += paid;
      }
    }
    return { totalDue, totalPaid, remaining: totalDue };
  }, [commissions, isAgentOnly, currentAgentName]);

  // اسم الدفتر
  const ledgerName = useCallback(
    (id) => {
      const l = (ledgers || []).find((x) => x.id === id);
      return l?.name || l?.title || '—';
    },
    [ledgers]
  );

  // حفظ عمولة (إضافة/تعديل)
  const handleSave = async (data, editId) => {
    const { error } = editId ? await updateCommission(editId, data) : await createCommission(data);
    if (error) {
      toast.error(error?.message || 'حدث خطأ أثناء الحفظ');
      return;
    }
    toast.success(editId ? 'تم تعديل العمولة بنجاح' : 'تم إضافة العمولة بنجاح');
    setModal(null);
  };

  // تسجيل دفعة
  const handlePayment = async (commissionId, paymentAmount, paymentDate) => {
    const c = (commissions || []).find((x) => x.id === commissionId);
    if (!c) return;
    const totalAmount = calcCommissionAmount(
      f(c, 'dealValue', 'deal_value'),
      f(c, 'officePercent', 'office_percent')
    );
    const currentPaid = safeNum(f(c, 'paidAmount', 'paid_amount'), 0);
    const newPaid = currentPaid + safeNum(paymentAmount, 0);
    let newStatus = 'partial';
    let paidDate = null;
    if (newPaid >= totalAmount) {
      newStatus = 'paid';
      paidDate = paymentDate || today();
    } else if (newPaid <= 0) {
      newStatus = 'pending';
    }
    const updates = { paidAmount: newPaid, status: newStatus };
    if (paidDate) updates.paidDate = paidDate;
    const { error } = await updateCommission(commissionId, updates);
    if (error) {
      toast.error(error?.message || 'حدث خطأ أثناء تسجيل الدفعة');
      return;
    }
    toast.success('تم تسجيل الدفعة بنجاح');
    setPaymentModal(null);
  };

  // حذف عمولة
  const handleDelete = (id) => {
    setConfirm({
      title: 'حذف العمولة',
      message: 'هل أنت متأكد؟ سيتم حذف هذه العمولة نهائياً.',
      onConfirm: async () => {
        const { error } = await deleteCommission(id);
        if (error) {
          toast.error(error?.message || 'حدث خطأ أثناء الحذف');
          setConfirm(null);
          return;
        }
        toast.success('تم حذف العمولة');
        setConfirm(null);
      },
    });
  };

  const resetFilters = () =>
    setFilters({
      status: '',
      ledgerId: '',
      search: '',
      agent: '',
      dateFrom: '',
      dateTo: '',
      sort: 'newest',
    });

  // ─── معالجات التصدير (للتولبار) ───
  const handleExportPdf = async () => {
    if (pdfExporting) return;
    setPdfExporting(true);
    try {
      const { exportCommissionsReport } = await loadPdfService();
      await exportCommissionsReport(
        filtered,
        { name: office?.name || office?.office_name || '' },
        filters
      );
      toast.success('تم تصدير PDF بنجاح');
    } catch (e) {
      toast.error(e?.message || 'خطأ في التصدير');
    } finally {
      setPdfExporting(false);
    }
  };

  const handleExportCsv = () => {
    exportCommissionsCSV(filtered, ledgerName);
    toast.success('تم تصدير الملف بنجاح');
  };

  // هل يمكن الكتابة (غير وكيل)
  const canWrite = !isAgentOnly;

  return (
    <div className="page-shell page-shell--wide commissions-page" dir="rtl">
      <div className="page-header">
        <div className="page-header-copy">
          <span className="page-kicker">العوائد والوساطة</span>
          <h1 className="page-title">العمولات</h1>
          <p className="page-subtitle">
            راقب المستحق والمدفوع والمتبقي بتدفق بصري أوضح، مع تصدير ومراجعة أسهل.
          </p>
        </div>
      </div>
      {/* ═══ تبويبات ═══ */}
      <div className="control-toolbar control-toolbar--segmented commissions-page__tabs commissions-page__tabs-shell">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`commissions-page__tab${activeTab === tab.id ? ' is-active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══ عرض الوكيل — شريط تنبيه ═══ */}
      {isAgentOnly && (
        <div className="panel-card commissions-page__notice">
          <Icons.info size={16} />
          <span>أنت تشاهد عمولاتك فقط (وضع الوكيل)</span>
        </div>
      )}

      {activeTab === 'list' ? (
        <>
          {/* ═══ بطاقات الملخص ═══ */}
          <div className="commissions-page__summary">
            <div className="route-summary-grid">
              <SummaryCard
                label="إجمالي المستحق"
                value={<Currency value={summary.totalDue} className="commissions-page__summary-value" />}
                color="red"
                icon={<Icons.arrowDown size={16} />}
              />
              <SummaryCard
                label="إجمالي المدفوع"
                value={<Currency value={summary.totalPaid} className="commissions-page__summary-value" />}
                color="green"
                icon={<Icons.arrowUp size={16} />}
              />
              <div className="route-summary-grid__full">
                <SummaryCard
                  label="صافي المتبقي"
                  value={<Currency value={summary.remaining} className="commissions-page__summary-value" />}
                  color={summary.remaining > 0 ? 'red' : 'green'}
                />
              </div>
            </div>
          </div>

          {/* ═══ شريط الفلاتر ═══ */}
          <CommissionsToolbar
            filters={filters}
            setFilters={setFilters}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            resultsCount={filtered.length}
            ledgers={ledgers}
            agentNames={agentNames}
            isAgentOnly={isAgentOnly}
            canWrite={canWrite}
            onAdd={() => setModal('add')}
            onExportPdf={handleExportPdf}
            onExportCsv={handleExportCsv}
            pdfExporting={pdfExporting}
          />

          {/* ═══ قائمة العمولات ═══ */}
          {filtered.length === 0 ? (
            (commissions || []).length === 0 ? (
              <EmptyCommissions onAdd={canWrite ? () => setModal('add') : null} />
            ) : (
              <EmptyState
                title="لا توجد نتائج مطابقة"
                description="غيّر الفلاتر أو أعد تعيينها لعرض العمولات المتاحة."
                actionLabel="إعادة تعيين الفلاتر"
                onAction={resetFilters}
              />
            )
          ) : (
            <>
              <div className="commissions-page__results-head">
                <div>
                  <h2 className="commissions-page__results-title">نتائج العمولات</h2>
                  <p className="commissions-page__results-subtitle">
                    قائمة واحدة للبطاقات (جوال) والجدول (شاشة واسعة) — العدد أدناه يشمل كل النتائج
                    المصفّاة حالياً.
                  </p>
                </div>
                <span className="commissions-page__results-count-badge">
                  {filtered.length} عمولة
                </span>
              </div>

              {/* ديسكتوب: جدول */}
              <CommissionsTable
                commissions={filtered}
                ledgerName={ledgerName}
                canWrite={canWrite}
                onEdit={setModal}
                onPay={setPaymentModal}
                onDelete={handleDelete}
              />

              {/* موبايل: بطاقات */}
              <div className="commissions-page__mobile-list">
                {filtered.map((c) => (
                  <CommissionCard
                    key={c.id}
                    commission={c}
                    ledgerName={ledgerName}
                    canWrite={canWrite}
                    onEdit={setModal}
                    onPay={setPaymentModal}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </>
          )}
        </>
      ) : (
        /* ═══ تبويب التقارير ═══ */
        <CommissionReports
          commissions={
            isAgentOnly && currentAgentName
              ? (commissions || []).filter(
                  (c) =>
                    (f(c, 'agentName', 'agent_name') || '').toLowerCase() ===
                    currentAgentName.toLowerCase()
                )
              : commissions || []
          }
          ledgerName={ledgerName}
          agentOnly={isAgentOnly}
        />
      )}

      {/* ═══ مودالات الصفحة (إضافة/تعديل + تسجيل دفعة) ═══ */}
      <CommissionsPageModals
        canWrite={canWrite}
        modal={modal}
        setModal={setModal}
        paymentModal={paymentModal}
        setPaymentModal={setPaymentModal}
        ledgers={ledgers}
        activeLedgerId={activeLedgerId}
        onSave={handleSave}
        onPayment={handlePayment}
      />

      {/* ═══ تأكيد الحذف ═══ */}
      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title}
        message={confirm?.message}
        onConfirm={confirm?.onConfirm}
        onCancel={() => setConfirm(null)}
        danger
      />
    </div>
  );
}

export default CommissionsPage;
