# قيد العقار — Pilot Runbook

> الإصدار: 1.0.0 | التاريخ: 2026-04-05
> هذا الملف هو المرجع التشغيلي الوحيد لتشغيل pilot محدود.

---

## 1. Pre-Launch Checklist

- [ ] مشروع Supabase جاهز (https://supabase.com/dashboard)
- [ ] نسخ `VITE_SUPABASE_URL` و `VITE_SUPABASE_ANON_KEY` من Settings → API
- [ ] تفعيل Email Auth في Authentication → Providers → Email
- [ ] (اختياري للـ pilot) تعطيل Email Confirmation: Authentication → Settings → "Confirm email" = OFF
- [ ] DNS CNAME record مُضاف: `app.qaydalaqar.com` → `badroneai.github.io`
- [ ] HTTPS مُفعّل في GitHub Pages settings

---

## 2. Deployment Checklist

### 2.1 قاعدة البيانات — Migrations

نفّذ بالترتيب في Supabase SQL Editor (Dashboard → SQL Editor → New query):

| الترتيب | الملف | المحتوى |
|---------|-------|---------|
| 1 | `001_create_base_tables.sql` | 10 جداول أساسية + RLS + triggers + فهارس |
| 2 | `002_add_constraints.sql` | قيود سلامة البيانات + trigger تطابق المكتب |
| 3 | `003_create_missing_tables.sql` | 7 جداول إضافية (payment_schedule, maintenance, notifications, audit_log, attachments, support_tickets, contact_activities) |
| 4 | `004_create_units_table.sql` | جدول الوحدات العقارية |
| 5 | `005_create_contract_receipts_table.sql` | جدول سندات القبض |
| 6 | `006_handle_new_user_trigger.sql` | trigger إنشاء office + profile عند التسجيل |

الملفات في: `supabase/migrations/`

**تحقق بعد التنفيذ:** Table Editor يعرض 18 جدول (17 + units أو contract_receipts).

### 2.2 متغيرات البيئة

**للنشر عبر GitHub Actions:**

GitHub repo → Settings → Secrets and variables → Actions → New repository secret:
```
VITE_SUPABASE_URL=https://[project-ref].supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

`pages.yml` يمرر هذه القيم تلقائيًا لخطوة Build عبر `${{ secrets.* }}`.

**للتطوير المحلي:**
```bash
cp .env.example .env.local
# املأ القيم في .env.local
```

### 2.3 النشر

```bash
git push origin main
```

CI يشغّل: lint → test → build → deploy تلقائي إلى GitHub Pages.

**الرابط:** `https://app.qaydalaqar.com` (بعد إعداد DNS)
**البديل المؤقت:** `https://badroneai.github.io/finance-flow/`

---

## 3. Smoke Test Checklist

بعد التشغيل مباشرة، تحقق من هذه النقاط بالترتيب:

- [ ] **الموقع يفتح:** `app.qaydalaqar.com` → صفحة الهبوط تظهر
- [ ] **التطبيق يفتح:** `app.qaydalaqar.com/finance-flow.html` → صفحة تسجيل الدخول
- [ ] **التسجيل يعمل:** إنشاء حساب جديد → يدخل التطبيق بدون خطأ
- [ ] **Profile + Office أُنشئا:** Supabase Table Editor → profiles → يوجد سجل للمستخدم الجديد مع office_id
- [ ] **تسجيل الخروج/الدخول:** تسجيل خروج ثم دخول → يعمل
- [ ] **إنشاء دفتر:** من الداشبورد أو صفحة الدفاتر → إنشاء دفتر جديد → يظهر
- [ ] **إضافة عقار:** صفحة العقارات → إضافة عقار → يُحفظ
- [ ] **إضافة جهة اتصال:** صفحة جهات الاتصال → إضافة → يُحفظ
- [ ] **إنشاء عقد:** صفحة العقود → ربط بعقار وجهة اتصال → يُحفظ
- [ ] **تسجيل حركة مالية:** من الدفتر → إضافة إيراد أو مصروف → يظهر
- [ ] **Fail-closed في الإنتاج:** إذا أزلت env variables → التطبيق يعرض "خطأ في الإعدادات" ولا يسمح بالدخول
- [ ] **Demo ممنوع في الإنتاج:** `?demo=true` لا يتجاوز المصادقة

---

## 4. Rollback / Fallback

**إذا فشل النشر (build error):**
- آخر نسخة ناجحة تبقى حية على GitHub Pages
- لا يُحذف المحتوى القديم تلقائيًا
- أصلح الخطأ وادفع مرة أخرى

**إذا فشلت قاعدة البيانات:**
- Migrations مصممة بـ `CREATE IF NOT EXISTS` — آمنة للتشغيل أكثر من مرة
- إذا حدث خطأ في migration معينة: أصلح وأعد تنفيذها
- **حذف البيانات:** migration 003 تحتوي `DROP CASCADE` على الجداول السبعة الإضافية فقط — لا تمس الجداول الأساسية

**إذا فشل الموقع بالكامل:**
- التطبيق يعمل بـ localStorage بدون Supabase في بيئة التطوير
- لكن في الإنتاج: fail-closed — يجب إصلاح الاتصال

---

## 5. Pilot Operator Notes

**أول مستخدم:**
- أول حساب يُنشأ تلقائيًا بدور `owner`
- المالك يرى كل البيانات في مكتبه
- لا يوجد seed data — يبدأ المكتب فارغًا

**الأدوار:**
- `owner`: صلاحيات كاملة
- `manager` / `agent`: مُعدّة في النظام لكن لا يوجد فرق فعلي في الصلاحيات حاليًا (يُضاف لاحقًا)

**حدود معروفة في الـ pilot:**
- لا إشعارات بريدية (email notifications غير مُفعّلة بعد)
- لا رفع مرفقات (Storage Bucket لم يُنشأ بعد)
- التطبيق يعمل كـ SPA على GitHub Pages — refresh على مسار داخلي قد يُعطي 404 (hash routing يحل هذا)

**الدومين:**
- الدومين المخصص: `app.qaydalaqar.com`
- يحتاج CNAME record في DNS
- HTTPS مجاني عبر GitHub Pages (Let's Encrypt)

**الدعم:**
- الـ logs في: Supabase Dashboard → Logs
- أخطاء المستخدم تظهر كـ toast messages في التطبيق
- أخطاء النظام تُسجل في `console.warn` / `console.error` فقط
