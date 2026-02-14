import React, { useMemo } from 'react';

import { computePL, computeTopBuckets } from '../core/ledger-reports.js';

/** Minimal, stable Reports tab (Stage 6 stability).
 *  هدفه منع أي crash/white-screen وتقديم تقارير أساسية + CSV تصدير.
 */
export default function LedgerReportsTab(props) {
  const {
    toast,
    activeId,
    activeLedger,
    Badge,
    EmptyState,
    Currency,
    Icons,
    dataStore,
    filterTransactionsForLedgerByMeta,
  } = props;

  const txs = useMemo(() => {
    if (!activeId) return [];
    try {
      const all = dataStore?.transactions?.list ? dataStore.transactions.list() : [];
      return filterTransactionsForLedgerByMeta({ transactions: all, ledgerId: activeId });
    } catch {
      return [];
    }
  }, [activeId]);

  const pl30 = useMemo(() => {
    const now = new Date();
    const d = new Date(now.getTime());
    d.setDate(d.getDate() - 30);
    const last30 = (txs || []).filter(t => {
      const dt = new Date(String(t?.date || '') + 'T00:00:00');
      if (Number.isNaN(dt.getTime())) return false;
      return dt.getTime() >= d.getTime();
    });
    return computePL({ transactions: last30 });
  }, [txs]);

  const topBuckets = useMemo(() => {
    try {
      return computeTopBuckets({ transactions: txs || [], limit: 5 });
    } catch {
      return [];
    }
  }, [txs]);

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

            <div className="mt-3 grid md:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl border border-gray-100 bg-gray-50">
                <div className="text-xs text-gray-500">عدد الحركات</div>
                <div className="mt-1 text-xl font-bold text-gray-900">{(txs || []).length}</div>
              </div>
              <div className="p-3 rounded-xl border border-gray-100 bg-gray-50">
                <div className="text-xs text-gray-500">صافي آخر 30 يوم</div>
                <div className="mt-1 text-xl font-bold text-gray-900"><Currency value={pl30?.net || 0} /></div>
              </div>
              <div className="p-3 rounded-xl border border-gray-100 bg-gray-50">
                <div className="text-xs text-gray-500">Top Buckets</div>
                <div className="mt-2 flex flex-col gap-1">
                  {(topBuckets || []).length === 0 ? (
                    <div className="text-sm text-gray-500">—</div>
                  ) : (
                    topBuckets.map(b => (
                      <div key={b.bucket} className="text-sm text-gray-700 flex items-center justify-between gap-2">
                        <span className="truncate">{String(b.bucket || 'other')}</span>
                        <span className="font-semibold"><Currency value={b.total || 0} /></span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <p className="mt-3 text-xs text-gray-500">ملاحظة: هذه تقارير أساسية لضمان الاستقرار في Stage 6.4.</p>
          </div>
        </div>
      )}
    </>
  );
}
