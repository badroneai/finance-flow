# قيد العقار — Finance Flow (Static)

نسخة Static تعمل على GitHub Pages (بدون باك-إند) لإدارة التدفقات المالية والعمولات بشكل بسيط.

## الروابط (Production)
- App: https://app.qaydalaqar.com/finance-flow.html
- Landing: https://app.qaydalaqar.com/landing.html

## تشغيل محلي (Local)
> مهم: افتح عبر HTTP server (وليس file://) لتجنب مشاكل التحميل.

```bash
python -m http.server 4173
```
ثم افتح:
- http://127.0.0.1:4173/finance-flow.html
- http://127.0.0.1:4173/landing.html

## نظام الثيم (Design Tokens + Themes)
- Tokens + Themes: `assets/css/theme.tokens.css`
- App styles: `assets/css/app.css`
- التفعيل في HTML:
  - `finance-flow.html` يربط الملفين داخل `<head>` بعد `assets/qaydalaqar-theme.css`.
  - الثيم يُطبّق عبر: `document.documentElement.dataset.theme = "light|dim|dark"`
  - يتم حفظ اختيار المستخدم في LocalStorage key: `ui_theme`

## Docs
- Theme system: `docs/theme-system.md`
- Acceptance tests: `docs/acceptance-tests.md`
- Changelog: `docs/CHANGELOG.md`
