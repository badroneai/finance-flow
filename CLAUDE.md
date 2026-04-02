# قيد العقار (Finance Flow)

نظام إدارة تدفقات مالية عقارية للمكاتب الصغيرة والمستثمرين الأفراد في السعودية.

## الأوامر

```bash
npm run dev      # تشغيل بيئة التطوير (Vite)
npm run build    # بناء للإنتاج
npm run preview  # معاينة البناء محلياً
npm run test     # تشغيل الاختبارات (vitest run)
```

## الستاك التقني

| التقنية | الإصدار | الاستخدام |
|---------|---------|-----------|
| React | ^19.2.4 | واجهة المستخدم |
| Vite | ^7.3.1 | البناء والتطوير |
| React Router DOM | ^7.13.0 | التنقل بين الصفحات |
| @supabase/supabase-js | ^2.99.2 | المصادقة وقاعدة البيانات |
| jsPDF | ^4.2.1 | تصدير PDF |
| html2canvas | ^1.4.1 | تحويل HTML لصور |
| Vitest | ^4.0.18 | الاختبارات |

## قواعد الستاك الثابتة

- **لا Tailwind** — نستخدم CSS Variables ونظام تنسيق مخصص
- **لا Redux/Zustand** — نستخدم React Context فقط
- **لا frameworks إضافية** بدون مبرر مكتوب (ADR)
- **Supabase أولاً، localStorage fallback** — التطبيق يعمل offline

## هيكل src/

```
src/
├── App.jsx              # المكون الرئيسي + المسارات
├── main.jsx             # نقطة الدخول
├── config/              # إعدادات التنقل
├── constants/           # الثوابت
├── contexts/            # React Contexts (Auth, Data, Demo, Toast, Unsaved)
├── core/                # المحركات والخدمات (مع __tests__/)
├── domain/              # منطق الأعمال النقي (بدون React!)
├── pages/               # الصفحات (lazy loaded)
├── tabs/                # تبويبات داخل الصفحات
├── ui/                  # مكونات الواجهة (Sidebar, BottomNav, Topbar...)
└── utils/               # أدوات مساعدة (تنسيق، تصدير)
```

## قواعد التسمية

- **ملفات**: kebab-case (`alert-engine.js`)
- **مكونات React**: PascalCase (`PulsePage.jsx`)
- **دوال**: camelCase (`formatCurrency()`)
- **ثوابت**: UPPER_SNAKE_CASE (`UI_ONBOARDING_SEEN_KEY`)
- **الكود**: بالإنجليزي — **التعليقات**: بالعربي
- **التنسيق**: 2 spaces، single quotes، semicolons

## مبدأ العمل

> **اسأل أولاً، اعرض خيارات، انتظر الموافقة** — خصوصاً عند:
> تعديل ملفات core/ الحساسة، إضافة تبعيات، تغيير هيكل المشروع، أو تعديل قاعدة البيانات.

ما يُسمح بدون سؤال: قراءة الكود، تحليل المشاكل، كتابة اختبارات، إصلاح typos.

## السياق السعودي

- **العملة**: ريال سعودي (ر.س / SAR) — دقة هللتان (0.01)
- **الاتجاه**: RTL (من اليمين لليسار)
- **الضريبة**: 15% قيمة مضافة (ZATCA)
- **الرقم الضريبي**: 15 رقم، يبدأ وينتهي بـ 3
- **حماية البيانات**: PDPL — موافقة صريحة، حق الحذف والتصدير

## متغيرات البيئة

```
VITE_SUPABASE_URL=https://[project].supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

إذا كانت القيم فارغة أو وهمية، التطبيق يعمل بوضع localStorage فقط.

## بوابات الجودة

- **Pre-commit**: Husky + lint-staged — يمنع commit كود غير منسق أو فيه أخطاء ESLint
- **CI**: GitHub Actions (`ci.yml`) — يشغّل lint + test + build على كل PR
- **القواعد الهندسية**: راجع `.claude/rules/engineering-standards.md` — حدود الحجم والتعقيد وقواعد الاستخراج

## تذكيرات

- لا مفاتيح أو أسرار في الكود — استخدم `import.meta.env.VITE_*`
- لا تكسر شي شغّال — backward compatibility أولاً
- الاختبارات إلزامية لـ `core/` و `domain/`
- RLS إلزامي على كل جدول Supabase
- نقطة الدخول للبناء: `finance-flow.html` (مو index.html)
