# هجرة الهوية البصرية — قيد العقار

**المرجع المعتمد (SOURCE OF TRUTH):** `brand-identity-system.md` (يحتوي على مواصفات الهوية بصيغة HTML/CSS).

**ملاحظة:** الملف `qayd-alaqar-brand-identity.html` غير موجود في المشروع؛ تم استخراج المواصفات من `brand-identity-system.md`.

---

## Step 0 — مواصفات الهوية المستخرجة من الملف المرجعي

### لوحة الألوان (Color Palette)

| الدور | اسم المتغير | القيمة | الاستخدام |
|--------|-------------|--------|-----------|
| **Primary** | `--navy` | `#0F1C2E` | النصوص الرئيسية، الأزرار الأساسية، الخلفيات الداكنة |
| | `--navy-90` | `rgba(15, 28, 46, 0.9)` | |
| | `--navy-60` | `rgba(15, 28, 46, 0.6)` | نصوص ثانوية |
| | `--navy-30` | `rgba(15, 28, 46, 0.3)` | حدود، حدود أزرار ثانوية |
| | `--navy-10` | `rgba(15, 28, 46, 0.1)` | خلفيات خفيفة |
| | `--navy-05` | `rgba(15, 28, 46, 0.05)` | hover خفيف (ghost) |
| **Neutrals** | `--gray` | `#8A8F98` | نصوص ثانوية، تسميات |
| | `--gray-light` | `#C8CBD0` | placeholder |
| | `--gray-bg` | `#F4F5F6` | خلفيات محايدة |
| **Accent** | `--gold` | `#B8A76A` | عناصر تفاعلية مهمة فقط (محدود جداً) |
| | `--gold-light` | `rgba(184, 167, 106, 0.15)` | focus ring، تمييز خفيف |
| | `--gold-subtle` | `rgba(184, 167, 106, 0.08)` | badges، خلفيات تسميات |
| **Backgrounds** | `--white` | `#FFFFFF` | |
| | `--off-white` | `#FAFBFC` | خلفية الصفحة، حقول الإدخال |
| **Borders & Shadows** | `--border` | `rgba(15, 28, 46, 0.08)` | حدود رفيعة |
| | `--shadow-sm` | `0 1px 3px rgba(15, 28, 46, 0.04)` | |
| | `--shadow-md` | `0 4px 16px rgba(15, 28, 46, 0.06)` | |
| | `--shadow-lg` | `0 8px 32px rgba(15, 28, 46, 0.08)` | |
| **Radius** | `--radius` | `12px` | |
| | `--radius-sm` | `8px` | أزرار، حقول |
| | `--radius-lg` | `16px` | بطاقات كبيرة |

ألوان دلالية (من الملف): نجاح `#2E7D32`، خطر `#C62828`، تحذير برتقالي `#E65100` — استخدام درجات هادئة وبدون ألوان صاخبة.

---

### الطباعة (Typography)

| العنصر | الخط | الأحجام/الأوزان |
|--------|------|------------------|
| **العربي** | **IBM Plex Sans Arabic** (إجباري) | 300, 400, 500, 600, 700 |
| **English** | نفس العائلة أو مونو للقيم (قيم ألوان، أرقام) |
| **H1** | 48px–56px, weight 600, line-height 1.2 | |
| **H2** | 36px, 600, 1.3 | |
| **H3** | 24px, 500, 1.4 | |
| **Body** | 16px, 400, line-height 1.7–1.8, لون navy-60 للجسم | |
| **Caption** | 13px, 400, لون gray | |
| **Labels** | 13px, 500, navy | |

رابط الخط:  
`https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap`

---

### قواعد الواجهة (UI Rules) من الملف

- **المسافات:** مساحات بيضاء كافية؛ الفراغ يعزز الوضوح والثقة.
- **البطاقات:** حدود رفيعة، ظلال خفيفة جداً، زوايا مدورة (`--radius`, `--radius-lg`).
- **الذهبي (Accent):** يُستخدم فقط للعناصر التفاعلية المهمة والتمييز — محدود جداً.
- **ممنوع:** تدرجات لونية قوية أو ألوان صارخة.
- **ممنوع:** خطوط زخرفية — التزم بـ IBM Plex Arabic فقط.
- **ممنوع:** ألوان صاخبة (أحمر فاقع، أخضر صارخ) — استخدم درجات هادئة.

**التدرجات في الملف:** فقط تدرجات خفيفة جداً (مثلاً `radial-gradient` مع شفافية 0.04–0.08 للذهبي أو الرمادي) — لا gradients قوية.

---

### مكونات من الملف (للمرجع فقط — لا تغيير JS)

- **Buttons:** `.btn-primary` (navy), `.btn-secondary` (شفاف + حدود navy-30), `.btn-gold` (accent), `.btn-ghost`. padding 12px 28px, radius `--radius-sm` (8px). `.btn-sm`: 8px 20px, 13px.
- **Inputs:** `border: 1px solid var(--border)`, `border-radius: var(--radius-sm)`, focus: `border-color: var(--gold)`, `box-shadow: 0 0 0 3px var(--gold-light)`.
- **Cards:** `border: 1px solid var(--border)`, `border-radius: var(--radius)` أو `--radius-lg`, `padding: 24px` أو أكثر، hover: `box-shadow: var(--shadow-md)`.
- **Tables:** رأس وزن 500، لون gray، حدود رفيعة، padding 12px 16px.

---

## الهدف من الهجرة

- نفس الوظائف 100% (لا تغيير في JavaScript أو الـ IDs أو data-attributes).
- شكل الواجهات 100% وفق هوية "قيد العقار" حسب الملف المرجعي.

---

## الملفات المستهدفة

| الملف | الوصف |
|-------|--------|
| `finance-flow.html` | التطبيق الرئيسي (واجهة واحدة مع React + Tailwind + CSS مضمّن) |
| `landing.html` | صفحة الهبوط |
| `index.html` | صفحة التوجيه إلى التطبيق |
| `assets/` | حالياً لا يوجد ملف CSS خارجي مرتبط بالواجهة (فقط sar.svg) — سيتم إضافة `qaydalaqar-theme.css` لاحقاً. |

---

## قاعدة صارمة: لا تغيير JS

- **ممنوع** تغيير أي JavaScript logic أو أسماء الدوال أو IDs أو data-attributes المستخدمة وظيفياً.
- التغييرات **CSS-first**؛ أي تعديل HTML يكون محدوداً جداً (إضافة class فقط عند الضرورة).
- ممنوع refactor شامل أو نقل أقسام أو حذف CSS الحالي دفعة واحدة.

---

## النسخ الاحتياطي

- **المسار:** `release/brand-migration-backup/2026-02-10/`
- قبل أي تعديل على ملف مستهدف، يتم نسخه إلى هذا المجلد بنفس الاسم.

---

## خطة المراحل القادمة

| المرحلة | الوصف |
|---------|--------|
| **Step 2** | Theme Tokens (CSS Variables) + Fonts في `assets/qaydalaqar-theme.css`؛ ربطه في الصفحات دون إزالة CSS الحالي. |
| **Step 3** | Global Base Styles في نفس الملف (جسم، نصوص، روابط، قواعد خفيفة للبطاقات/أزرار/مدخلات). |
| **Step 4** | Re-skin لـ landing.html و index.html. |
| **Step 5** | Re-skin لـ finance-flow.html (CSS overrides فقط، بدون لمس المنطق). |
| **Step 6** | Brand QA + توثيق docs/BRAND.md وتحديث هذا الملف بنتائج المراحل. |

---

## Step 1 — تقرير الإنجاز (Baseline + Backup)

**تاريخ:** 2026-02-10

**ما تم:**
- **A)** تحديد الصفحات الأساسية: `finance-flow.html`, `landing.html`, `index.html`. لا يوجد ملف CSS خارجي في `assets/` مرتبط بالواجهة (فقط sar.svg).
- **B)** إنشاء مجلد النسخ الاحتياطي: `release/brand-migration-backup/2026-02-10/`
- **C)** نسخ الملفات المرشحة للتعديل إلى المجلد بنفس الأسماء: `finance-flow.html`, `landing.html`, `index.html`.
- **D)** إنشاء/تحديث `docs/BRAND_MIGRATION.md` يتضمن الهدف، الملفات المستهدفة، قاعدة "لا تغيّر JS"، وخطة المراحل.

**الملفات المنسوخة (للرجع):**
- `release/brand-migration-backup/2026-02-10/finance-flow.html`
- `release/brand-migration-backup/2026-02-10/landing.html`
- `release/brand-migration-backup/2026-02-10/index.html`

**الرجوع (Rollback):** استبدال أي ملف في الجذر بنسخته من `release/brand-migration-backup/2026-02-10/` بنفس الاسم.

---

## Step 2 — تقرير الإنجاز (Theme Tokens + Fonts)

**تاريخ:** 2026-02-10

**ما تم:**
- **A)** إنشاء ملف جديد: `assets/qaydalaqar-theme.css`.
- **B)** تعريف tokens في `:root` و `[data-theme="light"]`: ألوان (navy, gray, gold, white, off-white)، حدود، ظلال، radius، spacing، typography (خط IBM Plex Arabic، أحجام)، ألوان دلالية (success, danger, warning).
- **C)** ثيمات: `[data-theme="light"]` (افتراضي)، `[data-theme="dim"]` (خلفية رمادية متوسطة، أخف من dark)، `[data-theme="dark"]` (خلفية navy، نصوص فاتحة).
- **D)** ربط الملف في `finance-flow.html`، `landing.html`، `index.html` عبر `<link rel="stylesheet" href="assets/qaydalaqar-theme.css"/>` دون إزالة أي CSS أو خطوط موجودة.

**لم يتم:** حذف أو تعديل CSS القديم؛ لم يُلمس أي JS.

**كيف تختبر:** افتح كل من index.html، landing.html، finance-flow.html من الجذر (مع تشغيل سيرفر محلي إن لزم لمسار assets/). الصفحات يجب أن تظهر وتعمل كما قبل؛ إضافة الـ theme لا يغيّر المظهر بعد لأن الصفحات لا تستخدم متغيرات qaydalaqar حتى الآن.

**الرجوع (Rollback):** احذف السطر `<link rel="stylesheet" href="assets/qaydalaqar-theme.css"/>` من الصفحات الثلاث؛ واحذف الملف `assets/qaydalaqar-theme.css` إن أردت إزالة الثيم بالكامل.

---

## Step 3 — تقرير الإنجاز (Global Base Styles)

**تاريخ:** 2026-02-10

**ما تم (في `assets/qaydalaqar-theme.css` فقط):**
- **Base:** تعزيز RTL عبر `html[lang="ar"] { direction: rtl; }`. جسم الصفحة: `font-family`, `background`, `color`, `line-height`, `-webkit-font-smoothing`. روابط: `color`, `hover` باستخدام tokens.
- **مكونات عبر classes فقط (لا تُطبَّق إلا عند إضافة الـ class):** `.qa-card`, `.qa-card-lg`, `.qa-btn`, `.qa-btn-primary`, `.qa-btn-secondary`, `.qa-btn-ghost`, `.qa-input`, `.qa-table` (مع `th`, `td`, `.amount`) — حدود رفيعة، ظلال خفيفة، بدون تدرجات قوية، مسافات من tokens.

**لم يتم:** حذف أو تعديل CSS القديم في الصفحات؛ لم يُلمس أي JS؛ لم تُضف classes جديدة إلى HTML بعد (ستُستخدم في Step 4/5).

**كيف تختبر:** افتح index و landing و finance-flow. الصفحات تحتفظ بمظهرها لأن أنماطها الداخلية تأتي بعد الثيم وتُغلّف body و a. التأكد من RTL وتباين جيد: الصفحات تستخدم بالفعل `dir="rtl"`؛ الثيم يعزز ذلك لـ `html[lang="ar"]`. للتحقق من المكونات: أضف مؤقتاً عنصراً بـ class `qa-card` أو `qa-btn-primary` في أي صفحة للتأكد من الشكل.

**الرجوع (Rollback):** احذف من `qaydalaqar-theme.css` كل القسم من "Step 3 — Global Base Styles" حتى نهاية الملف (أبقِ الثيمات والـ tokens فقط).

---

## Step 4 — تقرير الإنجاز (Re-skin Landing / Index)

**تاريخ:** 2026-02-10

**ما تم:**
- **index.html:** استبدال ألوان وخط الجسم والرابط بمتغيرات الهوية: `var(--qa-font-arabic)`, `var(--qa-page-bg)`, `var(--qa-text-primary)`, `var(--qa-navy)`. لم يُغيّر أي نص أو رابط أو هيكل.
- **landing.html:** ربط متغيرات الصفحة (`:root`) بـ tokens قيد العقار: `--lp-bg` → `var(--qa-off-white)`, `--lp-surface` → `var(--qa-white)`, `--lp-primary` → `var(--qa-navy)` (CTA أساسي Navy), `--lp-primary-dark` → `#1a2d45`, `--lp-text` / `--lp-muted` / `--lp-border` / `--lp-radius` / `--lp-shadow` من الثيم. خط الجسم: `var(--qa-font-arabic)`, line-height من الثيم. زر CTA الرئيسي: ظل خفيف (`var(--qa-shadow-md)`)، بدون transform قوي، hover بلون navy أغمق. عنصر accent واحد فقط: شارة «موصى به» بالذهبي (`var(--qa-gold)`). أيقونة الثقة بالأخضر الهادئ `var(--qa-success)`. حقول النموذج: radius وخط من الثيم. `theme-color` في الـ meta: `#0F1C2E`. لم يُغيّر أي نص أو روابط أو أقسام إلا عبر CSS.

**ممنوع ولم يحدث:** تغيير النصوص أو الروابط أو هيكل الأقسام (فقط إضافة/تعديل أنماط).

**كيف تختبر:** افتح index.html و landing.html. تحقق أن التوجيه والروابط تعمل، أن الهوية الجديدة (Navy، خط IBM Plex، ظلال خفيفة، ذهبي للشارة فقط) تظهر، وأن الترتيب لم ينكسر.

**الرجوع (Rollback):** استبدال الملفين من `release/brand-migration-backup/2026-02-10/index.html` و `landing.html`.

---

## Step 5 — تقرير الإنجاز (Re-skin App — finance-flow.html)

**تاريخ:** 2026-02-10

**ما تم (CSS وربط tokens فقط، بدون لمس المنطق):**
- **meta theme-color:** `#0F1C2E` (Navy).
- **خط:** استبدال Noto Sans Arabic بـ IBM Plex Sans Arabic (رابط الخط + tailwind.config fontFamily).
- **tokens التطبيق (--ff-*):** ربطها بهوية قيد العقار في الثيمات الثلاثة:
  - `[data-theme="light"]`: --ff-bg/surface/border/text/muted من --qa-*، --ff-primary = Navy، --ff-ring = gold-light (focus)، ظلال و radius من الثيم.
  - `[data-theme="dim"]`: نفس المصدر --qa-* (قيم dim من ملف الثيم).
  - `[data-theme="dark"]`: نفس المصدر مع --ff-primary = gold للتباين على الخلفية الداكنة.
- **Typography/Tables/Cards/Inputs/Modals:** تعتمد على --ff-* فوراً دون تغيير أي selectors أو IDs.
- **Welcome banner:** إزالة التدرج البنفسجي؛ خلفية Navy وظل خفيف.
- **Focus:** :focus-visible و #root input/select/textarea focus و #root button:focus-visible باستخدام ذهبي (--qa-gold، --qa-gold-light) كـ accent محدود.
- **Confirm danger / btn-danger:** استخدام var(--qa-danger) (أحمر هادئ).
- **بيانات واحدة (تقويم):** لون "تقويم دراسي" من أزرق إلى navy/رمادي هادئ (بدون تغيير منطق).

**ممنوع ولم يحدث:** تعديل JS (دوال، أسماء، منطق)، إعادة تسمية IDs، حذف CSS الحالي دفعة واحدة.

**كيف تختبر:** فتح finance-flow.html، تجربة: إضافة/تعديل حركة، عمولات، خطابات، تنقل القوائم، تغيير الثيم (light/dim/dark)، تحميل/تصدير بيانات. التأكد أن الأرقام والتنسيقات والوظائف كما هي وأن الشكل يتبع الهوية (Navy، خط IBM Plex، ظلال خفيفة، ذهبي للـ focus فقط).

**الرجوع (Rollback):** استبدال الملف من `release/brand-migration-backup/2026-02-10/finance-flow.html`.

---

## Step 6 — تقرير الإنجاز (Brand QA + Docs)

**تاريخ:** 2026-02-10

**ما تم:**
- **إنشاء docs/BRAND.md:** يشرح الهوية كما طُبّقت: الألوان (primary/secondary/accent/neutrals)، الطباعة (IBM Plex Arabic)، قواعد الاستخدام، أين تُعرّف القيم (qaydalaqar-theme.css)، الثيمات (light/dim/dark)، ومرجع سريع للمطورين.
- **تحديث docs/BRAND_MIGRATION.md:** إضافة تقرير Step 6 وقائمة Brand QA أدناه.

**Brand QA — التحقق:**
- **لا تدرجات قوية:** تم إزالة التدرج البنفسجي من welcome-banner؛ الخلفيات والبطاقات بدون gradients قوية.
- **لا ظلال ثقيلة:** الاعتماد على `--qa-shadow-sm/md/lg` (قيم من ملف الهوية).
- **مساحات بيضاء كافية:** الهيكل الحالي يحافظ على padding و margin؛ الثيم يوفّر spacing tokens (--qa-space-*).
- **اتساق الصفحات:** index و landing و finance-flow تستخدم نفس الخط (IBM Plex Arabic)، نفس primary (Navy)، ونفس accent محدود (ذهبي للـ focus وشارة واحدة في الهبوط).

**كيف تختبر (مراجعة نهائية):**
1. افتح index.html → التوجيه والرابط يعملان، الهوية واضحة.
2. افتح landing.html → كل الأقسام والروابط، CTA Navy، شارة «موصى به» ذهبية فقط.
3. افتح finance-flow.html → التنقل، الإضافة/التعديل، الثيمات، التصدير/الاستيراد؛ الشكل يتبع الهوية دون كسر وظائف.

**الرجوع (Rollback):** حذف أو تعديل docs/BRAND.md حسب الحاجة؛ إزالة قسم Step 6 من BRAND_MIGRATION.md.

---

*آخر تحديث: 2026-02-10 — Step 0 حتى Step 6 مكتملان. هجرة الهوية منتهية.*
