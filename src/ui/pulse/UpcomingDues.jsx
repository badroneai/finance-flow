/*
  أقرب المستحقات — برومبت 1.4
  قائمة بأقرب 5 مستحقات مع تسمية زمنية وشارة متكرر وزر عرض الكل.
*/
import { useMemo } from 'react';
import { formatCurrency } from '../../utils/format.jsx';

const MAX_ITEMS = 5;

function getTimeLabel(daysRemaining) {
  if (daysRemaining == null) return '';
  if (daysRemaining < 0) return `متأخر ${Math.abs(daysRemaining)} يوم`;
  if (daysRemaining === 0) return 'اليوم';
  if (daysRemaining === 1) return 'غدًا';
  return `بعد ${daysRemaining} أيام`;
}

export default function UpcomingDues({ upcomingDues = [], onShowAll }) {
  const sorted = useMemo(() => {
    const list = Array.isArray(upcomingDues) ? upcomingDues : [];
    return [...list]
      .filter((d) => d && (d.id || d.name))
      .sort((a, b) => {
        const da = a.daysRemaining != null ? a.daysRemaining : 999;
        const db = b.daysRemaining != null ? b.daysRemaining : 999;
        return da - db;
      })
      .slice(0, MAX_ITEMS);
  }, [upcomingDues]);

  if (sorted.length === 0) {
    return (
      <div className="pulse-card pulse-card__empty" dir="rtl">
        <h2 className="font-semibold text-[var(--color-text)] mb-1">أقرب المستحقات</h2>
        <p className="text-sm">لا توجد مستحقات قريبة.</p>
      </div>
    );
  }

  return (
    <div className="panel-card pulse-card" dir="rtl">
      <div className="pulse-card__header">
        <h2 className="font-semibold text-[var(--color-text)]">أقرب المستحقات</h2>
      </div>
      <ul className="divide-y divide-[var(--color-border)]">
        {sorted.map((due) => (
          <li key={due.id || due.dueDate + due.name} className="px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1 flex items-center gap-2">
                <span
                  className="flex-shrink-0 w-2 h-2 rounded-full"
                  style={{
                    background:
                      due.type === 'income' ? 'var(--color-success)' : 'var(--color-danger)',
                  }}
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className="font-medium text-[var(--color-text)] truncate">{due.name || '—'}</p>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                    <span className="text-xs text-[var(--color-muted)]">
                      {getTimeLabel(due.daysRemaining)}
                    </span>
                    {due.recurring && (
                      <span className="inline-flex px-1.5 py-0.5 rounded text-xs bg-[var(--color-bg)] text-[var(--color-muted)]">
                        متكرر
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <span
                className="flex-shrink-0 font-medium tabular-nums"
                style={{
                  color: due.type === 'income' ? 'var(--color-success)' : 'var(--color-danger)',
                }}
              >
                {due.type === 'income' ? '+' : '-'}
                {formatCurrency(Math.abs(Number(due.amount) || 0))}
              </span>
            </div>
          </li>
        ))}
      </ul>
      {onShowAll && (
        <div className="pulse-card__footer text-center">
          <button
            type="button"
            onClick={onShowAll}
            className="pulse-card__link text-sm font-medium"
          >
            عرض كل المستحقات
          </button>
        </div>
      )}
    </div>
  );
}
