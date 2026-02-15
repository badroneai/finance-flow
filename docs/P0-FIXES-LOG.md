# سجل إصلاحات P0 — قيد العقار (Finance Flow)

توثيق تنفيذ إصلاحات الأولوية الحرجة (P0) حسب تقرير التدقيق، بشكل منهجي وخطوة بخطوة.

---

## المنهجية

- تنفيذ خطوة واحدة في المرة مع التحقق من عدم كسر السلوك الحالي.
- توثيق كل خطوة في هذا الملف (التاريخ، الملفات، التغيير، الاختبار المطلوب).
- الترتيب: إصلاح البنية أولاً (removeRaw)، ثم Quota، ثم التحقق من النسخ الاحتياطي، ثم الأداء، ثم العقود.

---

## الخطوة 0: إصلاح removeRaw / remove

**الهدف:** الـ facade يستدعي `storage.removeRaw(key)` بينما الـ storage يعرّف فقط `remove(key)` — استدعاءات مثل استعادة النسخة الاحتياطية أو clear تؤدي لخطأ.

**الحل:** إضافة `removeRaw(key)` في طبقة الـ storage لتحقيق توافق الـ API مع الـ facade (بدون تغيير سلوك التطبيق).

**الملفات المعدّلة:**
- `assets/js/core/storage.js`
- `public/assets/js/core/storage.js`

**التغيير:** إضافة الدالة `removeRaw(key)` التي تستدعي `localStorage.removeItem(key)` (نفس سلوك `remove`). الإبقاء على `remove` للتوافق مع أي استدعاءات قديمة.

**الحالة:** [x] مخطط — [x] منفّذ — [ ] مُتحقّق (يفضّل اختبار استعادة نسخة احتياطية أو clear)

---

## الخطوة 1: P0 #2 — معالجة Quota في localStorage

**الهدف:** منع crash عند امتلاء التخزين (QuotaExceededError) وتحسين التعامل مع SecurityError في وضع التصفح الخاص.

**الحل:** لف `setRaw` و `setJSON` في try/catch في طبقة الـ storage، إرجاع كائن نتيجة؛ تحديث الـ facade لتمرير النتيجة؛ التحقق من النتيجة عند الحفظ في المواضع الحرجة.

**الملفات المعدّلة:**
- `assets/js/core/storage.js` — setRaw/setJSON ترجعان `{ ok, error? }` مع try/catch
- `public/assets/js/core/storage.js` — نفس التعديل
- `src/core/storage-facade.js` — setRaw/setJSON ترجعان boolean وتستخدمان نتيجة الـ storage
- `src/core/storage-quota.js` — الاعتماد على القيمة المرجعة من setRaw بدل الالتقاط بالـ try/catch

**ملاحظة:** dataStore في App.jsx يستخدم بالفعل safeSet التي تتحقق من نتيجة setJSON وترجع { ok: false, message } — لا تغيير مطلوب هناك.

**الحالة:** [x] مخطط — [x] منفّذ — [ ] مُتحقّق (اختبار امتلاء التخزين أو وضع التصفح الخاص)

---

## الخطوة 2: P0 #1 — التحقق من النسخ الاحتياطي والاستعادة

**الهدف:** عدم قبول بيانات خاطئة أو ضارة، حد أقصى لحجم الملف، كتابة آمنة، وإمكانية تراجع عند الفشل.

**الملفات المعدّلة:** `src/App.jsx` (دالة استعادة النسخة الاحتياطية + ثوابت التحقق).

**التغييرات:**
- حد أقصى لحجم الملف: 10 ميجا؛ رفض الملفات الأكبر مع رسالة.
- استبعاد مفاتيح خطيرة: `__proto__`, `constructor`, `prototype`.
- قبول البيانات فقط للمفاتيح المعروفة (من getBackupAppKeys).
- كتابة آمنة: للمفاتيح من نوع JSON (مصفوفات/كائنات) استخدام setJSON؛ للنص استخدام setRaw مع String.
- تراجع: قبل الكتابة حفظ القيم الحالية؛ عند فشل أي كتابة استعادة القيم القديمة وإظهار رسالة خطأ.

**الحالة:** [x] مخطط — [x] منفّذ — [ ] مُتحقّق

---

## الخطوة 3: P0 #5 — عدم استدعاء transactions.list داخل map

**الهدف:** تقليل قراءات التخزين — جلب قائمة الحركات مرة واحدة ثم استخدامها داخل رسم بطاقات الدفاتر.

**الملفات المعدّلة:** `src/App.jsx` (LedgersPage).

**التغييرات:** تعريف `allTxsForLedgerCards = dataStore.transactions.list()` مرة واحدة قبل الـ return؛ استخدامها داخل IIFE زر "إضافة نموذج الالتزامات" بدل استدعاء `list()` لكل بطاقة. استدعاء `list()` داخل onConfirm عند النقر بقي كما هو (قائمة محدثة عند الإجراء).

**الحالة:** [x] مخطط — [x] منفّذ — [ ] مُتحقّق

---

## الخطوة 4: P0 #4 — useMemo لحسابات Brain

**الهدف:** عدم إعادة تشغيل الحسابات الثقيلة في كل render.

**الملفات المعدّلة:** `src/App.jsx` (LedgersPage).

**التغييرات:** استبدال IIFE بـ useMemo لـ ledgerTxs (تبعيات activeId)، health (activeId, seededOnlyList, ledgerTxs)، brainCtx (activeLedger, recurring, ledgerTxs)، brain (activeId, brainCtx).

**الحالة:** [x] مخطط — [x] منفّذ — [ ] مُتحقّق

---

## الخطوة 5: P0 #3 — استخدام العقود عند الحدود الحرجة

**الهدف:** استخدام invariant/assertFn عند دخول دوال core/ و domain/ الحرجة.

**الملفات المعدّلة:** `src/core/ledger-reports.js` — استيراد assertArr من contracts.js واستدعاؤه عند دخول filterTransactionsForLedgerByMeta، computePL، computeTopBuckets (مع الاحتفاظ ب fallback مصفوفة فارغة).

**الحالة:** [x] مخطط — [x] منفّذ — [ ] مُتحقّق

---

*آخر تحديث: بعد تنفيذ جميع خطوات P0.*

---

## P1 #6 — منع حفظ NaN (تم لاحقاً)

**الهدف:** عدم تخزين NaN في localStorage عند إدخال غير رقمي في المبالغ أو النسب.

**الملفات المعدّلة:**
- `src/App.jsx`: دالة `safeNum(val, fallback)`؛ التحقق في TransactionForm و CommissionForm (تحقق + استخدام safeNum عند الحفظ)؛ الإعدادات defaultCommissionPercent؛ تسجيل الدفعة الآن وتفعيل الديمو.
- `src/domain/recurringItems.js`: دالة `safeAmount(val)` واستخدامها في createRecurringItem.

**الحالة:** [x] منفّذ.

---

## P1 #7 — React.memo لتبويبات الدفاتر

**الهدف:** تقليل إعادة العرض غير الضرورية عند فتح تبويب تقارير الدفتر.

**الملفات المعدّلة:**  
- `src/tabs/LedgerPerformanceTab.jsx`: تصدير `React.memo(LedgerPerformanceTab)`.  
- `src/tabs/LedgerRecurringTab.jsx`: تحويل إلى دالة ثم `React.memo(LedgerRecurringTab)`.  
- `src/tabs/LedgerInboxTab.jsx`: تحويل إلى دالة ثم `React.memo(LedgerInboxTab)`.  
- `src/tabs/LedgerForecastTab.jsx`: تحويل إلى دالة ثم `React.memo(LedgerForecastTab)`.

**الحالة:** [x] منفّذ.

---

## P1 #9 — رسالة عند فشل تحميل الدفاتر

**الهدف:** عند فشل `getLedgers()` داخل `refresh()` في LedgersPage إظهار رسالة بدل ترك القائمة فارغة بصمت.

**الملفات المعدّلة:** `src/App.jsx` — في `refresh` داخل LedgersPage: في الـ catch عند فشل `getLedgers()` استدعاء `toast('تعذر تحميل قائمة الدفاتر...', 'error')` مع الإبقاء على `setLedgersState([])`.

**الحالة:** [x] منفّذ.

---

## P1 #10 — التحقق من صحة التاريخ في النماذج

**الهدف:** رفض تواريخ غير صالحة (مثل 2025-99-99 أو 2025-02-30) في نماذج الحركة والعمولة؛ ومراجعة `getMonthKey()`.

**الملفات المعدّلة:**  
- `src/domain/charts.js`: `getMonthKey(dateStr)` يعيد `null` عند تاريخ غير صالح أو فارغ؛ في `buildLast6MonthsIncomeExpenseChart` تخطي الحركات التي تعيد لها `getMonthKey` null.  
- `src/App.jsx`: دالة `isValidDateStr(str)` (تحقق من parse + round-trip YYYY-MM-DD)؛ في TransactionForm التحقق من `form.date`؛ في CommissionForm التحقق من `form.dueDate` وعرض خطأ dueDate؛ في `submitPayNow` (تحويل التكرار إلى حركة) التحقق من التاريخ قبل الحفظ.

**الحالة:** [x] منفّذ.

---

## P1 #11 — حركات بدون تاريخ عند الفلترة

**الهدف:** عدم إخفاء الحركات التي تفتقد `t.date` عند الفلترة بـ fromDate/toDate.

**الملفات المعدّلة:** `src/domain/transactions.js` — في `filterTransactions`: عند تطبيق fromDate/toDate تضمين الحركات التي `t.date == null` أو `t.date === ''` بدل استبعادها؛ وفي الترتيب وضع الحركات بدون تاريخ في نهاية القائمة (الأحدث أولاً للباقي).

**الحالة:** [x] منفّذ.

---

## P1 #12 — تباين اللون الذهبي WCAG AA

**الهدف:** تحسين `--qa-gold` لتحقيق تباين ≥ 4.5:1 على خلفية بيضاء (WCAG AA).

**الملفات المعدّلة:**  
- `assets/qaydalaqar-theme.css`  
- `public/assets/qaydalaqar-theme.css`  
استبدال `--qa-gold: #B8A76A` بـ `#6B5A2E` وتحديث `--qa-gold-rgb` و `--qa-gold-light` و `--qa-gold-subtle` وفقاً.

**الحالة:** [x] منفّذ.

---

## P2 — إصلاحات متوسطة (كلها منفّذة)

**#13 توحيد CRUD:** إضافة `createCrud(key, options)` في App.jsx؛ استخدامها لـ commissions و letters (ومشاركة create/update/remove مع transactions مع الإبقاء على list مخصص للحركات).

**#14 تصدير CSV:** إنشاء `src/utils/csvExport.js` (csvEscape، downloadCSV)؛ استخدامها من صفحة الحركات، صفحة العمولات، وتبويب تقارير الدفتر.

**#15 ملفات مكررة:** حذف `assets/js/core/formatters.js`؛ جعل `assets/js/bootstrap.js` يعيد التصدير من `public/assets/js/core/formatters.js`.

**#16 Focus trap:** في `src/ui/Modals.jsx` إضافة `useFocusTrap` و `getFocusableElements`؛ تطبيقها على Modal و ConfirmDialog مع ref على حاوية الحوار.

**#17 ARIA tablist:** في `LedgerHeader.jsx` إضافة role="tablist" وتبويبات مع role="tab" و aria-selected و aria-controls؛ في App.jsx لف محتوى كل تبويب بـ div مع role="tabpanel" و id و aria-labelledby.

**#18 Toast aria-live:** حاوية الإشعارات: role="region" aria-label="إشعارات" aria-live="polite"؛ كل toast role="status".

**#19 معالجات أحداث:** في LedgerHeader استبدال أربعة أزرار بثابت LEDGER_TABS ومعالج واحد handleClick مع data-tab؛ في LedgersPage استخدام useCallback لـ handleLedgerTabSelect.

**#20 ثوابت JSX:** ثابت DASHBOARD_PERIOD_OPTIONS لخيارات فترة لوحة التحكم واستخدامه بدل مصفوفة داخلية.

**#21 CSS منطقي:** استبدال text-left/text-right بـ text-start/text-end في Sidebar و App (جداول وبحث)؛ pr-9 pl-3 بـ ps-9 pe-3؛ في mobile-responsive-fixes.css استخدام inset-inline-end و border-inline-end.

**#22 حد طول النص:** maxLength={120} لاسم الدفتر (جديد/تعديل) واسم المكتب؛ maxLength={200} لوصف الدفتر وعنوان الالتزام في LedgerRecurringTab.

**#23 aria-expanded:** زر الهامبرجر في Sidebar: إضافة aria-expanded={mobileOpen}.

---

## P3 — إصلاحات منخفضة (كلها منفّذة)

**#24 رابط تخطي المحتوى:** إضافة رابط "تخطي إلى المحتوى الرئيسي" في بداية app-shell يظهر عند التركيز (Tab) وينقل إلى #main-content (WCAG 2.4.1).

**#25 الجداول caption و scope:** جدول الحركات وجدول العمولات: إضافة `<caption>` مع class sr-only و id؛ إضافة `scope="col"` لجميع `<th>`؛ ربط الجدول بـ aria-describedby (WCAG 1.3.1).

**#26 أيقونات زخرفية:** إضافة `aria-hidden="true"` لأيقونات الحالة الفارغة (Icons.empty) في App.jsx (WCAG 1.1.1).

**#27 حقول النماذج والأخطاء:** تطوير FormField ليقبل `id`؛ عند وجود خطأ ربط الحقل بـ aria-invalid و aria-describedby يشير إلى رسالة الخطأ (id-error)؛ إضافة id لجميع حقول TransactionForm و CommissionForm التي تعرض أخطاء (WCAG 3.3.1).

**#28 تحويل صامت في الميزانية:** في saveLedgerBudgets (App.jsx) التحقق من monthlyTarget و yearlyTarget قبل الحفظ؛ إذا كانت القيمة غير رقمية (مثل "abc") إظهار toast "قيمة الهدف غير صالحة. أدخل رقماً." وعدم الحفظ.

**#29 useMemo لـ chartData:** تصحيح تبعية useMemo في DashboardPage — الاعتماد على [] بدل [txs] لأن المصدر الفعلي هو dataStore.transactions.list({}) وليس txs.
