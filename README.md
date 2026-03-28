# قيد العقار — Finance Flow

نظام إدارة التدفقات المالية العقارية للمكاتب الصغيرة والمستثمرين الأفراد في السعودية.
يتيح تتبع العقود، الإيرادات، المصروفات، العمولات، والتنبيهات المالية بواجهة عربية بالكامل (RTL).

## المتطلبات

- Node.js 22 أو أحدث
- npm

## التشغيل

```bash
rm -f package-lock.json   # مهم: يضمن تثبيت المكتبات المناسبة لنظامك (macOS/Linux)
npm install
npm run dev
```

> إذا ظهر خطأ يتعلق بـ `@rollup/rollup-*`، احذف `package-lock.json` و `node_modules` ثم أعد `npm install`.

ثم افتح الرابط الذي يظهر في Terminal (عادةً `http://localhost:5173/finance-flow.html`).

### أوامر إضافية

```bash
npm run build     # بناء نسخة الإنتاج
npm run preview   # معاينة البناء محلياً
npm run test      # تشغيل الاختبارات (Vitest)
```

## وضعيّ التشغيل

### وضع Demo (بدون backend)

يعمل التطبيق تلقائياً بوضع localStorage إذا لم تكن مفاتيح Supabase موجودة.
كل البيانات تُحفظ محلياً في المتصفح — مناسب للتجربة والعرض.

### وضع Supabase (مع backend)

أنشئ ملف `.env.local` في جذر المشروع (أو `.env` — Vite يقرأ الاثنين):

```env
VITE_SUPABASE_URL=https://[project-id].supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

> ملاحظة: `.env.local` مُفضّل لأنه مُستثنى من Git تلقائياً.

عند وجود القيم، يتصل التطبيق بـ Supabase للمصادقة وتخزين البيانات سحابياً.

## هيكل المشروع

```
src/
├── App.jsx              # المكون الرئيسي والمسارات
├── main.jsx             # نقطة الدخول
├── config/              # إعدادات التنقل
├── constants/           # الثوابت
├── contexts/            # React Contexts (Auth, Data, Demo, Toast, Unsaved)
├── core/                # المحركات والخدمات الأساسية
├── domain/              # منطق الأعمال النقي (بدون React)
├── pages/               # الصفحات (lazy loaded)
├── tabs/                # تبويبات داخل الصفحات
├── ui/                  # مكونات الواجهة المشتركة
└── utils/               # أدوات مساعدة (تنسيق، تصدير)
```

## Tech Stack

- **React 19** — واجهة المستخدم
- **Vite 7** — البناء والتطوير
- **React Router DOM 7** — التنقل
- **Supabase** — المصادقة وقاعدة البيانات
- **jsPDF + html2canvas** — تصدير PDF
- **Vitest** — الاختبارات
- **CSS Variables** — نظام تنسيق مخصص (بدون Tailwind)

## الترخيص

ISC
