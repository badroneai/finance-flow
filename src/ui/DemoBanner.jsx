/*
  قيد العقار (Finance Flow)
  DemoBanner.jsx — بانر الوضع التجريبي (SPR-015)

  يظهر أعلى التطبيق عندما يكون في وضع Demo.
*/

import { useDemo } from '../contexts/DemoContext.jsx';

export const DemoBanner = () => {
  const { isDemo, exitDemo } = useDemo();

  if (!isDemo) return null;

  return (
    <div dir="rtl" role="status" aria-live="polite" className="demo-banner">
      <span className="demo-banner__text">
        <span style={{ fontSize: '16px' }} aria-hidden="true">
          &#9888;
        </span>
        أنت في <strong style={{ margin: '0 4px' }}>الوضع التجريبي</strong> — البيانات لن تُحفظ بعد
        إغلاق المتصفح
      </span>
      <button type="button" onClick={exitDemo} className="demo-banner__button">
        سجّل حسابك الآن
      </button>
    </div>
  );
};
