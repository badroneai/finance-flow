/*
  قيد العقار (Finance Flow)
  ResetPasswordPage.jsx — صفحة تعيين كلمة مرور جديدة

  تُعرض بعد أن يضغط المستخدم على رابط الاستعادة في بريده الإلكتروني.
  Supabase يُرسل المستخدم إلى هذه الصفحة مع حدث PASSWORD_RECOVERY في onAuthStateChange.
  المسار: /reset-password
  بدون Sidebar/Topbar — صفحة كاملة.
*/

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { supabase, isSupabaseConfigured } from '../core/supabase.js';

// ─── ترجمة رسائل الخطأ ───────────────────────────────────────────
const translateError = (msg) => {
  if (!msg) return 'حدث خطأ غير متوقع. حاول مرة أخرى';
  const lower = msg.toLowerCase();
  if (lower.includes('password should be at least'))
    return 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
  if (lower.includes('new password should be different'))
    return 'يجب أن تختلف كلمة المرور الجديدة عن القديمة';
  if (lower.includes('email link is invalid') || lower.includes('token has expired'))
    return 'رابط الاستعادة منتهي الصلاحية. أرسل طلب استعادة جديد';
  if (lower.includes('auth session missing') || lower.includes('no session'))
    return 'انتهت صلاحية الجلسة. يرجى طلب رابط استعادة جديد';
  return 'حدث خطأ غير متوقع. حاول مرة أخرى';
};

// ─── شعار التطبيق (نفس AuthPage) ───────────────────────────────
const AppLogo = () => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    width="56"
    height="56"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinejoin="round"
  >
    <path d="M50 20L24 44V76H38V60H62V76H76V44L50 20Z" />
    <path d="M62 30V24H68V36" />
    <path d="M20 80H80" strokeOpacity="0.5" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M24 84L20 80L24 76H76L80 80L76 84H24Z" strokeOpacity="0.4" strokeWidth="1.5" />
  </svg>
);

// ─── المكون الرئيسي ─────────────────────────────────────────────
const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const { updatePassword } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  // حالة الجلسة: pending (ننتظر) | ready (جاهز) | invalid (رابط غير صالح)
  const [sessionState, setSessionState] = useState('pending');

  // ── الاستماع لحدث PASSWORD_RECOVERY من Supabase ────────────────
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      // بدون Supabase: نعرض رسالة توضيحية
      setSessionState('invalid');
      return;
    }

    // Supabase يُطلق حدث PASSWORD_RECOVERY عند فتح رابط الاستعادة
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionState('ready');
      } else if (event === 'SIGNED_IN' && session) {
        // في بعض إصدارات Supabase يصل SIGNED_IN بدلاً من PASSWORD_RECOVERY
        setSessionState('ready');
      }
    });

    // تحقق من وجود جلسة حالية أيضاً (المستخدم فتح الرابط في نفس المتصفح)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionState('ready');
      } else {
        // لا جلسة ولا حدث — الرابط قديم أو مستخدم
        setTimeout(() => {
          setSessionState((prev) => (prev === 'pending' ? 'invalid' : prev));
        }, 2500);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // ── تغيير كلمة المرور ─────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    if (password !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين');
      return;
    }

    setLoading(true);
    const { error: err } = await updatePassword(password);
    setLoading(false);

    if (err) {
      setError(translateError(err.message));
    } else {
      setSuccessMsg('تم تغيير كلمة المرور بنجاح! سيتم توجيهك لتسجيل الدخول…');
      setTimeout(() => navigate('/auth', { replace: true }), 2500);
    }
  };

  // ── شاشة الانتظار ─────────────────────────────────────────────
  if (sessionState === 'pending') {
    return (
      <div dir="rtl" className="auth__pending">
        جاري التحقق…
      </div>
    );
  }

  // ── رابط غير صالح ─────────────────────────────────────────────
  if (sessionState === 'invalid') {
    return (
      <div dir="rtl" className="auth-page">
        <div className="auth__card" style={{ textAlign: 'center' }}>
          <div className="auth__error-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 className="auth__card-title">رابط غير صالح</h2>
          <p className="auth__card-description">
            رابط الاستعادة منتهي الصلاحية أو تم استخدامه مسبقاً.
            <br />
            يرجى طلب رابط استعادة جديد.
          </p>
          <button
            type="button"
            onClick={() => navigate('/auth', { replace: true })}
            className="auth__submit"
          >
            العودة لتسجيل الدخول
          </button>
        </div>
      </div>
    );
  }

  // ── نموذج كلمة المرور الجديدة ──────────────────────────────────
  return (
    <div dir="rtl" className="auth-page">
      {/* ── الشعار ─────────────────────────────────────────────── */}
      <div className="auth__logo-block">
        <div className="auth__logo-icon">
          <AppLogo />
        </div>
        <h1 className="auth__logo-title">قيد العقار</h1>
        <p className="auth__logo-subtitle">إدارة التدفقات المالية لمكتبك العقاري</p>
      </div>

      {/* ── البطاقة ─────────────────────────────────────────────── */}
      <div className="auth__card">
        <h2 className="auth__card-title">تعيين كلمة مرور جديدة</h2>
        <p className="auth__card-subtitle">أدخل كلمة المرور الجديدة لحسابك</p>

        <form onSubmit={handleSubmit} noValidate>
          {/* كلمة المرور الجديدة */}
          <div className="auth__field">
            <label className="auth__label">كلمة المرور الجديدة</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6 أحرف على الأقل"
              dir="ltr"
              required
              autoComplete="new-password"
              autoFocus
              className="auth__input auth__input--ltr"
            />
          </div>

          {/* تأكيد كلمة المرور */}
          <div className="auth__field">
            <label className="auth__label">تأكيد كلمة المرور</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="أعد كتابة كلمة المرور"
              dir="ltr"
              required
              autoComplete="new-password"
              className="auth__input auth__input--ltr"
            />
          </div>

          {/* رسالة الخطأ */}
          {error && (
            <div className="auth__alert auth__alert--danger" role="alert">
              {error}
            </div>
          )}

          {/* رسالة النجاح */}
          {successMsg && (
            <div className="auth__alert auth__alert--success" role="status">
              {successMsg}
            </div>
          )}

          {/* زر الإرسال */}
          <button
            type="submit"
            disabled={loading || !!successMsg}
            className="auth__submit"
          >
            {loading ? 'جاري الحفظ…' : 'حفظ كلمة المرور الجديدة'}
          </button>
        </form>

        <div className="auth__links">
          <button
            type="button"
            onClick={() => navigate('/auth', { replace: true })}
            className="auth__link auth__link--secondary"
          >
            العودة لتسجيل الدخول
          </button>
        </div>
      </div>

      <p className="auth__footer">
        &copy; {new Date().getFullYear()} قيد العقار. جميع الحقوق محفوظة.
      </p>
    </div>
  );
};

export default ResetPasswordPage;
