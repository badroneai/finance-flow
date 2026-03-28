import { useAlerts, CriticalAlertBanner } from './alerts/AlertCenter.jsx';
import AlertCenter from './alerts/AlertCenter.jsx';

export const Topbar = ({ Icons, page, mobileOpen, setMobileOpen, headerDateText, setPage }) => {
  const {
    alerts,
    fetchTime,
    criticalFirst,
    refresh,
    handleAction,
    handleDismiss,
    handleSnooze,
    handleDismissAll,
  } = useAlerts();
  const titles = {
    pulse: 'النبض المالي',
    inbox: 'المستحقات',
    ledgers: 'الدفاتر',
    transactions: 'الحركات',
    commissions: 'العمولات',
    report: 'التقارير',
    settings: 'الإعدادات',
  };
  return (
    <header className="bg-[var(--color-surface)] border-b border-[var(--color-border)] sticky top-0 z-30 no-print flex flex-col">
      {criticalFirst && (
        <CriticalAlertBanner
          criticalFirst={criticalFirst}
          onAction={handleAction}
          onDismiss={(alert) => {
            handleDismiss(alert);
            refresh();
          }}
          setPage={setPage}
        />
      )}
      <div className="px-4 py-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            className="md:hidden hamburger-btn p-2 rounded-lg flex-shrink-0"
            onClick={() => setMobileOpen(true)}
            aria-label="فتح القائمة"
            aria-expanded={mobileOpen}
          >
            <Icons.menu size={22} />
          </button>
          <h2 className="text-lg font-bold text-[var(--color-text)] truncate">
            {titles[page] || ''}
          </h2>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {setPage && (
            <AlertCenter
              setPage={setPage}
              alerts={alerts}
              fetchTime={fetchTime}
              criticalFirst={criticalFirst}
              refresh={refresh}
              handleAction={handleAction}
              handleDismiss={handleDismiss}
              handleSnooze={handleSnooze}
              handleDismissAll={handleDismissAll}
            />
          )}
          <div
            className="text-xs text-[var(--color-muted)] text-start max-w-[14rem] sm:max-w-none whitespace-normal leading-snug"
            dir="auto"
            aria-label="التاريخ"
          >
            {headerDateText || ''}
          </div>
        </div>
      </div>
    </header>
  );
};
