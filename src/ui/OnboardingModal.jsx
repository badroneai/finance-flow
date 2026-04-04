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
        className="modal-sheet modal-surface modal-surface--md onboarding-modal"
        style={{ color: 'var(--color-text)' }}
      >
        <div className="onboarding-modal__header">
          <div className="min-w-0">
            <h3 className="text-lg font-bold" style={{ margin: 0 }}>
              مرحبًا بك في قيد العقار
            </h3>
            <p className="text-sm" style={{ margin: '0.5rem 0 0', color: 'var(--color-muted)' }}>
              ابدأ خلال دقيقة:
            </p>
          </div>
          <button type="button" className="modal-sheet__close" aria-label="إغلاق" onClick={onClose}>
            ×
          </button>
        </div>

        <ol
          className="onboarding-modal__list mt-4 text-sm space-y-2"
          style={{ color: 'var(--color-text)' }}
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
          className="btn-ghost mt-4 text-sm u-text-start"
          style={{ color: 'var(--color-primary)' }}
          onClick={() => {
            onClose();
            onOpenSettings?.();
          }}
        >
          افتح الإعدادات
        </button>

        <div className="onboarding-modal__actions flex-col">
          <button type="button" className="btn-primary w-full" onClick={goToLedgers}>
            أنشئ أول دفتر
          </button>
          <button type="button" className="btn-secondary w-full" onClick={onClose}>
            لا تُظهر مرة أخرى
          </button>
        </div>
      </div>
    </div>
  );
}

export default OnboardingModal;
