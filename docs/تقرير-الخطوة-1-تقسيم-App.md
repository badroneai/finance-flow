# تقرير الخطوة 1: استخراج الثوابت والدوال المساعدة من App.jsx

**تاريخ التنفيذ:** بعد إكمال المهمة حسب الطلب.  
**قواعد مُطبقة:** لا حذف لملفات موجودة مسبقاً، لا تغيير سلوك أو منطق، استيراد من الملفات الجديدة بدل التعريف المحلي.

---

## 1. الملفات التي تم إنشاؤها وعدد الأسطر

| الملف | عدد الأسطر |
|-------|------------|
| `src/constants/index.js` | 111 |
| `src/utils/helpers.js` | 24 |
| `src/utils/format.jsx` | 55 |
| `src/utils/dateFormat.js` | 90 |
| `src/core/theme-ui.js` | 151 |
| `src/core/dataStore.js` | 187 |

**ملاحظة:** ملف التنسيق المالي أنشئ كـ `format.jsx` (وليس `format.js`) لأنّه يحتوي على مكوّني React (SarSymbol و Currency) وبالتالي JSX؛ Vite يفسّر الملفات `.js` كـ JavaScript فقط فتفشل البناء عند وجود وسم `<svg>`.

---

## 2. ما تم نقله إلى كل ملف

- **constants/index.js:** KEYS، MSG، TRANSACTION_TYPES، TRANSACTION_CATEGORIES، PAYMENT_METHODS، COMMISSION_STATUSES، LETTER_TYPES، DASHBOARD_PERIOD_OPTIONS، NAV_ITEMS (بـ iconKey بدل icon)، SEED_TRANSACTIONS، SEED_COMMISSIONS، SEED_DRAFTS، SEED_SETTINGS، BACKUP_VERSION، STORAGE_ERROR_MESSAGE.  
  (TEMPLATES و FIELD_LABELS غير معرّفين في App.jsx؛ هما مستوردان من `domain/index.js` فلم يُنقلا إلى constants.)

- **utils/helpers.js:** genId، now، today، isValidDateStr، safeNum.

- **utils/format.jsx:** getNumeralLocale، formatNumber، formatCurrency، formatPercent، formatNum، SarSymbol، Currency.  
  (يعتمد getNumeralLocale على getNumeralsMode من theme-ui.)

- **utils/dateFormat.js:** normalizeHijriSuffix، buildLocale، getLocaleForNumerals، getGregorianLocale، getHijriLocale، formatDateHeader، formatDateGregorianNumeric، formatDateHijriNumeric.  
  (تعتمد دوال التاريخ على getNumeralsMode و getSavedDateHeader من theme-ui.)

- **core/theme-ui.js:** مفاتيح الواجهة (UI_THEME_KEY، UI_NUMERALS_KEY، UI_DATE_HEADER_KEY، UI_ONBOARDING_SEEN_KEY)، getSavedTheme، getEffectiveSystemTheme، start/stopSystemThemeListener، applyTheme، initTheme، getSavedNumerals، applyNumerals، initNumerals، getSavedDateHeader، setDateHeaderPref، getOnboardingSeen، setOnboardingSeen، getNumeralsMode.

- **core/dataStore.js:** getActiveLedgerIdSafe، safeGet، safeSet، createCrud، transactionsList، _commissionsCrud، _draftsCrud، dataStore، detectPrivateBrowsing.  
  (تعتمد على constants، helpers، ledger-store، storageFacade.)

---

## 3. التعديل على App.jsx

- **إضافة:** استيراد من `constants/index.js`، `utils/helpers.js`، `utils/format.jsx`، `utils/dateFormat.js`، `core/theme-ui.js`، `core/dataStore.js`.  
- **حذف:** تعريف getActiveLedgerIdSafe؛ ثم كتلة واحدة كبيرة من "// TYPES" حتى نهاية formatDateHijriNumeric (جميع الثوابت والدوال المنقولة أعلاه).  
- **الإبقاء في App:** SIMULATE_RENDER_ERROR (لاختبار Error Boundary)؛ تعريف Icons ثم بناء NAV_ITEMS من NAV_ITEMS_BASE:  
  `const NAV_ITEMS = NAV_ITEMS_BASE.map((it) => ({ ...it, icon: Icons[it.iconKey] }));`

---

## 4. عدد الأسطر المُزالة من App.jsx وحجمه الجديد

- **عدد الأسطر المُزالة تقريباً:** ~880 (من حوالي 4046 إلى 3166).  
- **حجم App.jsx بعد التعديل:** **3166 سطراً.**

---

## 5. نتيجة `npm run build`

- **النتيجة:** نجاح (exit code 0).  
- **مخرجات البناء:**  
  `vite v7.3.1 building client environment for production...`  
  `✓ 80 modules transformed.`  
  `✓ built in 1.85s`  
  مع إنشاء `dist/finance-flow.html` و `dist/assets/app-*.js` و `dist/assets/app-*.css`.

---

## 6. مشاكل واجهتها وكيفية الحل

1. **فشل البناء عند وجود JSX في ملف .js**  
   - **السبب:** وضع مكوّني SarSymbol و Currency في `src/utils/format.js`؛ Vite/Rollup يعاملان `.js` كـ JavaScript فقط فيُفسَّر `<` في `<svg>` كعامل مقارنة.  
   - **الحل:** إنشاء الملف كـ `src/utils/format.jsx` واستيراده من App كـ `./utils/format.jsx`، وحذف `format.js` الذي أنشئ في نفس المهمة (لم يُحذف أي ملف كان موجوداً قبل المهمة).

2. **مسار استيراد keys في constants**  
   - تم استخدام `../../assets/js/core/keys.js` من `src/constants/index.js` (مستويان للأعلى ثم assets).

3. **NAV_ITEMS تعتمد على Icons**  
   - تم تصدير NAV_ITEMS من constants بحقل `iconKey` (نص)؛ في App.jsx بعد تعريف Icons يتم بناء مصفوفة NAV_ITEMS الكاملة:  
     `NAV_ITEMS = NAV_ITEMS_BASE.map((it) => ({ ...it, icon: Icons[it.iconKey] }));`  
   - بذلك يبقى سلوك القائمة الجانبية كما كان.

4. **مفاتيح الواجهة (UI_*_KEY) في SettingsPage و App**  
   - تم تصديرها من `theme-ui.js` واستيرادها في App حتى يبقى استدعاء `storageFacade.removeRaw(UI_ONBOARDING_SEEN_KEY)` و getBackupAppKeys داخل SettingsPage يعمل دون تغيير منطق.

---

## 7. التحقق من التطبيق (npm run dev)

- لم يُطلب تشغيل `npm run dev` والتحقق يدوياً في البيئة الحالية؛ البناء ناجح وهو المؤشر الأساسي على أن الاستيرادات والتصديرات صحيحة. يُنصح بتشغيل `npm run dev` وفتح الصفحة الرئيسية والتنقل بين الحركات والعمولات والإعدادات مرة واحدة للتأكد من أن الثيم وتاريخ الرأس والتنسيق يعملان كما قبل.

---

*تم إعداد هذا التقرير بعد إكمال الخطوة 1 دون تعديل منطق التطبيق.*
