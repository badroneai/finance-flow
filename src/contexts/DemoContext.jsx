/*
  قيد العقار (Finance Flow)
  DemoContext.jsx — وضع Demo التجريبي (SPR-015)

  يوفّر:
  - isDemo: هل التطبيق في الوضع التجريبي؟
  - activateDemo(): تفعيل وضع Demo
  - exitDemo(): الخروج من وضع Demo

  التفعيل:
  - رابط: finance-flow.html#/demo
  - أو: finance-flow.html?demo=true

  في وضع Demo:
  - يتخطى المصادقة (ProtectedRoute يسمح بالمرور)
  - يعمل على localStorage بدون Supabase
  - بيانات تجريبية ثابتة (seed data)
  - بانر أعلى التطبيق
*/

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

const DemoContext = createContext(null);

// بيانات تجريبية للوضع Demo
const DEMO_PROFILE = {
  id: 'demo-user-001',
  full_name: 'زائر تجريبي',
  role: 'owner',
  is_active: true,
  office_id: 'demo-office-001',
  email: 'demo@qaydalaqar.com',
};

const DEMO_OFFICE = {
  id: 'demo-office-001',
  name: 'مكتب تجريبي',
  office_name: 'مكتب تجريبي',
  created_at: '2024-01-01T00:00:00Z',
};

/** كشف وضع Demo من URL */
function detectDemoFromURL() {
  try {
    // فحص hash: #/demo
    if (window.location.hash.includes('/demo')) return true;
    // فحص search params: ?demo=true
    const params = new URLSearchParams(window.location.search);
    if (params.get('demo') === 'true') return true;
    // فحص sessionStorage (إذا فُعّل مسبقاً في الجلسة)
    if (sessionStorage.getItem('ff_demo_mode') === 'true') return true;
  } catch {}
  return false;
}

export const DemoProvider = ({ children }) => {
  const [isDemo, setIsDemo] = useState(detectDemoFromURL);

  // حفظ الحالة في sessionStorage
  useEffect(() => {
    try {
      if (isDemo) {
        sessionStorage.setItem('ff_demo_mode', 'true');
      } else {
        sessionStorage.removeItem('ff_demo_mode');
      }
    } catch {}
  }, [isDemo]);

  const activateDemo = useCallback(() => {
    setIsDemo(true);
  }, []);

  const exitDemo = useCallback(() => {
    setIsDemo(false);
    try { sessionStorage.removeItem('ff_demo_mode'); } catch {}
    // توجيه لصفحة التسجيل
    window.location.hash = '#/auth';
  }, []);

  const value = useMemo(() => ({
    isDemo,
    activateDemo,
    exitDemo,
    demoProfile: isDemo ? DEMO_PROFILE : null,
    demoOffice: isDemo ? DEMO_OFFICE : null,
  }), [isDemo, activateDemo, exitDemo]);

  return (
    <DemoContext.Provider value={value}>
      {children}
    </DemoContext.Provider>
  );
};

export const useDemo = () => {
  const ctx = useContext(DemoContext);
  if (!ctx) {
    throw new Error('useDemo يجب أن يُستخدم داخل DemoProvider');
  }
  return ctx;
};
