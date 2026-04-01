/**
 * TooltipTour.jsx — جولة تعريفية بـ tooltips تفاعلية
 *
 * SPR-017: تُعرض بعد إغلاق OnboardingModal (أو عند الضغط على "ابدأ الجولة" من الإعدادات).
 * تُرشد المستخدم خطوة بخطوة إلى العناصر الأساسية في الواجهة مع تسليط ضوء (spotlight).
 *
 * الخطوات:
 *  1. الشريط الجانبي — التنقل بين الأقسام
 *  2. الدفاتر — إنشاء أول دفتر
 *  3. الحركات — تسجيل الدخل والمصروف
 *  4. المستحقات — متابعة الالتزامات
 *  5. النبض المالي — مراقبة الصحة المالية
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { storageFacade } from '../core/storage-facade.js';

// مفتاح التخزين
const TOUR_SEEN_KEY = 'ui_tour_seen';

// خطوات الجولة — كل خطوة تستهدف عنصر DOM بـ data-tour-id
const TOUR_STEPS = [
  {
    target: '[data-tour-id="sidebar"]',
    fallback: '.app-shell > aside, .app-shell nav',
    title: 'الشريط الجانبي',
    text: 'من هنا تتنقل بين أقسام التطبيق: النبض، المستحقات، الدفاتر، الحركات، والإعدادات.',
    position: 'left',
  },
  {
    target: '[data-tour-id="nav-ledgers"], a[href="#/ledgers"], [aria-label="الدفاتر"]',
    title: 'الدفاتر',
    text: 'أنشئ دفاتر لعقاراتك — كل دفتر يجمع حركاته المالية في مكان واحد.',
    position: 'left',
  },
  {
    target: '[data-tour-id="nav-transactions"], a[href="#/transactions"], [aria-label="الحركات"]',
    title: 'الحركات المالية',
    text: 'سجّل الدخل والمصروفات لكل دفتر. يمكنك التصفية والبحث والتصدير.',
    position: 'left',
  },
  {
    target: '[data-tour-id="nav-inbox"], a[href="#/inbox"], [aria-label="المستحقات"]',
    title: 'المستحقات',
    text: 'تابع التزاماتك المتكررة (إيجار، صيانة، كهرباء...) ومواعيد استحقاقها.',
    position: 'left',
  },
  {
    target: '[data-tour-id="nav-pulse"], a[href="#/"], [aria-label="النبض المالي"]',
    title: 'النبض المالي',
    text: 'لوحة شاملة تعرض صحتك المالية، التنبيهات، وملخص الأداء في نظرة واحدة.',
    position: 'left',
  },
];

/**
 * حساب موقع التلميح بالنسبة للعنصر المستهدف
 */
function calcTooltipPos(rect, position) {
  const gap = 12;
  const tooltipW = 300;
  const tooltipH = 160;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let top, left;

  // على الموبايل — دائماً أسفل الشاشة
  if (vw < 768) {
    return {
      top: vh - tooltipH - 24,
      left: Math.max(12, (vw - tooltipW) / 2),
      arrowSide: 'none',
    };
  }

  switch (position) {
    case 'left':
      top = rect.top + rect.height / 2 - tooltipH / 2;
      left = rect.right + gap;
      break;
    case 'right':
      top = rect.top + rect.height / 2 - tooltipH / 2;
      left = rect.left - tooltipW - gap;
      break;
    case 'bottom':
      top = rect.bottom + gap;
      left = rect.left + rect.width / 2 - tooltipW / 2;
      break;
    default: // top
      top = rect.top - tooltipH - gap;
      left = rect.left + rect.width / 2 - tooltipW / 2;
  }

  // تصحيح الحدود
  if (top < 8) top = 8;
  if (top + tooltipH > vh - 8) top = vh - tooltipH - 8;
  if (left < 8) left = 8;
  if (left + tooltipW > vw - 8) left = vw - tooltipW - 8;

  return { top, left, arrowSide: position };
}

export function TooltipTour({ active, onComplete }) {
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [tooltipPos, setTooltipPos] = useState(null);
  const rafRef = useRef(null);

  // هل الجولة شوهدت سابقاً؟
  const isSeen = useCallback(() => {
    try {
      return storageFacade.getRaw(TOUR_SEEN_KEY) === '1';
    } catch {
      return false;
    }
  }, []);

  const markSeen = useCallback(() => {
    try {
      storageFacade.setRaw(TOUR_SEEN_KEY, '1');
    } catch {}
  }, []);

  // البحث عن العنصر المستهدف
  const findTarget = useCallback((stepIdx) => {
    const s = TOUR_STEPS[stepIdx];
    if (!s) return null;
    let el = document.querySelector(s.target);
    if (!el && s.fallback) el = document.querySelector(s.fallback);
    return el;
  }, []);

  // تحديث الموقع
  const updatePosition = useCallback(() => {
    const el = findTarget(step);
    if (!el) {
      setTargetRect(null);
      setTooltipPos(null);
      return;
    }
    const rect = el.getBoundingClientRect();
    const pad = 6;
    setTargetRect({
      top: rect.top - pad,
      left: rect.left - pad,
      width: rect.width + pad * 2,
      height: rect.height + pad * 2,
    });
    setTooltipPos(calcTooltipPos(rect, TOUR_STEPS[step].position));
  }, [step, findTarget]);

  // تحديث الموقع عند تغيير الخطوة أو تغيير حجم النافذة
  useEffect(() => {
    if (!active) return;
    updatePosition();
    const onResize = () => updatePosition();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
    };
  }, [active, step, updatePosition]);

  // تنقل الخطوات
  const handleNext = useCallback(() => {
    if (step < TOUR_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      markSeen();
      onComplete?.();
    }
  }, [step, markSeen, onComplete]);

  const handlePrev = useCallback(() => {
    if (step > 0) setStep(step - 1);
  }, [step]);

  const handleSkip = useCallback(() => {
    markSeen();
    onComplete?.();
  }, [markSeen, onComplete]);

  // اختصارات لوحة المفاتيح
  useEffect(() => {
    if (!active) return;
    const onKey = (e) => {
      if (e.key === 'Escape') handleSkip();
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown')
        handleNext(); // RTL
      else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') handlePrev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, handleNext, handlePrev, handleSkip]);

  if (!active) return null;

  const currentStep = TOUR_STEPS[step];
  const isLast = step === TOUR_STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="جولة تعريفية">
      {/* خلفية شفافة مع ثقب spotlight */}
      <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
        <defs>
          <mask id="tour-spotlight">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left}
                y={targetRect.top}
                width={targetRect.width}
                height={targetRect.height}
                rx="8"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="var(--color-overlay)"
          mask="url(#tour-spotlight)"
          style={{ pointerEvents: 'all' }}
          onClick={handleSkip}
        />
      </svg>

      {/* بروز العنصر المستهدف */}
      {targetRect && (
        <div
          className="absolute rounded-lg"
          style={{
            top: targetRect.top,
            insetInlineStart: targetRect.left,
            width: targetRect.width,
            height: targetRect.height,
            boxShadow:
              '0 0 0 3px color-mix(in srgb, var(--color-accent) 42%, transparent), 0 0 24px color-mix(in srgb, var(--color-primary) 20%, transparent)',
            borderRadius: '8px',
            pointerEvents: 'none',
            transition: 'all 0.3s ease',
          }}
        />
      )}

      {/* بطاقة التلميح */}
      {tooltipPos && (
        <div
          className="absolute rounded-xl border shadow-xl"
          dir="rtl"
          style={{
            top: tooltipPos.top,
            insetInlineStart: tooltipPos.left,
            width: 300,
            background: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-primary)',
            padding: '16px',
            transition: 'all 0.3s ease',
            zIndex: 61,
          }}
        >
          {/* مؤشر التقدم */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              {step + 1} / {TOUR_STEPS.length}
            </span>
            <div className="flex gap-1">
              {TOUR_STEPS.map((_, i) => (
                <div
                  key={i}
                  className="rounded-full"
                  style={{
                    width: 8,
                    height: 8,
                    background: i === step ? 'var(--color-accent)' : 'var(--color-border)',
                    transition: 'background 0.2s',
                  }}
                />
              ))}
            </div>
          </div>

          <h4 className="font-bold text-sm mb-1">{currentStep.title}</h4>
          <p
            className="text-sm leading-relaxed mb-4"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {currentStep.text}
          </p>

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleSkip}
              className="text-xs px-2 py-1"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              تخطي
            </button>
            <div className="flex gap-2">
              {step > 0 && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="px-3 py-1.5 rounded-lg text-sm border"
                  style={{
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)',
                    background: 'transparent',
                  }}
                >
                  السابق
                </button>
              )}
              <button
                type="button"
                onClick={handleNext}
                className="px-3 py-1.5 rounded-lg text-sm font-medium"
                style={{
                  background: 'var(--color-primary)',
                  color: 'var(--color-text-inverse)',
                  border: 'none',
                }}
              >
                {isLast ? 'إنهاء الجولة' : 'التالي'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// دوال مساعدة للتحكم الخارجي
export const isTourSeen = () => {
  try {
    return storageFacade.getRaw(TOUR_SEEN_KEY) === '1';
  } catch {
    return false;
  }
};

export const resetTour = () => {
  try {
    storageFacade.removeRaw(TOUR_SEEN_KEY);
  } catch {}
};

export default TooltipTour;
