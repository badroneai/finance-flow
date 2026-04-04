# Frontend Visual Smoke

هدف هذا الملف هو منع كسر الصفحات الأساسية بصرياً قبل أي polish جديد، بدون إدخال نظام ثقيل.

## متى نستخدمه

- قبل أي merge يغيّر `assets/css/app.css`
- قبل أي merge يغيّر `src/App.jsx`
- قبل أي merge يغيّر `src/ui/Sidebar.jsx`
- قبل أي merge يغيّر `src/ui/Topbar.jsx`
- قبل أي merge يغيّر `src/ui/BottomNav.jsx`
- قبل أي merge يغيّر shared primitives مثل `panel-card`, `summary-card`, `page-shell`, `control-toolbar`

## الخطوات السريعة

1. شغّل `npm run build`
2. شغّل `npm run test`
3. شغّل `npm run dev`
4. راجع المسارات التالية على Desktop وMobile width

## المسارات الأساسية

- `#/` Dashboard
- `#/properties`
- `#/contracts`
- `#/transactions`
- `#/commissions`
- `#/inbox`
- `#/ledgers`

## ما الذي نتحقق منه

- الـ sidebar ثابت ولا يضغط المحتوى أو يسبب overflow
- الـ topbar sticky بدون قفزات spacing
- الـ bottom nav لا يغطي المحتوى على الموبايل
- `page-shell` يعطي padding ثابت بين الصفحات
- `panel-card` و `summary-card` متناسقة في الحدود والـ radius والـ shadow
- toolbars والفلاتر لا تنهار بشكل غير متوقع على الموبايل
- الجداول الأساسية ما زالت مقروءة ولا يوجد قص أفقي غير مقصود
- لا يوجد `text-left` أو `text-right` جديد داخل `src/ui/` إلا لسبب موثق

## قاعدة اعتماد بسيطة

- إذا تغيّر shared CSS أو shared shell:
- لا نعتبر التغيير آمناً حتى تتم مراجعة المسارات الأساسية السبعة
- إذا ظهر خلل في صفحتين أو أكثر، نوقف polish ونعود أولاً إلى shared layer
