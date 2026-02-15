# النبض المالي والمستحقات — دليل المطور

ملخص تقني لميزات النبض المالي وصندوق الوارد والتنقل المرتبط بهما.

---

## المسارات والملفات

| الغرض | الملف |
|--------|--------|
| محرك النبض (حساب الأرقام والتنبيهات) | `src/core/pulse-engine.js` |
| صفحة النبض المالي | `src/pages/PulsePage.jsx` |
| صفحة المستحقات | `src/pages/InboxPage.jsx` |
| شريط التنبيهات الاستباقية | `src/ui/PulseAlertsBanner.jsx` |
| تنقل التطبيق (5 عناصر) | `src/constants/index.js` → `NAV_ITEMS` |
| الشريط الجانبي | `src/ui/Sidebar.jsx` |
| التوجيه والصفحات | `src/App.jsx` |

---

## محرك النبض (`pulse-engine.js`)

- **`calculatePulse(ledgerId?)`**  
  يحسب النبض للدفتر المحدد، أو للدفتر النشط إن لم يُمرَّر `ledgerId`. إن لم يوجد دفتر نشط يُرجع كائن نبض فارغ (`healthStatus: 'unknown'`).

- **الحقول المُرجَعة (أهمها):**  
  `todayIncome`, `weekExpenses`, `currentBalance`, `balanceTrend`, `healthScore`, `healthStatus`, `healthColor`, `alerts`, `weekForecast`, `upcomingDues`, `ledgerSummary`, `calculatedAt`, `dataFreshness`.

- **الاعتماديات:**  
  `ledger-store` (الدفتر النشط والالتزامات)، `dataStore` (الحركات)، `ledger-inbox`, `ledger-cash-plan`, `ledger-intelligence-v1`, `ledger-compliance`, `ledger-reports`.

- **فلترة الحركات:**  
  دالة محلية تفلتر حسب `ledgerId` أو `meta.ledgerId`.

---

## صفحة النبض (`PulsePage.jsx`)

- تستدعي `calculatePulse()` عند التحميل وعند عودة نافذة المتصفح (حدث `focus`).
- تعرض: بطاقات (دخل اليوم، مصروف الأسبوع، الرصيد + اتجاه)، صحة الدفتر، تنبيهات، المستحقات القريبة، نظرة الأسبوع، ملخص الدفتر مع رابط "عرض الحركات".
- زر "تحديث" لتحديث يدوي، و"إدارة الدفتر" للانتقال إلى الدفاتر.
- منطقة المحتوى الرئيسية: `aria-live="polite"` و`role="status"` و`aria-label="ملخص النبض المالي"` لدعم قارئات الشاشة.

---

## صفحة المستحقات (`InboxPage.jsx`)

- تعرض **كل** الالتزامات الدورية للدفتر النشط (مرتبة حسب تاريخ الاستحقاق)، وليس فقط عناصر "صندوق الوارد" المُصفاة.
- مصدر البيانات: `getRecurringItems()` مُصفى حسب `ledgerId`، مع حساب `reason` (متأخر، مستحق خلال 7/14 يوم، قادم لاحقاً).
- تتحدث عند حدث `ledger:activeChanged` وعند حدث `focus`.
- روابط: "الحركات"، "إدارة الالتزامات في الدفاتر" (مع `sessionStorage` لفتح الدفاتر على تبويب الالتزامات الدورية).

---

## شريط التنبيهات (`PulseAlertsBanner.jsx`)

- يظهر في كل الصفحات **ما عدا** صفحة المستحقات (`page === 'inbox'`).
- يعرض تنبيهات من `calculatePulse().alerts` (متأخر، قادم خلال أسبوع) وزر "عرض المستحقات".

---

## التنقل وفتح التبويبات

- **الثوابت:** `NAV_ITEMS` في `constants/index.js`: النبض المالي، المستحقات، الدفاتر، الحركات، الإعدادات.
- **فتح الدفاتر على تبويب الالتزامات:** قبل `setPage('ledgers')` يُخزَّن `sessionStorage.setItem('ff_ledgers_open_tab', 'recurring')`؛ `LedgersPage` يقرأه عند التحميل ويُظهِر التبويب المناسب.

---

## التحميل الكسول وحد الأخطاء

- **Lazy:** `LedgersPage`, `TransactionsPage`, `SettingsPage` تُحمَّل عند الحاجة؛ النبض والمستحقات في الحزمة الأولى.
- **PageLoadErrorBoundary:** يلف المحتوى المعروض؛ عند فشل تحميل أو عرض صفحة مؤجلة يُعرض رسالة مع "العودة للنبض المالي" و"إعادة تحميل الصفحة". استخدام `key={page}` في App يعيد إنشاء الحد عند تغيير الصفحة.

---

## الاختبارات

- `src/core/__tests__/pulse-engine.test.js`: اختبار `calculatePulse()` بدون دفتر (شكل النبض الفارغ).
- `src/utils/__tests__/format.test.js`: اختبار `formatNumber` و `formatCurrency`.

تشغيل الاختبارات: `npm test`.
