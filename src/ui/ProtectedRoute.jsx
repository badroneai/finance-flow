/*
  قيد العقار (Finance Flow)
  ProtectedRoute.jsx — حماية المسارات (SPR-004d)

  المنطق:
  - إذا Supabase غير مُعدّ → يعرض المحتوى مباشرة (وضع التطوير المحلي)
  - إذا Supabase مُعدّ:
    - loading → شاشة تحميل
    - غير مسجّل → تحويل لـ /auth
    - مسجّل + profile لا يزال يُحمّل → شاشة تحميل
    - مسجّل + profile.is_active === false → رسالة "حسابك معلّق"
    - مسجّل + profile جاهز → يعرض المحتوى
  - يدعم prop اختياري allowedRoles لتقييد الوصول بحسب الدور (مُعدّ للاستخدام لاحقاً)
*/

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, profileLoading, profile, role, isSupabaseConfigured, isDemo } =
    useAuth();

  // وضع Demo التجريبي — يسمح بالمرور بدون مصادقة
  if (isDemo) {
    return children;
  }

  // وضع التطوير المحلي — بدون حماية
  if (!isSupabaseConfigured) {
    return children;
  }

  // انتظار التحقق الأولي من الجلسة
  if (loading) {
    return (
      <div
        dir="rtl"
        className="flex items-center justify-center min-h-[50vh]"
        style={{
          fontFamily: '"IBM Plex Sans Arabic", sans-serif',
          color: 'var(--color-muted, #64748b)',
        }}
      >
        جاري التحميل…
      </div>
    );
  }

  // غير مسجّل → صفحة تسجيل الدخول
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // انتظار تحميل بيانات الـ profile
  if (profileLoading) {
    return (
      <div
        dir="rtl"
        className="flex items-center justify-center min-h-[50vh]"
        style={{
          fontFamily: '"IBM Plex Sans Arabic", sans-serif',
          color: 'var(--color-muted, #64748b)',
        }}
      >
        جاري تحميل بيانات الحساب…
      </div>
    );
  }

  // الحساب معلّق
  if (profile && profile.is_active === false) {
    return (
      <div
        dir="rtl"
        className="flex flex-col items-center justify-center min-h-[50vh] px-4"
        style={{
          fontFamily: '"IBM Plex Sans Arabic", sans-serif',
          color: 'var(--color-text, #0f172a)',
        }}
      >
        <div
          className="max-w-sm w-full rounded-2xl p-6 text-center shadow-lg"
          style={{
            background: 'var(--color-surface, #ffffff)',
            border: '1px solid var(--color-border, #e2e8f0)',
          }}
        >
          <h2 className="text-lg font-bold mb-3">حسابك معلّق</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--color-muted, #64748b)' }}>
            تم تعليق حسابك. تواصل مع مالك المكتب أو الدعم الفني لمزيد من المعلومات.
          </p>
        </div>
      </div>
    );
  }

  // تحقق من الدور (إذا حُدّد allowedRoles)
  if (allowedRoles && allowedRoles.length > 0 && role && !allowedRoles.includes(role)) {
    return (
      <div
        dir="rtl"
        className="flex flex-col items-center justify-center min-h-[50vh] px-4"
        style={{
          fontFamily: '"IBM Plex Sans Arabic", sans-serif',
          color: 'var(--color-text, #0f172a)',
        }}
      >
        <div
          className="max-w-sm w-full rounded-2xl p-6 text-center shadow-lg"
          style={{
            background: 'var(--color-surface, #ffffff)',
            border: '1px solid var(--color-border, #e2e8f0)',
          }}
        >
          <h2 className="text-lg font-bold mb-3">غير مصرّح</h2>
          <p className="text-sm" style={{ color: 'var(--color-muted, #64748b)' }}>
            ليس لديك صلاحية الوصول لهذه الصفحة.
          </p>
        </div>
      </div>
    );
  }

  // مسجّل ومُصرّح → المحتوى المحمي
  return children;
};
