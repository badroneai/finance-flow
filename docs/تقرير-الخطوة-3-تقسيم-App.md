# تقرير الخطوة 3: استخراج الصفحات الأقل تشابكاً من App.jsx

**قواعد مُطبقة:** لا حذف لملفات موجودة مسبقاً، لا تغيير سلوك أو منطق — فقط نقل. التحقق بـ `npm run build`.

---

## 1. الملفات التي تم إنشاؤها

| الملف | الوصف |
|-------|--------|
| `src/pages/HomePage.jsx` | الصفحة الرئيسية — props: `setPage`. استيراد: `dataStore` من core/dataStore، `Icons` من ui/ui-common. |
| `src/pages/DashboardPage.jsx` | لوحة التحكم — بدون props من App. استيراد: `dataStore`، `getDashboardDateRange`، `computeIncomeExpenseNet`، `splitCommissionsByStatus`، `computeCommissionOfficeTotals`، `buildLast6MonthsIncomeExpenseChart` من domain؛ `DASHBOARD_PERIOD_OPTIONS` من constants؛ `SummaryCard`، `Icons` من ui-common؛ `Currency`، `formatNum` من utils/format. |
| `src/pages/TemplatesPage.jsx` | صفحة قوالب الخطابات — props: `setPage`، `setLetterType`. استيراد: `TEMPLATES` من domain/index، `Icons` من ui/ui-common. |

---

## 2. التعديل على App.jsx

- **إضافة استيرادات:** `HomePage`، `DashboardPage`، `TemplatesPage` من `./pages/HomePage.jsx`، `./pages/DashboardPage.jsx`، `./pages/TemplatesPage.jsx`.
- **حذف التعريفات:** مكون `HomePage` (بما فيه التعليق)، مكون `DashboardPage` (بما فيه التعليق)، مكون `TemplatesPage` والتعليق الخاص بـ "LETTERS TEMPLATES PAGE".
- **renderPage (switch):** لم يُغيّر — لا يزال يستخدم `<HomePage setPage={setPage}/>`، `<DashboardPage/>`، `<TemplatesPage setPage={setPage} setLetterType={setLetterType}/>` مع نفس الـ props، والمكونات الآن مستوردة.

---

## 3. عدد الأسطر المُزالة من App.jsx وحجمه الجديد

- **عدد الأسطر المُزالة:** **446** سطراً (من 3264 إلى 2818).
- **حجم App.jsx بعد التعديل:** **2818** سطراً.

---

## 4. نتيجة `npm run build`

- **النتيجة:** نجاح (exit code 0).
- **مخرجات البناء:** `✓ 89 modules transformed.`، `✓ built in 2.35s`، إنشاء `dist/` بنجاح.

---

## 5. مشاكل واجهتها وحلولها

- **لا توجد.** نقل التعريفات كما هي مع تصحيح مسارات الاستيراد من داخل `src/pages/`. البناء نجح من أول تشغيل.

---

*تم إعداد هذا التقرير بعد إكمال الخطوة 3 دون تعديل منطق التطبيق.*
