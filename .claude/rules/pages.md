---
paths:
  - "src/pages/**/*.jsx"
---
# قواعد الصفحات

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

## الصفحات الحالية
- `PulsePage.jsx` — لوحة النبض (الرئيسية)
- `InboxPage.jsx` — صندوق الوارد
- `LedgersPage.jsx` — الدفاتر (lazy)
- `TransactionsPage.jsx` — المعاملات (lazy)
- `CommissionsPage.jsx` — العمولات (lazy)
- `MonthlyReportPage.jsx` — التقرير الشهري (lazy)
- `SettingsPage.jsx` — الإعدادات (lazy)
- `AuthPage.jsx` — تسجيل الدخول (lazy)
