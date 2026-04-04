/**
 * MonthlyReportView.jsx — واجهة التقرير الشهري (برومبت 5.2)
 * عرض التقرير بتصميم A4 عمودي، شعار قيد العقار، أقسام واضحة، تصدير PDF ومشاركة.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { generateMonthlyReport } from '../../core/monthly-report-generator.js';
import { printReport, getReportFilename, shareReport } from '../../utils/report-to-pdf.js';
// pdf-service يُحمّل ديناميكياً لتقليل حجم الحزمة الأولية
const loadPdfService = () => import('../../core/pdf-service.js');
import { useAuth } from '../../contexts/AuthContext.jsx';
import { formatCurrency, formatNumber } from '../../utils/format.jsx';

const MONTH_NAMES = [
  '',
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
];

const REPORT_PIE_COLORS = [
  'var(--color-primary)',
  'var(--color-accent)',
  'var(--color-secondary)',
  'var(--color-success)',
  'var(--color-warning)',
  'var(--color-danger)',
  'var(--color-info-light)',
  'var(--color-border-strong)',
];

function PieChart({ items, total, size = 120, strokeWidth = 12 }) {
  if (!total || !Array.isArray(items) || items.length === 0) {
    return (
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="report-pie"
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={(size - strokeWidth) / 2}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={strokeWidth}
        />
      </svg>
    );
  }
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  let offset = 0;
  const segments = items.map((item, i) => {
    const pct = total > 0 ? item.amount / total : 0;
    const dash = 2 * Math.PI * r * pct;
    const seg = { dash, color: REPORT_PIE_COLORS[i % REPORT_PIE_COLORS.length], offset };
    offset += dash;
    return seg;
  });
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="report-pie"
      aria-hidden="true"
    >
      {segments.map((seg, i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={seg.color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${seg.dash} ${2 * Math.PI * r}`}
          strokeDashoffset={-seg.offset}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      ))}
    </svg>
  );
}

export function MonthlyReportView({
  report: reportProp,
  ledgerId,
  month,
  year,
  onBack,
  setPage,
  dataOptions,
}) {
  const [report, setReport] = useState(reportProp || null);
  const [loading, setLoading] = useState(!reportProp && !!(ledgerId && month && year));
  const [error, setError] = useState(null);
  const [pdfExporting, setPdfExporting] = useState(false);
  const printRef = useRef(null);
  const { office } = useAuth();

  const loadReport = useCallback(async () => {
    if (reportProp) return;
    const lid = String(ledgerId || '').trim();
    const m = Number(month) || new Date().getMonth() + 1;
    const y = Number(year) || new Date().getFullYear();
    if (!lid) {
      setError('لم يُحدد دفتر');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await generateMonthlyReport(lid, m, y, dataOptions || {});
      setReport(data);
    } catch (e) {
      setError(e?.message || 'تعذر تحميل التقرير');
    } finally {
      setLoading(false);
    }
  }, [reportProp, ledgerId, month, year, dataOptions]);

  useEffect(() => {
    if (reportProp) setReport(reportProp);
    else loadReport();
  }, [reportProp, loadReport]);

  const handlePrint = useCallback(() => {
    const el = printRef.current;
    const filename = report?.meta ? getReportFilename(report.meta) : '';
    printReport(el, filename);
  }, [report?.meta]);

  const handleShare = useCallback(async () => {
    const title = report?.meta
      ? `تقرير قيد — ${report.meta.ledgerName} — ${MONTH_NAMES[report.meta.month] || report.meta.month} ${report.meta.year}`
      : 'تقرير قيد العقار';
    await shareReport({ title, text: title, url: window.location.href });
  }, [report?.meta]);

  const handleExportPdf = useCallback(async () => {
    if (!report || pdfExporting) return;
    setPdfExporting(true);
    try {
      const { exportMonthlyReport } = await loadPdfService();
      await exportMonthlyReport(report, { name: office?.name || office?.office_name || '' });
    } catch (e) {
      console.error('[قيد العقار] PDF export error:', e);
    } finally {
      setPdfExporting(false);
    }
  }, [report, office, pdfExporting]);

  if (loading) {
    return (
      <div className="report-loading" dir="rtl">
        <p className="report-loading__text">جاري تحميل التقرير…</p>
      </div>
    );
  }
  if (error || !report) {
    return (
      <div className="report-error" dir="rtl">
        <p className="report-error__text">{error || 'لا توجد بيانات التقرير'}</p>
        {onBack && (
          <button type="button" onClick={onBack} className="report-back-btn">
            رجوع
          </button>
        )}
      </div>
    );
  }

  const {
    meta,
    summary,
    incomeBreakdown,
    expenseBreakdown,
    commitments,
    highlights,
    nextMonthForecast,
    transactions,
  } = report;
  const monthLabel = `${MONTH_NAMES[meta.month] || meta.month} ${meta.year}`;
  const incomeTotal = summary?.totalIncome || 0;
  const expenseTotal = summary?.totalExpense || 0;

  return (
    <div className="report-page" dir="rtl">
      {/* أزرار التصدير والمشاركة (تُخفى عند الطباعة) */}
      <div className="no-print report-toolbar">
        <button
          type="button"
          onClick={handleExportPdf}
          disabled={pdfExporting}
          className={`btn-primary${pdfExporting ? ' report-btn--disabled' : ''}`}
          aria-label="تصدير PDF"
        >
          {pdfExporting ? 'جاري التصدير…' : 'تصدير PDF'}
        </button>
        <button type="button" onClick={handlePrint} className="btn-secondary" aria-label="طباعة">
          طباعة
        </button>
        {typeof navigator !== 'undefined' && navigator.share && (
          <button type="button" onClick={handleShare} className="btn-secondary" aria-label="مشاركة">
            مشاركة
          </button>
        )}
        {(onBack || setPage) && (
          <button
            type="button"
            onClick={() => (onBack ? onBack() : setPage?.('ledgers'))}
            className="btn-secondary"
          >
            رجوع
          </button>
        )}
      </div>

      <div ref={printRef} className="monthly-report-print receipt-sheet report-sheet">
        {/* شعار وعنوان */}
        <header className="report-header">
          <h1 className="report-header__title">قيد العقار</h1>
          <p className="report-header__subtitle">التقرير الشهري</p>
          <p className="report-header__ledger">{meta.ledgerName}</p>
          <p className="report-header__period">{monthLabel}</p>
        </header>

        {/* ملخص */}
        <section className="report-section report-section--spaced">
          <h2 className="report-section__title">ملخص الشهر</h2>
          <div className="report-metric-grid">
            <div className="report-metric">
              <div className="report-metric__label">رصيد الافتتاح</div>
              <div className="report-metric__value">{formatCurrency(summary.openingBalance)}</div>
            </div>
            <div className="report-metric">
              <div className="report-metric__label">رصيد الإغلاق</div>
              <div className="report-metric__value">{formatCurrency(summary.closingBalance)}</div>
            </div>
            <div className="report-metric report-metric--success">
              <div className="report-metric__label">إجمالي الدخل</div>
              <div className="report-metric__value">{formatCurrency(summary.totalIncome)}</div>
            </div>
            <div className="report-metric report-metric--danger">
              <div className="report-metric__label">إجمالي المصروف</div>
              <div className="report-metric__value">{formatCurrency(summary.totalExpense)}</div>
            </div>
          </div>
          <div className="report-summary-row">
            <span className="report-summary-row__item">
              صافي التدفق:{' '}
              <strong
                style={{
                  color: summary.netCashflow >= 0 ? 'var(--color-success)' : 'var(--color-danger)',
                }}
              >
                {formatCurrency(summary.netCashflow)}
              </strong>
            </span>
            <span className="report-summary-row__item--muted">
              درجة الصحة: {summary.healthScore}
            </span>
            <span className="report-summary-row__item--muted">الاتجاه: {summary.healthTrend}</span>
          </div>
        </section>

        {/* تفصيل الدخل */}
        <section className="report-section report-section--spaced">
          <h2 className="report-section__title">تفصيل الدخل</h2>
          <div className="report-breakdown">
            <div className="report-table-wrap report-breakdown__table">
              <table className="report-data-table">
                <thead>
                  <tr>
                    <th className="u-text-start">المصدر</th>
                    <th className="u-text-end">المبلغ</th>
                    <th className="u-text-end">النسبة</th>
                    <th className="u-text-end">العدد</th>
                  </tr>
                </thead>
                <tbody>
                  {(incomeBreakdown || []).map((row, i) => (
                    <tr key={i}>
                      <td>{row.source || '—'}</td>
                      <td>{formatCurrency(row.amount)}</td>
                      <td>{formatNumber(row.percentage)}%</td>
                      <td>{row.count ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="report-breakdown__chart">
              <PieChart items={incomeBreakdown || []} total={incomeTotal} size={120} />
            </div>
          </div>
        </section>

        {/* تفصيل المصروفات */}
        <section className="report-section report-section--spaced">
          <h2 className="report-section__title">تفصيل المصروفات</h2>
          <div className="report-breakdown">
            <div className="report-table-wrap report-breakdown__table">
              <table className="report-data-table">
                <thead>
                  <tr>
                    <th className="u-text-start">الفئة</th>
                    <th className="u-text-end">المبلغ</th>
                    <th className="u-text-end">النسبة</th>
                    <th className="u-text-end">العدد</th>
                  </tr>
                </thead>
                <tbody>
                  {(expenseBreakdown || []).map((row, i) => (
                    <tr key={i}>
                      <td>{row.category || '—'}</td>
                      <td>{formatCurrency(row.amount)}</td>
                      <td>{formatNumber(row.percentage)}%</td>
                      <td>{row.count ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="report-breakdown__chart">
              <PieChart items={expenseBreakdown || []} total={expenseTotal} size={120} />
            </div>
          </div>
        </section>

        {/* الالتزامات */}
        <section className="report-section report-section--spaced">
          <h2 className="report-section__title">الالتزامات</h2>
          <div className="report-metric">
            <div className="report-commitments__stats">
              <span>مستحقات الشهر: {formatCurrency(commitments?.totalDue || 0)}</span>
              <span>مدفوع: {formatCurrency(commitments?.totalPaid || 0)}</span>
              <span>متأخر: {formatCurrency(commitments?.totalOverdue || 0)}</span>
            </div>
            <div className="report-commitments__bar">
              <div
                className="report-commitments__fill"
                style={{
                  width: `${Math.min(100, commitments?.complianceRate ?? 0)}%`,
                }}
                role="progressbar"
                aria-valuenow={commitments?.complianceRate ?? 0}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
            <p className="report-commitments__note">
              نسبة الالتزام: {commitments?.complianceRate ?? 0}%
            </p>
          </div>
        </section>

        {/* أبرز الأحداث */}
        <section className="report-section report-section--spaced">
          <h2 className="report-section__title">أبرز الأحداث</h2>
          <ul className="report-highlights">
            {(highlights || []).map((h, i) => (
              <li
                key={i}
                className={`report-highlight ${
                  h.type === 'positive'
                    ? 'report-highlight--positive'
                    : h.type === 'negative'
                      ? 'report-highlight--negative'
                      : 'report-highlight--neutral'
                }`}
              >
                {h.message}
              </li>
            ))}
          </ul>
        </section>

        {/* توقعات الشهر القادم */}
        <section className="report-section report-section--spaced">
          <h2 className="report-section__title">توقعات الشهر القادم</h2>
          <div className="report-metric">
            <div className="report-forecast__stats">
              <span>دخل متوقع: {formatCurrency(nextMonthForecast?.expectedIncome || 0)}</span>
              <span>مصروف متوقع: {formatCurrency(nextMonthForecast?.expectedExpense || 0)}</span>
              <span>
                صافي متوقع: <strong>{formatCurrency(nextMonthForecast?.expectedNet || 0)}</strong>
              </span>
            </div>
            {(nextMonthForecast?.risks || []).length > 0 && (
              <ul className="report-risks">
                {nextMonthForecast.risks.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* حركات الشهر (ملخص) */}
        {Array.isArray(transactions) && transactions.length > 0 && (
          <section className="report-section report-section--spaced">
            <h2 className="report-section__title">حركات الشهر ({transactions.length})</h2>
            <div className="report-table-wrap report-tx-scroll">
              <table className="report-data-table">
                <thead>
                  <tr>
                    <th className="u-text-start">التاريخ</th>
                    <th className="u-text-start">النوع</th>
                    <th className="u-text-start">الفئة</th>
                    <th className="u-text-end">المبلغ</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 50).map((t) => (
                    <tr key={t.id || t.date + t.amount}>
                      <td>{t.date}</td>
                      <td>{t.type === 'income' ? 'دخل' : 'مصروف'}</td>
                      <td>{t.category || '—'}</td>
                      <td
                        className={
                          t.type === 'income' ? 'report-cell--income' : 'report-cell--expense'
                        }
                      >
                        {formatCurrency(t.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {transactions.length > 50 && (
                <p className="report-tx-note">عرض 50 من {transactions.length} حركة</p>
              )}
            </div>
          </section>
        )}

        <footer className="report-footer">
          تم إنشاء التقرير في{' '}
          {meta.generatedAt ? new Date(meta.generatedAt).toLocaleString('ar-SA') : '—'}
        </footer>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body * { visibility: hidden; }
          .monthly-report-print, .monthly-report-print * { visibility: visible; }
          .monthly-report-print { position: absolute; left: 0; top: 0; width: 100%; max-width: 100%; box-shadow: none; border: none; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
}

export default MonthlyReportView;
