/**
 * صفحة العمولات — SPR-011 + SPR-012
 * CRUD كامل للعمولات مع ملخص مالي + فلاتر متقدمة + دفعات جزئية.
 * SPR-012: تقارير (حسب الوكيل / الدفتر / شهري) + عرض الوكيل + تصدير CSV.
 * responsive: بطاقات على الموبايل، جدول على الديسكتوب.
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useData } from '../contexts/DataContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import { FormField, SummaryCard, Icons, Badge } from '../ui/ui-common.jsx';
import { Modal, ConfirmDialog } from '../ui/Modals.jsx';
import { Currency, formatNumber, formatCurrency } from '../utils/format.jsx';
import { today, safeNum, genId, now } from '../utils/helpers.js';
// pdf-service يُحمّل ديناميكياً لتقليل حجم الحزمة الأولية
const loadPdfService = () => import('../core/pdf-service.js');

// ═══════════════════════════════════════
// حالات العمولة
// ═══════════════════════════════════════
const STATUS_MAP = {
  pending: { label: 'مستحقة', color: 'yellow' },
  partial: { label: 'مدفوعة جزئياً', color: 'blue' },
  paid: { label: 'مدفوعة', color: 'green' },
};

const STATUS_OPTIONS = [
  { value: '', label: 'كل الحالات' },
  { value: 'pending', label: 'مستحقة' },
  { value: 'partial', label: 'مدفوعة جزئياً' },
  { value: 'paid', label: 'مدفوعة' },
];

// ═══════════════════════════════════════
// خيارات الترتيب
// ═══════════════════════════════════════
const SORT_OPTIONS = [
  { value: 'newest', label: 'الأحدث أولاً' },
  { value: 'oldest', label: 'الأقدم أولاً' },
  { value: 'amount_desc', label: 'الأعلى مبلغاً' },
  { value: 'amount_asc', label: 'الأقل مبلغاً' },
  { value: 'client_asc', label: 'العميل (أ-ي)' },
];

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

function calcAgentAmount(dealValue, agentPercent) {
  return (safeNum(dealValue, 0) * safeNum(agentPercent, 0)) / 100;
}

/** الحصول على قيمة الحقل بدعم camelCase و snake_case */
function f(c, camel, snake) {
  return c[camel] ?? c[snake] ?? null;
}

// ═══════════════════════════════════════
// تصدير CSV
// ═══════════════════════════════════════
function exportCSV(data, ledgerNameFn) {
  const BOM = '\uFEFF';
  const headers = ['العميل', 'الوكيل', 'الدفتر', 'قيمة الصفقة', 'نسبة المكتب %', 'العمولة', 'المدفوع', 'المتبقي', 'الحالة', 'تاريخ الاستحقاق', 'ملاحظات'];
  const statusLabel = { pending: 'مستحقة', partial: 'مدفوعة جزئياً', paid: 'مدفوعة' };

  const rows = data.map((c) => {
    const amount = calcCommissionAmount(f(c, 'dealValue', 'deal_value'), f(c, 'officePercent', 'office_percent'));
    const paid = safeNum(f(c, 'paidAmount', 'paid_amount'), 0);
    const remaining = Math.max(0, amount - paid);
    return [
      f(c, 'clientName', 'client_name') || '',
      f(c, 'agentName', 'agent_name') || '',
      ledgerNameFn(f(c, 'ledgerId', 'ledger_id')),
      safeNum(f(c, 'dealValue', 'deal_value'), 0),
      safeNum(f(c, 'officePercent', 'office_percent'), 0),
      amount,
      paid,
      remaining,
      statusLabel[c.status] || c.status,
      f(c, 'dueDate', 'due_date') || '',
      (c.notes || '').replace(/[\r\n]+/g, ' '),
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',');
  });

  const csv = BOM + headers.join(',') + '\n' + rows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `commissions_${today()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ═══════════════════════════════════════
// CommissionsPage
// ═══════════════════════════════════════
export function CommissionsPage({ setPage }) {
  const toast = useToast();
  const { isAgent, isOwner, isManager, isSuperAdmin, profile, office } = useAuth();
  const {
    commissions,
    commissionsLoading,
    fetchCommissions,
    createCommission,
    updateCommission,
    deleteCommission,
    ledgers,
    activeLedgerId,
  } = useData();

  const [activeTab, setActiveTab] = useState('list');
  const [filters, setFilters] = useState({ status: '', ledgerId: '', search: '', agent: '', dateFrom: '', dateTo: '', sort: 'newest' });
  const [showFilters, setShowFilters] = useState(false);
  const [modal, setModal] = useState(null); // null | 'add' | commission object (edit)
  const [paymentModal, setPaymentModal] = useState(null); // null | commission object
  const [confirm, setConfirm] = useState(null);
  const [pdfExporting, setPdfExporting] = useState(false);

  // SPR-012: هل المستخدم وكيل (عرض محدود)
  const agentOnly = isAgent && !isOwner && !isManager && !isSuperAdmin;
  const currentAgentName = profile?.full_name || profile?.fullName || '';

  // جلب أولي
  const refresh = useCallback(() => {
    fetchCommissions();
  }, [fetchCommissions]);

  useEffect(() => { refresh(); }, [refresh]);

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
    if (agentOnly && currentAgentName) {
      list = list.filter((c) => {
        const name = (f(c, 'agentName', 'agent_name') || '').toLowerCase();
        return name === currentAgentName.toLowerCase();
      });
    }

    if (filters.status) list = list.filter((c) => c.status === filters.status);
    if (filters.ledgerId) list = list.filter((c) => (f(c, 'ledgerId', 'ledger_id')) === filters.ledgerId);
    if (filters.agent) {
      list = list.filter((c) => (f(c, 'agentName', 'agent_name') || '') === filters.agent);
    }
    if (filters.search) {
      const s = filters.search.toLowerCase();
      list = list.filter((c) =>
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
        sorted.sort((a, b) => ((f(b, 'createdAt', 'created_at') || '') > (f(a, 'createdAt', 'created_at') || '') ? 1 : -1));
        break;
      case 'oldest':
        sorted.sort((a, b) => ((f(a, 'createdAt', 'created_at') || '') > (f(b, 'createdAt', 'created_at') || '') ? 1 : -1));
        break;
      case 'amount_desc':
        sorted.sort((a, b) => calcCommissionAmount(f(b, 'dealValue', 'deal_value'), f(b, 'officePercent', 'office_percent')) - calcCommissionAmount(f(a, 'dealValue', 'deal_value'), f(a, 'officePercent', 'office_percent')));
        break;
      case 'amount_asc':
        sorted.sort((a, b) => calcCommissionAmount(f(a, 'dealValue', 'deal_value'), f(a, 'officePercent', 'office_percent')) - calcCommissionAmount(f(b, 'dealValue', 'deal_value'), f(b, 'officePercent', 'office_percent')));
        break;
      case 'client_asc':
        sorted.sort((a, b) => (f(a, 'clientName', 'client_name') || '').localeCompare(f(b, 'clientName', 'client_name') || '', 'ar'));
        break;
      default:
        break;
    }
    return sorted;
  }, [commissions, filters, agentOnly, currentAgentName]);

  // حساب الملخص
  const summary = useMemo(() => {
    const list = agentOnly && currentAgentName
      ? (commissions || []).filter((c) => (f(c, 'agentName', 'agent_name') || '').toLowerCase() === currentAgentName.toLowerCase())
      : (commissions || []);
    let totalDue = 0;
    let totalPaid = 0;
    for (const c of list) {
      const amount = calcCommissionAmount(f(c, 'dealValue', 'deal_value'), f(c, 'officePercent', 'office_percent'));
      const paid = safeNum(f(c, 'paidAmount', 'paid_amount'), 0);
      if (c.status === 'paid') {
        totalPaid += amount;
      } else {
        totalDue += amount - paid;
        totalPaid += paid;
      }
    }
    return { totalDue, totalPaid, remaining: totalDue };
  }, [commissions, agentOnly, currentAgentName]);

  // اسم الدفتر
  const ledgerName = useCallback((id) => {
    const l = (ledgers || []).find((x) => x.id === id);
    return l?.name || l?.title || '—';
  }, [ledgers]);

  // حفظ عمولة (إضافة/تعديل)
  const handleSave = async (data, editId) => {
    const { error } = editId
      ? await updateCommission(editId, data)
      : await createCommission(data);
    if (error) {
      toast(error?.message || 'حدث خطأ أثناء الحفظ', 'error');
      return;
    }
    toast(editId ? 'تم تعديل العمولة بنجاح' : 'تم إضافة العمولة بنجاح');
    setModal(null);
  };

  // تسجيل دفعة
  const handlePayment = async (commissionId, paymentAmount, paymentDate) => {
    const c = (commissions || []).find((x) => x.id === commissionId);
    if (!c) return;
    const totalAmount = calcCommissionAmount(f(c, 'dealValue', 'deal_value'), f(c, 'officePercent', 'office_percent'));
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
      toast(error?.message || 'حدث خطأ أثناء تسجيل الدفعة', 'error');
      return;
    }
    toast('تم تسجيل الدفعة بنجاح');
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
          toast(error?.message || 'حدث خطأ أثناء الحذف', 'error');
          setConfirm(null);
          return;
        }
        toast('تم حذف العمولة');
        setConfirm(null);
      },
    });
  };

  const resetFilters = () => setFilters({ status: '', ledgerId: '', search: '', agent: '', dateFrom: '', dateTo: '', sort: 'newest' });

  // هل يمكن الكتابة (غير وكيل)
  const canWrite = !agentOnly;

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto" dir="rtl">
      {/* ═══ تبويبات ═══ */}
      <div className="flex gap-1 mb-4 bg-[var(--color-bg)] rounded-lg p-1 border border-[var(--color-border)]">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm'
                : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══ عرض الوكيل — شريط تنبيه ═══ */}
      {agentOnly && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm text-blue-800 flex items-center gap-2">
          <Icons.info size={16} />
          <span>أنت تشاهد عمولاتك فقط (وضع الوكيل)</span>
        </div>
      )}

      {activeTab === 'list' ? (
        <>
          {/* ═══ بطاقات الملخص ═══ */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <SummaryCard
              label="إجمالي المستحق"
              value={<><span className="text-lg font-bold">{formatNumber(summary.totalDue)}</span> <span className="text-xs">ر.س</span></>}
              color="red"
              icon={<Icons.arrowDown size={16} />}
            />
            <SummaryCard
              label="إجمالي المدفوع"
              value={<><span className="text-lg font-bold">{formatNumber(summary.totalPaid)}</span> <span className="text-xs">ر.س</span></>}
              color="green"
              icon={<Icons.arrowUp size={16} />}
            />
            <div className="col-span-2">
              <SummaryCard
                label="صافي المتبقي"
                value={<><span className="text-lg font-bold">{formatNumber(summary.remaining)}</span> <span className="text-xs">ر.س</span></>}
                color={summary.remaining > 0 ? 'red' : 'green'}
              />
            </div>
          </div>

          {/* ═══ شريط الفلاتر ═══ */}
          <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 mb-4">
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative flex-1 min-w-[180px]">
                <Icons.search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" />
                <input
                  type="text"
                  placeholder="بحث بالعميل أو الوكيل..."
                  value={filters.search}
                  onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
                  className="w-full border border-[var(--color-border)] rounded-lg ps-9 pe-3 py-2 text-sm bg-[var(--color-input-bg)] text-[var(--color-text)] focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
                  aria-label="بحث"
                />
              </div>
            </div>

            {/* فلاتر متقدمة — قابلة للطي على الموبايل */}
            <button
              type="button"
              onClick={() => setShowFilters((s) => !s)}
              className="flex items-center gap-2 text-sm text-[var(--color-muted)] mt-2 md:hidden"
              aria-expanded={showFilters}
              aria-label="فلاتر متقدمة"
            >
              <Icons.filter size={14} />
              فلاتر متقدمة
              <Icons.chevronDown size={16} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            <div className={`flex flex-wrap gap-2 items-center mt-2 ${showFilters ? 'flex' : 'hidden'} md:flex`}>
              <select
                value={filters.status}
                onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
                className="border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm bg-[var(--color-surface)] text-[var(--color-text)]"
                aria-label="حالة العمولة"
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>

              <select
                value={filters.ledgerId}
                onChange={(e) => setFilters((p) => ({ ...p, ledgerId: e.target.value }))}
                className="border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm bg-[var(--color-surface)] text-[var(--color-text)]"
                aria-label="الدفتر"
              >
                <option value="">كل الدفاتر</option>
                {(ledgers || []).map((l) => (
                  <option key={l.id} value={l.id}>{l.name || l.title || l.id}</option>
                ))}
              </select>

              {/* SPR-012: فلتر الوكيل */}
              {!agentOnly && agentNames.length > 0 && (
                <select
                  value={filters.agent}
                  onChange={(e) => setFilters((p) => ({ ...p, agent: e.target.value }))}
                  className="border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm bg-[var(--color-surface)] text-[var(--color-text)]"
                  aria-label="الوكيل"
                >
                  <option value="">كل الوكلاء</option>
                  {agentNames.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              )}

              {/* SPR-012: فلتر التاريخ */}
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters((p) => ({ ...p, dateFrom: e.target.value }))}
                className="border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm bg-[var(--color-surface)] text-[var(--color-text)]"
                aria-label="من تاريخ"
                title="من تاريخ"
              />
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters((p) => ({ ...p, dateTo: e.target.value }))}
                className="border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm bg-[var(--color-surface)] text-[var(--color-text)]"
                aria-label="إلى تاريخ"
                title="إلى تاريخ"
              />

              {/* SPR-012: ترتيب */}
              <select
                value={filters.sort}
                onChange={(e) => setFilters((p) => ({ ...p, sort: e.target.value }))}
                className="border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm bg-[var(--color-surface)] text-[var(--color-text)]"
                aria-label="ترتيب"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>

              <button
                onClick={resetFilters}
                className="px-3 py-2 rounded-lg text-sm text-[var(--color-muted)] hover:bg-[var(--color-bg)] border border-[var(--color-border)]"
                aria-label="إعادة تعيين الفلاتر"
                title="إعادة تعيين"
              >
                <Icons.filter size={14} />
              </button>
            </div>

            <div className="flex gap-2 mt-3 justify-end">
              {/* SPR-012: تصدير CSV + SPR-013: تصدير PDF */}
              {filtered.length > 0 && (
                <>
                  <button
                    onClick={async () => {
                      if (pdfExporting) return;
                      setPdfExporting(true);
                      try {
                        const { exportCommissionsReport } = await loadPdfService();
                        await exportCommissionsReport(filtered, { name: office?.name || office?.office_name || '' }, filters);
                        toast('تم تصدير PDF بنجاح');
                      } catch (e) {
                        toast(e?.message || 'خطأ في التصدير', 'error');
                      } finally {
                        setPdfExporting(false);
                      }
                    }}
                    disabled={pdfExporting}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                    aria-label="تصدير PDF"
                  >
                    <Icons.download size={16} />
                    {pdfExporting ? 'جاري…' : 'تصدير PDF'}
                  </button>
                  <button
                    onClick={() => { exportCSV(filtered, ledgerName); toast('تم تصدير الملف بنجاح'); }}
                    className="px-4 py-2 rounded-lg bg-[var(--color-surface)] text-[var(--color-text)] text-sm font-medium border border-[var(--color-border)] hover:bg-[var(--color-bg)] flex items-center gap-2"
                    aria-label="تصدير CSV"
                  >
                    <Icons.download size={16} />
                    تصدير CSV
                  </button>
                </>
              )}
              {canWrite && (
                <button
                  onClick={() => setModal('add')}
                  className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium hover:opacity-90 flex items-center gap-2"
                  aria-label="إضافة عمولة"
                >
                  <Icons.plus size={16} />
                  إضافة عمولة
                </button>
              )}
            </div>
          </div>

          {/* ═══ عدد النتائج ═══ */}
          {filtered.length > 0 && (
            <p className="text-xs text-[var(--color-muted)] mb-3">{filtered.length} عمولة</p>
          )}

          {/* ═══ قائمة العمولات ═══ */}
          {filtered.length === 0 ? (
            (commissions || []).length === 0 ? (
              <EmptyCommissions onAdd={canWrite ? () => setModal('add') : null} />
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-[var(--color-muted)]">
                <Icons.empty size={64} aria-hidden="true" />
                <p className="mt-4 text-sm font-medium">لا توجد نتائج مطابقة للفلاتر</p>
                <button
                  onClick={resetFilters}
                  className="mt-4 px-4 py-2 rounded-lg bg-[var(--color-bg)] text-[var(--color-text)] text-sm font-medium border border-[var(--color-border)]"
                >
                  إعادة تعيين الفلاتر
                </button>
              </div>
            )
          ) : (
            <>
              {/* ديسكتوب: جدول */}
              <div className="hidden md:block relative overflow-hidden rounded-xl border border-[var(--color-border)] shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[800px]">
                    <thead>
                      <tr className="bg-[var(--color-bg)] border-b border-[var(--color-border)]">
                        <th className="px-4 py-3 text-end font-semibold text-[var(--color-muted)]">العميل</th>
                        <th className="px-4 py-3 text-end font-semibold text-[var(--color-muted)]">الوكيل</th>
                        <th className="px-4 py-3 text-end font-semibold text-[var(--color-muted)]">الدفتر</th>
                        <th className="px-4 py-3 text-end font-semibold text-[var(--color-muted)]">قيمة الصفقة</th>
                        <th className="px-4 py-3 text-end font-semibold text-[var(--color-muted)]">نسبة المكتب</th>
                        <th className="px-4 py-3 text-end font-semibold text-[var(--color-muted)]">العمولة</th>
                        <th className="px-4 py-3 text-end font-semibold text-[var(--color-muted)]">المدفوع</th>
                        <th className="px-4 py-3 text-end font-semibold text-[var(--color-muted)]">المتبقي</th>
                        <th className="px-4 py-3 text-center font-semibold text-[var(--color-muted)]">الحالة</th>
                        {canWrite && <th className="px-4 py-3 text-center font-semibold text-[var(--color-muted)]">إجراءات</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((c) => {
                        const amount = calcCommissionAmount(f(c, 'dealValue', 'deal_value'), f(c, 'officePercent', 'office_percent'));
                        const paid = safeNum(f(c, 'paidAmount', 'paid_amount'), 0);
                        const remaining = Math.max(0, amount - paid);
                        const st = STATUS_MAP[c.status] || STATUS_MAP.pending;
                        return (
                          <tr key={c.id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-bg)]/50">
                            <td className="px-4 py-3 text-[var(--color-text)] font-medium">{f(c, 'clientName', 'client_name') || '—'}</td>
                            <td className="px-4 py-3 text-[var(--color-muted)]">{f(c, 'agentName', 'agent_name') || '—'}</td>
                            <td className="px-4 py-3 text-[var(--color-muted)]">{ledgerName(f(c, 'ledgerId', 'ledger_id'))}</td>
                            <td className="px-4 py-3 text-[var(--color-text)]">{formatNumber(f(c, 'dealValue', 'deal_value'))} ر.س</td>
                            <td className="px-4 py-3 text-[var(--color-muted)]">{f(c, 'officePercent', 'office_percent') || 0}%</td>
                            <td className="px-4 py-3 font-semibold text-[var(--color-text)]">{formatNumber(amount)} ر.س</td>
                            <td className="px-4 py-3 text-green-600">{formatNumber(paid)} ر.س</td>
                            <td className="px-4 py-3 text-red-600">{formatNumber(remaining)} ر.س</td>
                            <td className="px-4 py-3 text-center"><Badge color={st.color}>{st.label}</Badge></td>
                            {canWrite && (
                              <td className="px-4 py-3">
                                <div className="flex gap-1 justify-center">
                                  <button onClick={() => setModal(c)} className="p-1.5 rounded-lg hover:bg-[var(--color-bg)] text-[var(--color-primary)]" aria-label="تعديل" title="تعديل"><Icons.edit size={15} /></button>
                                  {c.status !== 'paid' && (
                                    <button onClick={() => setPaymentModal(c)} className="p-1.5 rounded-lg hover:bg-[var(--color-bg)] text-green-600" aria-label="تسجيل دفعة" title="تسجيل دفعة"><Icons.check size={15} /></button>
                                  )}
                                  <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg hover:bg-[var(--color-bg)] text-red-600" aria-label="حذف" title="حذف"><Icons.trash size={15} /></button>
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* موبايل: بطاقات */}
              <div className="md:hidden flex flex-col gap-3">
                {filtered.map((c) => {
                  const amount = calcCommissionAmount(f(c, 'dealValue', 'deal_value'), f(c, 'officePercent', 'office_percent'));
                  const paid = safeNum(f(c, 'paidAmount', 'paid_amount'), 0);
                  const remaining = Math.max(0, amount - paid);
                  const st = STATUS_MAP[c.status] || STATUS_MAP.pending;
                  return (
                    <div key={c.id} className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 shadow-sm">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-[var(--color-text)]">{f(c, 'clientName', 'client_name') || '—'}</p>
                          <p className="text-xs text-[var(--color-muted)]">{ledgerName(f(c, 'ledgerId', 'ledger_id'))}</p>
                        </div>
                        <Badge color={st.color}>{st.label}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                        <div>
                          <span className="text-[var(--color-muted)]">قيمة الصفقة: </span>
                          <span className="font-medium text-[var(--color-text)]">{formatNumber(f(c, 'dealValue', 'deal_value'))} ر.س</span>
                        </div>
                        <div>
                          <span className="text-[var(--color-muted)]">العمولة: </span>
                          <span className="font-semibold text-[var(--color-text)]">{formatNumber(amount)} ر.س</span>
                        </div>
                        <div>
                          <span className="text-[var(--color-muted)]">المدفوع: </span>
                          <span className="text-green-600">{formatNumber(paid)} ر.س</span>
                        </div>
                        <div>
                          <span className="text-[var(--color-muted)]">المتبقي: </span>
                          <span className="text-red-600">{formatNumber(remaining)} ر.س</span>
                        </div>
                      </div>
                      {(f(c, 'agentName', 'agent_name')) && (
                        <p className="text-xs text-[var(--color-muted)] mb-2">الوكيل: {f(c, 'agentName', 'agent_name')}</p>
                      )}
                      {canWrite && (
                        <div className="flex gap-2 border-t border-[var(--color-border)] pt-2">
                          <button onClick={() => setModal(c)} className="flex-1 py-1.5 rounded-lg text-xs font-medium text-[var(--color-primary)] hover:bg-[var(--color-bg)] border border-[var(--color-border)]">تعديل</button>
                          {c.status !== 'paid' && (
                            <button onClick={() => setPaymentModal(c)} className="flex-1 py-1.5 rounded-lg text-xs font-medium text-green-600 hover:bg-[var(--color-bg)] border border-[var(--color-border)]">دفعة</button>
                          )}
                          <button onClick={() => handleDelete(c.id)} className="py-1.5 px-3 rounded-lg text-xs font-medium text-red-600 hover:bg-[var(--color-bg)] border border-[var(--color-border)]">حذف</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      ) : (
        /* ═══ تبويب التقارير ═══ */
        <CommissionReports
          commissions={agentOnly && currentAgentName
            ? (commissions || []).filter((c) => (f(c, 'agentName', 'agent_name') || '').toLowerCase() === currentAgentName.toLowerCase())
            : (commissions || [])
          }
          ledgerName={ledgerName}
          agentOnly={agentOnly}
        />
      )}

      {/* ═══ Modal إضافة/تعديل ═══ */}
      {canWrite && (
        <Modal
          open={modal !== null}
          onClose={() => setModal(null)}
          title={modal && modal !== 'add' ? 'تعديل العمولة' : 'إضافة عمولة جديدة'}
        >
          <CommissionForm
            initial={modal !== 'add' ? modal : null}
            ledgers={ledgers}
            activeLedgerId={activeLedgerId}
            onSave={handleSave}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}

      {/* ═══ Modal تسجيل دفعة ═══ */}
      {canWrite && (
        <Modal
          open={paymentModal !== null}
          onClose={() => setPaymentModal(null)}
          title="تسجيل دفعة"
        >
          {paymentModal && (
            <PaymentForm
              commission={paymentModal}
              onSave={handlePayment}
              onCancel={() => setPaymentModal(null)}
            />
          )}
        </Modal>
      )}

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

// ═══════════════════════════════════════
// SPR-012: تقارير العمولات
// ═══════════════════════════════════════
const REPORT_TABS = [
  { id: 'by_agent', label: 'حسب الوكيل' },
  { id: 'by_ledger', label: 'حسب الدفتر' },
  { id: 'monthly', label: 'شهري' },
];

function CommissionReports({ commissions, ledgerName, agentOnly }) {
  const [reportTab, setReportTab] = useState('by_agent');

  // ─── تقرير حسب الوكيل ───
  const byAgent = useMemo(() => {
    const map = {};
    (commissions || []).forEach((c) => {
      const agent = f(c, 'agentName', 'agent_name') || 'بدون وكيل';
      if (!map[agent]) map[agent] = { agent, count: 0, totalDeal: 0, totalCommission: 0, totalPaid: 0, totalRemaining: 0 };
      const amount = calcCommissionAmount(f(c, 'dealValue', 'deal_value'), f(c, 'officePercent', 'office_percent'));
      const paid = safeNum(f(c, 'paidAmount', 'paid_amount'), 0);
      map[agent].count++;
      map[agent].totalDeal += safeNum(f(c, 'dealValue', 'deal_value'), 0);
      map[agent].totalCommission += amount;
      map[agent].totalPaid += paid;
      map[agent].totalRemaining += Math.max(0, amount - paid);
    });
    return Object.values(map).sort((a, b) => b.totalCommission - a.totalCommission);
  }, [commissions]);

  // ─── تقرير حسب الدفتر ───
  const byLedger = useMemo(() => {
    const map = {};
    (commissions || []).forEach((c) => {
      const lid = f(c, 'ledgerId', 'ledger_id') || '__none__';
      const lname = ledgerName(lid);
      if (!map[lid]) map[lid] = { ledger: lname, count: 0, totalDeal: 0, totalCommission: 0, totalPaid: 0, totalRemaining: 0 };
      const amount = calcCommissionAmount(f(c, 'dealValue', 'deal_value'), f(c, 'officePercent', 'office_percent'));
      const paid = safeNum(f(c, 'paidAmount', 'paid_amount'), 0);
      map[lid].count++;
      map[lid].totalDeal += safeNum(f(c, 'dealValue', 'deal_value'), 0);
      map[lid].totalCommission += amount;
      map[lid].totalPaid += paid;
      map[lid].totalRemaining += Math.max(0, amount - paid);
    });
    return Object.values(map).sort((a, b) => b.totalCommission - a.totalCommission);
  }, [commissions, ledgerName]);

  // ─── تقرير شهري ───
  const monthly = useMemo(() => {
    const map = {};
    (commissions || []).forEach((c) => {
      const dateStr = f(c, 'dueDate', 'due_date') || f(c, 'createdAt', 'created_at') || '';
      const month = dateStr ? dateStr.substring(0, 7) : 'بدون تاريخ'; // YYYY-MM
      if (!map[month]) map[month] = { month, count: 0, totalDeal: 0, totalCommission: 0, totalPaid: 0, totalRemaining: 0 };
      const amount = calcCommissionAmount(f(c, 'dealValue', 'deal_value'), f(c, 'officePercent', 'office_percent'));
      const paid = safeNum(f(c, 'paidAmount', 'paid_amount'), 0);
      map[month].count++;
      map[month].totalDeal += safeNum(f(c, 'dealValue', 'deal_value'), 0);
      map[month].totalCommission += amount;
      map[month].totalPaid += paid;
      map[month].totalRemaining += Math.max(0, amount - paid);
    });
    return Object.values(map).sort((a, b) => (b.month > a.month ? 1 : -1));
  }, [commissions]);

  // أكبر عمولة (للرسم البياني البسيط)
  const maxCommission = useMemo(() => {
    const data = reportTab === 'by_agent' ? byAgent : reportTab === 'by_ledger' ? byLedger : monthly;
    return Math.max(1, ...data.map((r) => r.totalCommission));
  }, [reportTab, byAgent, byLedger, monthly]);

  const reportData = reportTab === 'by_agent' ? byAgent : reportTab === 'by_ledger' ? byLedger : monthly;
  const labelKey = reportTab === 'by_agent' ? 'agent' : reportTab === 'by_ledger' ? 'ledger' : 'month';

  if ((commissions || []).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center text-[var(--color-muted)]">
        <Icons.empty size={64} aria-hidden="true" />
        <p className="mt-4 text-sm font-medium">لا توجد بيانات لعرض التقارير</p>
        <p className="text-xs mt-1">أضف عمولات أولاً لتظهر هنا</p>
      </div>
    );
  }

  // تنسيق اسم الشهر
  const formatMonth = (m) => {
    if (!m || m === 'بدون تاريخ') return m;
    try {
      const [y, mo] = m.split('-');
      const d = new Date(Number(y), Number(mo) - 1);
      return d.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long' });
    } catch {
      return m;
    }
  };

  return (
    <div>
      {/* تبويبات التقارير الفرعية */}
      <div className="flex gap-1 mb-4 bg-[var(--color-bg)] rounded-lg p-1 border border-[var(--color-border)]">
        {REPORT_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setReportTab(tab.id)}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
              reportTab === tab.id
                ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm'
                : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* إجمالي التقرير */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <SummaryCard
          label="عدد الصفقات"
          value={<span className="text-lg font-bold">{reportData.reduce((s, r) => s + r.count, 0)}</span>}
          color="blue"
        />
        <SummaryCard
          label="إجمالي العمولات"
          value={<><span className="text-lg font-bold">{formatNumber(reportData.reduce((s, r) => s + r.totalCommission, 0))}</span> <span className="text-xs">ر.س</span></>}
          color="green"
        />
        <SummaryCard
          label="المتبقي"
          value={<><span className="text-lg font-bold">{formatNumber(reportData.reduce((s, r) => s + r.totalRemaining, 0))}</span> <span className="text-xs">ر.س</span></>}
          color="red"
        />
      </div>

      {/* الجدول + رسم بياني أفقي بسيط */}
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--color-bg)] border-b border-[var(--color-border)]">
                <th className="px-4 py-3 text-end font-semibold text-[var(--color-muted)]">
                  {reportTab === 'by_agent' ? 'الوكيل' : reportTab === 'by_ledger' ? 'الدفتر' : 'الشهر'}
                </th>
                <th className="px-4 py-3 text-end font-semibold text-[var(--color-muted)]">الصفقات</th>
                <th className="px-4 py-3 text-end font-semibold text-[var(--color-muted)]">قيمة الصفقات</th>
                <th className="px-4 py-3 text-end font-semibold text-[var(--color-muted)]">العمولة</th>
                <th className="px-4 py-3 text-end font-semibold text-[var(--color-muted)]">المدفوع</th>
                <th className="px-4 py-3 text-end font-semibold text-[var(--color-muted)]">المتبقي</th>
                <th className="px-4 py-3 font-semibold text-[var(--color-muted)] hidden md:table-cell" style={{ minWidth: 150 }}>&nbsp;</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((row, i) => {
                const label = reportTab === 'monthly' ? formatMonth(row[labelKey]) : row[labelKey];
                const barWidth = Math.max(2, (row.totalCommission / maxCommission) * 100);
                const paidWidth = row.totalCommission > 0 ? (row.totalPaid / row.totalCommission) * 100 : 0;
                return (
                  <tr key={i} className="border-b border-[var(--color-border)] hover:bg-[var(--color-bg)]/50">
                    <td className="px-4 py-3 font-medium text-[var(--color-text)]">{label}</td>
                    <td className="px-4 py-3 text-[var(--color-muted)]">{row.count}</td>
                    <td className="px-4 py-3 text-[var(--color-text)]">{formatNumber(row.totalDeal)} ر.س</td>
                    <td className="px-4 py-3 font-semibold text-[var(--color-text)]">{formatNumber(row.totalCommission)} ر.س</td>
                    <td className="px-4 py-3 text-green-600">{formatNumber(row.totalPaid)} ر.س</td>
                    <td className="px-4 py-3 text-red-600">{formatNumber(row.totalRemaining)} ر.س</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="w-full h-4 bg-[var(--color-bg)] rounded-full overflow-hidden relative" title={`العمولة: ${formatNumber(row.totalCommission)} ر.س`}>
                        <div className="absolute inset-y-0 start-0 bg-blue-200 rounded-full" style={{ width: `${barWidth}%` }} />
                        <div className="absolute inset-y-0 start-0 bg-green-500 rounded-full" style={{ width: `${Math.min(barWidth, (paidWidth / 100) * barWidth)}%` }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* مفتاح الرسم */}
      <div className="flex gap-4 mt-3 text-xs text-[var(--color-muted)]">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500 inline-block" /> المدفوع</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-200 inline-block" /> إجمالي العمولة</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// حالة فارغة
// ═══════════════════════════════════════
function EmptyCommissions({ onAdd }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-[var(--color-bg)] flex items-center justify-center mb-4">
        <Icons.percent size={32} className="text-[var(--color-muted)]" />
      </div>
      <h3 className="text-lg font-semibold text-[var(--color-text)] mb-1">لا توجد عمولات بعد</h3>
      <p className="text-sm text-[var(--color-muted)] mb-4 max-w-xs">سجّل عمولات صفقاتك لتتبع مستحقاتك المالية ومدفوعاتك</p>
      {onAdd && (
        <button
          type="button"
          onClick={onAdd}
          className="px-5 py-2.5 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium hover:opacity-90 flex items-center gap-2"
        >
          <Icons.plus size={16} />
          أضف أول عمولة
        </button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════
// نموذج إضافة/تعديل العمولة
// ═══════════════════════════════════════
function CommissionForm({ initial, ledgers, activeLedgerId, onSave, onCancel }) {
  const isEdit = initial && initial !== 'add' && initial.id;

  const [form, setForm] = useState(() => {
    if (isEdit) {
      return {
        clientName: f(initial, 'clientName', 'client_name') || '',
        ledgerId: f(initial, 'ledgerId', 'ledger_id') || '',
        agentName: f(initial, 'agentName', 'agent_name') || '',
        dealValue: f(initial, 'dealValue', 'deal_value') || '',
        officePercent: f(initial, 'officePercent', 'office_percent') || 2.5,
        agentPercent: f(initial, 'agentPercent', 'agent_percent') || 0,
        dueDate: f(initial, 'dueDate', 'due_date') || '',
        notes: initial.notes || '',
      };
    }
    return {
      clientName: '',
      ledgerId: activeLedgerId || '',
      agentName: '',
      dealValue: '',
      officePercent: 2.5,
      agentPercent: 0,
      dueDate: '',
      notes: '',
    };
  });
  const [errors, setErrors] = useState({});

  const officeAmount = calcCommissionAmount(form.dealValue, form.officePercent);
  const agentAmount = calcAgentAmount(form.dealValue, form.agentPercent);
  const netOffice = officeAmount - agentAmount;

  const validate = () => {
    const errs = {};
    if (!form.clientName.trim()) errs.clientName = 'اسم العميل مطلوب';
    const dv = Number(form.dealValue);
    if (!form.dealValue || !Number.isFinite(dv) || dv <= 0) errs.dealValue = 'قيمة الصفقة مطلوبة وأكبر من صفر';
    const op = Number(form.officePercent);
    if (!Number.isFinite(op) || op < 0 || op > 100) errs.officePercent = 'النسبة بين 0 و 100';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const data = {
      clientName: form.clientName.trim(),
      ledgerId: form.ledgerId || null,
      agentName: form.agentName.trim() || null,
      dealValue: safeNum(form.dealValue, 0),
      officePercent: safeNum(form.officePercent, 2.5),
      agentPercent: safeNum(form.agentPercent, 0),
      dueDate: form.dueDate || null,
      notes: form.notes.trim() || null,
      status: isEdit ? undefined : 'pending',
      paidAmount: isEdit ? undefined : 0,
    };
    // لا نرسل undefined
    Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);
    onSave(data, isEdit ? initial.id : null);
  };

  const updateField = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  return (
    <form onSubmit={handleSubmit}>
      <FormField id="cm-client" label="اسم العميل / الصفقة" error={errors.clientName}>
        <input
          type="text"
          value={form.clientName}
          onChange={(e) => updateField('clientName', e.target.value)}
          className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm bg-[var(--color-input-bg)] text-[var(--color-text)]"
          placeholder="مثال: عبدالله العتيبي — شقة 5"
          aria-required="true"
        />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="الدفتر (اختياري)">
          <select
            value={form.ledgerId}
            onChange={(e) => updateField('ledgerId', e.target.value)}
            className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm bg-[var(--color-surface)] text-[var(--color-text)]"
            aria-label="الدفتر"
          >
            <option value="">بدون دفتر</option>
            {(ledgers || []).map((l) => (
              <option key={l.id} value={l.id}>{l.name || l.title || l.id}</option>
            ))}
          </select>
        </FormField>

        <FormField label="اسم الوكيل (اختياري)">
          <input
            type="text"
            value={form.agentName}
            onChange={(e) => updateField('agentName', e.target.value)}
            className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm bg-[var(--color-input-bg)] text-[var(--color-text)]"
            placeholder="اسم الوكيل"
          />
        </FormField>
      </div>

      <FormField id="cm-deal" label="قيمة الصفقة (ر.س)" error={errors.dealValue}>
        <input
          type="number"
          step="0.01"
          min="0"
          value={form.dealValue}
          onChange={(e) => updateField('dealValue', e.target.value)}
          className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm bg-[var(--color-input-bg)] text-[var(--color-text)]"
          placeholder="مثال: 500000"
          aria-required="true"
        />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField id="cm-office-pct" label="نسبة المكتب %" error={errors.officePercent}>
          <input
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={form.officePercent}
            onChange={(e) => updateField('officePercent', e.target.value)}
            className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm bg-[var(--color-input-bg)] text-[var(--color-text)]"
          />
        </FormField>

        <FormField label="نسبة الوكيل %">
          <input
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={form.agentPercent}
            onChange={(e) => updateField('agentPercent', e.target.value)}
            className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm bg-[var(--color-input-bg)] text-[var(--color-text)]"
          />
        </FormField>
      </div>

      {/* حقول محسوبة */}
      {safeNum(form.dealValue, 0) > 0 && (
        <div className="bg-[var(--color-bg)] rounded-lg p-3 mb-3 text-sm border border-[var(--color-border)]">
          <div className="flex justify-between mb-1">
            <span className="text-[var(--color-muted)]">عمولة المكتب:</span>
            <span className="font-semibold text-[var(--color-text)]">{formatNumber(officeAmount)} ر.س</span>
          </div>
          {safeNum(form.agentPercent, 0) > 0 && (
            <>
              <div className="flex justify-between mb-1">
                <span className="text-[var(--color-muted)]">عمولة الوكيل:</span>
                <span className="text-[var(--color-text)]">{formatNumber(agentAmount)} ر.س</span>
              </div>
              <div className="flex justify-between border-t border-[var(--color-border)] pt-1 mt-1">
                <span className="text-[var(--color-muted)]">صافي المكتب:</span>
                <span className="font-bold text-[var(--color-text)]">{formatNumber(netOffice)} ر.س</span>
              </div>
            </>
          )}
        </div>
      )}

      <FormField label="تاريخ الاستحقاق (اختياري)">
        <input
          type="date"
          value={form.dueDate}
          onChange={(e) => updateField('dueDate', e.target.value)}
          className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm bg-[var(--color-input-bg)] text-[var(--color-text)]"
        />
      </FormField>

      <FormField label="ملاحظات (اختياري)">
        <textarea
          value={form.notes}
          onChange={(e) => updateField('notes', e.target.value)}
          rows={2}
          className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm bg-[var(--color-input-bg)] text-[var(--color-text)] resize-none"
          placeholder="أي ملاحظات إضافية..."
        />
      </FormField>

      <div className="flex gap-3 justify-end mt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg bg-[var(--color-bg)] text-[var(--color-text)] text-sm font-medium border border-[var(--color-border)]"
        >
          إلغاء
        </button>
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium hover:opacity-90"
        >
          {isEdit ? 'حفظ التعديلات' : 'إضافة العمولة'}
        </button>
      </div>
    </form>
  );
}

// ═══════════════════════════════════════
// نموذج تسجيل دفعة
// ═══════════════════════════════════════
function PaymentForm({ commission, onSave, onCancel }) {
  const c = commission;
  const totalAmount = calcCommissionAmount(f(c, 'dealValue', 'deal_value'), f(c, 'officePercent', 'office_percent'));
  const currentPaid = safeNum(f(c, 'paidAmount', 'paid_amount'), 0);
  const remaining = Math.max(0, totalAmount - currentPaid);

  const [amount, setAmount] = useState('');
  const [payDate, setPayDate] = useState(today());
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const val = safeNum(amount, 0);
    if (val <= 0) {
      setError('مبلغ الدفعة مطلوب وأكبر من صفر');
      return;
    }
    if (val > remaining) {
      setError(`المبلغ يتجاوز المتبقي (${formatNumber(remaining)} ر.س)`);
      return;
    }
    setError('');
    onSave(c.id, val, payDate);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="bg-[var(--color-bg)] rounded-lg p-4 mb-4 border border-[var(--color-border)]">
        <p className="font-semibold text-[var(--color-text)] mb-2">{f(c, 'clientName', 'client_name') || '—'}</p>
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div>
            <span className="text-[var(--color-muted)]">العمولة</span>
            <p className="font-medium text-[var(--color-text)]">{formatNumber(totalAmount)} ر.س</p>
          </div>
          <div>
            <span className="text-[var(--color-muted)]">المدفوع</span>
            <p className="font-medium text-green-600">{formatNumber(currentPaid)} ر.س</p>
          </div>
          <div>
            <span className="text-[var(--color-muted)]">المتبقي</span>
            <p className="font-bold text-red-600">{formatNumber(remaining)} ر.س</p>
          </div>
        </div>
      </div>

      <FormField id="pay-amount" label="مبلغ الدفعة (ر.س)" error={error}>
        <input
          type="number"
          step="0.01"
          min="0"
          max={remaining}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm bg-[var(--color-input-bg)] text-[var(--color-text)]"
          placeholder={`الحد الأقصى: ${formatNumber(remaining)}`}
          aria-required="true"
        />
      </FormField>

      <FormField label="تاريخ الدفع">
        <input
          type="date"
          value={payDate}
          onChange={(e) => setPayDate(e.target.value)}
          className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm bg-[var(--color-input-bg)] text-[var(--color-text)]"
        />
      </FormField>

      {/* زر دفع كامل */}
      {remaining > 0 && (
        <button
          type="button"
          onClick={() => setAmount(String(remaining))}
          className="w-full mb-3 py-2 rounded-lg text-sm font-medium text-green-700 bg-green-50 border border-green-200 hover:bg-green-100"
        >
          دفع المبلغ كاملاً ({formatNumber(remaining)} ر.س)
        </button>
      )}

      <div className="flex gap-3 justify-end mt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg bg-[var(--color-bg)] text-[var(--color-text)] text-sm font-medium border border-[var(--color-border)]"
        >
          إلغاء
        </button>
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700"
        >
          تسجيل الدفعة
        </button>
      </div>
    </form>
  );
}

export default CommissionsPage;
