import React from 'react';

/**
 * OnboardingModal — ترحيب أول تشغيل.
 * Props: onClose (required), onOpenSettings (optional — عند النقر على "افتح الإعدادات")
 */
export function OnboardingModal({ onClose, onOpenSettings }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="مرحبًا بك">
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.45)' }} onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border p-5 shadow-lg" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-lg font-bold" style={{ margin: 0 }}>مرحبًا بك في قيد العقار</h3>
            <p className="text-sm" style={{ margin: '0.5rem 0 0', color: 'var(--color-muted)' }}>ابدأ خلال دقيقة:</p>
          </div>
          <button type="button" className="text-sm" style={{ color: 'var(--color-muted)' }} aria-label="إغلاق" onClick={onClose}>×</button>
        </div>

        <ul className="mt-4 text-sm space-y-2" style={{ paddingInlineStart: '1.2rem', margin: '1rem 0 0', color: 'var(--color-text)' }}>
          <li>بياناتك تُحفظ محليًا داخل المتصفح.</li>
          <li>ابدأ بإضافة أول حركة مالية من زر (إضافة).</li>
          <li>يمكنك التصدير CSV في أي وقت.</li>
        </ul>

        <button
          type="button"
          className="mt-4 text-sm"
          style={{ color: 'var(--color-primary)', textAlign: 'start' }}
          onClick={() => {
            onClose();
            onOpenSettings?.();
          }}
        >
          افتح الإعدادات
        </button>

        <div className="mt-4 flex flex-col gap-2">
          <button
            type="button"
            className="btn-primary w-full"
            style={{ padding: '0.9rem 1rem', borderRadius: 'var(--radius)', background: 'var(--color-primary)', color: '#fff' }}
            onClick={onClose}
          >
            ابدأ الآن
          </button>
          <button
            type="button"
            className="w-full"
            style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-muted)' }}
            onClick={onClose}
          >
            لا تُظهر مرة أخرى
          </button>
        </div>
      </div>
    </div>
  );
}

export default OnboardingModal;
