# التقرير التقني الشامل — قيد العقار (Finance Flow)

---

## اسم المشروع:
**قيد العقار** (Finance Flow) — `finance-flow-public`

## وصف بجملة واحدة:
تطبيق ويب عربي (RTL) لإدارة التدفقات المالية والعمولات والدفاتر المحاسبية للمكاتب العقارية السعودية، يعمل بالكامل على المتصفح بدون خادم خلفي (Static SPA).

## نوع المنتج:
SPA (Single Page Application) — تطبيق محاسبي/مالي موجّه للمكاتب العقارية في السعودية، يعمل كنسخة Static على GitHub Pages بدون Backend.

---

## TECH STACK:

| البند | التفاصيل |
|-------|----------|
| **Framework** | React 19.2 + React Router 7.13 (HashRouter) |
| **Language** | JavaScript (JSX) — لا يوجد TypeScript |
| **Build Tool** | Vite 7.3 + @vitejs/plugin-react 5.1 |
| **Testing** | Vitest 4.0 + jsdom 28.1 |
| **Database** | **غير موجود** — يستخدم `localStorage` فقط كطبقة تخزين (storage-facade → core/storage → localStorage) |
| **Auth** | **غير موجود** — لا يوجد نظام مصادقة أو تسجيل دخول |
| **Payments** | **غير موجود** — لا يوجد تكامل مع بوابات دفع |
| **UI Library** | Tailwind CSS (utility classes مباشرة بدون compiler — classes مكتوبة يدوياً) + CSS مخصص (theme.tokens.css, qaydalaqar-theme.css) |
| **Hosting** | GitHub Pages (عبر GitHub Actions workflow) — الدومين المخصص: `app.qaydalaqar.com` |
| **External APIs** | **غير موجود** — التطبيق يعمل بالكامل offline بدون أي API خارجي. `@supabase/supabase-js` موجود في dependencies لكن **لا يُستخدم فعلياً في أي ملف** |
| **State Management** | React useState/useEffect + Custom Events (window.dispatchEvent) للتواصل بين المكونات |
| **Routing** | HashRouter (react-router-dom) — يدعم GitHub Pages بدون server-side routing |
| **Internationalization** | عربي فقط (RTL) مع دعم أرقام عربية/إنجليزية + تواريخ هجرية/ميلادية |

---

## هيكل المجلدات (أول مستويين):

```
finance-flow/
├── .github/
│   └── workflows/          # GitHub Actions (pages.yml)
├── assets/
│   ├── css/                # app.css, theme.tokens.css
│   └── js/
│       ├── core/           # keys.js, storage.js (legacy storage layer)
│       ├── pages/          # legacy page JS files
│       └── ui/             # legacy UI JS files
├── docs/                   # وثائق المشروع (brand, plans, changelogs)
├── notes-calendar/         # مكون التقويم (React standalone)
├── public/                 # static assets للنشر
├── release/                # ملفات الإصدار (FAQ, INSTALL, USER_GUIDE)
├── src/
│   ├── config/             # navigation.js
│   ├── constants/          # index.js (ثوابت + seed data)
│   ├── contexts/           # ToastContext.jsx, UnsavedContext.jsx
│   ├── core/               # محركات الأعمال (22 ملف)
│   ├── domain/             # منطق النطاق الصافي (12 ملف)
│   ├── pages/              # صفحات التطبيق (13 ملف)
│   ├── tabs/               # تبويبات صفحة الدفاتر (5 ملفات)
│   ├── ui/                 # مكونات الواجهة (15+ ملف)
│   └── utils/              # دوال مساعدة (5 ملفات)
├── standards/              # معايير وأدلة المشروع
├── package.json
├── vite.config.js
├── index.html              # Landing page (static HTML)
├── finance-flow.html       # نقطة دخول SPA الرئيسية
├── landing.html            # صفحة هبوط تسويقية
└── CNAME                   # app.qaydalaqar.com
```

---

## الملفات المحورية (أهم 20 ملف وماذا يفعل كل واحد):

| # | الملف | الوظيفة |
|---|-------|---------|
| 1 | `src/main.jsx` | نقطة الدخول — يُنشئ ReactDOM root، يُغلّف بـ HashRouter و RootErrorBoundary، ويضمن وجود الدفتر الافتراضي |
| 2 | `src/App.jsx` | المكون الرئيسي — يحتوي الـ Router (Routes)، Sidebar، Topbar، BottomNav، ويدير حالة الثيم والتنقل والـ Onboarding |
| 3 | `src/core/dataStore.js` | طبقة البيانات المركزية — CRUD للحركات والعمولات والمسودات والإعدادات + seed data + كشف التصفح الخاص |
| 4 | `src/core/storage-facade.js` | واجهة موحّدة (facade) فوق localStorage — تقدم getRaw/setRaw/getJSON/setJSON مع معالجة أخطاء الحصة (quota) |
| 5 | `src/core/ledger-store.js` | إدارة الدفاتر في localStorage — getLedgers/setLedgers/getRecurringItems/getActiveLedgerId/ensureDefaultLedger |
| 6 | `src/core/pulse-engine.js` | محرك النبض المالي — يحسب درجة الصحة (0–100)، التنبيهات، توقعات الأسبوع، كائن النبض الكامل |
| 7 | `src/core/inbox-engine.js` | محرك صندوق الوارد — يوسّع الالتزامات المتكررة إلى مستحقات (overdue/thisWeek/thisMonth) مع مطابقة المدفوع |
| 8 | `src/core/alert-engine.js` | محرك التنبيهات الذكية — يولّد تنبيهات استباقية (overdue, anomaly, cashflow_risk) مع dismiss/snooze |
| 9 | `src/core/ledger-analytics.js` | تحليلات الدفتر — P&L، أعلى البنود (buckets)، درجة الامتثال، جدول آخر 4 أشهر |
| 10 | `src/core/ledger-health.js` | صحة الدفتر — حساب درجة الصحة والامتثال والتوقعات والسيناريوهات |
| 11 | `src/core/ledger-planner.js` | مخطط الدفتر — صندوق وارد الدفتر + خطة النقد (Cash Plan) + التوقعات |
| 12 | `src/core/ledger-forecast.js` | توقعات 6 أشهر + Cash Gap Model + سيناريوهات (rent, utilities, maintenance) |
| 13 | `src/core/monthly-report-generator.js` | مولّد التقرير الشهري — يجمع ملخص الشهر والتفصيل والتوقعات في كائن تقرير |
| 14 | `src/core/recurring-intelligence.js` | ذكاء الالتزامات المتكررة — تصنيف، ترتيب، تجميع، كشف المتأخر |
| 15 | `src/core/saudi-pricing.js` | تسعير سعودي تلقائي — عوامل المدينة (riyadh/jeddah/dammam) وحجم العقار |
| 16 | `src/pages/PulsePage.jsx` | صفحة النبض — العرض الرئيسي (HeroCard, Alerts, WeekForecast, UpcomingDues) مع cache و pull-to-refresh |
| 17 | `src/pages/LedgersPage.jsx` | صفحة الدفاتر — إدارة الدفاتر والالتزامات المتكررة والأداء والتقارير (أكبر صفحة) |
| 18 | `src/pages/TransactionsPage.jsx` | صفحة الحركات — عرض/إضافة/تعديل/حذف الحركات المالية مع فلترة وتصدير CSV |
| 19 | `src/pages/InboxPage.jsx` | صفحة المستحقات — عرض المتأخر والمستحق هذا الأسبوع/الشهر مع تسجيل دفعة سريع |
| 20 | `src/pages/SettingsPage.jsx` | صفحة الإعدادات — إعدادات المكتب، الثيم، الأرقام، النسخ الاحتياطي، إعادة الديمو |

---

## جداول قاعدة البيانات (localStorage Keys):

**لا توجد قاعدة بيانات تقليدية** — كل البيانات مُخزّنة في `localStorage` كـ JSON. إليك البنية:

### 1. `ff_transactions` — الحركات المالية
| العمود | النوع | الوصف |
|--------|------|-------|
| id | string (UUID) | معرّف فريد |
| type | 'income' \| 'expense' | نوع الحركة |
| category | string | التصنيف (commission, rent, salary, expense, deposit, refund, other) |
| amount | number | المبلغ بالريال |
| paymentMethod | string | طريقة الدفع (cash, bank_transfer, check, electronic) |
| date | string (YYYY-MM-DD) | تاريخ الحركة |
| description | string | الوصف |
| ledgerId | string | معرّف الدفتر المرتبط |
| meta | object (optional) | بيانات وصفية (recurringId, acct.bucket, etc.) |
| createdAt | string (ISO) | تاريخ الإنشاء |
| updatedAt | string (ISO) | تاريخ آخر تعديل |

**العلاقات:** كل حركة ترتبط بدفتر واحد عبر `ledgerId`

### 2. `ff_commissions` — العمولات
| العمود | النوع | الوصف |
|--------|------|-------|
| id | string (UUID) | معرّف فريد |
| clientName | string | اسم العميل/الصفقة |
| dealValue | number | قيمة الصفقة |
| officePercent | number | نسبة المكتب |
| agentName | string | اسم الوسيط |
| agentPercent | number | نسبة الوسيط |
| status | 'pending' \| 'paid' | حالة العمولة |
| dueDate | string | تاريخ الاستحقاق |
| paidDate | string (optional) | تاريخ الدفع |
| createdAt / updatedAt | string (ISO) | — |

**العلاقات:** مستقلة (لا ترتبط بدفتر حالياً)

### 3. `ff_drafts` — مسودات الخطابات
| العمود | النوع | الوصف |
|--------|------|-------|
| id | string (UUID) | معرّف فريد |
| templateType | 'intro' \| 'request' \| 'delegation' | نوع القالب |
| fields | object | حقول الخطاب (officeName, recipientName, date, etc.) |
| createdAt / updatedAt | string (ISO) | — |

### 4. `ff_settings` — إعدادات المكتب
| العمود | النوع | الوصف |
|--------|------|-------|
| officeName | string | اسم المكتب |
| phone | string | رقم الهاتف |
| email | string | البريد الإلكتروني |
| defaultCommissionPercent | number | نسبة العمولة الافتراضية |
| theme | 'light' \| 'dim' \| 'dark' | المظهر |
| numerals | 'ar' \| 'en' | نمط الأرقام |

### 5. `ff_ledgers` — الدفاتر المحاسبية
| العمود | النوع | الوصف |
|--------|------|-------|
| id | string (ledg_UUID) | معرّف فريد |
| name | string | اسم الدفتر |
| type | string | النوع (office, chalet, apartment, villa, building, personal, other) |
| note | string | ملاحظة (max 120 حرف) |
| currency | string | العملة (SAR) |
| archived | boolean | مؤرشف؟ |
| createdAt / updatedAt | string (ISO) | — |

### 6. `ff_recurring_items` — الالتزامات المتكررة
| العمود | النوع | الوصف |
|--------|------|-------|
| id | string (rec_UUID) | معرّف فريد |
| ledgerId | string | معرّف الدفتر |
| title | string | عنوان الالتزام |
| category | string | التصنيف (system, operational, maintenance, marketing) |
| amount | number | المبلغ |
| frequency | string | التكرار (monthly, quarterly, yearly, weekly, adhoc) |
| nextDueDate | string (YYYY-MM-DD) | تاريخ الاستحقاق التالي |
| notes | string | ملاحظات |
| riskLevel | string | مستوى المخاطرة (high, medium, low) |
| required | boolean | إلزامي؟ |
| createdAt / updatedAt | string (ISO) | — |

**العلاقات:** كل التزام متكرر يرتبط بدفتر واحد عبر `ledgerId`

### 7. `ff_active_ledger_id` — معرّف الدفتر النشط (string بسيط)

### 8. مفاتيح UI:
- `ui_theme` — المظهر المحفوظ (system/light/dim/dark)
- `ui_numerals` — نمط الأرقام (ar/en)
- `ui_date_header` — عرض التاريخ في الهيدر (off/greg/hijri/both)
- `ui_onboarding_seen` — هل شاهد المستخدم شاشة الترحيب
- `hasSeenWelcomeBanner` — هل شاهد بانر الترحيب
- `ff_seeded` — هل تمّ زرع البيانات التجريبية
- `ff_alert_state` — حالة التنبيهات (dismissed/snoozed)
- `ff_inbox_snooze` — تأجيل المستحقات
- `ff_pulse_cache` — كاش صفحة النبض (sessionStorage)

---

## صفحات التطبيق (كل route + هل محمي أم لا):

| Route (Hash) | الصفحة | المكون | محمي؟ |
|--------------|--------|--------|-------|
| `#/` | النبض المالي (الصفحة الرئيسية) | `PulsePage` | لا — لا يوجد نظام مصادقة |
| `#/inbox` | المستحقات (صندوق الوارد) | `InboxPage` | لا |
| `#/ledgers` | الدفاتر المحاسبية | `LedgersPage` | لا |
| `#/transactions` | الحركات المالية | `TransactionsPage` | لا |
| `#/settings` | الإعدادات | `SettingsPage` | لا |
| `#/report` | التقرير الشهري | `MonthlyReportPage` | لا |
| `*` (أي مسار آخر) | يُعاد توجيهه إلى النبض | `PulsePage` | لا |

### صفحات موجودة لكن **غير مربوطة** بالـ Router الحالي:
- `HomePage.jsx` — صفحة رئيسية قديمة (legacy)
- `CommissionsPage.jsx` — صفحة العمولات (كانت تُستخدم سابقاً، أُزيلت من الـ Router)
- `DraftsPage.jsx` — صفحة المسودات (legacy)
- `GeneratorPage.jsx` — محرر الخطابات (legacy)
- `TemplatesPage.jsx` — قوالب الخطابات (legacy)
- `DashboardPage.jsx` — لوحة التحكم القديمة (استُبدلت بـ PulsePage)
- `NotesCalendar.jsx` — تقويم وملاحظات (غير مربوط)

---

## الميزات المكتملة:

| # | الميزة | الحالة | ملاحظات |
|---|--------|--------|---------|
| 1 | النبض المالي (Pulse Dashboard) | **تعمل** | درجة صحة، تنبيهات، توقعات أسبوعية، مستحقات قادمة، pull-to-refresh، كاش 5 دقائق |
| 2 | صندوق الوارد (Inbox) | **تعمل** | مستحقات متأخرة/هذا الأسبوع/هذا الشهر، تسجيل دفعة سريع، تأجيل (snooze) |
| 3 | إدارة الدفاتر المحاسبية | **تعمل** | إنشاء/تعديل/حذف دفاتر، تبديل الدفتر النشط، أنواع عقارات متعددة |
| 4 | الالتزامات المتكررة | **تعمل** | إضافة/تعديل التزامات، تصنيف (system/operational/maintenance/marketing)، تكرار مرن |
| 5 | الحركات المالية (CRUD) | **تعمل** | إضافة/تعديل/حذف حركات، فلترة متعددة، بحث، تصدير CSV |
| 6 | الإعدادات | **تعمل** | اسم المكتب، ثيم (light/dim/dark/system)، أرقام عربية/إنجليزية، تاريخ هجري/ميلادي |
| 7 | التقرير الشهري | **تعمل** | تقرير شهري تفصيلي لكل دفتر، طباعة/تصدير PDF (عبر window.print) |
| 8 | محرك التنبيهات الذكية | **تعمل** | overdue, upcoming, anomaly, cashflow_risk مع dismiss/snooze بصلاحية 7 أيام |
| 9 | توقعات 6 أشهر | **تعمل** | forecast + Cash Gap Model + سيناريوهات |
| 10 | التسعير السعودي التلقائي | **تعمل** | عوامل المدينة وحجم العقار |
| 11 | مقارنة الدفاتر | **تعمل** | مكون LedgerCompare لمقارنة أداء الدفاتر |
| 12 | أداء الدفتر | **تعمل** | P&L، أعلى البنود، درجة الامتثال، جدول 4 أشهر |
| 13 | النسخ الاحتياطي (Export/Import) | **تعمل** | تصدير/استيراد JSON من الإعدادات |
| 14 | بيانات تجريبية (Seed Data) | **تعمل** | 36 حركة + 10 عمولات + 2 مسودة واقعية |
| 15 | Onboarding + Welcome Banner | **تعمل** | شاشة ترحيب للمرة الأولى |
| 16 | Error Boundaries | **تعمل** | RootErrorBoundary + PageLoadErrorBoundary |
| 17 | تحذير المغادرة (Unsaved Changes) | **تعمل** | beforeunload عند وجود تعديلات غير محفوظة |
| 18 | لوحة المساعدة (HelpPanel) | **تعمل** | أقسام: start, ledgers, recurring, reports, backup, privacy |
| 19 | الثيم المتعدد | **تعمل** | 4 أوضاع (system, light, dim, dark) مع مراقبة prefers-color-scheme |
| 20 | Responsive Design | **تعمل** | Sidebar للديسكتوب + BottomNav للموبايل + فلاتر قابلة للطي |

---

## الميزات الناقصة أو قيد التطوير:

| # | الميزة | الحالة | ملاحظات |
|---|--------|--------|---------|
| 1 | نظام المصادقة (Auth) | **غير موجود** | لا يوجد تسجيل دخول أو حماية بيانات — أي شخص يفتح الرابط يرى البيانات |
| 2 | Backend / API | **غير موجود** | كل البيانات محلية في المتصفح — لا مزامنة بين الأجهزة |
| 3 | صفحة العمولات (مفصولة) | **معطّلة** | `CommissionsPage.jsx` موجودة لكن غير مربوطة بالـ Router — يبدو أنها أُزيلت عمداً |
| 4 | صفحة الخطابات (Generator/Drafts/Templates) | **معطّلة** | 3 صفحات موجودة لكن غير مربوطة بالـ Router |
| 5 | صفحة التقويم والملاحظات | **معطّلة** | `NotesCalendar.jsx` موجودة لكن غير مربوطة |
| 6 | صفحة لوحة التحكم القديمة | **مستبدلة** | `DashboardPage.jsx` استُبدلت بـ PulsePage |
| 7 | Supabase Integration | **غير مُفعّل** | المكتبة مثبّتة في dependencies لكن لا يوجد أي استخدام فعلي لها في الكود |
| 8 | تصدير PDF حقيقي | **جزئي** | يعتمد على window.print() — لا يوجد تصدير PDF برمجي (مثل jsPDF أو puppeteer) |
| 9 | ربط العمولات بالدفاتر | **غير موجود** | العمولات لا تحتوي على ledgerId — مستقلة عن نظام الدفاتر |
| 10 | بحث شامل (Global Search) | **غير موجود** | لا يوجد بحث عابر للصفحات |
| 11 | إشعارات (Push Notifications) | **غير موجود** | — |
| 12 | Multi-user / Collaboration | **غير موجود** | تطبيق فردي فقط |
| 13 | لغة إنجليزية (i18n) | **غير موجود** | عربي فقط — النصوص مكتوبة يدوياً بدون نظام ترجمة |

---

## المشاكل والديون التقنية:

### 1. ازدواجية الكود (Code Duplication)
- **الملفات المنسوخة (deprecated):** `ledger-reports.js`, `ledger-budgets.js`, `ledger-forecast.js`, `ledger-inbox.js`, `ledger-cash-plan.js`, `ledger-brain.js`, `ledger-intelligence-v1.js`, `ledger-compliance.js`, `ledger-variance.js`, `ledger-compare.js` — كلها تحمل تعليق `@deprecated — moved to...` لكنها **لا تزال موجودة** ومُستورَدة في بعض الأماكن.
- الدالة `getTransactionsForLedger` معرّفة في 4 ملفات مختلفة (pulse-engine, inbox-engine, alert-engine, monthly-report-generator).
- `computePL` موجودة في كل من `ledger-analytics.js` و `ledger-reports.js`.

### 2. طبقة التخزين المزدوجة (Dual Storage Layer)
- يوجد نظام تخزين قديم في `assets/js/core/storage.js` + `keys.js` ونظام جديد في `src/core/storage-facade.js` — الجديد يستدعي القديم. طبقة غير ضرورية يمكن تبسيطها.

### 3. صفحات يتيمة (Orphaned Pages)
- 6 صفحات في `src/pages/` غير مربوطة بالـ Router: HomePage, CommissionsPage, DraftsPage, GeneratorPage, TemplatesPage, DashboardPage, NotesCalendar — يجب إما حذفها أو إعادة ربطها.

### 4. غياب TypeScript
- المشروع بالكامل JavaScript — لا يوجد type checking مما يزيد احتمال أخطاء وقت التشغيل.

### 5. اعتماد كامل على localStorage
- لا يوجد حد أعلى لحجم البيانات (حدود localStorage عادة 5-10 MB) — مع الاستخدام المكثف قد تمتلئ المساحة.
- لا توجد مزامنة — فقدان البيانات عند مسح المتصفح.

### 6. تغطية اختبارات ضعيفة جداً
- ملفان فقط للاختبار: `pulse-engine.test.js` (47 سطر) و `format.test.js` (30 سطر) — تغطية شبه معدومة لـ 14,744 سطر كود.

### 7. Supabase كـ dependency غير مُستخدم
- `@supabase/supabase-js` مثبّت في dependencies لكن لا يوجد أي import أو استخدام فعلي — يجب إزالته أو تفعيله.

### 8. Custom Events كبديل عن State Management
- يستخدم `window.dispatchEvent(new CustomEvent('ledger:activeChanged'))` و `'ui:numerals'` و `'ui:dateHeader'` و `'ui:help'` — هذا نمط هش (fragile) مقارنة بـ Context/Zustand/Redux.

### 9. CSS بدون Tailwind Compiler
- يستخدم Tailwind classes يدوياً بدون compiler/JIT — مما يعني أن بعض classes قد لا تعمل أو تحتاج ملف CSS كبير.

### 10. غياب Code Splitting فعّال
- فقط 3 صفحات تستخدم `React.lazy()` (LedgersPage, TransactionsPage, SettingsPage) — الباقي يُحمّل eagerly.

---

## Environment Variables المطلوبة:

**لا توجد environment variables مطلوبة.** التطبيق يعمل بالكامل بدون أي متغيرات بيئة.

الملف الوحيد الذي يتحقق من `import.meta.env.DEV` هو `src/core/contracts.js` — ويُستخدم فقط لتحديد وضع التطوير (dev vs production) لتفعيل fail-fast في contracts.

---

## إحصائيات عامة:

| البند | القيمة |
|-------|--------|
| إجمالي أسطر الكود (src/) | ~14,744 سطر |
| عدد ملفات المصدر (src/) | ~55 ملف |
| ملفات الاختبار | 2 فقط (77 سطر) |
| حجم node_modules | — |
| عدد الـ dependencies | 4 (react, react-dom, react-router-dom, @supabase/supabase-js) |
| عدد الـ devDependencies | 4 (vite, @vitejs/plugin-react, vitest, jsdom) |
| نقطة الدخول للبناء (build entry) | `finance-flow.html` |
| الدومين المباشر | `app.qaydalaqar.com` |

---

*تاريخ التقرير: 2026-03-18*
