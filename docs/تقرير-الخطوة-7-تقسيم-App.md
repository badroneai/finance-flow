# تقرير الخطوة 7: استخراج صفحة الإعدادات من App.jsx

**قواعد مُطبقة:** لا حذف لملفات موجودة مسبقاً، لا تغيير سلوك أو منطق. التحقق بـ `npm run build`.

---

## 1. الملف الذي تم إنشاؤه

**`src/pages/SettingsPage.jsx`**

- **المكون:** SettingsPage فقط (named export).
- **Props:** onShowOnboarding.

### التبعيات المستوردة
- **Contexts:** useToast من `../contexts/ToastContext.jsx`.
- **Core:** dataStore، safeGet من `../core/dataStore.js`؛ storageFacade من `../core/storage-facade.js`؛ getSavedTheme، getSavedNumerals، initTheme، applyTheme، applyNumerals، UI_THEME_KEY، UI_NUMERALS_KEY، UI_DATE_HEADER_KEY، UI_ONBOARDING_SEEN_KEY، getSavedDateHeader، setDateHeaderPref من `../core/theme-ui.js`.
- **Constants:** KEYS، SEED_SETTINGS، STORAGE_ERROR_MESSAGE، MSG من `../constants/index.js`.
- **Keys:** STORAGE_KEYS من `../../assets/js/core/keys.js` (لـ getBackupAppKeys: STORAGE_KEYS.UI_WELCOME).
- **UI:** SettingsField، Icons من `../ui/ui-common.jsx`؛ ConfirmDialog من `../ui/Modals.jsx`.
- **Utils:** formatNumber من `../utils/format.jsx`؛ safeNum من `../utils/helpers.js`.

### الدوال المنقولة داخل المكون
- handleSave، handleResetDemo، handleClearAll، getBackupAppKeys، formatBackupFilename، handleExportBackup، handleImportBackupClick، handleImportFileChange (بما فيها منطق التحقق من حجم الملف، تنسيق النسخة الاحتياطية، والاستعادة مع استبدال البيانات والـ reload).
- الثوابت المحلية: MAX_BACKUP_FILE_SIZE، BACKUP_DANGEROUS_KEYS، BACKUP_JSON_KEYS، pad2.

**ملاحظة:** المهمة ذكرت SEED_TRANSACTIONS، SEED_COMMISSIONS، SEED_DRAFTS، BACKUP_VERSION — لا تُستخدم داخل SettingsPage في الكود المنقول؛ لم تتم إضافتها. FormField غير مستخدم (يُستخدم SettingsField فقط). genId و now غير مستخدمين في المكون فلم يُستوردا.

---

## 2. التعديل على App.jsx

- **إضافة استيراد:** `import { SettingsPage } from './pages/SettingsPage.jsx';`
- **حذف التعريف:** مكون SettingsPage بالكامل (بما فيه التعليق «SETTINGS PAGE») وجميع الدوال الداخلية (handleSave، handleResetDemo، handleClearAll، getBackupAppKeys، handleExportBackup، handleImportFileChange، إلخ).
- **renderPage (switch):** لم يُغيّر — لا يزال يستخدم `<SettingsPage onShowOnboarding={() => { try { storageFacade.removeRaw(UI_ONBOARDING_SEEN_KEY); } catch {} setShowOnboarding(true); }} />`.

---

## 3. عدد الأسطر المُزالة من App.jsx وحجمه الجديد

- **عدد الأسطر المُزالة:** **336** سطراً (من 2028 إلى 1692).
- **حجم App.jsx بعد التعديل:** **1692** سطراً.

---

## 4. نتيجة `npm run build`

- **النتيجة:** نجاح (exit code 0).
- **مخرجات البناء:** `✓ 95 modules transformed.`، `✓ built in 1.92s`، إنشاء `dist/` بنجاح.

---

## 5. مشاكل واجهتها وحلولها

- **لا توجد.** نقل المكون مع كل الدوال المساعدة كما هي. البناء نجح من أول تشغيل.

---

*تم إعداد هذا التقرير بعد إكمال الخطوة 7 دون تعديل منطق التطبيق.*
