/*
  قيد العقار (Finance Flow)
  supabase.js — عميل Supabase المركزي (SPR-004a)

  يقرأ إعدادات الاتصال من متغيرات البيئة (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY).
  إذا كانت القيم وهمية أو فارغة، يطبع تحذيراً في console بدون كسر التطبيق.
*/

import { createClient } from '@supabase/supabase-js';

// ─── قراءة متغيرات البيئة ───────────────────────────────────────
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// ─── كشف القيم الوهمية (placeholder) ────────────────────────────
const isPlaceholder = (val) =>
  !val ||
  val.includes('XXXXX') ||
  val === 'https://XXXXX.supabase.co' ||
  val === 'eyJhbGci...XXXXX';

const hasValidConfig = !isPlaceholder(supabaseUrl) && !isPlaceholder(supabaseAnonKey);

if (!hasValidConfig && import.meta.env.DEV) {
  console.warn(
    '[قيد العقار] إعدادات Supabase غير مكتملة أو وهمية.\n' +
      'التطبيق يعمل بوضع localStorage فقط.\n' +
      'لتفعيل Supabase، عدّل ملف .env.local بالقيم الحقيقية من لوحة تحكم Supabase.'
  );
}

// ─── إنشاء العميل ────────────────────────────────────────────────
// نُنشئ العميل حتى لو كانت القيم وهمية — لن يُستخدم فعلياً إلا عند التحقق من hasValidConfig
export const supabase = hasValidConfig ? createClient(supabaseUrl, supabaseAnonKey) : null;

/** هل إعدادات Supabase صالحة وجاهزة للاستخدام؟ */
export const isSupabaseConfigured = hasValidConfig;

/**
 * جلب المستخدم الحالي من الجلسة النشطة.
 * يُرجع كائن المستخدم أو null إذا لم يكن مسجّلاً أو Supabase غير مُعدّ.
 */
export const getCurrentUser = async () => {
  if (!supabase) return null;
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
};

/**
 * جلب الجلسة الحالية.
 * يُرجع كائن الجلسة أو null.
 */
export const getSession = async () => {
  if (!supabase) return null;
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session;
  } catch {
    return null;
  }
};
