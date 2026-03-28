---
description: فحص سريع لصحة المشروع — git، اختبارات، بناء، نظافة الكود
---

# /project:quick-check — فحص سريع

## التعليمات
نفذ كل الفحوصات بالترتيب وأبلغ بالنتائج.

## الخطوات

```
!`git status`
!`npm run test 2>&1 | tail -3`
!`npm run build 2>&1 | tail -3`
!`grep -rn "console\.log" src/ --include="*.js" --include="*.jsx" | grep -v "__tests__" | grep -v "// dev" | wc -l`
!`grep -rn "TODO\|FIXME" src/ --include="*.js" --include="*.jsx" | wc -l`
!`find src/ -name "*.jsx" -o -name "*.js" | xargs wc -l | sort -rn | head -5`
```

## شكل الإخراج
```
⚡ فحص سريع — قيد العقار
━━━━━━━━━━━━━━━━━━━━━━━

Git:          [نظيف ✅ / تغييرات ⚠️]
الاختبارات:   [نجحت ✅ / فشلت ❌] ([عدد])
البناء:       [نجح ✅ / فشل ❌]
Console logs: [عدد]
TODOs:        [عدد]
أكبر ملف:    [الاسم] ([عدد] سطر)

الصحة العامة: [🟢 ممتازة / 🟡 جيدة / 🔴 تحتاج انتباه]
```
