import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { computePL, computeTopBuckets } from '../core/ledger-analytics.js';
import { downloadCSV } from '../utils/csvExport.js';
// pdf-service يُحمّل ديناميكياً لتقليل حجم الحزمة الأولية
const loadPdfService = () => import('../core/pdf-service.js');

/** Minimal, stable Reports tab (Stage 6 stability).
 *  هدفه منع أي crash/white-screen وتقديم تقارير أساسية + CSV تصدير.
 */
const fallbackCurrency = ({ value }) => (
  <span>
    {Number(value) != null
      ? Number(value).toLocaleString('ar-SA', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        })
      : '0'}{' '}
    ر.س
  </span>
);
const fallbackEmpty = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-16 text-[var(--color-muted)]">
    <p className="mt-4 text-sm">{message}</p>
  </div>
);
const fallbackBadge = ({ children }) => (
  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--color-bg)] text-[var(--color-muted)]">
    {children}
  </span>
);

const BUCKET_LABELS = {
  operational: 'تشغيل ومرافق',
  maintenance: 'صيانة',
  marketing: 'تسويق وإعلان',
  system: 'إيجار ورسوم',
  adhoc: 'عند الحاجة',
  other: 'أخرى',
  uncategorized: 'غير مصنف',
};

const MONTHS_REPORT = [
  { value: 1, label: 'يناير' },
  { value: 2, label: 'فبراير' },
  { value: 3, label: 'مارس' },
  { value: 4, label: 'أبريل' },
  { value: 5, label: 'مايو' },
  { value: 6, label: 'يونيو' },
  { value: 7, label: 'يوليو' },
  { value: 8, label: 'أغسطس' },
  { value: 9, label: 'سبتمبر' },
  { value: 10, label: 'أكتوبر' },
  { value: 11, label: 'نوفمبر' },
  { value: 12, label: 'ديسمبر' },
];

function LedgerReportsTab(props) {
  const {
    toast,
    activeId,
    activeLedger,
    Badge = fallbackBadge,
    EmptyState = fallbackEmpty,
    Currency = fallbackCurrency,
    Icons = {},
    dataStore,
    filterTransactionsForLedgerByMeta,
    ledgerReports = null,
    budgetsHealth = null,
  } = props;

  const navigate = useNavigate();
  const now = new Date();
  const [reportMonth, setReportMonth] = useState(now.getMonth() + 1);
  const [reportYear, setReportYear] = useState(now.getFullYear());
  const [pdfExporting, setPdfExporting] = useState(false);

  const txs = useMemo(() => {
    if (!activeId) return [];
    try {
      const all = dataStore?.transactions?.list ? dataStore.transactions.list() : [];
      return filterTransactionsForLedgerByMeta({ transactions: all, ledgerId: activeId });
    } catch {
      return [];
    }
  }, [activeId, dataStore, filterTransactionsForLedgerByMeta]);

  const pl30 = useMemo(() => {
    if (ledgerReports?.pl30) return ledgerReports.pl30;
    try {
      const now = new Date();
      const d = new Date(now.getTime());
      d.setDate(d.getDate() - 30);
      const last30 = (txs || []).filter((t) => {
        const dt = new Date(String(t?.date || '') + 'T00:00:00');
        if (Number.isNaN(dt.getTime())) return false;
        return dt.getTime() >= d.getTime();
      });
      return computePL({ transactions: last30 }) || { income: 0, expense: 0, net: 0 };
    } catch {
      return { income: 0, expense: 0, net: 0 };
    }
  }, [txs, ledgerReports]);

  const pl365 = useMemo(() => {
    if (ledgerReports?.pl365) return ledgerReports.pl365;
    try {
      const now = new Date();
      const d = new Date(now.getTime());
      d.setDate(d.getDate() - 365);
      const last365 = (txs || []).filter((t) => {
        const dt = new Date(String(t?.date || '') + 'T00:00:00');
        if (Number.isNaN(dt.getTime())) return false;
        return dt.getTime() >= d.getTime();
      });
      return computePL({ transactions: last365 }) || { income: 0, expense: 0, net: 0 };
    } catch {
      return { income: 0, expense: 0, net: 0 };
    }
  }, [txs, ledgerReports]);

  const topBuckets = useMemo(() => {
    if (ledgerReports?.topBuckets?.length) return ledgerReports.topBuckets;
    try {
      return computeTopBuckets({ transactions: txs || [], limit: 5 });
    } catch {
      return [];
    }
  }, [txs, ledgerReports]);

  const compliance = ledgerReports?.compliance ?? null;

  const openMonthlyReport = () => {
    if (!activeId) {
      toast?.('اختر دفترًا نشطًا أولاً', 'error');
      return;
    }
    const params = new URLSearchParams({
      ledgerId: activeId,
      month: String(reportMonth),
      year: String(reportYear),
    });
    navigate(`/report?${params.toString()}`);
  };

  const exportLedgerTxCSV = () => {
    if (!activeId) return;
    const rows = (txs || []).map((t) => [
      t?.date || '',
      t?.type || '',
      t?.category || '',
      String(t?.amount ?? ''),
      t?.paymentMethod || '',
      t?.description || '',
      t?.meta?.ledgerId || '',
      t?.meta?.recurringId || '',
    ]);

    if (rows.length === 0) {
      toast?.('لا توجد حركات للدفتر لتصديرها', 'error');
      return;
    }

    downloadCSV({
      filename: `ledger-${activeId}-tx.csv`,
      headers: [
        'date',
        'type',
        'category',
        'amount',
        'paymentMethod',
        'description',
        'meta.ledgerId',
        'meta.recurringId',
      ],
      rows,
    });
    toast?.('تم تصدير CSV');
  };

  const exportLedgerPDF = async () => {
    if (!activeId || pdfExporting) return;
    if ((txs || []).length === 0) {
      toast?.('لا توجد حركات للتصدير', 'error');
      return;
    }
    setPdfExporting(true);
    try {
      const { exportLedgerStatement } = await loadPdfService();
      await exportLedgerStatement(
        activeLedger,
        txs,
        { name: '' },
        { month: reportMonth, year: reportYear }
      );
      toast?.('تم تصدير كشف الحساب PDF');
    } catch (e) {
      toast?.(e?.message || 'خطأ في تصدير PDF', 'error');
    } finally {
      setPdfExporting(false);
    }
  };

  return (
    <>
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 md:p-5 shadow-sm mb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 className="font-bold text-[var(--color-text)]">تقارير الدفتر</h4>
            <p className="text-sm text-[var(--color-muted)] mt-1">
              دفتر نشط:{' '}
              <span className="font-medium text-[var(--color-text)]">
                {activeLedger?.name || '—'}
              </span>
            </p>
            <p className="text-xs text-[var(--color-muted)] mt-1">
              هذه الصفحة تعرض تقارير مبنية على الحركات المرتبطة بالدفتر (meta).
            </p>
          </div>
          {!activeId && <Badge color="yellow">اختر دفترًا نشطًا</Badge>}
        </div>
      </div>

      {!activeId ? (
        <EmptyState message="اختر دفترًا نشطًا لعرض التقارير" />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 md:p-5 shadow-sm">
            <h4 className="font-bold text-[var(--color-text)] mb-3">التقرير الشهري</h4>
            <p className="text-sm text-[var(--color-muted)] mb-3">
              عرض تقرير شهري للدفتر مع إمكانية تصدير PDF ومشاركته.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={reportMonth}
                onChange={(e) => setReportMonth(Number(e.target.value))}
                className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] bg-[var(--color-surface)]"
                aria-label="شهر التقرير"
              >
                {MONTHS_REPORT.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              <select
                value={reportYear}
                onChange={(e) => setReportYear(Number(e.target.value))}
                className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] bg-[var(--color-surface)]"
                aria-label="سنة التقرير"
              >
                {Array.from({ length: 10 }, (_, i) => now.getFullYear() - 5 + i).map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={openMonthlyReport}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
              >
                عرض التقرير
              </button>
            </div>
          </div>

          <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 md:p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-bold text-[var(--color-text)]">ملخص سريع</div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={exportLedgerPDF}
                  disabled={pdfExporting}
                  className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                  aria-label="تصدير كشف حساب PDF"
                >
                  {pdfExporting ? 'جاري…' : 'كشف حساب PDF'}
                </button>
                <button
                  type="button"
                  onClick={exportLedgerTxCSV}
                  className="px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] text-sm font-medium hover:bg-[var(--color-bg)]"
                  aria-label="تصدير CSV"
                >
                  تصدير CSV
                </button>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]">
                <div className="text-xs text-[var(--color-muted)]">عدد الحركات</div>
                <div className="mt-1 text-xl font-bold text-[var(--color-text)]">
                  {(txs || []).length}
                </div>
              </div>
              <div className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]">
                <div className="text-xs text-[var(--color-muted)]">صافي آخر 30 يوم</div>
                <div className="mt-1 text-xl font-bold text-[var(--color-text)]">
                  <Currency value={pl30?.net || 0} />
                </div>
              </div>
              <div className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]">
                <div className="text-xs text-[var(--color-muted)]">صافي آخر سنة</div>
                <div className="mt-1 text-xl font-bold text-[var(--color-text)]">
                  <Currency value={pl365?.net ?? 0} />
                </div>
              </div>
              <div className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]">
                <div className="text-xs text-[var(--color-muted)]">دخل 30 يوم</div>
                <div className="mt-1 text-lg font-bold text-green-700">
                  <Currency value={pl30?.income ?? 0} />
                </div>
              </div>
              <div className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] col-span-2 md:col-span-1">
                <div className="text-xs text-[var(--color-muted)]">مصروف 30 يوم</div>
                <div className="mt-1 text-lg font-bold text-red-700">
                  <Currency value={pl30?.expense ?? 0} />
                </div>
              </div>
            </div>
          </div>

          {compliance != null && (
            <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 md:p-5 shadow-sm">
              <h4 className="font-bold text-[var(--color-text)] mb-2">درجة الالتزام</h4>
              <p className="text-sm text-[var(--color-muted)] mb-2">{compliance.note}</p>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-[var(--color-text)]">
                    {compliance.pct ?? 0}%
                  </span>
                  <Badge
                    color={compliance.pct >= 70 ? 'green' : compliance.pct >= 40 ? 'yellow' : 'red'}
                  >
                    {compliance.pct >= 70 ? 'جيد' : compliance.pct >= 40 ? 'يحتاج متابعة' : 'ضعيف'}
                  </Badge>
                </div>
                {compliance.overdueCount > 0 && (
                  <span className="text-sm text-amber-700">
                    استحقاقات متأخرة: {compliance.overdueCount}
                  </span>
                )}
                {compliance.completionPct != null && (
                  <span className="text-xs text-[var(--color-muted)]">
                    اكتمال التسعير: {compliance.completionPct}%
                  </span>
                )}
              </div>
            </div>
          )}

          {budgetsHealth && (budgetsHealth.monthlyTarget > 0 || budgetsHealth.yearlyTarget > 0) && (
            <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 md:p-5 shadow-sm">
              <h4 className="font-bold text-[var(--color-text)] mb-2">الميزانية</h4>
              <div className="flex flex-wrap gap-3 text-sm">
                {budgetsHealth.monthlyTarget > 0 && (
                  <span>
                    شهري: <Currency value={budgetsHealth.monthlyTarget} /> —{' '}
                    <Badge
                      color={
                        budgetsHealth.status === 'good' || budgetsHealth.status === 'neutral'
                          ? 'green'
                          : budgetsHealth.status === 'warn'
                            ? 'yellow'
                            : 'red'
                      }
                    >
                      {budgetsHealth.status === 'good' || budgetsHealth.status === 'neutral'
                        ? 'ضمن الهدف'
                        : budgetsHealth.status === 'warn'
                          ? 'قريب من الحد'
                          : 'تجاوز'}
                    </Badge>
                  </span>
                )}
                {budgetsHealth.yearlyTarget > 0 && (
                  <span>
                    سنوي: <Currency value={budgetsHealth.yearlyTarget} />
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 md:p-5 shadow-sm">
            <h4 className="font-bold text-[var(--color-text)] mb-3">توزيع المصروفات (حسب الفئة)</h4>
            <div className="flex flex-col gap-2">
              {(topBuckets || []).length === 0 ? (
                <div className="text-sm text-[var(--color-muted)]">لا توجد مصروفات مصنفة بعد.</div>
              ) : (
                topBuckets.map((b) => (
                  <div
                    key={b.bucket}
                    className="text-sm text-[var(--color-text)] flex items-center justify-between gap-2 py-1 border-b border-[var(--color-border)] last:border-0"
                  >
                    <span className="truncate">
                      {BUCKET_LABELS[b.bucket] || String(b.bucket || 'أخرى')}
                    </span>
                    <span className="font-semibold">
                      <Currency value={b.total || 0} />
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default React.memo(LedgerReportsTab);
