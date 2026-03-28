# SPR-007 — تقرير استبدال الألوان الثابتة بـ CSS Variables

**التاريخ:** 2026-03-18
**المهمة:** استبدال جميع ألوان Tailwind الثابتة (bg-white, text-gray-*, border-gray-*) بـ CSS variables
**النتيجة:** ✅ نجاح — 988 حالة مُستبدلة من أصل 990

---

## ١. ملخص التغييرات

| المقياس | القيمة |
|---------|--------|
| إجمالي الحالات قبل التعديل | 990 |
| الحالات المُستبدلة | 988 |
| الحالات المتبقية (مقصودة) | 2 (نقاط دلالية `bg-gray-400` لمؤشرات الخطورة) |
| الملفات المُعدّلة | 28 ملف (27 JSX/JS + 1 CSS) |
| متغيرات CSS جديدة مُضافة | 2 (`--color-surface-hover`, `--color-input-bg`) |
| نتيجة البناء | ✅ نجاح |
| نتيجة الاختبارات | ✅ 5/5 نجاح |

---

## ٢. الحالات المُستبدلة لكل ملف

| الملف | الحالات المُستبدلة | متبقي |
|-------|-------------------|-------|
| src/tabs/LedgerRecurringTab.jsx | 313 | 0 |
| src/tabs/LedgerInboxTab.jsx | 72 | 0 |
| src/tabs/LedgerReportsTab.jsx | 59 | 0 |
| src/pages/LedgersPage.jsx | 53 | 0 |
| src/pages/TransactionsPage.jsx | 52 | 0 |
| src/ui/reports/MonthlyReportView.jsx | 52 | 0 |
| src/tabs/LedgerForecastTab.jsx | 48 | 0 |
| src/tabs/LedgerPerformanceTab.jsx | 48 | 0 |
| src/pages/SettingsPage.jsx | 45 | 0 |
| src/pages/InboxPage.jsx | 30 | 1 (**مقصود**) |
| src/ui/alerts/AlertCenter.jsx | 20 | 0 |
| src/ui/inbox/QuickPaymentModal.jsx | 19 | 0 |
| src/ui/ledger/LedgerCompare.jsx | 21 | 0 |
| src/ui/ErrorBoundaries.jsx | 18 | 0 |
| src/ui/pulse/PulseAlerts.jsx | 17 | 1 (**مقصود**) |
| src/ui/Sidebar.jsx | 16 | 0 |
| src/pages/PulsePage.jsx | 16 | 0 |
| src/ui/pulse/PulseHeroCard.jsx | 15 | 0 |
| src/ui/pulse/UpcomingDues.jsx | 15 | 0 |
| src/ui/pulse/PulseHeader.jsx | 12 | 0 |
| src/ui/Modals.jsx | 10 | 0 |
| src/ui/ui-common.jsx | 10 | 0 |
| src/ui/pulse/WeekForecast.jsx | 8 | 0 |
| src/ui/ledger/LedgerHeader.jsx | 8 | 0 |
| src/App.jsx | 6 | 0 |
| src/ui/pulse/PulseFooter.jsx | 4 | 0 |
| src/contexts/ToastContext.jsx | 1 | 0 |
| src/main.jsx (inline styles) | 6 | 0 |
| **المجموع** | **988** | **2** |

---

## ٣. متغيرات CSS جديدة مُضافة

أُضيف متغيران جديدان إلى `assets/css/theme.tokens.css` في كل المظاهر الأربعة:

| المتغير | الوظيفة | Light | Dim | Dark |
|---------|---------|-------|-----|------|
| `--color-surface-hover` | خلفية عند hover على بطاقات/صفوف | `#f1f5f9` | `#112a45` | `#0e2035` |
| `--color-input-bg` | خلفية حقول الإدخال | `#ffffff` | `#0c1d33` | `#0a1627` |

---

## ٤. جدول التحويل المُستخدم

| Tailwind الثابت | البديل |
|-----------------|--------|
| `bg-white` | `bg-[var(--color-surface)]` |
| `bg-gray-50` | `bg-[var(--color-bg)]` |
| `bg-gray-100` | `bg-[var(--color-bg)]` |
| `bg-gray-200` | `bg-[var(--color-bg)]` |
| `bg-gray-800` | `bg-[var(--color-surface)]` |
| `bg-gray-900` | `bg-[var(--color-surface)]` |
| `text-gray-900` | `text-[var(--color-text)]` |
| `text-gray-800` | `text-[var(--color-text)]` |
| `text-gray-700` | `text-[var(--color-text)]` |
| `text-gray-600` | `text-[var(--color-muted)]` |
| `text-gray-500` | `text-[var(--color-muted)]` |
| `text-gray-400` | `text-[var(--color-muted)]` |
| `text-gray-300` | `text-[var(--color-muted)]` |
| `text-gray-100` | `text-[var(--color-border)]` (SVG track) |
| `border-gray-*` | `border-[var(--color-border)]` |
| `divide-gray-*` | `divide-[var(--color-border)]` |
| `ring-gray-*` | `ring-[var(--color-border)]` |
| `placeholder-gray-*` | `placeholder-[var(--color-muted)]` |
| `hover:bg-gray-*` | `hover:bg-[var(--color-bg)]` أو `hover:bg-[var(--color-surface-hover)]` |

---

## ٥. الحالات المتبقية ولماذا

| الملف | الكود | السبب |
|-------|-------|-------|
| `src/pages/InboxPage.jsx:57` | `return 'bg-gray-400'` | نقطة مؤشر خطورة (severity dot) — لون دلالي مثل red/green |
| `src/ui/pulse/PulseAlerts.jsx:116` | `'bg-gray-400'` (fallback) | نقطة مؤشر خطورة افتراضية — لون دلالي |

---

## ٦. الألوان الدلالية (لم تُمس)

تم التأكد من عدم المساس بأي لون دلالي:
- ✅ `bg-red-*`, `text-red-*` — أخطاء/حذف
- ✅ `bg-green-*`, `text-green-*` — نجاح/دخل
- ✅ `bg-blue-*`, `text-blue-*` — معلومات/أساسي
- ✅ `bg-yellow-*`, `text-yellow-*` — تحذيرات
- ✅ `bg-amber-*`, `bg-emerald-*`, `bg-orange-*` — ألوان فرعية

---

## ٧. حجم الحزمة قبل وبعد

| الملف | قبل | بعد | الفرق |
|-------|-----|-----|-------|
| app.js | 580,074 | 582,865 | +2,791 (+0.48%) |
| LedgersPage.js | 140,045 | 147,684 | +7,639 (+5.45%) |
| MonthlyReportPage.js | 17,979 | 18,604 | +625 (+3.48%) |
| SettingsPage.js | 14,482 | 15,059 | +577 (+3.98%) |
| TransactionsPage.js | 13,751 | 14,390 | +639 (+4.65%) |
| Modals.js | 3,210 | 3,330 | +120 (+3.74%) |
| AuthPage.js | 8,444 | 8,444 | 0 (لم يتغير) |

**ملاحظة:** الزيادة متوقعة لأن `bg-[var(--color-surface)]` أطول من `bg-white`. الزيادة الإجمالية ~12KB غير مضغوطة (~3-4KB مضغوطة gzip) — مقبولة تماماً مقابل دعم 4 مظاهر.

---

## ٨. ملف الأنماط المحدّث

`assets/css/theme.tokens.css` — أُضيفت المتغيرات الجديدة في:
- `:root` (القاعدة الافتراضية)
- `:root[data-theme="light"]`
- `:root[data-theme="dim"]`
- `:root[data-theme="dark"]`

تم نسخ الملف إلى `public/assets/css/theme.tokens.css`.

---

## ٩. نتائج التحقق

- ✅ `npm run build` — نجاح (2.05 ثانية)
- ✅ `npm test` — 5/5 اختبارات نجحت
- ✅ grep النهائي: 0 حالات hardcoded gray متبقية (باستثناء 2 دلالية مقصودة)
- ✅ الألوان الدلالية لم تتأثر
- ✅ CSS variables مُستخدمة في كل الملفات الـ 27

---

*نهاية التقرير — SPR-007*
