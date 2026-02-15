import React, { useMemo } from 'react';

import { computePL, computeTopBuckets } from '../core/ledger-reports.js';

/** Minimal, stable Reports tab (Stage 6 stability).
 *  هدفه منع أي crash/white-screen وتقديم تقارير أساسية + CSV تصدير.
 */
const fallbackCurrency = ({ value }) => <span>{Number(value) != null ? Number(value).toLocaleString('ar-SA', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : '0'} ر.س</span>;
const fallbackEmpty = ({ message }) => <div className="flex flex-col items-center justify-center py-16 text-gray-400"><p className="mt-4 text-sm">{message}</p></div>;
const fallbackBadge = ({ children }) => <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">{children}</span>;

const BUCKET_LABELS = {
  operational: 'تشغيلي',
  maintenance: 'صيانة',
  marketing: 'تسويق',
  system: 'نظام',
  adhoc: 'مرة واحدة',
  other: 'أخرى',
  uncategorized: 'غير مصنف',
};

export default function LedgerReportsTab(props) {
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
      const last30 = (txs || []).filter(t => {
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
      const last365 = (txs || []).filter(t => {
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

  const csvEscape = (v) => {
    const s = v == null ? '' : String(v);
    if (/[,\r\n"]/g.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  };

  const downloadCSV = ({ filename, headers, rows }) => {
    const BOM = '\uFEFF';
    const all = [headers, ...rows]
      .map(r => r.map(csvEscape).join(','))
      .join('\n');
    const blob = new Blob([BOM + all], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const exportLedgerTxCSV = () => {
    if (!activeId) return;
    const rows = (txs || []).map(t => [
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
      headers: ['date', 'type', 'category', 'amount', 'paymentMethod', 'description', 'meta.ledgerId', 'meta.recurringId'],
      rows,
    });
    toast?.('تم تصدير CSV');
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-100 p-4 md:p-5 shadow-sm mb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 className="font-bold text-gray-900">تقارير الدفتر</h4>
            <p className="text-sm text-gray-500 mt-1">دفتر نشط: <span className="font-medium text-gray-700">{activeLedger?.name || '—'}</span></p>
            <p className="text-xs text-gray-500 mt-1">هذه الصفحة تعرض تقارير مبنية على الحركات المرتبطة بالدفتر (meta).</p>
          </div>
          {!activeId && <Badge color="yellow">اختر دفترًا نشطًا</Badge>}
        </div>
      </div>

      {!activeId ? (
        <EmptyState message="اختر دفترًا نشطًا لعرض التقارير" />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-4 md:p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-bold text-gray-900">ملخص سريع</div>
              <button type="button" onClick={exportLedgerTxCSV} className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50" aria-label="تصدير CSV">تصدير CSV</button>
            </div>

            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl border border-gray-100 bg-gray-50">
                <div className="text-xs text-gray-500">عدد الحركات</div>
                <div className="mt-1 text-xl font-bold text-gray-900">{(txs || []).length}</div>
              </div>
              <div className="p-3 rounded-xl border border-gray-100 bg-gray-50">
                <div className="text-xs text-gray-500">صافي آخر 30 يوم</div>
                <div className="mt-1 text-xl font-bold text-gray-900"><Currency value={pl30?.net || 0} /></div>
              </div>
              <div className="p-3 rounded-xl border border-gray-100 bg-gray-50">
                <div className="text-xs text-gray-500">صافي آخر سنة</div>
                <div className="mt-1 text-xl font-bold text-gray-900"><Currency value={pl365?.net ?? 0} /></div>
              </div>
              <div className="p-3 rounded-xl border border-gray-100 bg-gray-50">
                <div className="text-xs text-gray-500">دخل 30 يوم</div>
                <div className="mt-1 text-lg font-bold text-green-700"><Currency value={pl30?.income ?? 0} /></div>
              </div>
              <div className="p-3 rounded-xl border border-gray-100 bg-gray-50 col-span-2 md:col-span-1">
                <div className="text-xs text-gray-500">مصروف 30 يوم</div>
                <div className="mt-1 text-lg font-bold text-red-700"><Currency value={pl30?.expense ?? 0} /></div>
              </div>
            </div>
          </div>

          {compliance != null && (
            <div className="bg-white rounded-xl border border-gray-100 p-4 md:p-5 shadow-sm">
              <h4 className="font-bold text-gray-900 mb-2">درجة الالتزام</h4>
              <p className="text-sm text-gray-600 mb-2">{compliance.note}</p>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-gray-900">{compliance.pct ?? 0}%</span>
                  <Badge color={compliance.pct >= 70 ? 'green' : compliance.pct >= 40 ? 'yellow' : 'red'}>
                    {compliance.pct >= 70 ? 'جيد' : compliance.pct >= 40 ? 'يحتاج متابعة' : 'ضعيف'}
                  </Badge>
                </div>
                {compliance.overdueCount > 0 && (
                  <span className="text-sm text-amber-700">استحقاقات متأخرة: {compliance.overdueCount}</span>
                )}
                {compliance.completionPct != null && (
                  <span className="text-xs text-gray-500">اكتمال التسعير: {compliance.completionPct}%</span>
                )}
              </div>
            </div>
          )}

          {budgetsHealth && (budgetsHealth.monthlyTarget > 0 || budgetsHealth.yearlyTarget > 0) && (
            <div className="bg-white rounded-xl border border-gray-100 p-4 md:p-5 shadow-sm">
              <h4 className="font-bold text-gray-900 mb-2">الميزانية</h4>
              <div className="flex flex-wrap gap-3 text-sm">
                {budgetsHealth.monthlyTarget > 0 && (
                  <span>شهري: <Currency value={budgetsHealth.monthlyTarget} /> — <Badge color={budgetsHealth.status === 'good' || budgetsHealth.status === 'neutral' ? 'green' : budgetsHealth.status === 'warn' ? 'yellow' : 'red'}>{budgetsHealth.status === 'good' || budgetsHealth.status === 'neutral' ? 'ضمن الهدف' : budgetsHealth.status === 'warn' ? 'قريب من الحد' : 'تجاوز'}</Badge></span>
                )}
                {budgetsHealth.yearlyTarget > 0 && (
                  <span>سنوي: <Currency value={budgetsHealth.yearlyTarget} /></span>
                )}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-100 p-4 md:p-5 shadow-sm">
            <h4 className="font-bold text-gray-900 mb-3">توزيع المصروفات (حسب الفئة)</h4>
            <div className="flex flex-col gap-2">
              {(topBuckets || []).length === 0 ? (
                <div className="text-sm text-gray-500">لا توجد مصروفات مصنفة بعد.</div>
              ) : (
                topBuckets.map(b => (
                  <div key={b.bucket} className="text-sm text-gray-700 flex items-center justify-between gap-2 py-1 border-b border-gray-50 last:border-0">
                    <span className="truncate">{BUCKET_LABELS[b.bucket] || String(b.bucket || 'أخرى')}</span>
                    <span className="font-semibold"><Currency value={b.total || 0} /></span>
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
