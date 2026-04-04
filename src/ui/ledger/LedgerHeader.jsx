// هيدر الدفاتر — Context Bar موحّد ضمن ledger-* namespace
const LEDGER_TABS = [
  {
    id: 'ledgers',
    label: 'الدفاتر',
    icon: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z',
  },
  { id: 'recurring', label: 'الالتزامات', icon: 'M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z' },
  { id: 'performance', label: 'الأداء', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
  {
    id: 'reports',
    label: 'التقارير',
    icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z',
  },
  {
    id: 'compare',
    label: 'المقارنة',
    icon: 'M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm0 0V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10m-6 0a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2m0 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z',
  },
];

export function LedgerHeader({ tab, onTabSelect }) {
  const handleClick = (e) => {
    const id = e.currentTarget.dataset.tab;
    if (id) onTabSelect(id);
  };
  return (
    <div className="ledger-context-bar">
      <div className="ledger-context-bar__top">
        <div className="ledger-context-bar__copy">
          <span className="page-kicker">المحفظة التشغيلية</span>
          <h1 className="ledger-context-bar__title">الدفاتر</h1>
        </div>
        <p className="ledger-context-bar__subtitle">
          إنشاء وإدارة الدفاتر المالية — الالتزامات والأداء والتقارير.
        </p>
      </div>

      <nav className="ledger-context-bar__nav" role="tablist" aria-label="تبويبات الدفاتر">
        {LEDGER_TABS.map(({ id, label, icon }) => (
          <button
            key={id}
            type="button"
            id={`tab-${id}`}
            data-tab={id}
            role="tab"
            aria-selected={tab === id}
            aria-controls={`tabpanel-${id}`}
            onClick={handleClick}
            className={`ledger-context-bar__tab ${tab === id ? 'ledger-context-bar__tab--active' : ''}`}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d={icon} />
            </svg>
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
