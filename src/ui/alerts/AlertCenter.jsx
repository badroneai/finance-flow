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
    <div className="ac--banner no-print" role="alert" dir="rtl">
      <p className="ac--banner__text">{criticalFirst.title}</p>
      <div className="ac--banner__actions">
        <button
          type="button"
          onClick={() => onAction(criticalFirst, setPage)}
          className="ac--banner__btn"
        >
          {criticalFirst.actionLabel || 'اتخذ إجراء'}
        </button>
        <button
          type="button"
          onClick={() => onDismiss(criticalFirst)}
          className="ac--banner__btn"
          aria-label="رفض"
        >
          رفض
        </button>
      </div>
    </div>
  );
}

function severityClass(severity) {
  if (severity === 'critical') return 'ac--row__icon--critical';
  if (severity === 'warning') return 'ac--row__icon--warning';
  return 'ac--row__icon--info';
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
    <div className="ac--wrap" ref={panelRef} data-alert-bell>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`ac--trigger${hasCritical ? ' is-critical' : ''}`}
        aria-label={count ? `${count} تنبيه` : 'مركز التنبيهات'}
        aria-expanded={open}
      >
        <BellIcon size={22} />
        {count > 0 && (
          <span className="ac--badge">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {/* اللوحة المنبثقة */}
      {open && (
        <div className="ac--panel" dir="rtl">
          <div className="ac--header">
            <h3 className="ac--header__title">التنبيهات</h3>
            {count > 0 && (
              <button
                type="button"
                onClick={onDismissAll}
                className="ac--header__clear"
              >
                مسح الكل
              </button>
            )}
          </div>
          <ul className="ac--list">
            {count === 0 ? (
              <li className="ac--empty">لا توجد تنبيهات</li>
            ) : (
              alerts.map((alert) => (
                <li key={alert.id}>
                  <div className="ac--row">
                    <span
                      className={`ac--row__icon ${severityClass(alert.severity)}`}
                      aria-hidden="true"
                    >
                      {ICON_BY_TYPE[alert.type] ? String(alert.type).slice(0, 1) : '•'}
                    </span>
                    <div className="ac--row__body">
                      <p className="ac--row__title">{alert.title}</p>
                      <p className="ac--row__desc">
                        {formatHoursAgo(Date.now() - fetchTime)}
                        {alert.amount > 0 && ` · ${formatCurrency(alert.amount)}`}
                      </p>
                      <div className="ac--row__actions">
                        <button
                          type="button"
                          onClick={() => onAction(alert)}
                          className="ac--row__action-btn"
                        >
                          {alert.actionLabel || 'اتخذ إجراء'}
                        </button>
                        <button
                          type="button"
                          onClick={() => onDismiss(alert)}
                          className="ac--row__dismiss-btn"
                        >
                          رفض
                        </button>
                        <button
                          type="button"
                          onClick={() => onSnooze(alert)}
                          className="ac--row__dismiss-btn"
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
