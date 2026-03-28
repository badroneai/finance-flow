---
paths:
  - "src/core/**/*.js"
---
# قواعد Core Services

- كل محرك/خدمة يحتاج ملف اختبار مقابل في `src/core/__tests__/`
- لا تعدّل `supabase.js` أو `storage-facade.js` بدون موافقة صريحة
- Error handling إلزامي — كل دالة تحتاج try/catch، لا throw بدون catch
- استخدم `storage-facade.js` للتخزين، لا `localStorage` مباشرة
- Supabase calls فقط في `supabase-store.js` و `storage-facade.js`
- لا JSX — لا DOM manipulation
- تنسيق الأخطاء: `console.warn('[قيد العقار] ⚠️ [الوصف]:', err.message)`

## الملفات الحساسة (تحتاج مراجعة إضافية)
- `supabase.js` — عميل Supabase المركزي
- `storage-facade.js` — الواجهة الموحدة (Supabase + localStorage fallback)
- `theme-ui.js` — إعدادات الثيم، تأثر على كل التطبيق

## المحركات الحالية
- `alert-engine.js` — التنبيهات
- `pulse-engine.js` — لوحة النبض
- `inbox-engine.js` — صندوق الوارد
- `ledger-analytics.js` — تحليلات الدفاتر
- `monthly-report-generator.js` — التقارير الشهرية
- `pdf-service.js` — تصدير PDF
- `saudi-pricing.js` — التسعير السعودي
