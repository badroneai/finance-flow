# تدقيق هندسي — قيد العقار (Finance Flow)
# Engineering Audit Report

**التاريخ**: 2 أبريل 2026
**المدقق**: Senior Software Architect & Codebase Quality Auditor
**النطاق**: Codebase Health & Engineering Quality — تحليل فقط، بدون تعديلات

---

## 1. الحكم التنفيذي | Executive Judgment

المشروع **ليس في حالة صحية كاملة، لكنه ليس سيئاً**. الأساس المعماري سليم — فصل واضح بين `domain/` (منطق أعمال نقي) و `core/` (خدمات) و `contexts/` (إدارة الحالة) و `pages/` (واجهة). هذا الفصل أفضل مما تراه في 80% من مشاريع React في نفس الحجم.

**المشكلة الحقيقية**: الصفحات نمت بشكل عضوي دون تفكيك. `LedgersPage.jsx` بـ 2,000 سطر و 64+ useState هو **أخطر ملف في المشروع** — أي تعديل بسيط فيه يخاطر بكسر عدة وظائف. صفحات أخرى مثل `CommissionsPage` (1,578) و `PropertyDetailPage` (1,352) تعاني من نفس النمط بدرجات أقل.

`DataContext.jsx` بـ 1,228 سطر هو God Object — يدير كل شيء من الدفاتر للعقود للعقارات في ملف واحد. هذا يعمل الآن، لكنه قنبلة موقوتة عند إضافة features جديدة.

60% من ملفات `core/` و `domain/` **بدون اختبارات**. لا يوجد git hooks. لا يوجد `.env.example`. هذه ليست مشاكل كارثية، لكنها تمنع المشروع من الوصول لمعيار "شركة منضبطة".

**الخلاصة**: المشروع في مرحلة "workable but accumulating debt" — يعمل ويُنتج، لكن كل feature جديدة تزيد الهشاشة إذا لم يُعالج الدين التقني قريباً.

---

## 2. تقييم حجم الكود | Code Size Assessment

### الإحصائيات العامة

| المقياس | القيمة |
|---------|--------|
| إجمالي الأسطر | **38,618** |
| عدد الملفات (JS/JSX) | 113 |
| عدد ملفات الاختبار | 17 |
| أكبر ملف | LedgersPage.jsx (1,999 سطر) |
| ملفات فوق 300 سطر | 42 |
| متوسط الأسطر/ملف | 342 |

### هل الحجم طبيعي؟

لمشروع React SPA بـ 18 صفحة + 5 تبويبات + Supabase backend، **38,618 سطر مقبول**. المشكلة ليست الحجم الإجمالي — المشكلة في **توزيع الحجم**.

### الملفات المتضخمة (تحتاج تفكيك)

| الملف | الأسطر | الخطورة | السبب |
|--------|--------|---------|-------|
| `LedgersPage.jsx` | 1,999 | 🔴 حرج | 64+ useState، 6+ modals inline، خلط عرض + منطق + بيانات |
| `CommissionsPage.jsx` | 1,578 | 🔴 حرج | CRUD + فلاتر + تصدير CSV/PDF + modals كلها في ملف واحد |
| `PropertyDetailPage.jsx` | 1,352 | 🟠 عالي | 33 useState، نموذج التعديل مدمج، إدارة الوحدات inline |
| `DataContext.jsx` | 1,228 | 🟠 عالي | God Object — يدير 10+ entities في context واحد |
| `supabase-store.js` | 1,271 | 🟡 متوسط | CRUD متكرر لكنه منظم — تفكيك اختياري |
| `constants/index.js` | 1,234 | 🟡 متوسط | بيانات ثابتة — الحجم مبرر لكن يمكن تقسيمه |
| `ledgerTemplates.js` | 1,006 | ✅ مقبول | قوالب بيانات — الحجم طبيعي للمحتوى |
| `LedgerRecurringTab.jsx` | 962 | 🟡 متوسط | 89 prop يتم تمريرها من الأب — prop drilling مفرط |

### توزيع الأسطر حسب المجلد

| المجلد | الأسطر | النسبة | التقييم |
|--------|--------|--------|---------|
| `pages/` | 12,924 | 33.5% | 🔴 ثقيل جداً — الصفحات تحمل مسؤولية أكثر مما ينبغي |
| `core/` | 8,289 | 21.5% | ✅ مقبول |
| `domain/` | 5,599 | 14.5% | ✅ ممتاز — منطق نقي |
| `ui/` | 5,146 | 13.3% | ✅ مقبول |
| `tabs/` | 2,408 | 6.2% | 🟡 ثقيل نسبياً لـ 5 ملفات فقط |
| `contexts/` | 1,755 | 4.5% | 🟡 DataContext يسيطر (70% من المجلد) |

### أولوية التفكيك

1. **LedgersPage.jsx** → تفكيك إلى 5 ملفات (LedgersPage shell, LedgerFormModal, BudgetPanel, PricingWizard, CashFlowSimulator)
2. **CommissionsPage.jsx** → تفكيك إلى 3 ملفات (CommissionsPage shell, CommissionFormModal, PaymentModal)
3. **PropertyDetailPage.jsx** → تفكيك إلى 3 ملفات (PropertyDetailPage shell, PropertyEditForm, UnitManager)
4. **DataContext.jsx** → تقسيم إلى contexts حسب المجال (LedgerContext, PropertyContext, ContractContext)

---

## 3. تقييم التكرار | Duplication Assessment

### التكرارات المؤثرة على الصيانة

#### 3.1 نمط إدارة الـ Modal (مكرر 6+ مرات)
كل صفحة تعيد اختراع نفس النمط:
```jsx
const [showModal, setShowModal] = useState(false);
const [modalData, setModalData] = useState(null);
// ... open handler, close handler, reset handler
```
**الملفات**: LedgersPage (6 modals)، CommissionsPage (2)، PropertiesPage، ContactsPage، ContractsPage، InboxPage
**الأثر**: ~150-200 سطر مكرر عبر المشروع
**الحل**: custom hook `useModal()` أو modal manager مركزي

#### 3.2 نمط إدارة النماذج (مكرر في كل صفحة CRUD)
```jsx
const [form, setForm] = useState({...});
const handleChange = (field, value) => setForm(prev => ({...prev, [field]: value}));
const handleSubmit = async () => { validate(); save(); reset(); };
```
**الملفات**: كل الصفحات الـ CRUD (Properties, Contacts, Contracts, Commissions, Transactions)
**الأثر**: ~100 سطر مكرر لكل صفحة × 6 صفحات = ~600 سطر
**الحل**: custom hook `useFormHandler(initialState, validator, onSubmit)`

#### 3.3 Quick Payment Modal مكرر بالكامل
`src/ui/inbox/QuickPaymentModal.jsx` و `src/ui/ContractQuickPaymentModal.jsx` يفعلان نفس الشيء بهياكل state مختلفة. أحدهما يستخدم flat state والآخر form object.
**الأثر**: ~590 سطر يمكن تقليصها لـ ~300
**الحل**: توحيد في مكون واحد `PaymentModal` مع props للسلوك المخصص

#### 3.4 نمط الفلترة والبحث (مكرر في 8-10 ملفات)
كل صفحة تبني فلترتها الخاصة بـ useState + useMemo + filter logic.
**التقييم**: مقبول حالياً — كل صفحة لها فلاتر مختلفة. لكن يمكن استخراج `useFilteredList(items, filters, searchFn)` لتوحيد النمط.

#### 3.5 أنماط **غير** مكررة (إيجابي)
- ✅ **Toast/Notifications**: مركزية عبر `ToastContext` — ممتاز
- ✅ **تنسيق العملة/التاريخ**: `formatCurrency` و `formatDate` مركزية في `utils/` — ممتاز
- ✅ **Error handling**: نمط `try/catch` متسق مع toast — مقبول
- ✅ **CSS Variables**: لا ألوان مكررة — يتبع brand identity — ممتاز

---

## 4. تقييم النضج الهندسي | Engineering Maturity

### التقييم: **Workable but messy** — يعمل لكنه فوضوي في مناطق محددة

### نقاط القوة (مثيرة للإعجاب)

| الجانب | التقييم | التفصيل |
|--------|---------|---------|
| فصل المنطق | ⭐⭐⭐⭐ | `domain/` بدون React، pure functions، JSDoc — ممتاز |
| Data layer | ⭐⭐⭐⭐ | `supabase-store.js` منظم، `storage-facade` للـ fallback |
| أمان | ⭐⭐⭐⭐ | RLS، لا secrets في الكود، لا eval، لا innerHTML خام |
| Error boundaries | ⭐⭐⭐⭐ | 3 أنواع boundaries بأسماء عربية مناسبة |
| تنظيم الاستيرادات | ⭐⭐⭐⭐ | ترتيب متسق: خارجي → داخلي → نسبي |
| Console hygiene | ⭐⭐⭐⭐ | صفر `console.log` — فقط error/warn مبررة |
| TODO/FIXME debt | ⭐⭐⭐⭐⭐ | صفر — نادر جداً في مشاريع بهذا الحجم |
| Lazy loading | ⭐⭐⭐⭐ | كل الصفحات lazy loaded بـ Suspense |
| ESLint/Prettier | ⭐⭐⭐⭐ | مُعدّ بشكل صحيح |

### نقاط الضعف

| الجانب | التقييم | التفصيل |
|--------|---------|---------|
| تفكيك الصفحات | ⭐⭐ | صفحات ضخمة بـ 30-64 useState |
| تغطية الاختبارات | ⭐⭐ | 60% من الملفات بدون اختبارات |
| Git hooks | ⭐ | غير موجودة — يمكن عمل commit بكود مكسور |
| TypeScript | ⭐ | غير موجود — JSDoc بـ ~50% تغطية |
| Prop drilling | ⭐⭐ | LedgerRecurringTab يستقبل 89 prop |
| CI/CD | ⭐⭐ | GitHub Pages فقط — لا tests في CI |
| .env.example | ⭐ | غير موجود |

### لماذا "workable but messy"؟

الأساس المعماري **سليم ومدروس** — طبقة domain نقية، فصل واضح بين data/core/ui، brand identity system متكامل، وثائق ممتازة (CLAUDE.md، database-schema، domain-logic-v2). هذا يدل على تفكير هندسي حقيقي.

لكن التنفيذ في طبقة الصفحات **لم يواكب التصميم**. الصفحات نمت عضوياً بدلاً من أن تُفكك عند تجاوزها 400-500 سطر. النتيجة: أساس قوي فوقه صفحات هشة.

**لا يشعر بمجموعة إصلاحات عشوائية (collection of fixes)** — يشعر بمنتج بناه شخص يعرف ماذا يفعل معمارياً، لكنه يحتاج جولة تنظيف جادة قبل النمو التالي.

---

## 5. ما ينقص | What is Missing

### 5.1 مطلوب فوراً (Blocking)

1. **Git hooks (Husky + lint-staged)** — لا يوجد أي حماية من commit كود مكسور أو غير منسق. هذا أساسي في أي فريق.

2. **اختبارات core/ الحرجة** — `supabase-store.js` (1,271 سطر)، `ledger-health.js` (746 سطر)، `ledger-planner.js` (417 سطر)، `pdf-service.js` (753 سطر) — كلها **بدون سطر اختبار واحد**.

3. **تفكيك LedgersPage** — 2,000 سطر بـ 64 useState يعني أي مطور جديد يحتاج يوم كامل لفهم هذا الملف فقط.

### 5.2 مطلوب قريباً (Important)

4. **تقسيم DataContext** — God Object بـ 1,228 سطر. عند إضافة entity جديد، هذا الملف سيصبح غير قابل للصيانة.

5. **Custom hooks للأنماط المكررة** — `useModal()`, `useFormHandler()`, `useFilteredList()` — ستقلص ~1,500 سطر وتوحد السلوك.

6. **`.env.example`** — أي مطور جديد لا يعرف ما المتغيرات المطلوبة.

7. **Tests في CI** — `npm run test` موجود لكن لا يُنفذ في GitHub Actions.

### 5.3 مطلوب لاحقاً (Good to Have)

8. **TypeScript migration** — ليس عاجلاً، لكن مع نمو المشروع سيصبح ضرورياً. البدء بملفات `domain/` (pure functions = أسهل ترحيل).

9. **Storybook أو مكتبة مكونات** — `ui-common.jsx` بـ 591 سطر يحتوي Icons + Badge + EmptyState بدون توثيق بصري.

10. **Performance monitoring** — لا يوجد قياس أداء. مع 18 صفحة lazy loaded + DataContext يُعيد render كل شيء، قد تظهر مشاكل أداء مع نمو البيانات.

---

## 6. أعلى التحسينات أولوية | Highest-Priority Improvements

### فوري (هذا الأسبوع)

| # | التحسين | الجهد | الأثر |
|---|---------|-------|-------|
| 1 | إعداد Husky + lint-staged (pre-commit: lint + format + test) | 1 ساعة | يمنع regression فوراً |
| 2 | إنشاء `.env.example` | 15 دقيقة | developer onboarding |
| 3 | إضافة `npm run test` في GitHub Actions CI | 30 دقيقة | يكشف الكسر تلقائياً |

### قريب (الأسبوعين القادمين)

| # | التحسين | الجهد | الأثر |
|---|---------|-------|-------|
| 4 | تفكيك `LedgersPage.jsx` إلى 5 ملفات | 4-6 ساعات | يقلص أخطر ملف من 2,000 إلى ~400 سطر |
| 5 | توحيد QuickPaymentModal (دمج الملفين) | 2-3 ساعات | يحذف ~300 سطر مكرر |
| 6 | كتابة اختبارات لـ `ledger-health.js` و `ledger-planner.js` | 4-6 ساعات | تغطية للملفات الأخطر بدون اختبارات |
| 7 | استخراج `useModal()` و `useFormHandler()` hooks | 3-4 ساعات | يوحد أنماط متكررة عبر 6+ صفحات |

### لاحق (الشهر القادم)

| # | التحسين | الجهد | الأثر |
|---|---------|-------|-------|
| 8 | تقسيم `DataContext` إلى 3-4 contexts حسب المجال | 6-8 ساعات | يقلل re-renders غير الضرورية |
| 9 | تفكيك `CommissionsPage` و `PropertyDetailPage` | 4-6 ساعات | يوصل كل الصفحات لمعيار <500 سطر |
| 10 | كتابة اختبارات لبقية domain/ (18 ملف بدون اختبارات) | 8-12 ساعة | تغطية 90%+ لمنطق الأعمال |
| 11 | البدء بترحيل TypeScript من `domain/` | 8-12 ساعة | type safety للمنطق الحرج |

---

## 7. الحكم النهائي | Final Verdict

### هل الكود في حالة تعتبرها شركات منضبطة "مقبولة"؟

**لا، ليس بعد** — لكنه **قريب** وأقرب مما تتوقع.

### الفجوة

المشروع يملك ما تفتقده معظم المشاريع في هذا الحجم: **أساس معماري مدروس**. طبقة domain نقية، فصل واضح للمسؤوليات، وثائق تقنية ممتازة، brand identity system متكامل، أمان مبني من البداية (RLS, PDPL compliance)، صفر TODO debt.

**ما ينقصه لسد الفجوة** يمكن تلخيصه في 3 نقاط:

1. **الصفحات الثلاث الكبرى تحتاج تفكيك** — هذا هو الدين التقني الأكبر. بدون تفكيك، كل feature جديد يزيد الهشاشة.

2. **اختبارات core/ ناقصة** — 60% من الملفات بدون اختبارات. في شركة منضبطة، الحد الأدنى 80% تغطية لـ core/ و domain/.

3. **بوابات الجودة غير موجودة** — لا git hooks، لا tests في CI. الانضباط يعتمد على الذاكرة البشرية بدلاً من الأتمتة.

### التقدير الزمني لسد الفجوة

**~40-50 ساعة عمل مركّز** — ليست إعادة كتابة، بل تنظيف وتقوية. بعدها يكون المشروع في مستوى تفتخر بعرضه في مقابلة تقنية أو code review في شركة محترمة.

### الملخص

```
الأساس المعماري:     ████████░░  8/10  — مدروس ومتين
تفكيك المكونات:      ████░░░░░░  4/10  — صفحات ضخمة وهشة
تغطية الاختبارات:    ████░░░░░░  4/10  — ناقصة بشكل ملحوظ
بوابات الجودة:       ██░░░░░░░░  2/10  — غير موجودة
التوثيق:             █████████░  9/10  — ممتاز (CLAUDE.md, rules, schema)
الأمان:              ████████░░  8/10  — RLS + PDPL + no secrets
نظافة الكود:         ████████░░  8/10  — لا TODO, لا console.log, imports منظمة
الجاهزية للنمو:      █████░░░░░  5/10  — يحتاج تفكيك قبل إضافة features

المتوسط العام:       ██████░░░░  6/10
```

**هذا مشروع بناه شخص يفكر كمهندس — يحتاج فقط أن يُعامل ككود إنتاج.**

---

*نهاية التقرير*
