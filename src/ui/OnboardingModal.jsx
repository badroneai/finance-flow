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
      className="modal-batch__backdrop modal-batch__backdrop--center"
      role="dialog"
      aria-modal="true"
      aria-label="مرحبًا بك"
      onClick={onClose}
    >
      <div
        className="modal-sheet modal-surface modal-surface--md onboarding-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="onboarding-modal__header">
          <div className="onboarding-modal__header-text">
            <h3 className="onboarding-modal__title">مرحبًا بك في قيد العقار</h3>
            <p className="onboarding-modal__subtitle">ابدأ خلال دقيقة:</p>
          </div>
          <button type="button" className="modal-sheet__close" aria-label="إغلاق" onClick={onClose}>
            ×
          </button>
        </div>

        <ol className="onboarding-modal__list">
          <li>أنشئ أول دفتر (عقار) — لتجميع حركاتك المالية في مكان واحد.</li>
          <li>أضف أول حركة مالية (دخل أو مصروف).</li>
          <li>أضف التزاماتك المتكررة (إيجار، صيانة، كهرباء...).</li>
          <li>راقب صحتك المالية من النبض.</li>
        </ol>

        <p className="onboarding-modal__storage-note">{storageMessage}</p>

        <button
          type="button"
          className="btn-ghost onboarding-modal__settings-link u-text-start"
          onClick={() => {
            onClose();
            onOpenSettings?.();
          }}
        >
          افتح الإعدادات
        </button>

        <div className="onboarding-modal__actions onboarding-modal__actions--stacked">
          <button type="button" className="btn-primary modal-batch__btn-block" onClick={goToLedgers}>
            أنشئ أول دفتر
          </button>
          <button type="button" className="btn-secondary modal-batch__btn-block" onClick={onClose}>
            لا تُظهر مرة أخرى
          </button>
        </div>
      </div>
    </div>
  );
}

export default OnboardingModal;
