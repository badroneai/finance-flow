---
name: supabase-migration
description: >
  يساعد في إنشاء Supabase migrations آمنة.
  يُستخدم عند إضافة جداول أو أعمدة أو تعديل schema.
allowed-tools: Read, Grep, Glob
---

عند إنشاء migration:

1. اقرأ الجداول الحالية من `supabase/migrations/` (إن وُجد)
2. تأكد من عدم التعارض مع migrations سابقة
3. أضف RLS policy لكل جدول جديد
4. أضف تعليقات عربية توضح الغرض
5. اتبع القائمة في @MIGRATION_CHECKLIST.md
6. سمّ الملف بتنسيق: `[YYYYMMDDHHMMSS]_[description].sql`

شكل الملف:
```sql
-- Migration: [الوصف بالعربي]
-- التاريخ: [YYYY-MM-DD]
-- السبب: [لماذا نحتاج هذا التغيير]

-- التغييرات
[SQL statements]

-- RLS Policies
[RLS policies]

-- التراجع (Rollback) — للمرجع فقط
-- [Rollback SQL]
```

⚠️ لا تنفذ الـ migration — اعرضها للموافقة أولاً.
