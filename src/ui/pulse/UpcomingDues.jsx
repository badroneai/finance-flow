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
        <h2 className="pulse-card__title" style={{ marginBottom: '0.25rem' }}>أقرب المستحقات</h2>
        <p className="pulse-page__state-desc">لا توجد مستحقات قريبة.</p>
      </div>
    );
  }

  return (
    <div className="panel-card pulse-card" dir="rtl">
      <div className="pulse-card__header">
        <h2 className="pulse-card__title">أقرب المستحقات</h2>
      </div>
      <ul className="pulse-dues__list">
        {sorted.map((due) => (
          <li key={due.id || due.dueDate + due.name} className="pulse-dues__item">
            <div className="pulse-dues__item-row">
              <div className="pulse-dues__item-body">
                <span
                  className="pulse-dues__dot"
                  style={{
                    background:
                      due.type === 'income' ? 'var(--color-success)' : 'var(--color-danger)',
                  }}
                  aria-hidden="true"
                />
                <div className="pulse-dues__text-wrap">
                  <p className="pulse-dues__name">{due.name || '—'}</p>
                  <div className="pulse-dues__meta">
                    <span className="pulse-dues__time-label">
                      {getTimeLabel(due.daysRemaining)}
                    </span>
                    {due.recurring && (
                      <span className="pulse-dues__recurring-badge">متكرر</span>
                    )}
                  </div>
                </div>
              </div>
              <span
                className="pulse-dues__amount"
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
        <div className="pulse-card__footer pulse-card__footer--center">
          <button
            type="button"
            onClick={onShowAll}
            className="pulse-card__link"
          >
            عرض كل المستحقات
          </button>
        </div>
      )}
    </div>
  );
}
