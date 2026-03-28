/*
  قيد العقار (Finance Flow)
  AuthPage.jsx — صفحة تسجيل الدخول وإنشاء الحساب (SPR-004d)

  صفحة كاملة (full-page) بدون Sidebar/Topbar.
  تدعم وضعين: تسجيل دخول + إنشاء حساب جديد.
  تعمل مع الثيمات الثلاث (light/dim/dark) عبر CSS variables.
*/

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

// ─── هل نحن في وضع التطوير؟ ────────────────────────────────────
const isDev = import.meta.env.DEV;

// ─── ترجمة رسائل Supabase الشائعة ──────────────────────────────
const translateError = (msg) => {
  if (!msg) return 'حدث خطأ غير متوقع. حاول مرة أخرى';
  const lower = msg.toLowerCase();

  // في وضع التطوير: دائماً نُظهر الرسالة الأصلية مع الترجمة
  const devSuffix = isDev ? `\n[DEV] ${msg}` : '';

  if (lower.includes('invalid login credentials'))
    return 'البريد الإلكتروني أو كلمة المرور غير صحيحة' + devSuffix;
  if (lower.includes('user already registered'))
    return 'هذا البريد الإلكتروني مسجّل بالفعل' + devSuffix;
  if (lower.includes('password should be at least'))
    return 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' + devSuffix;
  if (lower.includes('email not confirmed')) return 'يرجى تأكيد بريدك الإلكتروني أولاً' + devSuffix;
  if (lower.includes('email rate limit exceeded') || lower.includes('rate limit'))
    return 'تم تجاوز عدد المحاولات. حاول لاحقاً' + devSuffix;
  if (lower.includes('invalid email') || lower.includes('unable to validate email'))
    return 'صيغة البريد الإلكتروني غير صحيحة' + devSuffix;
  if (lower.includes('signup is not allowed') || lower.includes('signups not allowed'))
    return 'التسجيل غير متاح حالياً' + devSuffix;
  if (lower.includes('signup requires a valid password')) return 'أدخل كلمة مرور صالحة' + devSuffix;
  if (lower.includes('database')) return 'حدث خطأ في النظام. حاول مرة أخرى بعد قليل' + devSuffix;
  // رسائل غير معروفة
  if (isDev) return `حدث خطأ غير متوقع: ${msg}`;
  return 'حدث خطأ غير متوقع. حاول مرة أخرى';
};

// ─── شعار التطبيق (SVG) ────────────────────────────────────────
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

// ─── ستايل مشترك للحقول ─────────────────────────────────────────
const inputStyle = {
  background: 'var(--color-bg, #f8fafc)',
  border: '1px solid var(--color-border, #e2e8f0)',
  color: 'var(--color-text, #0f172a)',
};

// ─── المكون الرئيسي ─────────────────────────────────────────────
const AuthPage = () => {
  const navigate = useNavigate();
  const { signIn, signUp, isAuthenticated } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [officeName, setOfficeName] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // إذا كان مسجّلاً بالفعل، حوّل للصفحة الرئيسية
  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  // لا نعرض النموذج إذا المستخدم مسجّل بالفعل
  if (isAuthenticated) return null;

  const resetMessages = () => {
    setError('');
    setSuccessMsg('');
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    resetMessages();
    setPassword('');
    setConfirmPassword('');
  };

  // ── تسجيل دخول ───────────────────────────────────────────────
  const handleSignIn = async (e) => {
    e.preventDefault();
    resetMessages();

    if (!email.trim()) {
      setError('أدخل البريد الإلكتروني');
      return;
    }
    if (!password) {
      setError('أدخل كلمة المرور');
      return;
    }

    setLoading(true);
    const { data, error: err } = await signIn(email.trim(), password);
    setLoading(false);

    if (err) {
      console.error('[قيد العقار] Auth Error:', err);
      setError(translateError(err.message));
    } else {
      navigate('/', { replace: true });
    }
  };

  // ── إنشاء حساب ───────────────────────────────────────────────
  const handleSignUp = async (e) => {
    e.preventDefault();
    resetMessages();

    if (!officeName.trim()) {
      setError('أدخل اسم المكتب العقاري');
      return;
    }
    if (!fullName.trim()) {
      setError('أدخل الاسم الكامل');
      return;
    }
    if (!email.trim()) {
      setError('أدخل البريد الإلكتروني');
      return;
    }
    if (password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    if (password !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين');
      return;
    }

    setLoading(true);
    const { data, error: err } = await signUp(email.trim(), password, {
      office_name: officeName.trim(),
      full_name: fullName.trim(),
    });
    setLoading(false);

    if (err) {
      console.error('[قيد العقار] Auth Error:', err);
      setError(translateError(err.message));
      return;
    }

    // التحقق: هل Supabase أرسل session مباشرة (بدون تأكيد بريد)؟
    if (data?.session) {
      // دخول مباشر
      navigate('/', { replace: true });
    } else {
      // يحتاج تأكيد بريد
      setSuccessMsg('تم إنشاء حسابك بنجاح! تحقق من بريدك الإلكتروني لتأكيد الحساب.');
    }
  };

  const isLogin = mode === 'login';

  return (
    <div
      dir="rtl"
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
      style={{
        background: 'var(--color-bg, #f8fafc)',
        color: 'var(--color-text, #0f172a)',
        fontFamily: '"IBM Plex Sans Arabic", sans-serif',
      }}
    >
      {/* ── الشعار والعنوان ──────────────────────────────────────── */}
      <div className="text-center mb-8">
        <div
          className="mx-auto mb-4 w-16 h-16 flex items-center justify-center rounded-2xl"
          style={{ background: 'var(--color-primary, #0b2d4a)', color: '#fff' }}
        >
          <AppLogo />
        </div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text, #0f172a)' }}>
          قيد العقار
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-muted, #64748b)' }}>
          إدارة التدفقات المالية لمكتبك العقاري
        </p>
      </div>

      {/* ── البطاقة الرئيسية ─────────────────────────────────────── */}
      <div
        className="w-full max-w-sm rounded-2xl p-6 shadow-lg"
        style={{
          background: 'var(--color-surface, #ffffff)',
          border: '1px solid var(--color-border, #e2e8f0)',
        }}
      >
        <h2
          className="text-lg font-bold mb-5 text-center"
          style={{ color: 'var(--color-text, #0f172a)' }}
        >
          {isLogin ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
        </h2>

        <form onSubmit={isLogin ? handleSignIn : handleSignUp} noValidate>
          {/* ── اسم المكتب (إنشاء حساب فقط) ────────────────────── */}
          {!isLogin && (
            <div className="mb-4">
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: 'var(--color-text, #0f172a)' }}
              >
                اسم المكتب العقاري
              </label>
              <input
                type="text"
                value={officeName}
                onChange={(e) => setOfficeName(e.target.value)}
                placeholder="مثال: مكتب الأمانة العقارية"
                maxLength={120}
                required
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-colors"
                style={inputStyle}
              />
            </div>
          )}

          {/* ── الاسم الكامل (إنشاء حساب فقط) ─────────────────── */}
          {!isLogin && (
            <div className="mb-4">
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: 'var(--color-text, #0f172a)' }}
              >
                الاسم الكامل
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="مثال: أحمد محمد العتيبي"
                maxLength={100}
                required
                autoComplete="name"
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-colors"
                style={inputStyle}
              />
            </div>
          )}

          {/* ── البريد الإلكتروني ─────────────────────────────────── */}
          <div className="mb-4">
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: 'var(--color-text, #0f172a)' }}
            >
              البريد الإلكتروني
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              dir="ltr"
              required
              autoComplete="email"
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-colors text-left"
              style={inputStyle}
            />
          </div>

          {/* ── كلمة المرور ───────────────────────────────────────── */}
          <div className="mb-4">
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: 'var(--color-text, #0f172a)' }}
            >
              كلمة المرور
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isLogin ? '••••••••' : '6 أحرف على الأقل'}
              dir="ltr"
              required
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-colors text-left"
              style={inputStyle}
            />
          </div>

          {/* ── تأكيد كلمة المرور (إنشاء حساب فقط) ───────────────── */}
          {!isLogin && (
            <div className="mb-4">
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: 'var(--color-text, #0f172a)' }}
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
          )}

          {/* ── رسالة الخطأ ───────────────────────────────────────── */}
          {error && (
            <div
              className="mb-4 p-3 rounded-lg text-sm text-center"
              role="alert"
              style={{
                background: 'rgba(239, 68, 68, 0.08)',
                color: '#dc2626',
                border: '1px solid rgba(239, 68, 68, 0.2)',
              }}
            >
              {error}
            </div>
          )}

          {/* ── رسالة النجاح ──────────────────────────────────────── */}
          {successMsg && (
            <div
              className="mb-4 p-3 rounded-lg text-sm text-center"
              role="status"
              style={{
                background: 'rgba(34, 197, 94, 0.08)',
                color: '#16a34a',
                border: '1px solid rgba(34, 197, 94, 0.2)',
              }}
            >
              {successMsg}
            </div>
          )}

          {/* ── زر الإرسال ────────────────────────────────────────── */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg py-2.5 text-sm font-semibold transition-opacity"
            style={{
              background: 'var(--color-primary, #0b2d4a)',
              color: '#fff',
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'جاري…' : isLogin ? 'دخول' : 'إنشاء حساب'}
          </button>
        </form>

        {/* ── تبديل الوضع ─────────────────────────────────────────── */}
        <div className="text-center mt-5">
          {isLogin ? (
            <p className="text-sm" style={{ color: 'var(--color-muted, #64748b)' }}>
              ليس لديك حساب؟{' '}
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className="font-medium underline hover:no-underline"
                style={{ color: 'var(--color-primary, #0b2d4a)' }}
              >
                أنشئ حساباً جديداً
              </button>
            </p>
          ) : (
            <p className="text-sm" style={{ color: 'var(--color-muted, #64748b)' }}>
              لديك حساب بالفعل؟{' '}
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="font-medium underline hover:no-underline"
                style={{ color: 'var(--color-primary, #0b2d4a)' }}
              >
                سجّل دخول
              </button>
            </p>
          )}
        </div>
      </div>

      {/* ── تذييل ─────────────────────────────────────────────────── */}
      <p className="text-xs mt-6" style={{ color: 'var(--color-muted, #64748b)' }}>
        &copy; {new Date().getFullYear()} قيد العقار. جميع الحقوق محفوظة.
      </p>
    </div>
  );
};

export default AuthPage;
