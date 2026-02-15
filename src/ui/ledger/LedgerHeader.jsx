import React from 'react';

// Stage 6.2 (1:1 refactor): extracted from LedgersPage header block. P2 #19: تبويبات ثابتة + معالج واحد.
const LEDGER_TABS = [
  { id: 'ledgers', label: 'دفاتر' },
  { id: 'recurring', label: 'التزامات متكررة' },
  { id: 'reports', label: 'تقارير الدفتر' },
  { id: 'performance', label: 'أداء الدفتر' },
  { id: 'compare', label: 'مقارنة الدفاتر' },
];

export function LedgerHeader({ tab, onTabSelect }) {
  const handleClick = (e) => {
    const id = e.currentTarget.dataset.tab;
    if (id) onTabSelect(id);
  };
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 md:p-5 shadow-sm mb-4">
      <h3 className="font-bold text-gray-900 mb-1">الدفاتر</h3>
      <p className="text-sm text-gray-500">أنشئ عدة دفاتر لإدارة أكثر من جهة/مكتب (النسخة الحالية تبدأ بدفتر افتراضي).</p>

      <div className="flex flex-wrap gap-2 mt-4" role="tablist" aria-label="تبويبات الدفاتر">
        {LEDGER_TABS.map(({ id, label }) => (
          <button key={id} type="button" id={`tab-${id}`} data-tab={id} role="tab" aria-selected={tab === id} aria-controls={`tabpanel-${id}`} onClick={handleClick} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === id ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{label}</button>
        ))}
      </div>
    </div>
  );
}
