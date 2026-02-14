# Runbook — Safe Release (GitHub Pages)

هذا الدليل يقلل مشاكل “الكاش” والالتباس بعد النشر.

## 1) قبل الدمج (محلي)
- `npm run build` لازم ينجح.
- تأكد Gate smoke (انظر: `docs/gate-smoke.md`).

## 2) بعد الدمج (GitHub Actions)
- تأكد Pages workflow run = SUCCESS.
- افتح التطبيق بالرابط الأساسي.

## 3) كسر الكاش بشكل صحيح
إذا ظهر للمستخدم خطأ قديم بعد إصلاح (bundle قديم):

### الخيار A — Query param
افتح:
- `finance-flow.html?fresh=<رقم/تاريخ>`
مثال:
- `.../finance-flow.html?fresh=84&ts=999`

### الخيار B — Incognito
- افتح نفس الرابط في نافذة Incognito.

### الخيار C — Clear site data + unregister SW
Chrome DevTools → Application:
- Storage → **Clear site data**
- Service Workers → **Unregister** (إذا موجود)
ثم Reload.

## 4) تشخيص سريع (عند الشاشة البيضاء)
- Console: انسخ أول سطر error + اسم ملف `app-*.js`
- تأكد أن اسم ملف `app-*.js` تغيّر بعد الإصلاح (hash جديد).

## 5) قاعدة ذهبية
إذا بقي اسم ملف `app-*.js` نفسه بعد الدمج → أنت على نسخة قديمة (كاش).
