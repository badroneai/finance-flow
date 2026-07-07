-- ═══════════════════════════════════════
-- Migration 006: Trigger تسجيل مستخدم جديد
-- ═══════════════════════════════════════
-- عند تسجيل مستخدم جديد عبر Supabase Auth:
-- 1. يُنشئ مكتب جديد (offices) باسم من metadata
-- 2. يُنشئ profile مرتبط بالمكتب بدور owner
-- هذا الـ trigger ضروري لأن AuthContext يفترض وجود
-- profile + office بعد التسجيل مباشرة (مع تأخير 500-800ms)
-- ═══════════════════════════════════════

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_office_id uuid;
  office_name_val text;
  full_name_val text;
BEGIN
  -- استخراج البيانات من metadata المُرسلة عند التسجيل
  office_name_val := COALESCE(
    NEW.raw_user_meta_data ->> 'office_name',
    'مكتب جديد'
  );
  full_name_val := COALESCE(
    NEW.raw_user_meta_data ->> 'full_name',
    ''
  );

  -- إنشاء المكتب
  INSERT INTO public.offices (name)
  VALUES (office_name_val)
  RETURNING id INTO new_office_id;

  -- إنشاء الـ profile
  INSERT INTO public.profiles (id, office_id, full_name, role)
  VALUES (NEW.id, new_office_id, full_name_val, 'owner');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ربط الـ trigger بجدول auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
