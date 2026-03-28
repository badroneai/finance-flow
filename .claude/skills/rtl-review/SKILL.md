---
name: rtl-review
description: >
  يراجع مكونات الواجهة للتأكد من دعم RTL العربي.
  يُستخدم عند إنشاء أو تعديل مكونات UI أو صفحات.
allowed-tools: Read, Grep, Glob
---

عند مراجعة مكون:

1. **CSS Logical Properties**: تأكد من استخدام:
   - `margin-inline-start` بدل `margin-left`
   - `padding-inline-end` بدل `padding-right`
   - `text-align: start` بدل `text-align: right` أو `left`
   - `inset-inline-start` بدل `left`

2. **محاذاة النصوص**: تأكد من `dir="rtl"` أو وراثة من الـ root

3. **الأيقونات الاتجاهية**: arrows, chevrons, back buttons يجب أن تنعكس

4. **Flexbox/Grid**: لا `direction: ltr` ثابت — اترك الاتجاه يرث من RTL

5. **الأرقام**: عرض عربي (0-9) أو هندي (٠-٩) حسب إعداد المستخدم

6. **العملة**: `ر.س` يظهر صح بجانب الرقم

7. **CSS Variables**: لا ألوان hex/rgb مباشرة — استخدم `var(--color-name)`

ابحث عن المخالفات:
```
!`grep -rn "margin-left\|margin-right\|padding-left\|padding-right\|text-align:\s*left\|text-align:\s*right" src/ui/ --include="*.jsx" --include="*.css"`
```

أبلغ بالنتائج:
✅ متوافق RTL / ⚠️ يحتاج تعديل — مع ذكر الملف والسطر والبديل الصحيح.
