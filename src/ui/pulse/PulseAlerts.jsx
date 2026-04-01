/*
  شريط التنبيهات العاجلة — برومبت 1.2
  يعرض pulse.alerts مرتبة حسب الخطورة مع زر إجراء وإمكانية الإخفاء.
*/
import { useState, useMemo } from 'react';

const SEVERITY_ORDER = { critical: 0, warning: 1, info: 2 };
const SEVERITY_DOT = {
  critical: { background: 'var(--color-danger)' },
  warning: { background: 'var(--color-warning)' },
  info: { background: 'var(--color-info)' },
};

function formatAmount(val) {
  const n = Number(val);
  if (val == null || !Number.isFinite(n) || n === 0) return null;
  return `${n.toLocaleString('ar-SA', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ر.س`;
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

const slideInStyles = `
  @keyframes pulseAlertSlideIn {
    from { opacity: 0; transform: translateX(12px); }
    to { opacity: 1; transform: translateX(0); }
  }
  .pulse-alert-row { animation: pulseAlertSlideIn 0.3s ease-out forwards; }
`;

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
      <div
        className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]/80 p-5 text-center text-[var(--color-muted)]"
        dir="rtl"
      >
        <p className="font-medium">كل شيء على ما يرام</p>
        <p className="text-sm mt-1">لا توجد تنبيهات عاجلة.</p>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm overflow-hidden"
      dir="rtl"
    >
      <style>{slideInStyles}</style>
      <div className="px-4 py-3 border-b border-[var(--color-border)] flex items-center justify-between">
        <h2 className="font-semibold text-[var(--color-text)]">تنبيهات عاجلة ({sorted.length})</h2>
      </div>
      <ul className="divide-y divide-[var(--color-border)]" aria-label="قائمة التنبيهات">
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
        <div className="px-4 py-2 border-t border-[var(--color-border)] bg-[var(--color-bg)]/50">
          {onShowAll ? (
            <button
              type="button"
              onClick={onShowAll}
              className="text-sm font-medium hover:opacity-80"
              style={{ color: 'var(--color-info)' }}
            >
              عرض الكل ({sorted.length})
            </button>
          ) : (
            <span className="text-sm text-[var(--color-muted)]">عرض الكل ({sorted.length})</span>
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
      className="pulse-alert-row px-4 py-3 flex flex-col gap-2"
      style={{
        background: isCritical ? 'var(--color-danger-bg)' : 'var(--color-surface)',
        animationDelay: `${index * 50}ms`,
        opacity: 0,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1 flex items-center gap-2">
          <span
            className="flex-shrink-0 w-2 h-2 rounded-full"
            style={dotStyle}
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className="font-medium text-[var(--color-text)] truncate">{alert.title}</p>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-[var(--color-muted)] mt-0.5">
              {daysStr && <span>{daysStr}</span>}
              {amountStr && <span className="font-medium">{amountStr}</span>}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onDismiss(alert.id)}
          className="flex-shrink-0 p-1 rounded text-[var(--color-muted)] hover:text-[var(--color-muted)] hover:bg-[var(--color-bg)]"
          aria-label="إخفاء التنبيه"
        >
          <span className="text-lg leading-none">×</span>
        </button>
      </div>
      {alert.actionLabel && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => onAction && onAction(alert)}
            className="text-sm font-medium hover:opacity-80"
            style={{ color: 'var(--color-info)' }}
          >
            {alert.actionLabel}
          </button>
        </div>
      )}
    </li>
  );
}
