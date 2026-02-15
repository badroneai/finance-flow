/*
  صفحة لوحة التحكم — مستخرجة من App.jsx (الخطوة 3)
*/
import React, { useState } from 'react';
import { dataStore } from '../core/dataStore.js';
import {
  getDashboardDateRange,
  computeIncomeExpenseNet,
  splitCommissionsByStatus,
  computeCommissionOfficeTotals,
  buildChartDataForRange,
} from '../domain/index.js';
import { DASHBOARD_PERIOD_OPTIONS } from '../constants/index.js';
import { SummaryCard, Icons } from '../ui/ui-common.jsx';
import { Currency, formatNum } from '../utils/format.jsx';

export function DashboardPage() {
  const [periodType, setPeriodType] = useState('thisMonth');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const range = getDashboardDateRange(periodType, fromDate, toDate);
  const txs = dataStore.transactions.list({ fromDate: range.from, toDate: range.to });
  const allCms = dataStore.commissions.list();

  const { income, expense, net } = computeIncomeExpenseNet(txs);
  const { pendingCms, paidCms } = splitCommissionsByStatus(allCms);
  const { pendingTotal, paidTotal } = computeCommissionOfficeTotals(pendingCms, paidCms);

  // الرسم والبطاقات يعتمدان على نفس الفترة: نفس الحركات (txs) ونفس النطاق (range) — الأرقام متطابقة
  const chartData =
    range.from && range.to
      ? buildChartDataForRange(txs, range.from, range.to)
      : { months: [], maxVal: 1 };
  const chartTitleByPeriod = {
    thisMonth: 'الدخل والخرج — هذا الشهر',
    last3: 'الدخل والخرج — آخر 3 أشهر',
    last6: 'الدخل والخرج — آخر 6 أشهر',
    thisYear: 'الدخل والخرج — هذا العام',
    custom: 'الدخل والخرج — الفترة المختارة',
  };
  const chartTitle = chartTitleByPeriod[periodType] || 'الدخل والخرج';

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto print-container">
      {/* Period Filter */}
      <div className="flex flex-wrap gap-2 mb-6 no-print">
        {DASHBOARD_PERIOD_OPTIONS.map(opt => (
          <button key={opt.v} onClick={() => setPeriodType(opt.v)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${periodType === opt.v ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`} aria-label={opt.l}>{opt.l}</button>
        ))}
        {periodType === 'custom' && (
          <div className="flex gap-2 items-center">
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1 text-sm" aria-label="من تاريخ"/>
            <span className="text-gray-400 text-sm">إلى</span>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1 text-sm" aria-label="إلى تاريخ"/>
          </div>
        )}
      </div>

      {/* Summary Cards — موبايل: البطاقة الأخيرة بعرض كامل (الدفعة 3) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
        <SummaryCard label="إجمالي الدخل" value={<Currency value={income} />} color="green" icon={<Icons.arrowUp size={16}/>}/>
        <SummaryCard label="إجمالي الخرج" value={<Currency value={expense} />} color="red" icon={<Icons.arrowDown size={16}/>}/>
        <SummaryCard label="الصافي" value={<Currency value={net} />} color={net >= 0 ? 'blue' : 'red'}/>
        <SummaryCard label="عمولات معلقة" value={<Currency value={pendingTotal} />} color="yellow"/>
        <div className="col-span-2 md:col-span-1">
          <SummaryCard label="عمولات مدفوعة" value={<Currency value={paidTotal} />} color="green"/>
        </div>
      </div>

      {/* Bar Chart — يتغير حسب الفترة المختارة */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-6">{chartTitle}</h3>
        <div className="flex items-end gap-3 h-48">
          {chartData.months.length === 0 ? (
            <p className="text-sm text-gray-500 col-span-full">لا توجد حركات في الفترة المختارة.</p>
          ) : chartData.months.map((m, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="flex gap-1 items-end w-full justify-center" style={{height:'180px'}}>
                <div className="bg-green-500 rounded-t w-5 transition-all" style={{height: `${Math.max((m.income / chartData.maxVal) * 160, 2)}px`}} title={`دخل: ${formatNum(m.income)}`}/>
                <div className="bg-red-400 rounded-t w-5 transition-all" style={{height: `${Math.max((m.expense / chartData.maxVal) * 160, 2)}px`}} title={`خرج: ${formatNum(m.expense)}`}/>
              </div>
              <span className="text-xs text-gray-500 mt-1">{m.label}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-4 justify-center mt-4">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-green-500"/><span className="text-xs text-gray-500">دخل</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-red-400"/><span className="text-xs text-gray-500">خرج</span></div>
        </div>
      </div>
    </div>
  );
}
