/*
  شريط التنبيهات الاستباقية — يظهر عند وجود مستحقات متأخرة أو قريبة ويوجّه إلى المستحقات.
*/
import React, { useState, useEffect, useCallback } from 'react';
import { calculatePulse } from '../core/pulse-engine.js';

export function PulseAlertsBanner({ page, onGoToInbox, className = '' }) {
  const [alerts, setAlerts] = useState([]);
  const [hasLedger, setHasLedger] = useState(false);

  const refresh = useCallback(() => {
    try {
      const pulse = calculatePulse();
      const list = Array.isArray(pulse?.alerts) ? pulse.alerts : [];
      setAlerts(list);
      setHasLedger(pulse?.healthStatus !== 'unknown');
    } catch {
      setAlerts([]);
      setHasLedger(false);
    }
  }, []);

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
      className={`no-print border-b border-amber-200 bg-amber-50 px-4 py-2 flex items-center justify-between gap-3 flex-wrap ${className}`}
      role="alert"
      aria-live="polite"
    >
      <p className="text-amber-900 text-sm font-medium">{msg}</p>
      {typeof onGoToInbox === 'function' && (
        <button
          type="button"
          onClick={onGoToInbox}
          className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 transition-colors"
        >
          عرض المستحقات
        </button>
      )}
    </div>
  );
}
