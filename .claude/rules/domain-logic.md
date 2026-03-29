---
paths:
  - "src/domain/**/*.js"
---
# قواعد Domain Logic

- دوال نقية فقط (pure functions) — لا side effects
- لا React imports — لا hooks، لا components، لا JSX
- كل دالة تستقبل parameters وترجع قيمة
- لا استدعاء مباشر لـ Supabase أو localStorage أو fetch
- كل دالة تحتاج JSDoc بالعربي
- حسابات المال بـ هللة (أصغر وحدة) لتجنب أخطاء الفاصلة العشرية
- التقريب لأقرب هللة (0.01 SAR) في النتيجة النهائية فقط
- لا `import React` — لا `useState` — لا `useEffect` — لا DOM
- قابلة للاختبار بدون محاكاة (no mocks needed)

## ما يُسمح
- حسابات مالية (عمولات، ضرائب، أرصدة)
- تصفية وترتيب وتحويل البيانات
- Validation rules
- إنشاء قوالب بيانات

## الملفات الحالية

> **تنبيه**: هذه القائمة قديمة (10 ملفات فقط). الآن يوجد 23 ملف.
> انظر **`domain-logic-v2.md`** للقائمة الكاملة المحدّثة.

- `transactions.js` — المعاملات
- `ledgers.js` — الدفاتر
- `commissions.js` — العمولات
- `calendar.js` — التقويم
- `charts.js` — بيانات الرسوم
- `recurringItems.js` — المعاملات المتكررة
- `reports.js` — التقارير
- `letters.js` + `letterTemplates.js` — الخطابات
- `drafts.js` — المسودات
- `notes.js` — الملاحظات
- *(جديد)* `contracts.js`, `contract-finance.js`, `contract-payments.js`, `contract-alerts.js`
- *(جديد)* `properties.js`, `units.js`, `contacts.js`
- *(جديد)* `dues.js`, `receipt.js`, `ledgerTemplates.js`, `utils.js`
