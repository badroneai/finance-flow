# Smoke Gate — Finance Flow (Fast)

> هدفها: تأكيد سريع (60–120 ثانية) أن الإصدار سليم قبل/بعد الدمج.
> 
> **مهم:** Console = 0 errors، Network = 0 same-origin 404.

## 0) Open
- افتح: `https://app.qaydalaqar.com/finance-flow.html?fresh=<any>`
- افتح DevTools:
  - Console: تأكد 0 errors
  - Network: تأكد 0 same-origin 404

## 1) Navigation (2 clicks)
- Sidebar: افتح/اغلق القائمة.
- تنقل: الرئيسية → الحركات المالية → الدفاتر → الإعدادات.

## 2) Ledgers (sanity)
- الدفاتر: أنشئ دفتر جديد.
- عدّل الاسم.
- عيّنه كنشط.
- Refresh: تأكد الدفتر النشط ثابت.

## 3) Recurring (seed + pay-now)
- الدفاتر → الالتزامات المتكررة:
  - أضف نموذج الالتزامات (إن كان متاحًا)
  - اختر بند مسعّر واضغط "سجّل كدفعة الآن" → "تسجيل"

## 4) Inbox persist
- من Inbox (داخل الالتزامات): اضغط "✅ مدفوع" أو "⏭️ تجاوزته" على بند.
- Refresh: تأكد الحالة ثابتة.

## 5) CSV export (2 exports)
- الحركات المالية → "CSV": تأكد تنزيل ملف غير فارغ.
- (إن وُجد Export آخر في التقارير/مكان آخر) صدّر CSV ثاني.

## 6) Backup/Restore (schema=1)
- الإعدادات: تنزيل نسخة احتياطية JSON.
- ثم استعادة نفس الملف.
- Refresh: تأكد البيانات رجعت.

## 7) Mobile sanity
- Resize ~390x844:
  - Sidebar toggle يعمل
  - Tabs scroll بدون انهيار/overflow مزعج

---

## PASS criteria
- Console: 0 errors
- Network: 0 same-origin 404
- خطوات 1→7 كلها ناجحة
