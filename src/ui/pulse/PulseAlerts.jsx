/*
  شريط التنبيهات العاجلة — برومبت 1.2
  يعرض pulse.alerts مرتبة حسب الخطورة مع زر إجراء وإمكانية الإخفاء.
*/
import { useState, useMemo } from 'react';
import { formatCurrency } from '../../utils/format.jsx';

const SEVERITY_ORDER = { critical: 0, warning: 1, info: 2 };
const SEVERITY_DOT = {
  critical: { background: 'var(--color-danger)' },
  warning: { background: 'var(--color-warning)' },
  info: { background: 'var(--color-info)' },
};

function formatAmount(val) {
  const n = Number(val);
  if (val == null || !Number.isFinite(n) || n === 0) return null;
  return formatCurrency(n);
}

function getDaysText(dueDate) {
  if (!dueDate) return null;
  try {
    const due = new Date(dueDate + 'T00:00:00').getTime();
    if (Number.isNaN(due)) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMs = today.getTime();
    const dayMs = 24 * 60 * 60 * 1000;
    const days = Math.ceil((due - todayMs) / dayMs);
    if (days < 0) return `متأخر ${Math.abs(days)} يوم`;
    if (days === 0) return 'اليوم';
    if (days === 1) return 'بعد يوم';
    return `بعد ${days} يوم`;
  } catch {
    return null;
  }
}

// تم نقل keyframes pulseAlertSlideIn إلى app.css §35

export default function PulseAlerts({ alerts = [], onAlertAction, onShowAll }) {
  const [dismissed, setDismissed] = useState(() => new Set());

  const sorted = useMemo(() => {
    const list = (Array.isArray(alerts) ? alerts : [])
      .filter((a) => a && !dismissed.has(a.id))
      .sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 3) - (SEVERITY_ORDER[b.severity] ?? 3));
    return list;
  }, [alerts, dismissed]);

  const displayList = sorted.slice(0, 5);
  const hasMore = sorted.length > 5;

  const handleDismiss = (id) => {
    setDismissed((prev) => new Set(prev).add(id));
  };

  if (sorted.length === 0) {
    return (
      <div className="pulse-card pulse-card__empty" dir="rtl">
        <p className="pulse-page__state-title">كل شيء على ما يرام</p>
        <p className="pulse-page__state-desc">لا توجد تنبيهات عاجلة.</p>
      </div>
    );
  }

  return (
    <div className="panel-card pulse-card" dir="rtl">
      <div className="pulse-card__header">
        <h2 className="pulse-card__title">تنبيهات عاجلة ({sorted.length})</h2>
      </div>
      <ul className="pulse-alert__list" aria-label="قائمة التنبيهات">
        {displayList.map((alert, index) => (
          <AlertRow
            key={alert.id}
            alert={alert}
            index={index}
            onAction={onAlertAction}
            onDismiss={handleDismiss}
          />
        ))}
      </ul>
      {hasMore && (
        <div className="pulse-card__footer">
          {onShowAll ? (
            <button
              type="button"
              onClick={onShowAll}
              className="pulse-card__link"
            >
              عرض الكل ({sorted.length})
            </button>
          ) : (
            <span className="pulse-card__muted">عرض الكل ({sorted.length})</span>
          )}
        </div>
      )}
    </div>
  );
}

function AlertRow({ alert, index, onAction, onDismiss }) {
  const isCritical = alert.severity === 'critical';
  const dotStyle = SEVERITY_DOT[alert.severity] || { background: 'var(--color-border-strong)' };
  const amountStr = formatAmount(alert.amount);
  const daysStr = getDaysText(alert.dueDate);

  return (
    <li
      className="pulse-alert-row pulse-alert__item"
      style={{
        background: isCritical ? 'var(--color-danger-bg)' : 'var(--color-surface)',
        animationDelay: `${index * 50}ms`,
        opacity: 0,
      }}
    >
      <div className="pulse-alert__item-head">
        <div className="pulse-alert__item-body">
          <span className="pulse-alert__dot" style={dotStyle} aria-hidden="true" />
          <div className="pulse-alert__text-wrap">
            <p className="pulse-alert__title">{alert.title}</p>
            <div className="pulse-alert__meta">
              {daysStr && <span>{daysStr}</span>}
              {amountStr && <span className="pulse-alert__amount">{amountStr}</span>}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onDismiss(alert.id)}
          className="pulse-alert__dismiss"
          aria-label="إخفاء التنبيه"
        >
          <span className="pulse-alert__dismiss-icon">×</span>
        </button>
      </div>
      {alert.actionLabel && (
        <div className="pulse-alert__action-row">
          <button
            type="button"
            onClick={() => onAction && onAction(alert)}
            className="pulse-alert__action-btn"
          >
            {alert.actionLabel}
          </button>
        </div>
      )}
    </li>
  );
}
