# Frontend Architecture Rules

هذا الملف هو دليل التشغيل الأمامي للمشروع.
الهدف منه منع العودة إلى fragility في الواجهة أثناء التطوير القادم.

القاعدة العامة:
- نفضّل الاستقرار والاتساق وقابلية الصيانة على السرعة الشكلية
- لا نضيف طبقات styling جديدة بدون قرار صريح
- أي تحسين بصري جديد يجب أن يمر عبر shared layer أولاً أو page-scoped classes واضحة

## 1. Source Of Truth

### الطبقات المعتمدة

- `[assets/css/theme.tokens.css](/Users/baderalsalman/finance-flow/assets/css/theme.tokens.css)`
  - المصدر الأساسي لـ design tokens من نوع `--color-*`, `--space-*`, `--radius-*`
- `[assets/css/app.css](/Users/baderalsalman/finance-flow/assets/css/app.css)`
  - المصدر الأساسي لـ shared layout, shared primitives, shell contracts, toolbars, cards, modal surfaces, responsive contracts
- `[src/ui/ui-common.jsx](/Users/baderalsalman/finance-flow/src/ui/ui-common.jsx)`
  - المصدر الأساسي للمكونات المشتركة مثل `SummaryCard`, `Badge`, `EmptyState`, `MobileFAB`

### طبقات ليست source of truth

- `[assets/qaydalaqar-theme.css](/Users/baderalsalman/finance-flow/assets/qaydalaqar-theme.css)`
  - طبقة legacy/brand support
  - لا ينبغي توسيعها كطبقة shared behavior جديدة
- Tailwind CDN في `[finance-flow.html](/Users/baderalsalman/finance-flow/finance-flow.html)`
  - موجود حاليًا كطبقة توافق انتقالية فقط
  - ليس architecture معتمدًا للمستقبل

### Shared primitives المعتمدة

- App shell:
  - `.app-shell`
  - `.app-main`
  - `.app-content-frame`
  - `.topbar-shell`
  - `.sidebar-shell`
  - `.bottom-nav-shell`
- Page shell:
  - `.page-shell`
  - `.page-shell--wide`
  - `.page-shell--regular`
- Cards and surfaces:
  - `.panel-card`
  - `.summary-card`
  - `.page-panel`
  - `.detail-hero`
  - `.detail-section`
  - `.report-section`
- Toolbars:
  - `.control-toolbar`
  - `.control-toolbar--filters`
  - `.control-toolbar--compact`
  - `.control-toolbar--segmented`
- Summary layouts:
  - `.route-summary-grid`
  - `.route-summary-grid--quad`
  - `.route-summary-grid__full`
- RTL-safe utility helpers:
  - `.u-text-start`
  - `.u-text-end`
  - `.u-push-inline-start`
  - `.field-icon-inline-start`

## 2. Allowed Vs Disallowed Patterns

### Allowed

- استخدام shared semantic classes من `app.css` لبناء shell, cards, toolbars, grids
- إضافة page-scoped classes واضحة إذا كانت الصفحة تحتاج layout خاصًا بها
- استخدام utility classes الخفيفة للمسافات الصغيرة أو typography المساندة إذا لم تتعارض مع shared primitives
- استخدام inline styles فقط عندما تكون القيمة:
  - data-driven
  - dynamic
  - مرتبطة بلون/عرض/نسبة متغيرة من البيانات

أمثلة مقبولة:
- `style={{ width: \`\${pct}%\` }}`
- `style={{ color: 'var(--color-danger)' }}`
- `className="panel-card"`
- `className="page-shell page-shell--wide"`

### Disallowed

- إضافة طبقة CSS جديدة تتحكم بالسلوك العام للواجهة
- إعادة إدخال runtime direction/theme variants داخل الإنتاج
- كتابة route shell كامل عبر utility-heavy composition إذا كان يمكن بناؤه عبر shared primitives
- استخدام selectors blanket جديدة من نوع:
  - `#root table`
  - `#root input`
  - `#root button`
  - `#root form .grid`
- إضافة physical RTL classes جديدة داخل shared components أو shared routes عندما يوجد بديل logical
- تكرار card styling الكامل داخل JSX مثل:
  - `bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 shadow-sm`
  إذا كان العنصر في الأصل `panel-card` أو `summary-card`

### Utility-heavy composition rule

مسموح:
- utility classes الخفيفة على عناصر داخلية صغيرة

غير مسموح:
- بناء الصفحة أو البطاقة الأساسية بالكامل من utilities إذا كان لها primitive معتمد

مثال سيئ:
- `div` يركّب shell كامل عبر `p-* max-w-* mx-auto rounded-* border-* bg-* shadow-*`

المطلوب بدلًا منه:
- `page-shell`
- `panel-card`
- `control-toolbar`
- `route-summary-grid`

### RTL-safe vs RTL-unsafe

RTL-safe:
- `text-align: start`
- `text-align: end`
- `margin-inline-start`
- `margin-inline-end`
- `padding-inline-start`
- `padding-inline-end`
- `inset-inline-start`
- `inset-inline-end`
- helper classes مثل `.u-text-start`, `.u-text-end`, `.u-push-inline-start`

RTL-unsafe:
- `text-left`
- `text-right` في shared components/routes
- `mr-auto`
- `ml-auto`
- `left-*`
- `right-*`
- `padding-left`
- `padding-right`
- `margin-left`
- `margin-right`

استثناء:
- إذا كان العنصر phone/date/code field يحتاج `dir="ltr"` فهذا مقبول
- لكن alignment حوله يجب أن يبقى logical قدر الإمكان

## 3. Shell Contracts

### App shell

- `.app-shell`
  - يملك الإطار العام للتطبيق
- `.sidebar-shell`
  - يملك عمود التنقل المكتبي
- `.topbar-shell`
  - يملك الرأس الثابت
- `.bottom-nav-shell`
  - يملك تنقل الجوال
- `.app-main`
  - يملك تدفق المحتوى الرئيسي فقط
- `.app-content-frame`
  - يحدد العرض الأفقي للمحتوى المشترك فوق الصفحات

ممنوع:
- إعادة تعريف shell positioning داخل صفحة عادية

### Page shell

- `.page-shell`
  - padding الأساسي للصفحة
  - width/min-width/margin-inline
- `.page-shell--wide`
  - للصفحات التشغيلية الواسعة مثل الحركات والعمولات
- `.page-shell--regular`
  - للصفحات القياسية مثل العقارات والعقود

ممنوع:
- إضافة `p-4 md:p-6 max-w-* mx-auto` على route root إذا كانت `page-shell` مستخدمة

### Card primitives

- `.panel-card`
  - البطاقة القياسية العامة
- `.summary-card`
  - بطاقة المُلخص الرقمي
- `.page-panel`
  - panel shared surface عند الحاجة

ممنوع:
- إعادة تركيب border/radius/shadow/background لبطاقات رئيسية موجود لها primitive

### Toolbar variants

- `.control-toolbar`
  - toolbar shared baseline
- `.control-toolbar--filters`
  - شريط فلترة كامل
- `.control-toolbar--compact`
  - شريط أخف للفلاتر المضغوطة
- `.control-toolbar--segmented`
  - تبويبات أو segmented controls

### Summary grid variants

- `.route-summary-grid`
  - grid baseline for summary cards
- `.route-summary-grid--quad`
  - 4-up variant on desktop
- `.route-summary-grid__full`
  - item spans full row

ممنوع:
- تكرار `grid grid-cols-2 md:grid-cols-4 gap-3`
  في كل route جديد عندما يوجد variant جاهز

## 4. Styling Rules

### متى نستخدم semantic shared classes

- عند بناء:
  - route shell
  - cards
  - summary blocks
  - shared filter bars
  - modal shells
  - shared empty states
  - page headers

### متى تكون page-scoped classes مقبولة

- عندما تكون الصفحة لها layout domain-specific لا يناسب shared primitive
- مثل:
  - `db--*` في Dashboard
  - `ledgers-*` في Ledgers

الشروط:
- تكون واضحة scope
- لا تعيد تعريف shared shell بالكامل
- لا تتسرب لسلوك الصفحات الأخرى

### متى تكون inline styles ممنوعة

ممنوعة عندما تستخدم بدل shared CSS في:
- border
- radius
- padding
- shadows
- positioning الثابت
- layout composition

مسموحة فقط عند:
- dynamic color
- dynamic width/height
- chart/progress values
- state-specific values لا تستحق class خاصة

### كيف نتجنب broad selector regressions

- لا نستخدم `#root ...` إلا إذا كان السلوك فعلاً global وبقرار واضح
- نفضّل scoping عبر shared containers:
  - `.page-shell`
  - `.db--page`
  - `.detail-section`
  - `.report-section`
  - `.modal-body`
  - `.confirm-modal`
  - `.ledgers-page`
- إذا احتجنا behavior shared:
  - نضيف class واضحة
  - لا نربط السلوك بكل DOM داخل التطبيق

## 5. Route Development Rules

### كيف نبني صفحة جديدة بأمان

1. استخدم `page-shell` variant مناسب
2. استخدم `page-header` و`page-header-copy` و`page-kicker` و`page-title` و`page-subtitle`
3. استخدم `panel-card` و`summary-card` بدل إعادة بناء السطوح
4. استخدم `control-toolbar` variants للفلاتر
5. استخدم `route-summary-grid` إذا كانت الصفحة فيها summary cards
6. أضف page-scoped classes فقط إذا كان layout الصفحة خاصًا فعلاً
7. استخدم RTL-safe helpers من البداية

### كيف نستهلك shared primitives

- route root:
  - `page-shell page-shell--regular` أو `page-shell page-shell--wide`
- summary cards:
  - `route-summary-grid`
  - `SummaryCard`
- filter bar:
  - `control-toolbar control-toolbar--filters`
- compact filters:
  - `control-toolbar control-toolbar--compact`
- segmented controls:
  - `control-toolbar control-toolbar--segmented`

### ما الذي يجب فحصه قبل merge

- هل route root يستخدم shared shell بدل utility shell؟
- هل card surfaces مبنية من shared primitives؟
- هل أضفت selector broad جديد في `app.css`؟
- هل أضفت `text-left`, `text-right`, `mr-auto`, `ml-auto`, `left-*`, `right-*` داخل `src/ui/` أو shared routes؟
- هل الموبايل ما زال لا يتكسر مع bottom nav؟
- هل build/test نجحا؟
- هل visual smoke مرّ على المسارات الأساسية إذا لمس التعديل shared layer؟

## 6. Visual Smoke Checklist

هذا checklist مختصر بعد أي تعديل في:
- `assets/css/app.css`
- `src/App.jsx`
- `src/ui/*`
- shared route primitives

### المسارات الأساسية

- `#/`
- `#/transactions`
- `#/commissions`
- `#/properties`
- `#/contracts`
- `#/inbox`
- `#/ledgers`

### ما الذي نراجعه

- Sidebar لا يضغط المحتوى ولا يسبب horizontal overflow
- Topbar sticky يعمل بدون قفز spacing
- Bottom nav لا يغطي المحتوى على الجوال
- Page shell padding ثابت بين الصفحات
- Summary cards متسقة
- Toolbars لا تنهار بشكل غير متوقع
- Tables الرئيسية لا تفقد readability
- لا توجد عناصر aligned بعكس RTL بدون سبب

## 7. Tailwind Transition Policy

### القرار

- نعتمد سياسة `phased removal`
- لا نعتمد Tailwind كنظام build-time رسمي جديد

### لماذا

- المشروع لديه بالفعل semantic CSS system قائم
- نقل المشروع الآن إلى Tailwind رسمي سيضيف shift معماري جديد قبل الإطلاق
- الخطر الحالي ليس نقص utilities، بل كثرة الطبقات واختلاط الملكية

### ما الذي لا يجب إضافته بعد الآن

- لا نضيف shared components جديدة مبنية بالكامل على Tailwind utilities
- لا نضيف route shells جديدة عبر `p-* max-w-* mx-auto rounded-* border-* bg-* shadow-*`
- لا نضيف classes physical RTL جديدة
- لا نضيف overrides جديدة لإخفاء تعارض Tailwind مع shared CSS

### المسار العملي

1. shared layer الجديدة تبنى عبر semantic classes
2. الصفحات الحالية تُثبّت تدريجيًا لاستهلاك هذه primitives
3. بعد استقرار routes الأساسية، نبدأ تقليل الاعتماد على Tailwind utility usage صفحة صفحة
4. لاحقًا يمكن إزالة Tailwind CDN عندما يصبح الاعتماد عليه غير جوهري

## قاعدة العمل النهائية

إذا كان التغيير:
- يمس أكثر من route
- أو يغيّر shell
- أو يغيّر card primitive
- أو يغيّر toolbar behavior

فهو ليس “page tweak”.
هو shared-layer change ويجب أن يُعامل كتغيير معماري صغير مع smoke check واضح.
