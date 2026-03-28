/*
  قيد العقار (Finance Flow)
  AuthContext.jsx — سياق المصادقة (SPR-004d)

  يدير حالة المستخدم والجلسة عبر Supabase Auth.
  يجلب بيانات الـ profile والمكتب بعد تسجيل الدخول.
  يوفّر: user, session, profile, office, loading, signUp, signIn, signOut, isAuthenticated,
         isOwner, isManager, isAgent, isSuperAdmin, profileLoading.
  إذا لم يكن Supabase مُعدّاً (placeholder)، يعمل التطبيق بدون مصادقة (localStorage فقط).
*/

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '../core/supabase.js';
import { useDemo } from './DemoContext.jsx';

// ─── إنشاء السياق ──────────────────────────────────────────────
const AuthContext = createContext(null);

// ─── المزوّد (Provider) ─────────────────────────────────────────
export const AuthProvider = ({ children }) => {
  const { isDemo, demoProfile, demoOffice } = useDemo();
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // بيانات الـ profile والمكتب
  const [profile, setProfile] = useState(null);
  const [office, setOffice] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // ── جلب بيانات المستخدم (profile + office) ────────────────────
  const fetchUserData = useCallback(async (userId) => {
    if (!supabase || !userId) return;
    setProfileLoading(true);
    try {
      // 1. جلب الـ profile
      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileErr) {
        console.error('[قيد العقار] خطأ في جلب الـ profile:', profileErr);
        setProfile(null);
        setOffice(null);
        setProfileLoading(false);
        return;
      }

      setProfile(profileData);

      // 2. جلب المكتب (إذا ليس super_admin)
      if (profileData?.office_id) {
        const { data: officeData, error: officeErr } = await supabase
          .from('offices')
          .select('*')
          .eq('id', profileData.office_id)
          .single();

        if (officeErr) {
          console.error('[قيد العقار] خطأ في جلب بيانات المكتب:', officeErr);
        }
        setOffice(officeData ?? null);
      } else {
        setOffice(null);
      }
    } catch (err) {
      console.error('[قيد العقار] خطأ غير متوقع في fetchUserData:', err);
      setProfile(null);
      setOffice(null);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  // ── الاستماع لتغييرات حالة المصادقة ──────────────────────────
  useEffect(() => {
    // إذا Supabase غير مُعدّ، انتقل مباشرة لوضع بدون مصادقة
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    // جلب الجلسة الحالية عند التحميل الأولي
    const initSession = async () => {
      try {
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        // جلب بيانات المستخدم إذا كان مسجّلاً
        if (currentSession?.user?.id) {
          await fetchUserData(currentSession.user.id);
        }
      } catch (err) {
        console.error('[قيد العقار] خطأ في جلب الجلسة:', err);
      } finally {
        setLoading(false);
      }
    };

    initSession();

    // الاستماع للتغييرات المستقبلية (تسجيل دخول/خروج، تجديد token)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (event === 'SIGNED_IN' && newSession?.user?.id) {
        // تأخير بسيط ليكتمل الـ trigger في Supabase
        setTimeout(() => fetchUserData(newSession.user.id), 500);
      }

      if (event === 'SIGNED_OUT') {
        setProfile(null);
        setOffice(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [fetchUserData]);

  // ── تسجيل حساب جديد ──────────────────────────────────────────
  // metadata يحتوي: { office_name, full_name }
  const signUp = useCallback(
    async (email, password, metadata = {}) => {
      if (!supabase) {
        return { error: { message: 'Supabase غير مُعدّ. عدّل ملف .env.local.' } };
      }
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              office_name: metadata.office_name || '',
              full_name: metadata.full_name || '',
            },
          },
        });

        if (error) {
          console.error('[قيد العقار] Auth signUp Error:', error);
        }

        // إذا نجح التسجيل والمستخدم حصل على session مباشرة (بدون تأكيد بريد)
        if (!error && data?.session && data?.user?.id) {
          // تأخير ليكتمل trigger إنشاء الـ profile والمكتب
          setTimeout(() => fetchUserData(data.user.id), 800);
        }

        return { data, error };
      } catch (err) {
        console.error('[قيد العقار] Auth signUp Exception:', err);
        return { error: { message: err.message || 'خطأ غير متوقع أثناء التسجيل' } };
      }
    },
    [fetchUserData]
  );

  // ── تسجيل دخول ───────────────────────────────────────────────
  const signIn = useCallback(
    async (email, password) => {
      if (!supabase) {
        return { error: { message: 'Supabase غير مُعدّ. عدّل ملف .env.local.' } };
      }
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
          console.error('[قيد العقار] Auth signIn Error:', error);
        }

        // جلب بيانات المستخدم بعد تسجيل الدخول الناجح
        if (!error && data?.user?.id) {
          await fetchUserData(data.user.id);
        }

        return { data, error };
      } catch (err) {
        console.error('[قيد العقار] Auth signIn Exception:', err);
        return { error: { message: err.message || 'خطأ غير متوقع أثناء تسجيل الدخول' } };
      }
    },
    [fetchUserData]
  );

  // ── تسجيل خروج ───────────────────────────────────────────────
  const signOut = useCallback(async () => {
    if (!supabase) {
      return { error: { message: 'Supabase غير مُعدّ.' } };
    }
    try {
      const { error } = await supabase.auth.signOut();
      if (!error) {
        setUser(null);
        setSession(null);
        setProfile(null);
        setOffice(null);
      } else {
        console.error('[قيد العقار] Auth signOut Error:', error);
      }
      return { error };
    } catch (err) {
      console.error('[قيد العقار] Auth signOut Exception:', err);
      return { error: { message: err.message || 'خطأ غير متوقع' } };
    }
  }, []);

  // ── جلب بيانات الـ profile يدوياً (إعادة تحميل) ────────────────
  const getProfile = useCallback(async () => {
    if (!user?.id) return null;
    await fetchUserData(user.id);
    return profile;
  }, [user, fetchUserData, profile]);

  // ── أدوار المستخدم (computed) ──────────────────────────────────
  const role = profile?.role || null;
  const isOwner = role === 'owner';
  const isManager = role === 'manager';
  const isAgent = role === 'agent';
  const isSuperAdmin = role === 'super_admin';

  // ── القيمة المُقدّمة للسياق ──────────────────────────────────
  // في وضع Demo: تجاوز بيانات المستخدم ببيانات تجريبية
  const effectiveProfile = isDemo ? demoProfile : profile;
  const effectiveOffice = isDemo ? demoOffice : office;
  const effectiveRole = effectiveProfile?.role || null;
  const effectiveIsAuthenticated = isDemo ? true : !!user;

  const value = useMemo(
    () => ({
      user: isDemo ? { id: 'demo-user-001', email: 'demo@qaydalaqar.com' } : user,
      session,
      loading: isDemo ? false : loading,
      profile: effectiveProfile,
      office: effectiveOffice,
      profileLoading: isDemo ? false : profileLoading,
      signUp,
      signIn,
      signOut,
      getProfile,
      isAuthenticated: effectiveIsAuthenticated,
      isSupabaseConfigured,
      isDemo,
      // أدوار المستخدم
      role: effectiveRole,
      isOwner: effectiveRole === 'owner',
      isManager: effectiveRole === 'manager',
      isAgent: effectiveRole === 'agent',
      isSuperAdmin: effectiveRole === 'super_admin',
    }),
    [
      user,
      session,
      loading,
      effectiveProfile,
      effectiveOffice,
      profileLoading,
      signUp,
      signIn,
      signOut,
      getProfile,
      effectiveRole,
      effectiveIsAuthenticated,
      isDemo,
    ]
  );

  // أثناء التحقق الأولي، نعرض شاشة تحميل بسيطة
  if (loading) {
    return (
      <AuthContext.Provider value={value}>
        <div
          dir="rtl"
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: '"IBM Plex Sans Arabic", sans-serif',
            background: '#f8fafc',
            color: '#64748b',
          }}
        >
          جاري التحميل…
        </div>
      </AuthContext.Provider>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ─── Hook مختصر للوصول من أي مكون ──────────────────────────────
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth يجب أن يُستخدم داخل AuthProvider');
  }
  return ctx;
};
