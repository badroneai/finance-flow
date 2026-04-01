import { useData } from '../contexts/DataContext.jsx';

/**
 * OnboardingModal — ترحيب أول تشغيل.
 * Props: onClose (required), onOpenSettings (optional — عند النقر على "افتح الإعدادات")
 *
 * SPR-008: الرسائل ديناميكية حسب وضع التخزين (سحابي / محلي).
 *          الخطوات مُحدّثة: دفتر → حركة → التزامات → نبض.
 *          الزر الرئيسي يوجّه لصفحة الدفاتر.
 */
export function OnboardingModal({ onClose, onOpenSettings }) {
  let isCloud = false;
  try {
    const data = useData();
    isCloud = !!data?.isCloudMode;
  } catch {
    // خارج DataProvider — الافتراضي محلي
  }

  const storageMessage = isCloud
    ? 'بياناتك محفوظة بأمان في السحابة ومتاحة من أي جهاز.'
    : 'بياناتك تُحفظ على هذا الجهاز فقط — ننصح بعمل نسخ احتياطي دوري.';

  const goToLedgers = () => {
    onClose();
    window.location.hash = '#/ledgers';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="مرحبًا بك"
    >
      <div
        className="absolute inset-0"
        style={{ background: 'var(--color-overlay)' }}
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-md rounded-2xl border p-5 shadow-lg"
        style={{
          background: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
          color: 'var(--color-text)',
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-lg font-bold" style={{ margin: 0 }}>
              مرحبًا بك في قيد العقار
            </h3>
            <p className="text-sm" style={{ margin: '0.5rem 0 0', color: 'var(--color-muted)' }}>
              ابدأ خلال دقيقة:
            </p>
          </div>
          <button
            type="button"
            className="text-sm"
            style={{ color: 'var(--color-muted)' }}
            aria-label="إغلاق"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <ol
          className="mt-4 text-sm space-y-2"
          style={{ paddingInlineStart: '1.2rem', margin: '1rem 0 0', color: 'var(--color-text)' }}
        >
          <li>أنشئ أول دفتر (عقار) — لتجميع حركاتك المالية في مكان واحد.</li>
          <li>أضف أول حركة مالية (دخل أو مصروف).</li>
          <li>أضف التزاماتك المتكررة (إيجار، صيانة، كهرباء...).</li>
          <li>راقب صحتك المالية من النبض.</li>
        </ol>

        <p className="mt-3 text-xs" style={{ color: 'var(--color-muted)' }}>
          {storageMessage}
        </p>

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
            style={{
              padding: '0.9rem 1rem',
              borderRadius: 'var(--radius)',
              background: 'var(--color-primary)',
              color: 'var(--color-text-inverse)',
            }}
            onClick={goToLedgers}
          >
            أنشئ أول دفتر
          </button>
          <button
            type="button"
            className="w-full"
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--color-border)',
              background: 'transparent',
              color: 'var(--color-muted)',
            }}
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
