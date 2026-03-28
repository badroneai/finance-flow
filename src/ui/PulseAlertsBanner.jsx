/*
  شريط التنبيهات الاستباقية — يظهر عند وجود مستحقات متأخرة أو قريبة ويوجّه إلى المستحقات.
  SPR-006: يستخدم DataContext لتوفير البيانات لـ calculatePulse بدلاً من الاعتماد على localStorage فقط.
*/
import React, { useState, useEffect, useCallback } from 'react';
import { calculatePulse } from '../core/pulse-engine.js';
import { useData } from '../contexts/DataContext.jsx';

export function PulseAlertsBanner({ page, onGoToInbox, className = '' }) {
  const { transactions, recurringItems, ledgers, activeLedgerId } = useData();

  const [alerts, setAlerts] = useState([]);
  const [hasLedger, setHasLedger] = useState(false);

  const refresh = useCallback(() => {
    try {
      const pulse = calculatePulse(activeLedgerId || undefined, {
        transactions,
        recurringItems,
        ledgers,
      });
      const list = Array.isArray(pulse?.alerts) ? pulse.alerts : [];
      setAlerts(list);
      setHasLedger(pulse?.healthStatus !== 'unknown');
    } catch {
      setAlerts([]);
      setHasLedger(false);
    }
  }, [activeLedgerId, transactions, recurringItems, ledgers]);

  useEffect(() => {
    refresh();
    const onChanged = () => refresh();
    try {
      window.addEventListener('ledger:activeChanged', onChanged);
      return () => window.removeEventListener('ledger:activeChanged', onChanged);
    } catch {
      return () => {};
    }
  }, [refresh]);

  if (page === 'inbox' || !hasLedger || alerts.length === 0) return null;

  const overdue = alerts.filter((a) => a.type === 'overdue');
  const upcoming = alerts.filter((a) => a.type === 'upcoming');
  const msg =
    overdue.length > 0 && upcoming.length > 0
      ? `${overdue.length} متأخر و${upcoming.length} قادم خلال أسبوع`
      : overdue.length > 0
        ? `${overdue.length} مستحق متأخر`
        : `${upcoming.length} مستحق قادم خلال أسبوع`;

  return (
    <div
      className={`no-print border-b px-4 py-2 flex items-center justify-between gap-3 flex-wrap ${className}`}
      style={{ borderColor: 'var(--color-warning-bg)', background: 'var(--color-warning-bg)' }}
      role="alert"
      aria-live="polite"
    >
      <p className="text-sm font-medium" style={{ color: 'var(--color-warning)' }}>
        {msg}
      </p>
      {typeof onGoToInbox === 'function' && (
        <button
          type="button"
          onClick={onGoToInbox}
          className="flex-shrink-0 px-3 py-1.5 rounded-lg text-white text-sm font-medium transition-colors"
          style={{ background: 'var(--color-warning)' }}
        >
          عرض المستحقات
        </button>
      )}
    </div>
  );
}
