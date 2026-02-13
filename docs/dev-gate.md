# Dev Gate — قيد العقار (Finance Flow)

هدفنا: أي تغيير لازم يمر اختبارات ثابتة قبل الدمج.

## Gate Checklist (لازم PASS قبل طلب الدمج)
1) Console: 0 errors
2) Network: 0 404
3) CRUD + Refresh:
   - إضافة حركة مالية
   - تعديل حركة
   - حذف حركة
   - Refresh والتأكد أنها ثابتة
4) Backup/Restore:
   - Export JSON
   - Clear (إن كان موجود)
   - Restore ثم Reload
   - التحقق أن البيانات رجعت
5) UI Settings Regression:
   - Theme: light/dim/dark/system يعمل + يثبت بعد Refresh
   - Numerals: ar/en يعمل + يثبت بعد Refresh
   - Date header toggle يعمل + يثبت بعد Refresh
6) Mobile sanity:
   - فتح القائمة الجانبية
   - التنقل بين الصفحات الأساسية بدون كسر layout

## مخرجات كل PR
- رابط PR
- رابط commit
- سطر واحد: Gate = PASS + ما الذي تم اختباره باختصار
