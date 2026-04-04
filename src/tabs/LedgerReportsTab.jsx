import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { computePL, computeTopBuckets } from '../core/ledger-analytics.js';
import { downloadCSV } from '../utils/csvExport.js';
import { Currency as AppCurrency } from '../utils/format.jsx';
// pdf-service يُحمّل ديناميكياً لتقليل حجم الحزمة الأولية
const loadPdfService = () => import('../core/pdf-service.js');

/** Minimal, stable Reports tab (Stage 6 stability).
 *  هدفه منع أي crash/white-screen وتقديم تقارير أساسية + CSV تصدير.
 */
const fallbackCurrency = ({ value }) => <AppCurrency value={value} />;
const fallbackEmpty = ({ message }) => (
  <div className="ledger-empty-wrap">
    <p className="ledger-empty-wrap__title">{message}</p>
  </div>
);
const fallbackBadge = ({ children }) => (
  <span className="ledger-item-card__badge ledger-item-card__badge--info">{children}</span>
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

/**
 * @param {object} props — مُجمّعة في مجالين
 * @param {object} props.data — بيانات الدفتر والحركات والتقارير
 * @param {object} props.ui — مكونات مشتركة وأدوات مساعدة
 */
function LedgerReportsTab({ data, ui }) {
  const {
    activeId,
    activeLedger,
    dataStore,
    filterTransactionsForLedgerByMeta,
    ledgerReports = null,
    budgetsHealth = null,
  } = data;

  const {
    Badge = fallbackBadge,
    EmptyState = fallbackEmpty,
    Currency = fallbackCurrency,
    toast,
  } = ui;

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
      <section className="ledger-layer ledger-layer--summary">
        <div className="ledger-layer__header">
          <span className="ledger-layer__label">تقارير الدفتر</span>
          <p className="ledger-layer__hint">
            دفتر نشط: <strong>{activeLedger?.name || '—'}</strong>
            {' — '}
            هذه الصفحة تعرض تقارير مبنية على الحركات المرتبطة بالدفتر.
          </p>
          {!activeId && <Badge color="yellow">اختر دفترًا نشطًا</Badge>}
        </div>
      </section>

      {!activeId ? (
        <div className="ledger-empty-wrap">
          <EmptyState message="اختر دفترًا نشطًا لعرض التقارير" />
        </div>
      ) : (
        <div className="ledger-view">
          <section className="ledger-layer ledger-layer--summary">
            <div className="ledger-layer__header">
              <span className="ledger-layer__label">الملخص</span>
              <p className="ledger-layer__hint">
                تبدأ القراءة هنا بمؤشرات النشاط والصافي قبل الانتقال إلى أدوات التقرير والتفاصيل.
              </p>
            </div>
            <div className="panel-card ledger-panel ledger-summary-panel">
              <div className="ledger-panel__header">
                <div>
                  <span className="ledger-panel__eyebrow">لوحة ملخص</span>
                  <div className="ledger-panel__title">ملخص سريع</div>
                  <p className="ledger-panel__subtitle">
                    مؤشرات سريعة للصافي، النشاط، والدخل والمصروف المرتبطين بالدفتر النشط.
                  </p>
                </div>
              </div>
              <div className="ledger-metric-grid">
                <div className="ledger-metric-card">
                  <div className="ledger-metric-card__label">عدد الحركات</div>
                  <div className="ledger-metric-card__value ledger-metric-card__value--xl">
                    {(txs || []).length}
                  </div>
                </div>
                <div className="ledger-metric-card">
                  <div className="ledger-metric-card__label">صافي آخر 30 يوم</div>
                  <div className="ledger-metric-card__value ledger-metric-card__value--xl">
                    <Currency value={pl30?.net || 0} />
                  </div>
                </div>
                <div className="ledger-metric-card">
                  <div className="ledger-metric-card__label">صافي آخر سنة</div>
                  <div className="ledger-metric-card__value ledger-metric-card__value--xl">
                    <Currency value={pl365?.net ?? 0} />
                  </div>
                </div>
                <div className="ledger-metric-card">
                  <div className="ledger-metric-card__label">دخل 30 يوم</div>
                  <div className="ledger-metric-card__value ledger-metric-card__value--lg ledger-metric-card__value--success">
                    <Currency value={pl30?.income ?? 0} />
                  </div>
                </div>
                <div className="ledger-metric-card">
                  <div className="ledger-metric-card__label">مصروف 30 يوم</div>
                  <div className="ledger-metric-card__value ledger-metric-card__value--lg ledger-metric-card__value--danger">
                    <Currency value={pl30?.expense ?? 0} />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="ledger-layer ledger-layer--controls">
            <div className="ledger-layer__header">
              <span className="ledger-layer__label">الإجراءات</span>
              <p className="ledger-layer__hint">
                اختر فترة التقرير أو صدّر المستندات من هذه المنطقة قبل مراجعة التفاصيل التحليلية.
              </p>
            </div>
            <div className="panel-card ledger-panel ledger-control-panel">
              <div className="ledger-panel__header">
                <div>
                  <span className="ledger-panel__eyebrow">التقرير الرسمي</span>
                  <h4 className="ledger-panel__title">التقرير الشهري</h4>
                  <p className="ledger-panel__subtitle">
                    عرض تقرير شهري للدفتر مع إمكانية تصدير PDF ومشاركته.
                  </p>
                </div>
                <div className="ledger-panel__toolbar-group">
                  <button
                    type="button"
                    onClick={exportLedgerPDF}
                    disabled={pdfExporting}
                    className="btn-primary"
                    aria-label="تصدير كشف حساب PDF"
                  >
                    {pdfExporting ? 'جاري…' : 'كشف حساب PDF'}
                  </button>
                  <button
                    type="button"
                    onClick={exportLedgerTxCSV}
                    className="btn-secondary"
                    aria-label="تصدير CSV"
                  >
                    تصدير CSV
                  </button>
                </div>
              </div>
              <div className="ledger-panel__toolbar">
                <div className="ledger-panel__toolbar-group">
                  <select
                    value={reportMonth}
                    onChange={(e) => setReportMonth(Number(e.target.value))}
                    className="ledger-form-input ledger-form-select"
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
                    className="ledger-form-input ledger-form-select"
                    aria-label="سنة التقرير"
                  >
                    {Array.from({ length: 10 }, (_, i) => now.getFullYear() - 5 + i).map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                  <button type="button" onClick={openMonthlyReport} className="btn-primary">
                    عرض التقرير
                  </button>
                </div>
                <p className="ledger-muted-note">
                  اختر الفترة ثم افتح التقرير أو صدّر البيانات مباشرة من هنا.
                </p>
              </div>
            </div>
          </section>

          <section className="ledger-layer">
            <div className="ledger-layer__header">
              <span className="ledger-layer__label">المحتوى</span>
              <p className="ledger-layer__hint">
                في هذه المنطقة تظهر قراءة الالتزام والتوزيع الفعلي بعد ضبط التقرير المطلوب.
              </p>
            </div>
            {compliance != null && (
              <div className="panel-card ledger-panel ledger-content-panel">
                <div className="ledger-panel__header">
                  <div>
                    <span className="ledger-panel__eyebrow">مؤشر الجودة</span>
                    <h4 className="ledger-panel__title">درجة الالتزام</h4>
                    <p className="ledger-panel__subtitle">{compliance.note}</p>
                  </div>
                </div>
                <div className="ledger-row ledger-row--wrap">
                  <div className="ledger-row">
                    <strong className="ledger-metric-card__value ledger-metric-card__value--xl">
                      {compliance.pct ?? 0}%
                    </strong>
                    <Badge
                      color={
                        compliance.pct >= 70 ? 'green' : compliance.pct >= 40 ? 'yellow' : 'red'
                      }
                    >
                      {compliance.pct >= 70
                        ? 'جيد'
                        : compliance.pct >= 40
                          ? 'يحتاج متابعة'
                          : 'ضعيف'}
                    </Badge>
                  </div>
                  {compliance.overdueCount > 0 && (
                    <span className="ledger-callout__text ledger-callout__text--warning">
                      استحقاقات متأخرة: {compliance.overdueCount}
                    </span>
                  )}
                  {compliance.completionPct != null && (
                    <span className="ledger-form-hint">
                      اكتمال التسعير: {compliance.completionPct}%
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="panel-card ledger-panel ledger-content-panel">
              <div className="ledger-panel__header">
                <div>
                  <span className="ledger-panel__eyebrow">تفصيل المصروفات</span>
                  <h4 className="ledger-panel__title">توزيع المصروفات (حسب الفئة)</h4>
                  <p className="ledger-panel__subtitle">
                    قراءة مبسطة للفئات الأعلى صرفًا داخل الدفتر النشط.
                  </p>
                </div>
              </div>
              <div className="ledger-inline-list">
                {(topBuckets || []).length === 0 ? (
                  <div className="ledger-empty-wrap__note">
                    <p className="ledger-empty-wrap__title">لا توجد مصروفات مصنفة بعد</p>
                    <p className="ledger-empty-wrap__description">
                      ستظهر الفئات الأعلى صرفًا هنا بمجرد وجود حركات مصنفة داخل الدفتر.
                    </p>
                  </div>
                ) : (
                  topBuckets.map((b) => (
                    <div key={b.bucket} className="ledger-inline-list__row">
                      <span className="ledger-inline-list__label">
                        {BUCKET_LABELS[b.bucket] || String(b.bucket || 'أخرى')}
                      </span>
                      <span className="ledger-inline-list__value">
                        <Currency value={b.total || 0} />
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          <section className="ledger-layer ledger-layer--secondary">
            <div className="ledger-layer__header">
              <span className="ledger-layer__label">الثانوي</span>
              <p className="ledger-layer__hint">
                حالة الميزانية تأتي هنا كقراءة داعمة بعد استيعاب الملخص والتقرير الرئيسي.
              </p>
            </div>
            {budgetsHealth &&
              (budgetsHealth.monthlyTarget > 0 || budgetsHealth.yearlyTarget > 0) && (
                <div className="panel-card ledger-panel ledger-control-panel">
                  <div className="ledger-panel__header">
                    <div>
                      <span className="ledger-panel__eyebrow">قراءة داعمة</span>
                      <h4 className="ledger-panel__title">الميزانية</h4>
                      <p className="ledger-panel__subtitle">
                        حالة الأهداف الحالية مقارنة بالسقف الشهري والسنوي المحدد.
                      </p>
                    </div>
                  </div>
                  <div className="ledger-row ledger-row--wrap">
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
          </section>
        </div>
      )}
    </>
  );
}

export default React.memo(LedgerReportsTab);
