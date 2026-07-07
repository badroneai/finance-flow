# تقرير المرحلة 2 — تفكيك LedgersPage.jsx

> تاريخ التنفيذ: 2026-04-02

## الملخص التنفيذي

تم تفكيك `LedgersPage.jsx` من **1,999 سطر** إلى **567 سطر** عبر استخراج:
1. **`useLedgerState` custom hook** — نقل كل الحالة والمعالجات والقيم المحسوبة
2. **`LedgerListTab` component** — نقل JSX تبويب قائمة الدفاتر (إنشاء + عرض + تعديل + seed/demo)

## قبل وبعد

| الملف | قبل | بعد |
|-------|------|------|
| `src/pages/LedgersPage.jsx` | 1,999 سطر · 51 useState | 567 سطر · 0 useState |
| `src/pages/hooks/useLedgerState.js` | — | 1,402 سطر (جديد) |
| `src/ui/ledger/LedgerListTab.jsx` | — | 530 سطر (جديد) |

**صافي التغيير**: 1,999 → 2,499 سطر (+500 سطر overhead من التصريحات والاستيرادات المكررة)

## الملفات الجديدة المستخرجة

### 1. `src/pages/hooks/useLedgerState.js` (1,402 سطر)
**المسؤولية**: كل منطق الحالة لصفحة الدفاتر
- 51 useState declaration (الدفاتر، الالتزامات، الميزانيات، التسعير، الدفع، الذكاء، التوقعات)
- 4 useEffect hooks (جلب أولي، مزامنة DataContext، URL tab routing، مزامنة الميزانية)
- جميع الـ handlers (createLedger, saveEdit, saveLedgerBudgets, saveRecurring, deleteRecurring, startPayNow, submitPayNow, openPricingWizard, applyQuickPricing, applySaudiAutoPricingForLedger, updateRecurringOps)
- جميع القيم المحسوبة (health, brain, forecast, inbox, cashPlan, budgetAuth, operatorMode, outlook, actuals, budgetsHealth, ledgerAlerts, ledgerReports)
- الثوابت المساعدة (LEDGER_TYPE_LABELS, CATEGORY_LABEL, SA_CITY_FACTOR, SA_SIZE_FACTOR, sections)
- الدوال المساعدة (normalizeNumeralsToAscii, parseRecurringAmount, ensureDateValue, normalizeLedgerType, normalizeNote)

### 2. `src/ui/ledger/LedgerListTab.jsx` (530 سطر)
**المسؤولية**: عرض تبويب "الدفاتر" بالكامل
- نموذج إنشاء دفتر جديد (اسم + نوع + وصف)
- لقطة الدفتر النشط (الاسم، النوع، الالتزامات، الاكتمال)
- شبكة بطاقات الدفاتر مع:
  - تعديل inline (اسم + نوع + وصف)
  - زر "إضافة نموذج الالتزامات" (seed)
  - زر "تفعيل نموذج مكتب كامل" (demo + pricing + payments)
  - زر "تعيين كنشط"
- مكون `LedgersSectionHeader` المساعد

## ما بقي داخل LedgersPage ولماذا

| العنصر | السبب |
|--------|-------|
| Quick links (النبض/المستحقات/الحركات) | 10 أسطر فقط، مرتبطة بـ `setPage` prop |
| Tab routing (recurring/performance/compare/reports) | هيكل التبويبات + ربط المكونات الفرعية الموجودة |
| `assertFn` guards | تحقق وقت التشغيل قبل تمرير handlers |
| `ConfirmDialog` | modal واحد مشترك بين كل التبويبات |
| Props forwarding لـ LedgerRecurringTab | ~90 prop — التخفيض مخطط في المرحلة 4 (custom hooks) |
| Props forwarding لـ LedgerPerformanceTab/LedgerReportsTab | مرتبطة بحالة الأداء والتقارير |

## نتائج بوابات الجودة

| الفحص | النتيجة |
|-------|---------|
| ESLint (--max-warnings=0) | ✅ 0 أخطاء · 0 تحذيرات |
| Prettier | ✅ كل الملفات منسقة |
| Vitest (npm run test) | ✅ 17 ملف اختبار · 210 اختبار ناجح |
| Vite build (npm run build) | ✅ بنجاح في 3.44 ثانية |

## التحقق من عدم تغير السلوك

- **لا تغيير في الـ API الخارجي**: LedgersPage لا يزال يستقبل `{ setPage }` ويصدّر `default`
- **لا تغيير في الـ imports**: `App.jsx` لا يحتاج أي تعديل
- **نفس الـ JSX بالضبط**: كل عنصر HTML/React في المخرج النهائي مطابق للأصل
- **نفس الـ props بالضبط**: كل prop يمرر لـ LedgerRecurringTab/PerformanceTab/ReportsTab مطابق
- **Build output**: LedgersPage chunk حجمه 121.35 KB (لا تغيير جوهري)

## ملاحظات معمارية

1. **useLedgerState (1,402 سطر)** — أكبر من حد الـ 500 سطر المحدد في engineering-standards. هذا متوقع كخطوة أولى: نقلنا التعقيد بدون تغيير السلوك. المراحل القادمة (3 و 4) ستكسره لـ hooks أصغر.
2. **LedgerListTab (530 سطر)** — أكبر بقليل من حد الـ 300 سطر للـ UI component. يمكن تقسيمه لاحقاً لـ LedgerCreateForm + LedgerCardGrid.
3. **الـ 90 prop لـ LedgerRecurringTab** — لم تتغير (مقصود: لا نغير سلوك). المرحلة 4 ستحلها بـ Context مخصص.

## الخطوات التالية (لا تبدأ بدون موافقة)

- **المرحلة 3**: اختبارات ledger-health.js و ledger-planner.js
- **المرحلة 4**: تكسير useLedgerState لـ hooks أصغر + توحيد PaymentModal
- **المرحلة 5**: تفكيك CommissionsPage + PropertyDetailPage
- **المرحلة 6**: تقسيم DataContext
