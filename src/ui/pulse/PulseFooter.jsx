/*
  فوتر صفحة النبض — برومبت 1.5
  "آخر تحديث" + زر "تحديث يدوي"
*/
import React from 'react';

function formatCalculatedAt(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    const now = new Date();
    const diffMs = now - d;
    if (diffMs < 60000) return 'الآن';
    if (diffMs < 3600000) return `منذ ${Math.floor(diffMs / 60000)} د`;
    return d.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '—';
  }
}

export default function PulseFooter({ calculatedAt, onRefresh, refreshing = false }) {
  return (
    <footer
      className="flex flex-wrap items-center justify-between gap-3 pt-4 mt-6 border-t border-[var(--color-border)] text-sm text-[var(--color-muted)]"
      dir="rtl"
      aria-label="تذييل النبض المالي"
    >
      <span>آخر تحديث: {formatCalculatedAt(calculatedAt)}</span>
      {onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="text-[var(--color-muted)] hover:text-[var(--color-text)] font-medium disabled:opacity-50 no-print"
          aria-label="تحديث يدوي"
        >
          {refreshing ? 'جاري التحديث…' : 'تحديث يدوي'}
        </button>
      )}
    </footer>
  );
}
