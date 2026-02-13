# Stage 3 Plan — Structure (Finance Flow / قيد العقار)

> **Scope of this PR:** خطة فقط (docs-only). لا تغييرات كود.

## 1) Goal (الهدف)
- تنظيم المشروع بشكل أوضح داخل `src/` و `assets/` بدون أي تغيير سلوك.
- فصل الطبقات (core / data / ui / pages) بصورة قابلة للتوسع.
- تقليل الاعتماد على الملف الواحد الضخم، لكن **بدون** لمس UI/Routes/منطق مالي فعليًا في هذه المرحلة إلا بقدر النقل الحرفي.

## 2) Boundaries / Constraints (حدود التغيير)
ممنوع في Stage 3:
- تغيير المنطق المالي (حسابات، parsing، validation).
- تغيير LocalStorage schema أو أسماء المفاتيح.
- تغيير النصوص/الشكل/الأيقونات.
- إضافة مكتبات جديدة أو build steps جديدة.

مسموح في Stage 3:
- نقل ملفات/دوال/مكوّنات كما هي (copy/move) مع تحديث imports فقط.
- إعادة تسمية مسارات الملفات لتصبح منظمة.
- إضافة ملفات index بسيطة (barrel exports) عند الحاجة لتقليل التشتت.

## 3) PR Breakdown (تقسيم الـPRs — واحد لكل طبقة)
قاعدة: **كل PR هدف واحد + commit واحد**.

### PR 3.1 — Core structure
- إنشاء/تثبيت المسارات:
  - `src/core/` (keys, storage, formatters, qa)
- نقل/تجميع ملفات core الحالية إلى `src/core/` (بدون تغيير API)، وتحديث imports.

### PR 3.2 — Data layer structure
- إنشاء:
  - `src/data/` (dataStore, seed, helpers)
- نقل ما يتعلق بالـdata store فقط (بدون تغيير سلوك).

### PR 3.3 — UI layer structure (NO UI changes)
- إنشاء:
  - `src/ui/` (Sidebar/Modal/ConfirmDialog/other shared UI)
- نقل المكوّنات المشتركة فقط (حرفيًا) وتحديث imports.

### PR 3.4 — Pages structure
- إنشاء:
  - `src/pages/` (Transactions/Commissions/Settings/etc)
- نقل كل صفحة على حدة (بدون تغيير UI).

### PR 3.5 — App entry cleanup
- جعل `src/App.jsx` orchestrator فقط قدر الإمكان (بدون تغيير سلوك).
- تحديث `src/main.jsx` إن لزم.

## 4) Gate for every Stage 3 PR
لازم PASS قبل طلب الدمج:
1) Console: **0 errors**
2) Network: **0 same-origin 404**
3) CRUD + Refresh: add/edit/delete + refresh
4) Settings persistence: theme/numerals/date-header
5) Backup/Restore schema=1 replace+reload
6) Mobile sanity: toggle sidebar + basic navigation

## 5) Stop conditions
- أي Console error جديد
- أي same-origin 404
- أي فشل في CRUD/persistence/backup/mobile sanity

## 6) Deliverables after each PR
- رابط PR
- رابط commit
- Gate result (PASS/FAIL) + ما تم اختباره
- "ماذا تغير" في 5 سطور
- ثم التوقف حتى أمرك التالي
