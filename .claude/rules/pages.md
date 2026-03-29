---
paths:
  - "src/pages/**/*.jsx"
  - "src/tabs/**/*.jsx"
---
# قواعد الصفحات والتبويبات

> آخر تحديث: 2026-03-29

- كل صفحة ثقيلة lazy loaded باستخدام `React.lazy()` + `Suspense`
- كل صفحة ملفوفة بـ `PageLoadErrorBoundary`
- لا منطق أعمال في الصفحة — استدعِ من `domain/` أو `contexts/`
- لا `localStorage` مباشر — استخدم `storage-facade`
- لا API calls مباشرة — استخدم `core/`
- التعليقات بالعربي، أسماء المتغيرات بالإنجليزي

## النمط المعتمد
```jsx
// صفحة [الاسم] — [الوصف بالعربي]
import React, { useState, useEffect } from 'react';

export default function FeaturePage() {
  // state → effects → handlers → render
}
```

## الصفحات (15 صفحة)

### الصفحات الرئيسية
| الصفحة | المسار | الوصف |
|--------|--------|-------|
| `AuthPage.jsx` | `/auth` | تسجيل الدخول/إنشاء حساب — Supabase Auth — الصفحة الوحيدة بدون sidebar |
| `DashboardPage.jsx` | `/` | لوحة التحكم — KPIs، ملخص العقارات/العملاء/العقود، المستحقات التشغيلية |
| `PulsePage.jsx` | `/pulse` | النبض المالي — بطاقات الصحة، التنبيهات، التوقعات الأسبوعية، تحديث كل 5 دقائق |
| `SettingsPage.jsx` | `/settings` | الإعدادات — تبديل الثيمات، الأرقام، إعدادات المكتب، تسجيل الخروج |

### العقارات
| الصفحة | المسار | الوصف |
|--------|--------|-------|
| `PropertiesPage.jsx` | `/properties` | قائمة العقارات — CRUD + فلاتر (حالة/نوع) + بطاقات ملخص |
| `PropertyDetailPage.jsx` | `/properties/:id` | تفاصيل عقار — إدارة الوحدات (إضافة/تعديل/حذف) + العقود المرتبطة |

### جهات الاتصال
| الصفحة | المسار | الوصف |
|--------|--------|-------|
| `ContactsPage.jsx` | `/contacts` | قائمة العملاء — CRUD (مستأجر/مالك/مشتري) + فلاتر حسب النوع |
| `ContactDetailPage.jsx` | `/contacts/:id` | تفاصيل عميل — العقارات المملوكة + العقود المرتبطة |

### العقود
| الصفحة | المسار | الوصف |
|--------|--------|-------|
| `ContractsPage.jsx` | `/contracts` | قائمة العقود — CRUD + ربط عقار بعميل + فلاتر حسب الحالة |
| `ContractDetailPage.jsx` | `/contracts/:id` | تفاصيل عقد — الجدول المالي + تسجيل الدفعات + الإيصالات |

### المالية والتقارير
| الصفحة | المسار | الوصف |
|--------|--------|-------|
| `LedgersPage.jsx` | `/ledgers` | الدفاتر — واجهة متعددة التبويبات (5 تبويبات) + مقارنة الدفاتر |
| `TransactionsPage.jsx` | `/transactions` | الحركات — CRUD (إيراد/مصروف) + فلاتر + تصدير CSV |
| `CommissionsPage.jsx` | `/commissions` | العمولات — CRUD + تتبع حالة الدفع + تصدير PDF/CSV |
| `InboxPage.jsx` | `/inbox` | المستحقات — محرك calculateInbox + تأجيل + سحب للتحديث |
| `MonthlyReportPage.jsx` | `/report` | التقارير الشهرية — عرض مفصل بالرسوم البيانية حسب الدفتر/الشهر/السنة |

## تبويبات الدفاتر (5 تبويبات في `src/tabs/`)

تظهر كلها داخل `LedgersPage.jsx` عبر `LedgerTabsShell`:

| التبويب | الوصف |
|---------|-------|
| `LedgerRecurringTab.jsx` | البنود المتكررة — إضافة/تعديل + قائمة الالتزامات + ملخص شهري |
| `LedgerPerformanceTab.jsx` | الإيرادات والمصروفات — أوضاع الدخل (ثابت/ذروة/قاعدة) + جدول 4 أشهر |
| `LedgerReportsTab.jsx` | التقارير — حساب الربح/الخسارة + أعلى التصنيفات + تصدير CSV/PDF |
| `LedgerInboxTab.jsx` | صندوق الوارد — خطة النقد (اليوم/7 أيام/30 يوم) + فلترة + بنود متكررة |
| `LedgerForecastTab.jsx` | التوقعات (6 أشهر) — معدل التشغيل + فجوة النقد + شرائح السيناريوهات |

## ملاحظات معمارية

- كل المسارات معرّفة في `App.jsx` (سطر ~346-466)
- التنقل في `src/config/navigation.js` — يربط ID الصفحة بالتسمية العربية والأيقونة
- `ProtectedRoute` يلف كل المسارات ما عدا `/auth`
- Route params: `:id` في صفحات التفاصيل (property/contact/contract)
- Query params: `ledgerId`, `month`, `year` في التقارير الشهرية
