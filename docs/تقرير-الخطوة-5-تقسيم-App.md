# تقرير الخطوة 5: استخراج صفحتي الخطابات والمسودات من App.jsx

**قواعد مُطبقة:** لا حذف لملفات موجودة مسبقاً، لا تغيير سلوك أو منطق. التحقق بـ `npm run build`.

---

## 1. الملفات التي تم إنشاؤها

| الملف | المكون | الـ Props | التبعيات الرئيسية |
|-------|--------|-----------|---------------------|
| `src/pages/GeneratorPage.jsx` | GeneratorPage | letterType، setLetterType | useToast، dataStore، getTemplateByType، buildInitialFields، validateLetterFields، TEMPLATES، FIELD_LABELS (من domain)، MSG (constants)، today (helpers)، formatDateHeader (dateFormat)، Icons (ui-common) |
| `src/pages/DraftsPage.jsx` | DraftsPage | setPage، setLetterType، setEditDraft | useToast، dataStore، formatDraftDate (domain)، LETTER_TYPES، MSG (constants)، EmptyState، Icons (ui-common)، ConfirmDialog (Modals)، formatDateHeader (dateFormat) |

- **GeneratorPage:** لا يستخدم حالياً `editDraft` في الكود المنقول؛ الـ props الفعلية هي `letterType` و `setLetterType` فقط (نفس استدعاء renderPage في App).
- **DraftsPage:** LETTER_TYPES مستورد من `constants/index.js` وليس من domain.

---

## 2. التعديل على App.jsx

- **إضافة استيرادات:** `GeneratorPage` من `./pages/GeneratorPage.jsx`، `DraftsPage` من `./pages/DraftsPage.jsx`.
- **حذف التعريفات:** مكون `GeneratorPage` ومكون `DraftsPage` (بما فيه التعليقات «LETTER GENERATOR PAGE» و«DRAFTS PAGE»).
- **renderPage (switch):** لم يُغيّر — لا يزال يستخدم `<GeneratorPage letterType={letterType} setLetterType={setLetterType}/>` و `<DraftsPage setPage={setPage} setLetterType={setLetterType} setEditDraft={setEditDraft}/>`.

---

## 3. عدد الأسطر المُزالة من App.jsx وحجمه الجديد

- **عدد الأسطر المُزالة:** **158** سطراً (من 2637 إلى 2479).
- **حجم App.jsx بعد التعديل:** **2479** سطراً.

---

## 4. نتيجة `npm run build`

- **النتيجة:** نجاح (exit code 0).
- **مخرجات البناء:** `✓ 93 modules transformed.`، `✓ built in 2.05s`، إنشاء `dist/` بنجاح.

---

## 5. مشاكل واجهتها وحلولها

- **لا توجد.** نقل التعريفات كما هي مع استيراد التبعيات من المسارات الصحيحة. البناء نجح من أول تشغيل.

---

*تم إعداد هذا التقرير بعد إكمال الخطوة 5 دون تعديل منطق التطبيق.*
