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

const inputStyle = {
  background: 'var(--color-background)',
  border: '1px solid var(--color-border)',
  color: 'var(--color-text-primary)',
};

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
      <div
        dir="rtl"
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--color-background)',
          color: 'var(--color-text-secondary)',
          fontFamily: '"IBM Plex Sans Arabic", sans-serif',
        }}
      >
        جاري التحقق…
      </div>
    );
  }

  // ── رابط غير صالح ─────────────────────────────────────────────
  if (sessionState === 'invalid') {
    return (
      <div
        dir="rtl"
        className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
        style={{
          background: 'var(--color-background)',
          color: 'var(--color-text-primary)',
          fontFamily: '"IBM Plex Sans Arabic", sans-serif',
        }}
      >
        <div
          className="w-full max-w-sm rounded-2xl p-6 shadow-lg text-center"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            رابط غير صالح
          </h2>
          <p className="text-sm mb-5" style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
            رابط الاستعادة منتهي الصلاحية أو تم استخدامه مسبقاً.
            <br />
            يرجى طلب رابط استعادة جديد.
          </p>
          <button
            type="button"
            onClick={() => navigate('/auth', { replace: true })}
            className="w-full rounded-lg py-2.5 text-sm font-semibold"
            style={{
              background: 'var(--color-primary)',
              color: 'var(--color-text-inverse)',
              cursor: 'pointer',
            }}
          >
            العودة لتسجيل الدخول
          </button>
        </div>
      </div>
    );
  }

  // ── نموذج كلمة المرور الجديدة ──────────────────────────────────
  return (
    <div
      dir="rtl"
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
      style={{
        background: 'var(--color-background)',
        color: 'var(--color-text-primary)',
        fontFamily: '"IBM Plex Sans Arabic", sans-serif',
      }}
    >
      {/* ── الشعار ─────────────────────────────────────────────── */}
      <div className="text-center mb-8">
        <div
          className="mx-auto mb-4 w-16 h-16 flex items-center justify-center rounded-2xl shadow-sm"
          style={{ background: 'var(--color-primary)', color: 'var(--color-text-inverse)' }}
        >
          <AppLogo />
        </div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          قيد العقار
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
          إدارة التدفقات المالية لمكتبك العقاري
        </p>
      </div>

      {/* ── البطاقة ─────────────────────────────────────────────── */}
      <div
        className="w-full max-w-sm rounded-2xl p-6 shadow-lg"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <h2
          className="text-lg font-bold mb-2 text-center"
          style={{ color: 'var(--color-text-primary)' }}
        >
          تعيين كلمة مرور جديدة
        </h2>
        <p className="text-sm mb-5 text-center" style={{ color: 'var(--color-text-secondary)' }}>
          أدخل كلمة المرور الجديدة لحسابك
        </p>

        <form onSubmit={handleSubmit} noValidate>
          {/* كلمة المرور الجديدة */}
          <div className="mb-4">
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: 'var(--color-text-primary)' }}
            >
              كلمة المرور الجديدة
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6 أحرف على الأقل"
              dir="ltr"
              required
              autoComplete="new-password"
              autoFocus
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-colors text-left"
              style={inputStyle}
            />
          </div>

          {/* تأكيد كلمة المرور */}
          <div className="mb-4">
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: 'var(--color-text-primary)' }}
            >
              تأكيد كلمة المرور
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="أعد كتابة كلمة المرور"
              dir="ltr"
              required
              autoComplete="new-password"
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-colors text-left"
              style={inputStyle}
            />
          </div>

          {/* رسالة الخطأ */}
          {error && (
            <div
              className="mb-4 p-3 rounded-lg text-sm text-center"
              role="alert"
              style={{
                background: 'var(--color-danger-bg)',
                color: 'var(--color-danger)',
                border: '1px solid color-mix(in srgb, var(--color-danger) 24%, transparent)',
              }}
            >
              {error}
            </div>
          )}

          {/* رسالة النجاح */}
          {successMsg && (
            <div
              className="mb-4 p-3 rounded-lg text-sm text-center"
              role="status"
              style={{
                background: 'var(--color-success-bg)',
                color: 'var(--color-success)',
                border: '1px solid color-mix(in srgb, var(--color-success) 24%, transparent)',
                lineHeight: 1.6,
              }}
            >
              {successMsg}
            </div>
          )}

          {/* زر الإرسال */}
          <button
            type="submit"
            disabled={loading || !!successMsg}
            className="w-full rounded-lg py-2.5 text-sm font-semibold transition-opacity"
            style={{
              background: 'var(--color-primary)',
              color: 'var(--color-text-inverse)',
              opacity: loading || successMsg ? 0.6 : 1,
              cursor: loading || successMsg ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'جاري الحفظ…' : 'حفظ كلمة المرور الجديدة'}
          </button>
        </form>

        <div className="text-center mt-5">
          <button
            type="button"
            onClick={() => navigate('/auth', { replace: true })}
            className="text-sm underline hover:no-underline"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            العودة لتسجيل الدخول
          </button>
        </div>
      </div>

      <p className="text-xs mt-6" style={{ color: 'var(--color-text-secondary)' }}>
        &copy; {new Date().getFullYear()} قيد العقار. جميع الحقوق محفوظة.
      </p>
    </div>
  );
};

export default ResetPasswordPage;
