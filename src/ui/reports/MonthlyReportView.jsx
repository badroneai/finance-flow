/**
 * MonthlyReportView.jsx — واجهة التقرير الشهري (برومبت 5.2)
 * عرض التقرير بتصميم A4 عمودي، شعار قيد العقار، أقسام واضحة، تصدير PDF ومشاركة.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { generateMonthlyReport } from '../../core/monthly-report-generator.js';
import { printReport, getReportFilename, shareReport } from '../../utils/report-to-pdf.js';
import { formatNumber } from '../../utils/format.jsx';

const MONTH_NAMES = ['', 'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

function PieChart({ items, total, size = 120, strokeWidth = 12 }) {
  if (!total || !Array.isArray(items) || items.length === 0) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block mx-auto" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={(size - strokeWidth) / 2} fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth} />
      </svg>
    );
  }
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  let offset = 0;
  const colors = ['#059669', '#2563eb', '#7c3aed', '#dc2626', '#ea580c', '#ca8a04', '#0891b2', '#4f46e5'];
  const segments = items.map((item, i) => {
    const pct = total > 0 ? item.amount / total : 0;
    const dash = 2 * Math.PI * r * pct;
    const seg = { dash, color: colors[i % colors.length], offset };
    offset += dash;
    return seg;
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block mx-auto" aria-hidden="true">
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

export function MonthlyReportView({ report: reportProp, ledgerId, month, year, onBack, setPage }) {
  const [report, setReport] = useState(reportProp || null);
  const [loading, setLoading] = useState(!reportProp && !!(ledgerId && month && year));
  const [error, setError] = useState(null);
  const printRef = useRef(null);

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
      const data = await generateMonthlyReport(lid, m, y);
      setReport(data);
    } catch (e) {
      setError(e?.message || 'تعذر تحميل التقرير');
    } finally {
      setLoading(false);
    }
  }, [reportProp, ledgerId, month, year]);

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

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center" dir="rtl">
        <p className="text-gray-500">جاري تحميل التقرير…</p>
      </div>
    );
  }
  if (error || !report) {
    return (
      <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3" dir="rtl">
        <p className="text-red-600">{error || 'لا توجد بيانات التقرير'}</p>
        {onBack && (
          <button type="button" onClick={onBack} className="px-4 py-2 rounded-lg bg-gray-100 text-gray-800">
            رجوع
          </button>
        )}
      </div>
    );
  }

  const { meta, summary, incomeBreakdown, expenseBreakdown, commitments, highlights, nextMonthForecast, transactions } = report;
  const monthLabel = `${MONTH_NAMES[meta.month] || meta.month} ${meta.year}`;
  const incomeTotal = summary?.totalIncome || 0;
  const expenseTotal = summary?.totalExpense || 0;

  return (
    <div className="max-w-[210mm] mx-auto bg-white" dir="rtl">
      {/* أزرار التصدير والمشاركة (تُخفى عند الطباعة) */}
      <div className="no-print flex flex-wrap gap-2 mb-4 sticky top-0 z-10 bg-white/95 py-2 border-b border-gray-100">
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
          aria-label="تصدير PDF"
        >
          تصدير PDF
        </button>
        {typeof navigator !== 'undefined' && navigator.share && (
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50"
            aria-label="مشاركة"
          >
            مشاركة
          </button>
        )}
        {(onBack || setPage) && (
          <button
            type="button"
            onClick={() => (onBack ? onBack() : setPage?.('ledgers'))}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm hover:bg-gray-50"
          >
            رجوع
          </button>
        )}
      </div>

      <div ref={printRef} className="monthly-report-print bg-white text-gray-900 p-6 md:p-8 rounded-xl border border-gray-100">
        {/* شعار وعنوان */}
        <header className="text-center border-b border-gray-200 pb-4 mb-6">
          <h1 className="text-xl font-bold text-[var(--qa-navy,#0F1C2E)]">قيد العقار</h1>
          <p className="text-sm text-gray-500 mt-1">التقرير الشهري</p>
          <p className="font-semibold text-gray-800 mt-2">{meta.ledgerName}</p>
          <p className="text-sm text-gray-600">{monthLabel}</p>
        </header>

        {/* ملخص */}
        <section className="mb-6">
          <h2 className="text-base font-bold text-gray-800 mb-3">ملخص الشهر</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <div className="text-xs text-gray-500">رصيد الافتتاح</div>
              <div className="text-lg font-bold">{formatNumber(summary.openingBalance)} ر.س</div>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <div className="text-xs text-gray-500">رصيد الإغلاق</div>
              <div className="text-lg font-bold">{formatNumber(summary.closingBalance)} ر.س</div>
            </div>
            <div className="p-3 rounded-xl bg-green-50 border border-green-100">
              <div className="text-xs text-green-700">إجمالي الدخل</div>
              <div className="text-lg font-bold text-green-700">{formatNumber(summary.totalIncome)} ر.س</div>
            </div>
            <div className="p-3 rounded-xl bg-red-50 border border-red-100">
              <div className="text-xs text-red-700">إجمالي المصروف</div>
              <div className="text-lg font-bold text-red-700">{formatNumber(summary.totalExpense)} ر.س</div>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-4">
            <span className="text-sm">
              صافي التدفق: <strong className={summary.netCashflow >= 0 ? 'text-green-700' : 'text-red-700'}>{formatNumber(summary.netCashflow)} ر.س</strong>
            </span>
            <span className="text-sm text-gray-600">درجة الصحة: {summary.healthScore}</span>
            <span className="text-sm text-gray-600">الاتجاه: {summary.healthTrend}</span>
          </div>
        </section>

        {/* تفصيل الدخل */}
        <section className="mb-6">
          <h2 className="text-base font-bold text-gray-800 mb-3">تفصيل الدخل</h2>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-right py-2 px-2">المصدر</th>
                    <th className="text-left py-2 px-2">المبلغ</th>
                    <th className="text-left py-2 px-2">النسبة</th>
                    <th className="text-left py-2 px-2">العدد</th>
                  </tr>
                </thead>
                <tbody>
                  {(incomeBreakdown || []).map((row, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="py-1.5 px-2">{row.source || '—'}</td>
                      <td className="py-1.5 px-2">{formatNumber(row.amount)} ر.س</td>
                      <td className="py-1.5 px-2">{formatNumber(row.percentage)}%</td>
                      <td className="py-1.5 px-2">{row.count ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex-shrink-0">
              <PieChart items={incomeBreakdown || []} total={incomeTotal} size={120} />
            </div>
          </div>
        </section>

        {/* تفصيل المصروفات */}
        <section className="mb-6">
          <h2 className="text-base font-bold text-gray-800 mb-3">تفصيل المصروفات</h2>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-right py-2 px-2">الفئة</th>
                    <th className="text-left py-2 px-2">المبلغ</th>
                    <th className="text-left py-2 px-2">النسبة</th>
                    <th className="text-left py-2 px-2">العدد</th>
                  </tr>
                </thead>
                <tbody>
                  {(expenseBreakdown || []).map((row, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="py-1.5 px-2">{row.category || '—'}</td>
                      <td className="py-1.5 px-2">{formatNumber(row.amount)} ر.س</td>
                      <td className="py-1.5 px-2">{formatNumber(row.percentage)}%</td>
                      <td className="py-1.5 px-2">{row.count ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex-shrink-0">
              <PieChart items={expenseBreakdown || []} total={expenseTotal} size={120} />
            </div>
          </div>
        </section>

        {/* الالتزامات */}
        <section className="mb-6">
          <h2 className="text-base font-bold text-gray-800 mb-3">الالتزامات</h2>
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
            <div className="flex flex-wrap justify-between gap-2 mb-2 text-sm">
              <span>مستحقات الشهر: {formatNumber(commitments?.totalDue || 0)} ر.س</span>
              <span>مدفوع: {formatNumber(commitments?.totalPaid || 0)} ر.س</span>
              <span>متأخر: {formatNumber(commitments?.totalOverdue || 0)} ر.س</span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-green-500 transition-all"
                style={{ width: `${Math.min(100, commitments?.complianceRate ?? 0)}%` }}
                role="progressbar"
                aria-valuenow={commitments?.complianceRate ?? 0}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
            <p className="text-sm text-gray-600 mt-1">نسبة الالتزام: {commitments?.complianceRate ?? 0}%</p>
          </div>
        </section>

        {/* أبرز الأحداث */}
        <section className="mb-6">
          <h2 className="text-base font-bold text-gray-800 mb-3">أبرز الأحداث</h2>
          <ul className="space-y-1">
            {(highlights || []).map((h, i) => (
              <li
                key={i}
                className={`px-3 py-2 rounded-lg text-sm ${
                  h.type === 'positive' ? 'bg-green-50 text-green-800' : h.type === 'negative' ? 'bg-red-50 text-red-800' : 'bg-gray-50 text-gray-700'
                }`}
              >
                {h.message}
              </li>
            ))}
          </ul>
        </section>

        {/* توقعات الشهر القادم */}
        <section className="mb-6">
          <h2 className="text-base font-bold text-gray-800 mb-3">توقعات الشهر القادم</h2>
          <div className="p-4 rounded-xl border border-gray-200">
            <div className="flex flex-wrap gap-4 text-sm mb-2">
              <span>دخل متوقع: {formatNumber(nextMonthForecast?.expectedIncome || 0)} ر.س</span>
              <span>مصروف متوقع: {formatNumber(nextMonthForecast?.expectedExpense || 0)} ر.س</span>
              <span>صافي متوقع: <strong>{formatNumber(nextMonthForecast?.expectedNet || 0)} ر.س</strong></span>
            </div>
            {(nextMonthForecast?.risks || []).length > 0 && (
              <ul className="list-disc list-inside text-amber-700 text-sm mt-2">
                {nextMonthForecast.risks.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* حركات الشهر (ملخص) */}
        {Array.isArray(transactions) && transactions.length > 0 && (
          <section className="mb-4">
            <h2 className="text-base font-bold text-gray-800 mb-3">حركات الشهر ({transactions.length})</h2>
            <div className="max-h-48 overflow-y-auto border border-gray-100 rounded-lg">
              <table className="w-full text-sm border-collapse">
                <thead className="sticky top-0 bg-gray-50">
                  <tr className="border-b border-gray-200">
                    <th className="text-right py-1.5 px-2">التاريخ</th>
                    <th className="text-right py-1.5 px-2">النوع</th>
                    <th className="text-right py-1.5 px-2">الفئة</th>
                    <th className="text-left py-1.5 px-2">المبلغ</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 50).map((t) => (
                    <tr key={t.id || t.date + t.amount} className="border-b border-gray-50">
                      <td className="py-1 px-2">{t.date}</td>
                      <td className="py-1 px-2">{t.type === 'income' ? 'دخل' : 'مصروف'}</td>
                      <td className="py-1 px-2">{t.category || '—'}</td>
                      <td className={`py-1 px-2 font-medium ${t.type === 'income' ? 'text-green-700' : 'text-red-700'}`}>{formatNumber(t.amount)} ر.س</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {transactions.length > 50 && <p className="text-xs text-gray-500 p-2">عرض 50 من {transactions.length} حركة</p>}
            </div>
          </section>
        )}

        <footer className="text-center text-xs text-gray-500 pt-4 border-t border-gray-100">
          تم إنشاء التقرير في {meta.generatedAt ? new Date(meta.generatedAt).toLocaleString('ar-SA') : '—'}
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
