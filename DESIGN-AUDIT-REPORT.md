# تقرير تدقيق الهوية البصرية — قيد العقار
# Design Identity Audit Report — Qayd Al-Aqar

> تاريخ التدقيق: 2026-03-29
> النوع: استخراج وتحقق فقط — بدون أي تعديلات

---

## A) مصدر الحقيقة (Source of Truth)

### الملف المُعلَن كمصدر حقيقة:
**`public/assets/qaydalaqar-theme.css`** (301 سطر)

- السطر الأول يحمل تعليق: `SOURCE OF TRUTH: brand-identity-system.md`
- يحتوي على: الألوان الأساسية، التيبوغرافي، المسافات، الـ radius، وتعريفات المكونات (`qa-*`)
- يُعرّف 3 ثيمات: `light` (الافتراضي)، `dim`، `dark`
- **يُحمّل أولاً** في `finance-flow.html` (سطر 36) قبل باقي الملفات

### المشكلة:
لا يوجد مصدر حقيقة واحد فعلي. هناك **5 أماكن مختلفة** تُعرّف CSS variables، وبعضها يتعارض:

| # | الملف | الدور المُعلن | عدد المتغيرات |
|---|-------|--------------|---------------|
| 1 | `public/assets/qaydalaqar-theme.css` | مصدر الحقيقة الرسمي | ~88 متغير (`--qa-*`) |
| 2 | `assets/css/theme.tokens.css` | طبقة semantic فوق qa-* | ~60 متغير (`--color-*`) |
| 3 | `assets/css/app.css` | الأنماط التطبيقية + overrides لـ Tailwind | ~40 override بـ `!important` |
| 4 | `public/assets/mobile-responsive-fixes.css` | إصلاحات الموبايل | ~30 متغير جديد (`--space-*`, `--color-*`) |
| 5 | `landing.html` (inline `<style>`) | صفحة الهبوط المنفصلة | ~25 متغير (`--navy`, `--gold`, إلخ) |

### ترتيب التحميل في finance-flow.html:
```
1. Tailwind CDN (cdn.tailwindcss.com)
2. Google Fonts (IBM Plex Sans Arabic)
3. qaydalaqar-theme.css     ← المتغيرات الأساسية (--qa-*)
4. theme.tokens.css          ← المتغيرات الدلالية (--color-*)
5. app.css                   ← أنماط المكونات + Tailwind overrides
```

**ملاحظة:** `mobile-responsive-fixes.css` موجود في `public/assets/` لكن **غير مُحمّل** في `finance-flow.html`. يبدو أنه ملف مرجعي/مسودة وليس نشطاً.

---

## B) جدول الألوان الكامل (Color Tokens)

### B.1 — الألوان الأساسية (Brand Colors)

| اللون | qaydalaqar-theme.css | brand-identity.md | landing.html | الحالة |
|-------|---------------------|-------------------|-------------|--------|
| Navy | `#0F1C2E` | `#0F1C2E` | `#0F1C2E` | ✅ متطابق |
| Gold | **`#6B5A2E`** | **`#B8A76A`** | **`#6B5A2E`** | ❌ **تعارض** |
| Gray | `#8A8F98` | `#8A8F98` | `#8A8F98` | ✅ متطابق |
| White | `#FFFFFF` | `#FFFFFF` | `#FFFFFF` | ✅ متطابق |

#### ⚠️ التعارض الأكبر: لون الذهبي (Gold)
- **`brand-identity.md`** (التوثيق الرسمي) يقول: `#B8A76A` — ذهبي فاتح ساطع
- **`qaydalaqar-theme.css`** (مصدر الحقيقة المُعلن) يستخدم: `#6B5A2E` — ذهبي زيتوني داكن
- **`landing.html`** يستخدم: `#6B5A2E` — يتبع الـ CSS لا التوثيق
- **`theme.tokens.css`** يقول `--color-accent: var(--qa-gold)` — يرث `#6B5A2E` من qaydalaqar-theme
- **لكن** في dark theme بـ `theme.tokens.css` سطر 148: `rgba(184, 167, 106, 0.16)` — الـ RGB هنا يُطابق `#B8A76A` لا `#6B5A2E`!

**الحُكم:** التوثيق يقول شيء والكود يُطبّق شيء آخر. والـ dark theme يستخدم قيمة ثالثة.

### B.2 — ألوان الأسطح والخلفيات (Surfaces)

| المتغير | Light | Dim | Dark | مُعرّف في |
|---------|-------|-----|------|----------|
| `--qa-page-bg` | `#FAFBFC` | `#E8EAED` | `#0F1C2E` | qaydalaqar-theme.css |
| `--qa-surface` | `#FFFFFF` | `#F0F1F3` | `#1A2A42` | qaydalaqar-theme.css |
| `--qa-off-white` | `#FAFBFC` | — | — | qaydalaqar-theme.css |
| `--color-background` | `var(--qa-page-bg)` | `var(--qa-page-bg)` | `var(--qa-page-bg)` | theme.tokens.css |
| `--color-surface` | `var(--qa-surface)` | `var(--qa-surface)` | `var(--qa-surface)` | theme.tokens.css |
| `--color-surface-elevated` | `var(--qa-white)` | `var(--qa-surface)` | `var(--qa-surface)` | theme.tokens.css |
| `--color-surface-alt` | `var(--qa-off-white)` | `var(--qa-gray-bg)` | `var(--qa-navy-10)` | theme.tokens.css |

### B.3 — ألوان النصوص (Text)

| المتغير | Light | Dim | Dark | مُعرّف في |
|---------|-------|-----|------|----------|
| `--qa-text-primary` | `#0F1C2E` | `#0F1C2E` | `#FFFFFF` | qaydalaqar-theme.css |
| `--qa-text-muted` | `#8A8F98` | `#5F6368` | `#8A8F98` | qaydalaqar-theme.css |
| `--color-text-primary` | `var(--qa-text-primary)` | `var(--qa-text-primary)` | `var(--qa-text-primary)` | theme.tokens.css |
| `--color-text-secondary` | `var(--qa-text-muted)` | `var(--qa-text-muted)` | `var(--qa-text-muted)` | theme.tokens.css |
| `--color-text-inverse` | `#f8fbff` | — | `var(--qa-white)` | theme.tokens.css |

### B.4 — ألوان الحالات (Status Colors)

| الحالة | Light | Dark | مُعرّف في |
|--------|-------|------|----------|
| Success | `#2E7D32` | `#7fbf83` | qa-theme → light; tokens → dark |
| Danger | `#C62828` | `#d57a7a` | qa-theme → light; tokens → dark |
| Warning | `#E65100` | `#d8a75b` | qa-theme → light; tokens → dark |

### B.5 — الحدود (Borders)

| المتغير | Light | Dark |
|---------|-------|------|
| `--qa-border-color` | `rgba(15,28,46, 0.08)` | `rgba(255,255,255, 0.08)` |
| `--color-border` | `color-mix(78% border, 22% navy)` | `var(--qa-border-color)` |
| `--color-border-strong` | `color-mix(42% border, 58% navy)` | `rgba(255,255,255, 0.16)` |

---

## C) نظام التيبوغرافي (Typography System)

### C.1 — الخط
- **الخط الأساسي:** IBM Plex Sans Arabic
- **الأوزان:** 300, 400, 500, 600, 700
- **مُحمّل من:** Google Fonts CDN (في كل من finance-flow.html و qaydalaqar-theme.css)
- **⚠️ تحميل مزدوج:** الخط يُحمّل مرتين — مرة في HTML `<link>` ومرة في CSS `@import`

### C.2 — مقاسات الخطوط

| المستوى | القيمة (px) | المتغير | الوزن | ارتفاع السطر |
|---------|------------|---------|------|-------------|
| H1 | 48px | `--qa-font-size-h1` | 600 | 1.2 |
| H2 | 36px | `--qa-font-size-h2` | 600 | 1.3 |
| H3 | 24px | `--qa-font-size-h3` | 500 | 1.4 |
| Body | 16px | `--qa-font-size-body` | 400 | 1.8 |
| Caption | 13px | `--qa-font-size-caption` | 400 | 1.6 |

**مُعرّف في:** `qaydalaqar-theme.css` (الأصل) → `theme.tokens.css` (يحوّلها لـ rem)

### C.3 — تعارضات التيبوغرافي

| الموقع | القيمة | تعارض مع |
|--------|--------|---------|
| `brand-identity.md` | ارتفاع سطر `1.7` موحد | `qaydalaqar-theme.css` يستخدم 5 قيم مختلفة (1.2–1.8) |
| `app.css` body | `font-family: var(--font-ar)` | يستخدم اسم مختلف عن `--qa-font` |
| `finance-flow.html` body | `class="font-sans"` (Tailwind) | يتنافس مع CSS variable |
| Tailwind CDN | `text-xs`, `text-sm`, `text-lg` | مقاسات مختلفة عن نظام `--qa-font-size-*` |
| `app.css` topbar-title | `font-size: 1.28rem` (hardcoded) | لا يستخدم أي متغير |
| `app.css` topbar-subtitle | `font-size: 0.8125rem` (hardcoded) | لا يستخدم أي متغير |

---

## D) نظام المسافات (Spacing System)

### D.1 — المتغيرات المُعرّفة

| المتغير | القيمة | مُعرّف في |
|---------|--------|----------|
| `--qa-space-xs` | 8px | qaydalaqar-theme.css |
| `--qa-space-sm` | 12px | qaydalaqar-theme.css |
| `--qa-space-md` | 16px | qaydalaqar-theme.css |
| `--qa-space-lg` | 24px | qaydalaqar-theme.css |
| `--qa-space-xl` | 32px | qaydalaqar-theme.css |
| `--qa-space-2xl` | 40px | qaydalaqar-theme.css |
| `--qa-space-3xl` | 64px | qaydalaqar-theme.css |

### D.2 — الاستخدام الفعلي

- **مكونات `qa-*`** (في qaydalaqar-theme.css): تستخدم `var(--qa-space-*)` ✅
- **مكونات `app.css`**: تستخدم **قيم rem/px مباشرة** — مثال: `padding: 0.95rem 1.25rem`, `gap: 0.625rem`, `font-size: 0.8125rem` ❌
- **مكونات React**: تستخدم **Tailwind utilities** — `p-4`, `p-5`, `gap-3`, `gap-4` ❌
- **Inline styles**: تستخدم **أرقام مباشرة** — `padding: 24`, `margin: '0 0 8px'` ❌

### D.3 — الحُكم
نظام المسافات مُعرّف لكنه **غير مُطبّق بشكل منهجي**. المكونات الفعلية تستخدم 3 أنظمة مختلفة:
1. متغيرات `--qa-space-*` (في مكونات qa-* فقط)
2. Tailwind spacing (في JSX)
3. قيم rem/px يدوية (في app.css)

---

## E) نظام المكونات (Component System)

### E.1 — ثلاثة أنظمة مكونات متوازية

#### النظام 1: مكونات `qa-*` (qaydalaqar-theme.css)
| المكون | الكلاس | الحالة |
|--------|--------|--------|
| Card | `.qa-card`, `.qa-card-lg` | مُعرّف |
| Button Primary | `.qa-btn-primary` | مُعرّف |
| Button Secondary | `.qa-btn-secondary` | مُعرّف |
| Button Ghost | `.qa-btn-ghost` | مُعرّف |
| Input | `.qa-input` | مُعرّف |
| Table | `.qa-table` | مُعرّف |
| Typography | `.qa-h1`, `.qa-h2`, `.qa-h3`, `.qa-body`, `.qa-caption` | مُعرّف |

**الاستخدام الفعلي:** هذه الكلاسات مُعرّفة في CSS لكن يجب التحقق من استخدامها في JSX.

#### النظام 2: مكونات app.css (custom classes)
| المكون | الكلاس |
|--------|--------|
| App Shell | `.app-shell`, `.app-main`, `.app-footer` |
| Topbar | `.topbar-shell`, `.topbar-body`, `.topbar-title` |
| Sidebar | `.sidebar-shell`, `.sidebar-brand`, `.sidebar-item` |
| Bottom Nav | `.bottom-nav-shell`, `.bottom-nav-item` |
| Buttons | `.btn-primary`, `.btn-secondary`, `.btn-danger` |
| Modal | `.modal-header`, `.modal-body`, `.modal-footer` |
| Welcome | `.welcome-banner` |

**ملاحظة:** هذا النظام يستخدم `--color-*` tokens من theme.tokens.css.

#### النظام 3: Tailwind Utilities (في JSX مباشرة)
- `bg-blue-600`, `text-red-700`, `bg-slate-50` — ألوان Tailwind الافتراضية
- `p-4`, `gap-3`, `rounded-lg` — مسافات وأشكال Tailwind
- `text-xs`, `text-sm`, `font-bold` — تيبوغرافي Tailwind
- **43 استخدام** لألوان Tailwind الثابتة في 7 ملفات JSX

### E.2 — كيف يتعايشون؟
`app.css` يحتوي على **~40 override بـ `!important`** لتحويل ألوان Tailwind لمتغيرات الثيم:
```css
html[data-theme] .bg-blue-600 { background-color: var(--color-primary) !important; }
html[data-theme] .text-gray-600 { color: var(--color-text-secondary) !important; }
html[data-theme] .bg-white { background-color: var(--color-surface) !important; }
```

هذا يعني: المكونات تكتب `bg-blue-600` (أزرق Tailwind) لكن الـ CSS يحوّلها لـ `--color-primary` (Navy). **نظام هش يعتمد على أن كل كلاس Tailwind مُستخدم له override مقابل.**

---

## F) التعارضات المكتشفة

### F.1 — تعارض لون الذهبي (CRITICAL)
| المصدر | القيمة | الوصف |
|--------|--------|-------|
| `brand-identity.md` | `#B8A76A` | التوثيق الرسمي |
| `qaydalaqar-theme.css` | `#6B5A2E` | الكود الفعلي |
| `theme.tokens.css` dark mode | `rgba(184,167,106,*)` = `#B8A76A` | قيمة مختلفة في الظلام |

### F.2 — تعارض مسميات المتغيرات
| الطبقة | بادئة المتغيرات | مثال |
|--------|----------------|------|
| qaydalaqar-theme.css | `--qa-*` | `--qa-navy`, `--qa-gold` |
| theme.tokens.css | `--color-*` | `--color-primary`, `--color-accent` |
| landing.html | `--` (بدون بادئة) | `--navy`, `--gold` |
| mobile-responsive-fixes.css | `--color-*` + `--space-*` | `--color-primary: #1a1a2e` ⚠️ |

### F.3 — تعارض mobile-responsive-fixes.css
هذا الملف يُعرّف `--color-primary: #1a1a2e` و `--color-accent: #c5a93c` — قيم **مختلفة تماماً** عن كل الملفات الأخرى. لكنه **غير مُحمّل** في التطبيق حالياً.

| المتغير | mobile-responsive | qaydalaqar-theme | الفرق |
|---------|-------------------|------------------|-------|
| primary | `#1a1a2e` | `#0F1C2E` | مختلف |
| accent | `#c5a93c` | `#6B5A2E` | مختلف تماماً |

### F.4 — Tailwind CDN مُحمّل لكن غير مُهيّأ
- Tailwind CDN مُحمّل في `finance-flow.html`
- التهيئة فقط تُضيف الخط: `fontFamily: { sans: ['IBM Plex Sans Arabic'] }`
- لا تهيئة للألوان أو المسافات
- النتيجة: ألوان Tailwind الافتراضية (blue-600, red-700, إلخ) متاحة ومُستخدمة في الكود
- `app.css` يُعالج هذا بـ `!important` overrides لكن **ليس لكل الكلاسات**

### F.5 — تعارض body styling
```
finance-flow.html: <body class="bg-gray-50 text-gray-900 font-sans">
qaydalaqar-theme.css: body { background: var(--qa-page-bg); color: var(--qa-text-primary); }
app.css: body { background: radial-gradient(...); color: var(--color-text-primary); }
```
ثلاث طبقات تُحاول تنسيق الـ body — app.css يفوز بسبب الترتيب (آخر ملف مُحمّل) + خصوصية `html[data-theme]`.

### F.6 — تحميل مزدوج للخط
- `finance-flow.html` سطر 35: `<link>` لـ Google Fonts
- `qaydalaqar-theme.css` سطر 7: `@import url(...)` لنفس Google Fonts
- **النتيجة:** طلب شبكة مزدوج بلا فائدة

---

## G) الحُكم النهائي

### هل يوجد نظام تصميم حقيقي؟
**نعم، يوجد — لكنه مُجزّأ وغير مكتمل التطبيق.**

### التقييم التفصيلي:

| الجانب | الحالة | التفصيل |
|--------|--------|---------|
| **تعريف الألوان** | ⚠️ جزئي | مُعرّفة في 3+ أماكن مع تعارض في الذهبي |
| **التيبوغرافي** | ✅ جيد | مُعرّف بشكل كامل في qaydalaqar-theme — لكن التطبيق يخلط مع Tailwind |
| **المسافات** | ⚠️ جزئي | مُعرّف لكن غير مُطبّق — 3 أنظمة مسافات متوازية |
| **المكونات** | ❌ مُكرّر | 3 أنظمة مكونات متوازية (qa-*, custom classes, Tailwind) |
| **الثيمات** | ✅ جيد | 3 ثيمات مُعرّفة ومُطبّقة (light/dim/dark) عبر `data-theme` |
| **التناسق** | ❌ ضعيف | الأنماط التطبيقية لا تتبع النظام المُعرّف بانتظام |
| **التوثيق** | ⚠️ قديم | `brand-identity.md` يتعارض مع الكود الفعلي (Gold color) |

### الوصف الدقيق:
المشروع يملك **نظام تصميم مُعرّف ومُوثّق** (`qaydalaqar-theme.css` + `theme.tokens.css`) بمعمارية طبقتين ذكية:
- **الطبقة 1** (`--qa-*`): القيم الخام للعلامة التجارية
- **الطبقة 2** (`--color-*`): القيم الدلالية المرتبطة بالثيمات

لكن **التطبيق الفعلي في المكونات** لا يتبع هذا النظام بانتظام. المكونات تخلط بين:
- متغيرات CSS الخاصة ✅
- Tailwind utilities مع overrides بـ `!important` ⚠️
- قيم يدوية (px/rem) ❌

### هل النظام مكسور؟
**لا، ليس مكسوراً — لكنه هش.** التطبيق يعمل بسبب طبقة `!important` overrides في app.css التي تُحوّل ألوان Tailwind لمتغيرات الثيم. لكن أي كلاس Tailwind جديد بدون override مقابل سيكسر تناسق الثيمات.

### الأولوية القصوى للإصلاح (عندما تُقرّر):
1. **حسم لون الذهبي:** `#B8A76A` أم `#6B5A2E`؟ وتحديث التوثيق + الكود
2. **توحيد استخدام المكونات:** اختيار نظام واحد (qa-* أو Tailwind أو custom) والالتزام به
3. **إزالة التحميل المزدوج للخط**
4. **تنظيف mobile-responsive-fixes.css:** إما حذفه أو دمجه
5. **استبدال القيم اليدوية** بمتغيرات المسافات المُعرّفة

---

> هذا التقرير للقراءة فقط — لم يُعدّل أي ملف في المشروع.
