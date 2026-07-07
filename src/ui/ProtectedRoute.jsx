/*
  قيد العقار (Finance Flow)
  ProtectedRoute.jsx — حماية المسارات (SPR-004d)

  المنطق:
  - بيئة إنتاج + Supabase غير مُعدّ → fail-closed (تحويل لـ /auth مع رسالة)
  - بيئة تطوير + Supabase غير مُعدّ → يعرض المحتوى مباشرة (وضع التطوير المحلي)
  - وضع Demo → يُسمح فقط في بيئة التطوير (DemoContext يمنعه في الإنتاج)
  - إذا Supabase مُعدّ:
    - loading → شاشة تحميل
    - غير مسجّل → تحويل لـ /auth
    - مسجّل + profile لا يزال يُحمّل → شاشة تحميل
    - مسجّل + profile.is_active === false → رسالة "حسابك معلّق"
    - مسجّل + profile جاهز → يعرض المحتوى
  - يدعم prop اختياري allowedRoles لتقييد الوصول بحسب الدور (مُعدّ للاستخدام لاحقاً)
*/

import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

/** هل البيئة إنتاجية؟ */
const isProduction = import.meta.env.PROD && !import.meta.env.DEV;

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, profileLoading, profile, role, isSupabaseConfigured, isDemo } =
    useAuth();

  // وضع Demo التجريبي — يسمح بالمرور بدون مصادقة (dev فقط — DemoContext يمنعه في production)
  if (isDemo) {
    return children;
  }

  // Supabase غير مُعدّ
  if (!isSupabaseConfigured) {
    // في الإنتاج: fail-closed — لا يُسمح بتشغيل التطبيق بدون Supabase
    if (isProduction) {
      return (
        <div dir="rtl" className="shell-status shell-status--blocked">
          <div className="shell-status__card">
            <h2 className="shell-status__title">خطأ في الإعدادات</h2>
            <p className="shell-status__desc--sm">
              إعدادات الاتصال بقاعدة البيانات غير مكتملة. تواصل مع مسؤول النظام.
            </p>
          </div>
        </div>
      );
    }
    // في التطوير فقط: يسمح بالمرور بدون حماية (localStorage mode)
    return children;
  }

  // انتظار التحقق الأولي من الجلسة
  if (loading) {
    return (
      <div dir="rtl" className="shell-status">
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
      <div dir="rtl" className="shell-status">
        جاري تحميل بيانات الحساب…
      </div>
    );
  }

  // الحساب معلّق
  if (profile && profile.is_active === false) {
    return (
      <div dir="rtl" className="shell-status shell-status--blocked">
        <div className="shell-status__card">
          <h2 className="shell-status__title">حسابك معلّق</h2>
          <p className="shell-status__desc--sm">
            تم تعليق حسابك. تواصل مع مالك المكتب أو الدعم الفني لمزيد من المعلومات.
          </p>
        </div>
      </div>
    );
  }

  // تحقق من الدور (إذا حُدّد allowedRoles)
  if (allowedRoles && allowedRoles.length > 0 && role && !allowedRoles.includes(role)) {
    return (
      <div dir="rtl" className="shell-status shell-status--blocked">
        <div className="shell-status__card">
          <h2 className="shell-status__title">غير مصرّح</h2>
          <p className="shell-status__desc">
            ليس لديك صلاحية الوصول لهذه الصفحة.
          </p>
        </div>
      </div>
    );
  }

  // مسجّل ومُصرّح → المحتوى المحمي
  return children;
};
