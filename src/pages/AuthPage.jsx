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
  if (lower.includes('email link is invalid') || lower.includes('token has expired'))
    return 'رابط الاستعادة منتهي الصلاحية أو غير صالح. أرسل طلباً جديداً' + devSuffix;
  if (lower.includes('new password should be different'))
    return 'يجب أن تختلف كلمة المرور الجديدة عن القديمة' + devSuffix;
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

// ─── المكون الرئيسي ─────────────────────────────────────────────
const AuthPage = () => {
  const navigate = useNavigate();
  const { signIn, signUp, resetPassword, isAuthenticated } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'forgot'
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

  // ── نسيت كلمة المرور ─────────────────────────────────────────
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    resetMessages();

    if (!email.trim()) {
      setError('أدخل بريدك الإلكتروني لإرسال رابط الاستعادة');
      return;
    }

    setLoading(true);
    const { error: err } = await resetPassword(email.trim());
    setLoading(false);

    if (err) {
      setError(translateError(err.message));
    } else {
      // نُظهر رسالة نجاح بدون الكشف إذا كان الإيميل مسجلاً أم لا (أمان)
      setSuccessMsg(
        'إذا كان البريد مسجّلاً لدينا، ستصل رسالة الاستعادة خلال دقائق. تحقق من صندوق الوارد والبريد غير المرغوب.'
      );
    }
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
    const { error: err } = await signIn(email.trim(), password);
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
  const isForgot = mode === 'forgot';

  return (
    <div dir="rtl" className="auth-page">
      {/* ── الشعار والعنوان ──────────────────────────────────────── */}
      <div className="auth__logo-block">
        <div className="auth__logo-icon">
          <AppLogo />
        </div>
        <h1 className="auth__logo-title">قيد العقار</h1>
        <p className="auth__logo-subtitle">إدارة التدفقات المالية لمكتبك العقاري</p>
      </div>

      {/* ── البطاقة الرئيسية ─────────────────────────────────────── */}
      <div className="auth__card">
        <h2 className="auth__card-title">
          {isForgot ? 'استعادة كلمة المرور' : isLogin ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
        </h2>

        {/* ── نموذج نسيت كلمة المرور ─────────────────────────────── */}
        {isForgot && (
          <form onSubmit={handleForgotPassword} noValidate>
            <p className="auth__card-description">
              أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور
            </p>
            <div className="auth__field">
              <label className="auth__label">البريد الإلكتروني</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                dir="ltr"
                required
                autoComplete="email"
                autoFocus
                className="auth__input auth__input--ltr"
              />
            </div>

            {error && (
              <div className="auth__alert auth__alert--danger" role="alert">
                {error}
              </div>
            )}

            {successMsg && (
              <div className="auth__alert auth__alert--success" role="status">
                {successMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !!successMsg}
              className="auth__submit"
            >
              {loading ? 'جاري الإرسال…' : 'إرسال رابط الاستعادة'}
            </button>

            <div className="auth__links">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="auth__link"
              >
                العودة لتسجيل الدخول
              </button>
            </div>
          </form>
        )}

        <form
          onSubmit={isLogin ? handleSignIn : handleSignUp}
          noValidate
          style={{ display: isForgot ? 'none' : undefined }}
        >
          {/* ── اسم المكتب (إنشاء حساب فقط) ────────────────────── */}
          {!isLogin && (
            <div className="auth__field">
              <label className="auth__label">اسم المكتب العقاري</label>
              <input
                type="text"
                value={officeName}
                onChange={(e) => setOfficeName(e.target.value)}
                placeholder="مثال: مكتب الأمانة العقارية"
                maxLength={120}
                required
                className="auth__input"
              />
            </div>
          )}

          {/* ── الاسم الكامل (إنشاء حساب فقط) ─────────────────── */}
          {!isLogin && (
            <div className="auth__field">
              <label className="auth__label">الاسم الكامل</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="مثال: أحمد محمد العتيبي"
                maxLength={100}
                required
                autoComplete="name"
                className="auth__input"
              />
            </div>
          )}

          {/* ── البريد الإلكتروني ─────────────────────────────────── */}
          <div className="auth__field">
            <label className="auth__label">البريد الإلكتروني</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              dir="ltr"
              required
              autoComplete="email"
              className="auth__input auth__input--ltr"
            />
          </div>

          {/* ── كلمة المرور ───────────────────────────────────────── */}
          <div className="auth__field">
            <label className="auth__label">كلمة المرور</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isLogin ? '••••••••' : '6 أحرف على الأقل'}
              dir="ltr"
              required
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              className="auth__input auth__input--ltr"
            />
          </div>

          {/* ── تأكيد كلمة المرور (إنشاء حساب فقط) ───────────────── */}
          {!isLogin && (
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
          )}

          {/* ── رسالة الخطأ ───────────────────────────────────────── */}
          {error && (
            <div className="auth__alert auth__alert--danger" role="alert">
              {error}
            </div>
          )}

          {/* ── رسالة النجاح ──────────────────────────────────────── */}
          {successMsg && (
            <div className="auth__alert auth__alert--success" role="status">
              {successMsg}
            </div>
          )}

          {/* ── زر الإرسال ────────────────────────────────────────── */}
          <button
            type="submit"
            disabled={loading}
            className="auth__submit"
          >
            {loading ? 'جاري…' : isLogin ? 'دخول' : 'إنشاء حساب'}
          </button>
        </form>

        {/* ── تبديل الوضع ─────────────────────────────────────────── */}
        <div className="auth__links">
          {isLogin ? (
            <>
              <p>
                ليس لديك حساب؟{' '}
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className="auth__link"
                >
                  أنشئ حساباً جديداً
                </button>
              </p>
              <button
                type="button"
                onClick={() => switchMode('forgot')}
                className="auth__link auth__link--secondary"
              >
                نسيت كلمة المرور؟
              </button>
            </>
          ) : (
            <p>
              لديك حساب بالفعل؟{' '}
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="auth__link"
              >
                سجّل دخول
              </button>
            </p>
          )}
        </div>
      </div>

      {/* ── تذييل ─────────────────────────────────────────────────── */}
      <p className="auth__footer">
        &copy; {new Date().getFullYear()} قيد العقار. جميع الحقوق محفوظة.
      </p>
    </div>
  );
};

export default AuthPage;
