# تحليل وتخطيط تقسيم App.jsx — المرحلة الأولى

**تعليمات:** لا تعديل على الكود، لا حذف ولا إنشاء ملفات. تحليل وخطة فقط.

---

## أولاً: تحليل ملف App.jsx

### 1. قائمة المكونات (Components) المعرّفة داخل App.jsx

| # | اسم المكون | السطر بداية | السطر نهاية | عدد الأسطر | يستخدم state من App؟ |
|---|------------|-------------|-------------|------------|------------------------|
| 1 | SarSymbol | 594 | 612 | 19 | لا |
| 2 | Currency | 614 | 618 | 5 | لا |
| 3 | Icon | 733 | 735 | 3 | لا |
| 4 | Icons (كائن) | 736 | 764 | 29 | لا |
| 5 | ToastProvider | 769 | 792 | 24 | لا (state داخلي) |
| 6 | TrustChecks | 797 | 813 | 17 | لا (يستخدم useToast فقط) |
| 7 | FormField | 815 | 829 | 15 | لا |
| 8 | SettingsField | 831 | 839 | 9 | لا |
| 9 | SummaryCard | 841 | 849 | 9 | لا |
| 10 | EmptyState | 851 | 856 | 6 | لا |
| 11 | EnhancedEmptyState | 858 | 869 | 12 | لا |
| 12 | Badge | 871 | 875 | 5 | لا |
| 13 | LedgerTabErrorBoundary (class) | 877 | 898 | 22 | لا |
| 14 | HomePage | 919 | 966 | 48 | نعم — setPage (كـ prop) |
| 15 | DashboardPage | 967 | 1038 | 72 | لا — يستخدم dataStore وثوابت فقط |
| 16 | TransactionsPage | 1039 | 1203 | 165 | نعم — useToast، UnsavedContext |
| 17 | TransactionForm | 1204 | 1268 | 65 | نعم — UnsavedContext |
| 18 | CommissionsPage | 1269 | 1449 | 181 | نعم — useToast، UnsavedContext |
| 19 | CommissionForm | 1450 | 1531 | 82 | نعم — UnsavedContext |
| 20 | TemplatesPage | 1532 | 1551 | 20 | نعم — setPage، setLetterType |
| 21 | GeneratorPage | 1552 | 1663 | 112 | نعم — letterType، setLetterType، useToast |
| 22 | DraftsPage | 1664 | 1711 | 48 | نعم — setPage، setLetterType، setEditDraft، useToast |
| 23 | LedgersPage | 1712 | 2889 | 1178 | نعم — useToast؛ state كله داخلي |
| 24 | SettingsPage | 2894 | 3227 | 334 | نعم — onShowOnboarding، useToast |
| 25 | NotesCalendarAddInput | 3253 | 3271 | 19 | لا — props فقط |
| 26 | NotesCalendarPinnedCard | 3274 | 3306 | 33 | لا — props فقط |
| 27 | NotesCalendarAddPinnedInput | 3308 | 3344 | 37 | لا — props فقط |
| 28 | NotesCalendarAddEventModal | 3346 | 3450 | 105 | لا — props فقط |
| 29 | NotesCalendar | 3453 | 3682 | 230 | لا — state داخلي، domain من import |
| 30 | WelcomeBanner | 3684 | 3711 | 28 | لا — state داخلي + storageFacade/safeGet |
| 31 | App | 3717 | 3911 | 195 | — المكون الجذر |
| 32 | ErrorBoundary (class) | 3916 | 4045 | 130 | لا |

**ملاحظات:**
- لا يوجد مكون باسم "QuickGuidePanel" — محتوى المساعدة (دليل سريع) مضمّن داخل App في وسم `{showHelp && (...)}` (حوالي 3797–3910).
- تبويبات الدفاتر: LedgerRecurringTab، LedgerPerformanceTab، LedgerReportsTab مستوردة من `src/tabs/`. تبويبا "التوقعات" و"صندوق الوارد" مضمّنان داخل LedgersPage (JSX شرطي حسب `tab === 'reports' | 'performance' | ...`).

---

### 2. قائمة state variables في المكون الرئيسي App

| النوع | الاسم | السطر | المكونات الفرعية التي تستخدمه |
|-------|--------|-------|-------------------------------|
| useState | page | 3718 | renderPage → كل الصفحات (تحديد أي صفحة تُعرض) |
| useState | collapsed | 3719 | Sidebar (كـ prop) |
| useState | mobileOpen | 3720 | Sidebar، Topbar |
| useState | letterType | 3721 | GeneratorPage (كـ prop) |
| useState | editDraft | 3722 | لا يُمرَّر مباشرة؛ DraftsPage يستدعي setEditDraft ثم setPage('generator') |
| useState | dirty | 3723 | UnsavedContext.Provider، useEffect (beforeunload) |
| useState | headerDateMode | 3727 | Topbar (عبر headerDateText + منطق off) |
| useState | headerDateText | 3728 | Topbar |
| useState | showOnboarding | 3730 | عرض modal الترحيب؛ SettingsPage يستدعي onShowOnboarding الذي يفعّل setShowOnboarding(true) |
| useState | showHelp | 3731 | عرض modal المساعدة؛ Sidebar onOpenHelp |
| useState | helpSection | 3732 | محتوى modal المساعدة (تبويبات المساعدة) |
| useCallback | updateHeaderDate | 3757 | useEffect في App، scheduleHeaderDateMidnightRefresh |
| useCallback | scheduleHeaderDateMidnightRefresh | 3761 | useEffect في App |

**ملاحظة:** لا يوجد useRef أو useMemo داخل App نفسه (فقط useState و useCallback).

---

### 3. قائمة الدوال المعرّفة في App (المكوّن الجذر فقط، أسطر 3717–3911)

| اسم الدالة | السطر | الوصف في سطر | من يستدعيها |
|------------|-------|---------------|--------------|
| updateHeaderDate | 3757 | تحديث نص تاريخ الرأس في Topbar حسب الوقت الحالي. | useEffect، scheduleHeaderDateMidnightRefresh |
| scheduleHeaderDateMidnightRefresh | 3761 | جدولة تحديث تاريخ الرأس بعد منتصف الليل المحلي. | useEffect في App |
| renderPage | 3815 | يعيد مكون الصفحة الحالية حسب `page` (switch). | JSX في return (بداخل print-container) |

---

### 3ب. دوال مسطح الملف (دوال مساعدة غير المكونات) — المستوى الأعلى في App.jsx

| اسم الدالة/الثابت | السطر | وصف سطر واحد | من يستدعيها / أين تُستخدم |
|-------------------|-------|---------------|---------------------------|
| getActiveLedgerIdSafe | 119–121 | إرجاع معرف الدفتر النشط آمناً أو سلسلة فارغة. | transactionsList، dataStore.transactions.enrichCreate، TransactionsPage (refresh)، LedgersPage |
| genId | 177 | توليد معرف فريد (UUID أو fallback). | dataStore، ToastProvider، createCrud.enrichCreate |
| now | 178 | تاريخ/وقت ISO الحالي. | dataStore، createCrud.enrichCreate |
| today | 179 | تاريخ اليوم بصيغة YYYY-MM-DD. | TransactionForm، CommissionForm، GeneratorPage، LedgersPage (payForm، إلخ)، domain |
| isValidDateStr | 182–190 | التحقق من صحة سلسلة تاريخ. | نماذج (تحقق) |
| safeNum | 236–240 | تحويل آمن لرقم مع fallback. | بيانات البذور/تحقق |
| getSavedTheme | 275–282 | قراءة ثيم محفوظ من التخزين. | initTheme، App (useState initial)، SettingsPage |
| getEffectiveSystemTheme | 287–294 | ثيم النظام (prefers-color-scheme). | applyTheme، startSystemThemeListener |
| startSystemThemeListener | 296–311 | بدء الاستماع لتغيّر ثيم النظام. | applyTheme |
| stopSystemThemeListener | 314–325 | إيقاف مستمع ثيم النظام. | applyTheme |
| applyTheme | 327–336 | تطبيق الثيم على document و storage. | initTheme، SettingsPage (عبر تطبيق uiTheme) |
| initTheme | 338–347 | تهيئة الثيم عند التحميل. | App (useEffect)، SettingsPage (بعد reset/clear) |
| getSavedNumerals | 349–356 | قراءة وضع الأرقام محفوظ. | initNumerals، App، SettingsPage |
| getSavedDateHeader | 358–368 | قراءة تفضيل رأس التاريخ. | App (useEffect، headerDateMode)، setDateHeaderPref |
| setDateHeaderPref | 370–374 | حفظ تفضيل رأس التاريخ وإطلاق حدث. | SettingsPage (عند تغيير الإعداد) |
| getOnboardingSeen | 376–381 | هل تم عرض الترحيب مسبقاً. | App (useEffect)، setOnboardingSeen |
| setOnboardingSeen | 384–386 | تعليم أن المستخدم شاهد الترحيب. | App (onboarding modal) |
| applyNumerals | 388–396 | تطبيق وضع الأرقام على document و storage. | initNumerals، SettingsPage |
| initNumerals | 398–405 | تهيئة الأرقام عند التحميل. | App (useEffect) |
| detectPrivateBrowsing | 421–429 | كشف التصفح الخاص. | TrustChecks |
| safeGet | 438 | قراءة JSON من التخزين مع fallback. | createCrud، dataStore، transactionsList، SettingsPage، WelcomeBanner، LedgersPage، إلخ |
| safeSet | 441–452 | كتابة JSON مع معالجة QuotaExceededError. | createCrud، dataStore |
| createCrud | 455–484 | مصنف CRUD عام لمفتاح تخزين. | dataStore (transactions، commissions، letters)، _commissionsCrud، _draftsCrud |
| transactionsList | 485–518 | قائمة حركات مع فلترة وربط ledgerId. | dataStore.transactions.list |
| dataStore | 526–575 | كائن التخزين الموحد (transactions، commissions، letters، settings، seed). | كل الصفحات والمكونات التي تقرأ/تكتب البيانات |
| getNumeralLocale | 581 | locale للأرقام (ar-SA / en-US). | formatNumber |
| formatNumber | 583–590 | تنسيق رقم حسب locale الأرقام. | formatCurrency، formatPercent، Currency، SummaryCard، DashboardPage، SettingsPage، LedgersPage، إلخ |
| formatCurrency | 591 | تنسيق مبلغ بعملة (ر.س). | Currency، صفحات الحركات/العمولات/التقارير |
| formatPercent | 621 | تنسيق نسبة مئوية. | العمولات والتقارير |
| formatNum | 624 | اختصار formatNumber بكسور عشرية. | رسوم بيانية/تقارير |
| normalizeHijriSuffix | 630–635 | تطبيع لاحقة "هـ" في التاريخ الهجري. | formatDateHeader |
| buildLocale | 637–643 | بناء سلسلة locale مع امتدادات Unicode. | getLocaleForNumerals |
| getLocaleForNumerals | 645–648 | locale حسب وضع الأرقام. | formatDateHeader، formatDateGregorianNumeric |
| getGregorianLocale | 651–668 | locale ميلادي (مع nu إن لزم). | formatDateHeader، formatDateGregorianNumeric |
| getHijriLocale | 670–687 | locale هجري. | formatDateHeader، formatDateHijriNumeric |
| formatDateHeader | 689–709 | تنسيق تاريخ الرأس (ميلادي + هجري). | App (updateHeaderDate) |
| formatDateGregorianNumeric | 711–718 | تاريخ ميلادي رقمي. | نماذج/جداول |
| formatDateHijriNumeric | 720–731 | تاريخ هجري رقمي. | تقويم/ملاحظات |

---

### 4. خريطة التبعيات (Dependency Map)

لكل صفحة/مكون فرعي يُعرض من خلال App أو يستخدم في الشجرة:

| المكون | الـ props من App | الـ state من App (أو Context) | الدوال التي يستدعيها (من App أو عامة) |
|--------|------------------|------------------------------|----------------------------------------|
| HomePage | setPage | — | dataStore.settings.get (قراءة فقط) |
| DashboardPage | — | — | dataStore.transactions.list، dataStore.commissions.list؛ getDashboardDateRange، computeIncomeExpenseNet، splitCommissionsByStatus، buildLast6MonthsIncomeExpenseChart؛ DASHBOARD_PERIOD_OPTIONS، formatCurrency، Icons، SummaryCard، EmptyState، MSG |
| TransactionsPage | — | useToast، UnsavedContext (setDirty) | dataStore.transactions.*؛ getActiveLedgerIdSafe؛ refresh، handleSave، handleDelete، exportCSV، resetFilters؛ TRANSACTION_*، PAYMENT_*؛ TransactionForm، Modal، ConfirmDialog، FormField، EmptyState، Icons |
| TransactionForm | initial، onSave، onCancel | UnsavedContext (setDirty) | today، MSG؛ validate، handleSubmit |
| CommissionsPage | — | useToast، UnsavedContext | dataStore.commissions.*، dataStore.settings.get؛ filterCommissions، computeCommissionTotals، listAgentNames؛ refresh، handleSave، handleDelete، handleMarkPaid، resetFilters، exportCSV؛ COMMISSION_STATUSES؛ CommissionForm، Modal، ConfirmDialog، Currency، Badge، EmptyState، Icons |
| CommissionForm | initial، onSave، onCancel， defaultPercent | UnsavedContext | today، COMMISSION_STATUSES؛ validate، handleSubmit |
| TemplatesPage | setPage، setLetterType | — | LETTER_TYPES، Icons |
| GeneratorPage | letterType، setLetterType | useToast | dataStore.settings.get، dataStore.letters.*؛ getTemplateByType، buildInitialFields، validateLetterFields، formatDraftDate، today؛ TEMPLATES، FIELD_LABELS؛ handleSaveDraft، renderPreview |
| DraftsPage | setPage، setLetterType، setEditDraft | useToast | dataStore.letters.listDrafts، removeDraft؛ refresh، handleDelete، handleEdit؛ formatDraftDate، LETTER_TYPES، Icons |
| LedgersPage | — | useToast | dataStore.*؛ getLedgers، setLedgers، getActiveLedgerId، setActiveLedgerId، getRecurringItems، setRecurringItems؛ seedRecurringForLedger؛ دوال recurring-intelligence، ledger-budgets، ledger-intelligence-v1، exports-map، ledger-inbox، ledger-cash-plan، ledger-item-history، ledger-budget-authority، ledger-compliance، ledger-reports؛ getTemplateForLedgerType؛ LedgerHeader، LedgerTabsShell؛ LedgerRecurringTab، LedgerPerformanceTab، LedgerReportsTab؛ تبويبات التوقعات/صندوق الوارد مضمّنة؛ ConfirmDialog، MSG، Icons، formatCurrency، formatNumber، وغيرها كثيرة |
| SettingsPage | onShowOnboarding | useToast | dataStore.settings.*، dataStore.seed.*؛ safeGet، KEYS؛ getSavedTheme، getSavedNumerals؛ initTheme، applyTheme، applyNumerals؛ formatNumber؛ getBackupAppKeys، handleSave، handleResetDemo، handleClearAll، handleExportBackup، handleImportBackupClick، handleImportFileChange؛ ConfirmDialog، FormField، SettingsField، Icons |
| NotesCalendar | mode | — | domain: gregorianToHijri، getKeyNC، toArabicNumNC، buildCalendarDays، getEventsForDate، isHoliday، domainAddDailyNote، domainToggleDailyNote، domainDeleteDailyNote، domainAddPinnedNote، domainUpdatePinnedNote، domainDeletePinnedNote؛ ثوابت HIJRI_MONTHS_NC، GREG_MONTHS_NC، DAY_NAMES_*، EVENT_CATEGORIES_NC، DEFAULT_EVENTS_NC؛ NotesCalendarAddInput، NotesCalendarPinnedCard، NotesCalendarAddPinnedInput، NotesCalendarAddEventModal |
| WelcomeBanner | — | — | storageFacade، safeGet، KEYS، useState، useEffect (داخلي) |
| Sidebar | Icons، page، setPage، collapsed، setCollapsed، mobileOpen، setMobileOpen، onOpenHelp | — | NAV_ITEMS (ثابت)؛ setPage، setHelpSection، setShowHelp |
| Topbar | Icons، page، mobileOpen، setMobileOpen، headerDateText | — | — |

---

## ثانياً: خطة التقسيم المقترحة

### 1. المكونات التي يُقترح نقلها إلى ملفات منفصلة (مع المسار)

| المكون | المسار المقترح | أولوية |
|--------|----------------|--------|
| HomePage | src/pages/HomePage.jsx | 1 |
| DashboardPage | src/pages/DashboardPage.jsx | 2 |
| TransactionsPage + TransactionForm | src/pages/TransactionsPage.jsx (أو TransactionsPage.jsx + components/TransactionForm.jsx) | 3 |
| CommissionsPage + CommissionForm | src/pages/CommissionsPage.jsx (أو مع CommissionForm في components) | 4 |
| TemplatesPage | src/pages/TemplatesPage.jsx | 5 |
| GeneratorPage | src/pages/GeneratorPage.jsx | 6 |
| DraftsPage | src/pages/DraftsPage.jsx | 7 |
| LedgersPage | src/pages/LedgersPage.jsx | 8 (الأصعب — الأكبر وتشابك كثيف) |
| SettingsPage | src/pages/SettingsPage.jsx | 9 |
| NotesCalendar + NotesCalendarAddInput، NotesCalendarPinnedCard، NotesCalendarAddPinnedInput، NotesCalendarAddEventModal | src/pages/NotesCalendar.jsx (أو src/pages/NotesCalendar/index.jsx مع مكونات فرعية في نفس المجلد) | 10 |
| WelcomeBanner | src/ui/WelcomeBanner.jsx | 11 |
| FormField، SettingsField، SummaryCard، Currency، SarSymbol، Icon، Icons، EmptyState، EnhancedEmptyState، Badge | src/ui/ (ملفات منفصلة أو ui-common.jsx) | 12 |
| ToastProvider + ToastContext، useToast | موجود أو يُنشأ src/contexts/ToastContext.jsx | 13 |
| TrustChecks | src/ui/TrustChecks.jsx أو داخل Toast/context | 14 |
| LedgerTabErrorBoundary | src/ui/ledger/LedgerTabErrorBoundary.jsx أو يبقى قريباً من LedgersPage | 15 |
| محتوى دليل المساعدة (Help modal) | src/ui/HelpPanel.jsx أو HelpModal.jsx | 16 |

### 2. الـ state الذي يجب أن يبقى في App.jsx

- **page، setPage** — التوجيه الرئيسي.
- **letterType، setLetterType** — حتى لا نمرّر سلاسل عبر عدة مستويات (Templates → Generator → Drafts).
- **editDraft، setEditDraft** — تنسيق التدفق من Drafts إلى Generator مع مسودة محددة.
- **collapsed، setCollapsed** و **mobileOpen، setMobileOpen** — واجهة الشريط الجانبي والشريط العلوي.
- **dirty، setDirty** — لتذكير المستخدم قبل المغادرة؛ UnsavedContext.Provider يعتمد عليه.
- **headerDateMode، headerDateText** و **updateHeaderDate، scheduleHeaderDateMidnightRefresh** — unless ننقلها إلى Context أو Topbar مع قراءة من storage.
- **showOnboarding، setShowOnboarding** و **showHelp، setShowHelp** و **helpSection، setHelpSection** — unless ننقلها إلى Context (مثلاً AppUIContext).

### 3. الـ state الذي يمكن نقله إلى Context أو إلى المكون نفسه

- **headerDateMode / headerDateText / updateHeaderDate:** يمكن نقله إلى Topbar مع الاستماع لأحداث `ui:numerals` و `ui:dateHeader`، أو إلى Context صغير (مثل DateHeaderContext) لتقليل المسؤوليات في App.
- **showOnboarding، showHelp، helpSection:** يمكن تجميعها في **AppUIContext** (onboarding، help، helpSection) إذا أردنا فصل منطق المساعدة والترحيب عن App.
- **letterType و editDraft:** يمكن نقلهما إلى Context (مثل LetterFlowContext) حتى لا يمرّرا من App إلى Templates/Generator/Drafts؛ عندها App لا يحتاج إلا setPage.

### 4. الدوال المشتركة التي يُقترح وضعها في hooks أو utils

| النوع | الدوال/الثوابت | المسار المقترح |
|-------|-----------------|----------------|
| utils | genId، now، today، isValidDateStr، safeNum | src/utils/idAndDate.js أو مدمج في utils عام |
| utils | formatNumber، formatCurrency， formatPercent، formatNum، getNumeralLocale | src/utils/format.js (أو الإبقاء على formatters في core إن وُجد) |
| utils | formatDateHeader، formatDateGregorianNumeric، formatDateHijriNumeric، normalizeHijriSuffix، buildLocale، getLocaleForNumerals، getGregorianLocale، getHijriLocale | src/utils/dateFormat.js |
| theme/UI | getSavedTheme، applyTheme، initTheme، getEffectiveSystemTheme، start/stopSystemThemeListener؛ getSavedNumerals، applyNumerals، initNumerals؛ getSavedDateHeader، setDateHeaderPref؛ getOnboardingSeen، setOnboardingSeen | src/core/theme-ui.js أو src/hooks/useTheme.js + useNumerals.js |
| storage/datastore | safeGet، safeSet، createCrud، transactionsList؛ dataStore (كائن واحد) | يبقى في App أو يُنقل إلى src/core/dataStore.js (الآن مبعثر بين App و ledger-store) |
| constants | TRANSACTION_TYPES، TRANSACTION_CATEGORIES، PAYMENT_METHODS، COMMISSION_STATUSES، LETTER_TYPES؛ DASHBOARD_PERIOD_OPTIONS؛ SEED_*؛ KEYS؛ MSG؛ NAV_ITEMS | src/constants/*.js أو constants.js واحد |
| hooks | — | useToast موجود؛ يمكن إضافة useDataStore() إذا جعلنا dataStore من Context |

### 5. ترتيب التقسيم الآمن (أي مكون ننقله أولاً بدون كسر شيء)

1. **الثوابت والمصادر المشتركة:** نقل TYPES، SEED_*، KEYS، MSG، DASHBOARD_PERIOD_OPTIONS، NAV_ITEMS إلى ملفات constants؛ ثم نقل دوال التنسيق (formatNumber، formatCurrency، تاريخ، إلخ) إلى utils — بدون تغيير سلوك App.
2. **مكونات UI صغيرة لا تعتمد على state التوجيه:** FormField، SettingsField، SummaryCard، EmptyState، EnhancedEmptyState، Badge، SarSymbol، Currency، Icon، Icons → ملف أو أكثر في src/ui/. ثم ToastProvider + useToast → contexts/ToastContext.jsx. ثم TrustChecks، WelcomeBanner.
3. **الصفحات الأقل تشابكاً:** HomePage (يعتمد فقط setPage + dataStore.settings.get). ثم TemplatesPage (setPage، setLetterType فقط). ثم DashboardPage (لا props من App، يعتمد dataStore و domain).
4. **صفحات النماذج والجدول:** TransactionsPage + TransactionForm (يحتاجان useToast، UnsavedContext، dataStore). ثم CommissionsPage + CommissionForm بنفس الأسلوب.
5. **GeneratorPage ثم DraftsPage** (يعتمدان letterType/setLetterType و setEditDraft).
6. **SettingsPage** (يعتمد onShowOnboarding، useToast، dataStore، theme/numerals، backup).
7. **NotesCalendar ومكوناتها الفرعية** (مع ثوابت التقويم والمناسبات).
8. **LedgersPage** آخراً — الأكبر والأكثر تشابكاً مع dataStore و ledger-store وكل تبويبات الدفاتر.
9. **استخراج محتوى دليل المساعدة (Help)** إلى مكون HelpPanel/HelpModal واستدعاؤه من App مع showHelp و helpSection.

---

## ثالثاً: تقدير المخاطر

### الأجزاء الأكثر تشابكاً (أعلى coupling)

- **LedgersPage (1712–2889):** يعتمد على عشرات الاستيرادات من core/ و domain/؛ state كثير (تبويب، دفاتر، التزامات متكررة، ميزانيات، صندوق الوارد، توقعات، محاكاة، إلخ)؛ يستدعي dataStore.transactions و ledger-store و recurring-intelligence و reports و inbox و cash-plan و compliance و budget-authority؛ ومكوّنات LedgerHeader، LedgerTabsShell، والتبويبات المستوردة. أي نقل يتطلب استخراج نفس الاستيرادات وربما Context للدفتر النشط.
- **SettingsPage:** استيراد ثقيل (backup، theme، numerals، dataStore، KEYS، storageFacade)، ودوال مثل getBackupAppKeys، handleImportFileChange مع منطق استعادة معقد.
- **App نفسه:** renderPage يربط كل الصفحات بـ state (page، letterType، setPage، setLetterType، setEditDraft، onShowOnboarding). فصل الصفحات يتطلب تمرير نفس الـ props أو نقل جزء من هذا الـ state إلى Context.

### الأجزاء الأسهل للفصل (أقل coupling)

- **HomePage:** يعتمد فقط على setPage و dataStore.settings.get().officeName و NAV_ITEMS (يمكن تمريرها كـ props أو استيراد ثابت).
- **TemplatesPage:** فقط setPage و setLetterType و LETTER_TYPES (أو قائمة قوالب) و Icons.
- **DashboardPage:** لا يستقبل state من App؛ يعتمد على dataStore و domain helpers وثوابت؛ يمكن نقله مع استيراد نفس المصادر.
- **NotesCalendar ومكوناتها الفرعية (AddInput، PinnedCard، AddPinnedInput، AddEventModal):** تعتمد على domain (من index) وثوابت محلية؛ لا تستخدم page أو letterType؛ يمكن نقل الكتلة كاملة إلى صفحة واحدة أو مجلد NotesCalendar.
- **WelcomeBanner، TrustChecks، FormField، SummaryCard، EmptyState، Badge:** لا تعتمد على توجيه التطبيق؛ فقط storage أو props.

### هل يوجد مكون يمكن نقله فوراً بدون أي تعديل على App.jsx؟

**لا.** أي نقل يتطلب على الأقل:
- إنشاء ملف جديد (وهو ممنوع في هذه المرحلة)، أو
- بعد السماح بإنشاء الملفات: استيراد المكون من الملف الجديد في App.jsx وحذف التعريف من App.jsx، أي تعديل على App.jsx (سطر الاستيراد + إزالة التعريف).

إذا قصد "بدون تغيير **منطق** App (بدون كسر سلوك التطبيق)" فـ **نعم**: يمكن نقل المكونات واحدة واحدة مع استبدال تعريفها في App بـ `import ... from '...'` وتمرير نفس الـ props. الأسهل للبداية: **HomePage**، **TemplatesPage**، ثم **DashboardPage** — لأنها الأقل اعتماداً على Context و state معقد.

---

*تم إعداد هذا التحليل بناءً على قراءة كاملة لملف src/App.jsx (حوالي 4046 سطر) دون تنفيذ أي تعديل على الكود.*
