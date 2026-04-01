/**
 * DirectionSwitcher — أداة مؤقتة لتبديل الاتجاه البصري
 * تظهر كزر عائم في أسفل الشاشة يسار
 * تُزال بعد اختيار الاتجاه النهائي
 */
import { useState, useEffect } from 'react';

const DIRECTIONS = [
  { id: '', label: 'الحالي', desc: 'التصميم الحالي بدون تعديل' },
  { id: 'a', label: 'A — Mercury', desc: 'مالي نظيف، sidebar أبيض، بدون زخرفة' },
  { id: 'b', label: 'B — Linear', desc: 'أداة دقيقة، مضغوط، sidebar داكن' },
  { id: 'c', label: 'C — Wise', desc: 'العلامة التجارية حاضرة، CTA ذهبي' },
];

export function DirectionSwitcher() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState('');

  useEffect(() => {
    // قراءة الاتجاه المحفوظ
    try {
      const saved = localStorage.getItem('ui_direction') || '';
      setCurrent(saved);
      document.documentElement.setAttribute('data-direction', saved);
    } catch { /* ignore */ }
  }, []);

  const pick = (id) => {
    setCurrent(id);
    document.documentElement.setAttribute('data-direction', id);
    try { localStorage.setItem('ui_direction', id); } catch { /* ignore */ }
    setOpen(false);
  };

  const activeLabel = DIRECTIONS.find((d) => d.id === current)?.label || 'الحالي';

  return (
    <div style={{
      position: 'fixed',
      bottom: '5.5rem',
      left: '1rem',
      zIndex: 99999,
      fontFamily: 'var(--qa-font-arabic)',
      direction: 'rtl',
    }}>
      {open && (
        <div style={{
          position: 'absolute',
          bottom: '3.5rem',
          left: 0,
          width: '260px',
          background: 'var(--color-surface-elevated)',
          border: '2px solid var(--color-border-strong)',
          borderRadius: '14px',
          boxShadow: '0 20px 48px rgba(0,0,0,0.18)',
          padding: '0.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.25rem',
        }}>
          <div style={{
            padding: '0.5rem 0.75rem',
            fontSize: '0.6875rem',
            fontWeight: 700,
            color: 'var(--color-text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}>
            اختر الاتجاه البصري
          </div>
          {DIRECTIONS.map((d) => (
            <button
              key={d.id}
              onClick={() => pick(d.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.15rem',
                padding: '0.65rem 0.75rem',
                borderRadius: '10px',
                border: current === d.id
                  ? '2px solid var(--color-primary)'
                  : '2px solid transparent',
                background: current === d.id
                  ? 'var(--color-primary-bg)'
                  : 'transparent',
                cursor: 'pointer',
                textAlign: 'right',
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{
                fontSize: '0.8125rem',
                fontWeight: 700,
                color: current === d.id
                  ? 'var(--color-primary)'
                  : 'var(--color-text-primary)',
              }}>
                {d.label}
              </span>
              <span style={{
                fontSize: '0.6875rem',
                color: 'var(--color-text-secondary)',
              }}>
                {d.desc}
              </span>
            </button>
          ))}
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.6rem 1rem',
          borderRadius: '999px',
          border: '2px solid var(--color-border-strong)',
          background: 'var(--color-surface-elevated)',
          color: 'var(--color-text-primary)',
          cursor: 'pointer',
          fontSize: '0.8125rem',
          fontWeight: 700,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          transition: 'all 0.15s ease',
        }}
      >
        <span style={{ fontSize: '1rem' }}>🎨</span>
        <span>{activeLabel}</span>
      </button>
    </div>
  );
}
