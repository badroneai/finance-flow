import React from 'react';

// Stage 6.2 (1:1 refactor): extracted from LedgersPage header block. P2 #19: تبويبات ثابتة + معالج واحد.
const LEDGER_TABS = [
  { id: 'ledgers', label: 'الدفاتر' },
  { id: 'recurring', label: 'الالتزامات' },
  { id: 'performance', label: 'الأداء والتحليلات' },
  { id: 'reports', label: 'التقارير' },
  { id: 'compare', label: 'المقارنة' },
];

export function LedgerHeader({ tab, onTabSelect }) {
  const handleClick = (e) => {
    const id = e.currentTarget.dataset.tab;
    if (id) onTabSelect(id);
  };
  return (
    <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 md:p-5 shadow-sm mb-4">
      <h3 className="font-bold text-[var(--color-text)] mb-1">الدفاتر</h3>
      <p className="text-sm text-[var(--color-muted)]">أنشئ عدة دفاتر لإدارة أكثر من جهة/مكتب (النسخة الحالية تبدأ بدفتر افتراضي).</p>

      <div className="flex flex-wrap gap-2 mt-4" role="tablist" aria-label="تبويبات الدفاتر">
        {LEDGER_TABS.map(({ id, label }) => (
          <button key={id} type="button" id={`tab-${id}`} data-tab={id} role="tab" aria-selected={tab === id} aria-controls={`tabpanel-${id}`} onClick={handleClick} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === id ? 'bg-blue-600 text-white' : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-muted)] hover:bg-[var(--color-bg)]'}`}>{label}</button>
        ))}
      </div>
    </div>
  );
}
