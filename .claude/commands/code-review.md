---
description: مراجعة شاملة للكود — جودة، أمن، أداء، RTL
---

# /project:code-review — مراجعة الكود

اقرأ الـ diff وراجع الجودة والأمن والأداء.

إذا حُدد فرع في $ARGUMENTS، استخدمه بدل main.

## الخطوات

1. **حدد نطاق المراجعة**:
```
!`git diff --name-only ${ARGUMENTS:-main}...HEAD`
!`git diff ${ARGUMENTS:-main}...HEAD`
```

2. **راجع كل ملف متغير** حسب هذه المعايير:

### الجودة
- أسماء واضحة ومتسقة
- لا كود مكرر (DRY)
- الدوال قصيرة ومركزة
- تعليقات بالعربي كافية
- Error handling مناسب

### الأمن
- لا مفاتيح مكشوفة (API keys, tokens)
- لا `eval()` أو `dangerouslySetInnerHTML`
- المدخلات معقّمة

### الأداء
- لا re-renders غير ضرورية
- useCallback/useMemo عند الحاجة
- لا عمليات ثقيلة في render

### RTL
- CSS logical properties (margin-inline-start بدل margin-left)
- text-align: start بدل right/left
- أيقونات اتجاهية منعكسة

## شكل الإخراج
```
📝 تقرير مراجعة الكود
━━━━━━━━━━━━━━━━━━━━

الملفات المراجعة: [عدد]
✅ نجح: [عدد]  ⚠️ تحذيرات: [عدد]  ❌ مشاكل: [عدد]

[تفاصيل كل مشكلة مع الملف والسطر والحل المقترح]
```
