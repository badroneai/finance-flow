import React from 'react';

// Stage 6.2 (1:1 refactor): extracted from LedgersPage header block
export function LedgerHeader({ tab, setTab }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 md:p-5 shadow-sm mb-4">
      <h3 className="font-bold text-gray-900 mb-1">الدفاتر</h3>
      <p className="text-sm text-gray-500">أنشئ عدة دفاتر لإدارة أكثر من جهة/مكتب (النسخة الحالية تبدأ بدفتر افتراضي).</p>

      <div className="flex flex-wrap gap-2 mt-4">
        <button type="button" onClick={() => setTab('ledgers')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === 'ledgers' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`} aria-label="دفاتر">دفاتر</button>
        <button type="button" onClick={() => setTab('recurring')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === 'recurring' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`} aria-label="التزامات متكررة">التزامات متكررة</button>
        <button type="button" onClick={() => setTab('reports')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === 'reports' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`} aria-label="تقارير الدفتر">تقارير الدفتر</button>
        <button type="button" onClick={() => setTab('performance')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === 'performance' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`} aria-label="أداء الدفتر">📈 أداء الدفتر</button>
      </div>
    </div>
  );
}
