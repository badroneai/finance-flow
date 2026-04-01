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
  const subtitles = {
    pulse: 'ملخص سريع لصحة التدفق والحركة القادمة.',
    inbox: 'تابع البنود المستحقة وما يحتاج إجراء اليوم.',
    ledgers: 'نظّم دفاترك وراجع الأداء والالتزامات.',
    transactions: 'سجّل الحركات المالية وفلترها بسرعة.',
    commissions: 'راجع العمولات المستحقة والمنجزة بثقة.',
    report: 'تقارير شهرية جاهزة للمراجعة والتصدير.',
    settings: 'إعدادات الواجهة والنسخ الاحتياطي والبيانات.',
  };
  return (
    <header className="topbar-shell no-print">
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
      <div className="topbar-body">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <button
            className="md:hidden hamburger-btn p-2 rounded-lg flex-shrink-0"
            onClick={() => setMobileOpen(true)}
            aria-label="فتح القائمة"
            aria-expanded={mobileOpen}
          >
            <Icons.menu size={22} />
          </button>
          <div className="topbar-heading">
            <h2 className="topbar-title truncate">{titles[page] || ''}</h2>
            <span className="topbar-subtitle">
              {subtitles[page] || 'واجهة تشغيل مالية واضحة.'}
            </span>
          </div>
        </div>
        <div className="topbar-meta">
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
          {!!headerDateText && (
            <div className="topbar-date" dir="auto" aria-label="التاريخ">
              {headerDateText}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
