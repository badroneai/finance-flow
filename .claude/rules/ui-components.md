---
paths:
  - "src/ui/**/*.jsx"
  - "src/ui/**/*.css"
---
# قواعد UI Components

- RTL-first: كل مكون يشتغل عربي أولاً
- CSS Variables فقط — لا Tailwind، لا ألوان hex/rgb مباشرة
- Responsive: جوال أولاً (mobile-first)
- لا منطق أعمال — المكون يستقبل props ويعرض
- أسماء CSS classes بـ kebab-case
- لا `style={{ }}` إلا للقيم الديناميكية
- أحجام الخطوط بـ rem (لا px)

## CSS صح vs خطأ
```css
/* ✅ صحيح */
margin-inline-start: 1rem;
padding-inline-end: 0.5rem;
text-align: start;
color: var(--primary-color);

/* ❌ خطأ */
margin-left: 1rem;
text-align: right;
color: #1a73e8;
```

## هيكل المكون
```jsx
export const MyComponent = ({ prop1, prop2 }) => {
  // hooks أولاً
  // state ثانياً
  // effects ثالثاً
  // handlers رابعاً
  // render أخيراً
  return ( ... );
};
```

## إمكانية الوصول
- `aria-label` لكل زر بدون نص
- keyboard navigation يعمل
- contrast ratio كافي
