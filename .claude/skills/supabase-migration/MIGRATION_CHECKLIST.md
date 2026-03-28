# قائمة فحص Migration — قيد العقار

## هيكل الجدول
- [ ] اسم الجدول بالإنجليزي، snake_case (مثال: `rental_contracts`)
- [ ] `id` من نوع UUID مع `gen_random_uuid()` كـ default
- [ ] `user_id` من نوع UUID مرتبط بـ `auth.users(id)` مع `ON DELETE CASCADE`
- [ ] `created_at` من نوع `timestamptz` مع `DEFAULT now()`
- [ ] `updated_at` من نوع `timestamptz` مع `DEFAULT now()`
- [ ] كل عمود له تعليق بالعربي: `COMMENT ON COLUMN table.col IS 'الوصف';`

## RLS (Row Level Security)
- [ ] RLS مفعّل: `ALTER TABLE [table] ENABLE ROW LEVEL SECURITY;`
- [ ] Policy SELECT: المستخدم يقرأ بياناته فقط
- [ ] Policy INSERT: المستخدم يضيف لنفسه فقط
- [ ] Policy UPDATE: المستخدم يعدّل بياناته فقط
- [ ] Policy DELETE: المستخدم يحذف بياناته فقط

### نمط RLS المعتمد
```sql
CREATE POLICY "users_select_own" ON [table]
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own" ON [table]
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own" ON [table]
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "users_delete_own" ON [table]
  FOR DELETE USING (auth.uid() = user_id);
```

## الأمان
- [ ] لا حذف بيانات في migration — فقط إضافة (additive only)
- [ ] لا تعديل على جداول `auth.*` مباشرة
- [ ] الأعمدة المالية من نوع `numeric(12,2)` (لا `float`)
- [ ] الأعمدة الحساسة (هوية، هاتف) مميزة بتعليق `-- حساس PDPL`

## الفهارس
- [ ] فهرس على `user_id` لكل جدول (للأداء مع RLS)
- [ ] فهارس إضافية حسب أنماط الاستعلام المتوقعة

## التحقق
- [ ] تم اختبار الـ migration محلياً
- [ ] تم التأكد من أن `storage-facade.js` يتعامل مع الجدول الجديد
