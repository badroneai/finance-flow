
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
    <div className="panel-card bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 md:p-5 mb-4">
      <div className="page-header mb-0">
        <div className="page-header-copy">
          <span className="page-kicker">المحفظة التشغيلية</span>
          <h1 className="page-title">الدفاتر</h1>
          <p className="page-subtitle">
            أنشئ دفاتر متعددة لإدارة أكثر من جهة أو أصل، ثم انتقل بين الالتزامات والأداء والتقارير.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-4" role="tablist" aria-label="تبويبات الدفاتر">
        {LEDGER_TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            id={`tab-${id}`}
            data-tab={id}
            role="tab"
            aria-selected={tab === id}
            aria-controls={`tabpanel-${id}`}
            onClick={handleClick}
            className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors ${tab === id ? 'bg-[var(--color-primary)] text-[var(--color-text-inverse)] shadow-sm' : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-muted)] hover:bg-[var(--color-surface-hover)]'}`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
