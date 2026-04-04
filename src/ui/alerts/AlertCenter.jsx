/*
  مركز التنبيهات — برومبت 3.2
  شارة على أيقونة الجرس، لوحة منبثقة (slide-down)، بانر ثابت للتنبيه الحرج.
  SPR-006: يستخدم DataContext لتوفير البيانات لـ generateSmartAlerts بدلاً من localStorage فقط.
*/
import { useState, useEffect, useRef, useCallback } from 'react';
import { generateSmartAlerts } from '../../core/alert-engine.js';
import { getActiveLedgerId } from '../../core/ledger-store.js';
import { AlertManager } from '../../core/alert-manager.js';
import { useData } from '../../contexts/DataContext.jsx';
import { formatCurrency } from '../../utils/format.jsx';

const ICON_BY_TYPE = {
  cashflow_crisis: 'cashflow',
  spending_anomaly: 'chart',
  missed_income: 'income',
  health_trend: 'trend',
  dormant_commitment: 'clock',
  contract_expiring: 'contract',
  contract_expired: 'contract',
};

function BellIcon({ size = 22, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}

function formatHoursAgo(ms) {
  if (ms == null || ms < 0) return '';
  const h = Math.floor(ms / (60 * 60 * 1000));
  if (h < 1) return 'منذ أقل من ساعة';
  if (h === 1) return 'منذ ساعة';
  if (h < 24) return `منذ ${h} ساعة`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'منذ يوم';
  return `منذ ${d} يوم`;
}

export function useAlerts() {
  const {
    transactions,
    recurringItems,
    ledgers,
    activeLedgerId: ctxActiveLedgerId,
    contracts,
    properties,
    contacts,
  } = useData();

  const [alerts, setAlerts] = useState([]);
  const [fetchTime, setFetchTime] = useState(() => Date.now());
  const refresh = useCallback(() => {
    AlertManager.cleanup();
    // DataContext first, fallback to localStorage
    const lid = ctxActiveLedgerId || getActiveLedgerId() || '';
    const list = lid
      ? generateSmartAlerts(lid, {
          transactions,
          recurringItems,
          ledgers,
          contracts,
          properties,
          contacts,
        })
      : [];
    setAlerts(Array.isArray(list) ? list : []);
    setFetchTime(Date.now());
  }, [ctxActiveLedgerId, transactions, recurringItems, ledgers, contracts, properties, contacts]);
  useEffect(() => {
    refresh();
  }, [refresh]);
  useEffect(() => {
    window.addEventListener('ledger:activeChanged', refresh);
    return () => window.removeEventListener('ledger:activeChanged', refresh);
  }, [refresh]);
  const criticalFirst = alerts.find((a) => a.severity === 'critical');
  const handleAction = useCallback((alert, setPage) => {
    const type = alert?.actionType || '';
    if (type === 'record_payment' || type === 'prepare_payment') setPage?.('inbox');
    else if (type === 'review_transaction') setPage?.('transactions');
    else if (type === 'view_contract') setPage?.('contracts');
    else if (type === 'review_forecast') setPage?.('ledgers');
    else setPage?.('inbox');
  }, []);
  const handleDismiss = useCallback((alert) => {
    AlertManager.dismiss(alert.id, alert.type);
  }, []);
  const handleSnooze = useCallback((alert) => {
    AlertManager.snooze(alert.id, 24);
  }, []);
  const handleDismissAll = useCallback(() => {
    alerts.forEach((a) => AlertManager.dismiss(a.id, a.type));
  }, [alerts]);
  return {
    alerts,
    fetchTime,
    criticalFirst,
    refresh,
    handleAction,
    handleDismiss,
    handleSnooze,
    handleDismissAll,
  };
}

export function CriticalAlertBanner({ criticalFirst, onAction, onDismiss, setPage }) {
  if (!criticalFirst) return null;
  return (
    <div
      className="w-full text-white px-4 py-2.5 flex items-center justify-between gap-3 no-print"
      style={{ background: 'var(--color-danger)' }}
      role="alert"
      dir="rtl"
    >
      <p className="text-sm font-medium truncate flex-1 min-w-0">{criticalFirst.title}</p>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          type="button"
          onClick={() => {
            onAction(criticalFirst, setPage);
          }}
          className="px-3 py-1 rounded bg-[var(--color-surface)]/20 text-white text-xs font-medium hover:bg-[var(--color-surface)]/30"
        >
          {criticalFirst.actionLabel || 'اتخذ إجراء'}
        </button>
        <button
          type="button"
          onClick={() => onDismiss(criticalFirst)}
          className="px-3 py-1 rounded bg-[var(--color-surface)]/20 text-white text-xs font-medium hover:bg-[var(--color-surface)]/30"
          aria-label="رفض"
        >
          رفض
        </button>
      </div>
    </div>
  );
}

export default function AlertCenter({
  setPage,
  alerts,
  fetchTime,
  refresh,
  handleAction,
  handleDismiss,
  handleSnooze,
  handleDismissAll,
}) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  const count = alerts.length;
  const hasCritical = alerts.some((a) => a.severity === 'critical');

  const onAction = (alert) => {
    handleAction(alert, setPage);
    setOpen(false);
  };

  const onDismiss = (alert) => {
    handleDismiss(alert);
    refresh();
  };

  const onSnooze = (alert) => {
    handleSnooze(alert);
    refresh();
  };

  const onDismissAll = () => {
    handleDismissAll();
    refresh();
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        const btn = e.target?.closest?.('[data-alert-bell]');
        if (!btn) setOpen(false);
      }
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [open]);

  return (
    <div className="relative flex items-center" ref={panelRef} data-alert-bell>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`relative p-2 rounded-lg text-[var(--color-muted)] hover:bg-[var(--color-bg)] hover:text-[var(--color-text)] ${hasCritical ? 'animate-pulse' : ''}`}
        aria-label={count ? `${count} تنبيه` : 'مركز التنبيهات'}
        aria-expanded={open}
      >
        <BellIcon size={22} />
        {count > 0 && (
          <span
            className="absolute -top-0.5 -end-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-white text-[11px] font-bold leading-none"
            style={{ background: 'var(--color-danger)' }}
          >
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {/* اللوحة المنبثقة */}
      {open && (
        <div
          className="absolute top-full end-0 mt-1 w-[min(360px,100vw-2rem)] max-h-[70vh] overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl z-50 flex flex-col"
          dir="rtl"
        >
          <div className="px-4 py-3 border-b border-[var(--color-border)] flex items-center justify-between">
            <h3 className="font-semibold text-[var(--color-text)]">التنبيهات</h3>
            {count > 0 && (
              <button
                type="button"
                onClick={onDismissAll}
                className="text-xs font-medium"
                style={{ color: 'var(--color-muted)' }}
                onMouseEnter={(e) => (e.target.style.color = 'var(--color-danger)')}
                onMouseLeave={(e) => (e.target.style.color = 'var(--color-muted)')}
              >
                مسح الكل
              </button>
            )}
          </div>
          <ul className="overflow-y-auto flex-1 divide-y divide-[var(--color-border)]">
            {count === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-[var(--color-muted)]">
                لا توجد تنبيهات
              </li>
            ) : (
              alerts.map((alert) => (
                <li key={alert.id} className="px-4 py-3">
                  <div className="flex gap-3">
                    <span
                      className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs"
                      style={{
                        background:
                          alert.severity === 'critical'
                            ? 'var(--color-danger)'
                            : alert.severity === 'warning'
                              ? 'var(--color-warning)'
                              : 'var(--color-info)',
                      }}
                      aria-hidden="true"
                    >
                      {ICON_BY_TYPE[alert.type] ? String(alert.type).slice(0, 1) : '•'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-[var(--color-text)] text-sm">{alert.title}</p>
                      <p className="text-xs text-[var(--color-muted)] mt-0.5">
                        {formatHoursAgo(Date.now() - fetchTime)}
                        {alert.amount > 0 && ` · ${formatCurrency(alert.amount)}`}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => onAction(alert)}
                          className="text-xs font-medium"
                          style={{ color: 'var(--color-info)' }}
                          onMouseEnter={(e) => (e.target.style.opacity = '0.8')}
                          onMouseLeave={(e) => (e.target.style.opacity = '1')}
                        >
                          {alert.actionLabel || 'اتخذ إجراء'}
                        </button>
                        <button
                          type="button"
                          onClick={() => onDismiss(alert)}
                          className="text-xs font-medium text-[var(--color-muted)] hover:text-[var(--color-text)]"
                        >
                          رفض
                        </button>
                        <button
                          type="button"
                          onClick={() => onSnooze(alert)}
                          className="text-xs font-medium text-[var(--color-muted)] hover:text-[var(--color-text)]"
                        >
                          تأجيل
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
