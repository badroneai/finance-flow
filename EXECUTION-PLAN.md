# خطة التنفيذ — التثبيت الهندسي
# Execution Plan — Engineering Stabilization Sprint

**العنوان**: Stabilize → Split → Protect → Standardize
**المدة**: 10–14 يوم عمل
**القاعدة**: لا ميزات جديدة حتى انتهاء هذا الـ Sprint

---

## المرحلة 1 — تثبيت أرضية المشروع
**المدة**: يوم 1–2 | **المخاطر**: شبه معدومة | **الأولوية**: فورية

### المهمة 1.1 — Husky + lint-staged
**الهدف**: منع commit أي كود مكسور أو غير منسق تلقائياً

**خطوات التنفيذ**:
```bash
npm install --save-dev husky lint-staged
npx husky init
```

**إعداد `.husky/pre-commit`**:
```bash
npx lint-staged
```

**إضافة في `package.json`**:
```json
{
  "lint-staged": {
    "src/**/*.{js,jsx}": [
      "prettier --write",
      "eslint --fix --max-warnings=0"
    ]
  }
}
```

**معيار القبول**: أي `git commit` على ملف في `src/` يمر تلقائياً على Prettier + ESLint. إذا فشل أحدهما، يُمنع الـ commit.

---

### المهمة 1.2 — تعزيز CI بالاختبارات
**الهدف**: كشف أي كسر تلقائياً عند كل push و PR

**الوضع الحالي**: `.github/workflows/pages.yml` يحتوي فعلاً على `npm test` و `npm run lint` في خطوات الـ build. هذا جيد.

**التحسين المطلوب**: إضافة workflow منفصل للـ CI (لا يعتمد على deploy):

**إنشاء `.github/workflows/ci.yml`**:
```yaml
name: CI
on:
  push:
    branches: [main, dev]
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run build
```

**معيار القبول**: أي PR على `main` يمر تلقائياً على lint + test + build. فشل أي خطوة = PR لا يُدمج.

---

### المهمة 1.3 — إنشاء `.env.example`
**الهدف**: أي مطور جديد يعرف فوراً ما المتغيرات المطلوبة

**إنشاء `.env.example`**:
```env
# Supabase — اتركها فارغة للعمل بوضع localStorage فقط
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

**التأكد**: `.env.local` و `.env*.local` موجودة في `.gitignore` (مؤكد حالياً).

---

### المهمة 1.4 — ملف قواعد العمل الهندسي
**الهدف**: قواعد واضحة تمنع تكرار مشاكل الحجم والتكرار

**إنشاء `.claude/rules/engineering-standards.md`**:

القواعد التي يجب توثيقها:

| القاعدة | الحد | السبب |
|---------|------|-------|
| حجم الصفحة | ≤ 500 سطر | أكثر = تفكيك إلزامي |
| حجم المكوّن | ≤ 300 سطر | أكثر = مراجعة ضرورية |
| عدد useState في مكوّن | ≤ 8 | أكثر = استخراج custom hook أو تقسيم |
| عدد props لمكوّن | ≤ 12 | أكثر = استخدام Context أو تجميع في object |
| Modal inline | ممنوع | كل modal في ملف منفصل `ui/modals/` |
| Form logic inline في صفحة | ممنوع | استخدام custom hook أو مكوّن منفصل |
| ملف core/ جديد بدون اختبار | ممنوع | كل ملف core/ يرافقه ملف test |
| ملف domain/ جديد بدون اختبار | ممنوع | كل ملف domain/ يرافقه ملف test |

**معيار القبول**: الملف موجود، مرجعي، ويُشار إليه في `CLAUDE.md`.

---

### ✅ Checkpoint المرحلة 1
قبل الانتقال للمرحلة 2، تأكد من:
- [ ] `git commit` يمنع كود غير منسق
- [ ] CI workflow يعمل على PR
- [ ] `.env.example` موجود
- [ ] قواعد الهندسة موثقة
- [ ] `npm run test` يمر بنجاح (لا regression)

---

## المرحلة 2 — تفكيك LedgersPage.jsx
**المدة**: يوم 3–5 | **المخاطر**: متوسطة (ملف حرج) | **الأولوية**: عالية جداً

### الوضع الحالي
- **1,999 سطر** | **51 useState** | **62 handler** | **6 modals inline**
- يخلط: إدارة الدفاتر + الأسعار + الميزانية + المحاكاة + المدفوعات + الأداء
- أي تعديل بسيط يخاطر بكسر عدة وظائف

### خطة التفكيك

**الملف الحالي** → 6 ملفات:

#### 2.1 — `LedgersPage.jsx` (Shell)
**المسؤولية**: التخطيط العام فقط — اختيار الدفتر النشط، التبويبات، التنقل
**يحتوي**: activeId, tab state, ledgers list, إنشاء/تعديل/حذف الدفتر
**الحجم المتوقع**: ~400 سطر
**يستورد**: كل المكونات التالية

#### 2.2 — `ui/ledger/LedgerFormModal.jsx` (جديد)
**يُستخرج منه**: حالة إنشاء/تعديل الدفتر
**useState المنقولة**: newName, newType, newNote, editingId, editingName, editingType, editingNote
**Handlers المنقولة**: createLedger, startEdit, saveEdit, deleteLedger
**الحجم المتوقع**: ~150 سطر

#### 2.3 — `ui/ledger/BudgetPanel.jsx` (جديد)
**يُستخرج منه**: إدارة الميزانية والأهداف
**useState المنقولة**: budgetForm, tOperational, tMaintenance, tMarketing, incomeMode, incomeFixed, incomePeak, incomeBase, incomeSave, incomeManual, authorityOpen
**المنطق المنقول**: computeBudgetHealth, computeComplianceScore, targetsEvaluation
**الحجم المتوقع**: ~300 سطر

#### 2.4 — `ui/ledger/PricingWizard.jsx` (جديد)
**يُستخرج منه**: التسعير اليدوي + التسعير السعودي الآلي
**useState المنقولة**: pricingOpen, pricingIndex, pricingAmount, pricingDate, saPricingOpen, saCity, saSize, saOnlyUnpriced
**Handlers المنقولة**: applyQuickPricing, applySaudiAutoPricingForLedger, applyPricingToItem
**الحجم المتوقع**: ~200 سطر

#### 2.5 — `ui/ledger/CashFlowSimulator.jsx` (جديد)
**يُستخرج منه**: محاكاة التدفق النقدي والتوقعات
**useState المنقولة**: forecastPreset, assumedInflow, scRent, scUtilities, scMaintenance, scMarketing, scOther, brainDetails
**المنطق المنقول**: computeScenario, computeLedgerProjection, forecast6m, cashGapModel
**الحجم المتوقع**: ~250 سطر

#### 2.6 — `ui/ledger/PaymentConversionModal.jsx` (جديد)
**يُستخرج منه**: تحويل البند المتكرر إلى معاملة مالية
**useState المنقولة**: payOpen, paySource, payForm
**Handlers المنقولة**: startPayNow, submitPayNow
**الحجم المتوقع**: ~150 سطر

### قواعد التفكيك (مهمة جداً)

1. **لا تغيير في السلوك** — كل شيء يعمل كما هو بعد التفكيك
2. **اختبار يدوي بعد كل ملف** — تنقل بين التبويبات، أنشئ دفتر، عدّل سعر، سجّل دفعة
3. **commit بعد كل ملف ناجح** — لا تجمع التفكيك في commit واحد
4. **`npm run test`** بعد كل commit — لا regression
5. **Props واضحة** — كل مكوّن مستخرج يستقبل فقط ما يحتاجه (لا 89 prop)

### معيار القبول
- [ ] LedgersPage.jsx ≤ 500 سطر
- [ ] كل مكوّن مستخرج ≤ 300 سطر
- [ ] لا useState أكثر من 8 في أي مكوّن واحد
- [ ] `npm run test` يمر
- [ ] كل التبويبات والوظائف تعمل كما قبل

---

## المرحلة 3 — اختبارات المنطق الحرج
**المدة**: يوم 6–8 | **المخاطر**: منخفضة | **الأولوية**: عالية

### لماذا الآن؟
بعد تفكيك LedgersPage، أنت بحاجة لشبكة أمان قبل أي refactor إضافي. الاختبارات هنا ليست "لتحسين الصورة" — هي حماية تمنع regression.

### 3.1 — اختبارات `ledger-health.js` (746 سطر، 0 اختبارات حالياً)
**إنشاء**: `src/core/__tests__/ledger-health.test.js`

**الدوال الحرجة التي يجب تغطيتها**:
| الدالة | ما تفعله | نوع الاختبار |
|--------|---------|-------------|
| `computeLedgerHealth` | تحسب النتيجة الصحية الإجمالية للدفتر | happy path + edge cases (دفتر فارغ، بيانات ناقصة) |
| `computeComplianceShield` | تحسب درجة الامتثال | قيم حدية (0%, 50%, 100%) |
| `calculateBurnRateBundle` | تحسب معدل الحرق النقدي | أرقام واقعية + حالة صفر |
| `calculateCashPressureScore` | ضغط السيولة | سيناريوهات (صحي، متوسط، خطر) |
| `calculateNext90DayRisk` | مخاطر الـ 90 يوم القادمة | تواريخ مستقبلية + ماضية |
| `computeScenario` | محاكاة سيناريو مالي | مدخلات مختلفة = مخرجات متوقعة |
| `isSeededOnly` | هل الدفتر يحتوي فقط بيانات أولية؟ | true/false cases |

**الحد الأدنى**: 15-20 test case
**معيار القبول**: كل دالة مُصدّرة مغطاة بحالة واحدة على الأقل

### 3.2 — اختبارات `ledger-planner.js` (417 سطر، 0 اختبارات حالياً)
**إنشاء**: `src/core/__tests__/ledger-planner.test.js`

**الدوال الحرجة**:
| الدالة | ما تفعله | نوع الاختبار |
|--------|---------|-------------|
| `buildLedgerInbox` | تبني صندوق وارد الدفتر | بنود متنوعة الحالة (متأخر، قريب، عادي) |
| `computeCashPlan` | تحسب خطة السيولة | دفتر فارغ + دفتر نشط |
| `forecast6m` | توقعات 6 أشهر | بيانات تاريخية كافية + غير كافية |
| `cashGapModel` | نموذج فجوة السيولة | فائض + عجز |
| `normalizeMonthlyRunRate` | تحويل التكرار لشهري | monthly, quarterly, annual |

**الحد الأدنى**: 12-15 test case

### 3.3 — التحقق
```bash
npm run test
```
**معيار القبول**: كل الاختبارات الجديدة + القديمة تمر بنجاح

---

## المرحلة 4 — إزالة التكرار
**المدة**: يوم 9–10 | **المخاطر**: منخفضة-متوسطة | **الأولوية**: متوسطة-عالية

### 4.1 — استخراج `useModal()` hook
**إنشاء**: `src/hooks/useModal.js`

**الهدف**: توحيد نمط فتح/إغلاق/reset الـ modal المكرر في 6+ صفحات

**التصميم المقترح**:
```js
/**
 * @param {Object} [initialData] — بيانات أولية للـ modal
 * @returns {{ isOpen, data, open, close, toggle }}
 */
export function useModal(initialData = null) {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState(initialData);

  const open = useCallback((d = null) => {
    setData(d);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setData(initialData);
  }, [initialData]);

  return { isOpen, data, open, close };
}
```

**الاستخدام** (بدل 3 أسطر useState + handler):
```js
const pricing = useModal();
// pricing.open(itemData)  |  pricing.close()  |  pricing.isOpen  |  pricing.data
```

**الملفات المتأثرة**: LedgersPage (بعد التفكيك)، CommissionsPage، PropertiesPage، ContactsPage، ContractsPage، InboxPage
**التطبيق**: ابدأ بالملفات المفككة (المرحلة 2) ثم وسّع تدريجياً

### 4.2 — استخراج `useFormHandler()` hook
**إنشاء**: `src/hooks/useFormHandler.js`

**التصميم المقترح**:
```js
/**
 * @param {Object} initialState — الحالة الأولية للنموذج
 * @param {Function} [validator] — دالة تحقق اختيارية
 * @returns {{ form, setField, reset, isValid, errors }}
 */
export function useFormHandler(initialState, validator = null) {
  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState({});

  const setField = useCallback((field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    }
  }, [errors]);

  const reset = useCallback(() => {
    setForm(initialState);
    setErrors({});
  }, [initialState]);

  const isValid = validator ? validator(form) : true;

  return { form, setField, reset, setForm, isValid, errors, setErrors };
}
```

### 4.3 — توحيد QuickPaymentModal
**الوضع الحالي**: ملفان يفعلان نفس الشيء بهياكل مختلفة:
- `src/ui/inbox/QuickPaymentModal.jsx` (261 سطر) — flat state
- `src/ui/ContractQuickPaymentModal.jsx` (331 سطر) — form object state

**الحل**: دمجهما في `src/ui/modals/PaymentModal.jsx` واحد (~250 سطر) مع props للسلوك المخصص:
```jsx
<PaymentModal
  source="inbox"        // أو "contract"
  dueItem={item}
  onConfirm={handlePay}
  onClose={close}
/>
```

**معيار القبول**:
- [ ] `useModal` مستخدم في 3+ ملفات على الأقل
- [ ] `useFormHandler` مستخدم في 2+ ملفات على الأقل
- [ ] QuickPaymentModal أصبح ملف واحد
- [ ] `npm run test` يمر

---

## المرحلة 5 — تفكيك الصفحات المتبقية
**المدة**: يوم 11–12 | **المخاطر**: متوسطة | **الأولوية**: متوسطة

### 5.1 — تفكيك `CommissionsPage.jsx` (1,578 سطر)
**الملفات المستخرجة**:

| الملف الجديد | المسؤولية | الحجم المتوقع |
|-------------|-----------|--------------|
| `CommissionsPage.jsx` (shell) | تخطيط + فلاتر + قائمة | ~400 سطر |
| `ui/commissions/CommissionFormModal.jsx` | إنشاء/تعديل عمولة | ~300 سطر |
| `ui/commissions/CommissionPaymentModal.jsx` | تسجيل دفع العمولة | ~200 سطر |
| `domain/commission-export.js` | تصدير CSV (pure function) | ~80 سطر |

### 5.2 — تفكيك `PropertyDetailPage.jsx` (1,352 سطر)
**الملفات المستخرجة**:

| الملف الجديد | المسؤولية | الحجم المتوقع |
|-------------|-----------|--------------|
| `PropertyDetailPage.jsx` (shell) | عرض التفاصيل + تنقل | ~350 سطر |
| `ui/property/PropertyEditForm.jsx` | نموذج تعديل العقار | ~400 سطر |
| `ui/property/UnitManager.jsx` | إدارة الوحدات (CRUD) | ~300 سطر |
| `ui/property/ContactSelector.jsx` | اختيار جهة اتصال مع fallback يدوي | ~150 سطر |

### قاعدة مهمة
نفس قواعد المرحلة 2: لا تغيير في السلوك، commit بعد كل ملف، test بعد كل commit.

---

## المرحلة 6 — تقسيم DataContext.jsx
**المدة**: يوم 13–14 | **المخاطر**: عالية (يؤثر على كل المشروع) | **الأولوية**: متوسطة

### لماذا آخراً؟
- يعتمد عليه كل صفحة ومكوّن في المشروع
- أي خطأ = regression واسع
- نحتاج شبكة أمان الاختبارات (المرحلة 3) قبل هذه الخطوة

### خطة التقسيم التدريجي

**المرحلة الأولى (آمنة)**: استخراج بدون كسر

1. **إنشاء contexts جديدة** بجانب DataContext (لا تحذفه):
   - `contexts/LedgerDataContext.jsx` — ledgers, transactions, recurringItems, commissions
   - `contexts/PropertyDataContext.jsx` — properties, units
   - `contexts/ContractDataContext.jsx` — contracts, contractPayments, contractReceipts
   - `contexts/ContactDataContext.jsx` — contacts

2. **DataContext يصبح orchestrator**: يستورد الـ contexts الجديدة ويعيد تصديرها عبر `useData()` كما هو
   - هذا يعني **صفر تغيير في الملفات المستهلكة** في البداية

3. **ترحيل تدريجي**: صفحة صفحة، غيّر `useData()` إلى `useLedgerData()` أو `usePropertyData()` حسب الحاجة

**معيار القبول**:
- [ ] كل context جديد يعمل مستقلاً
- [ ] `useData()` لا يزال يعمل (backward compatible)
- [ ] `npm run test` يمر
- [ ] لا re-renders غير ضرورية (تحقق بـ React DevTools)

---

## ما لا نفعله في هذا الـ Sprint

| ❌ لا تفعل | السبب |
|-----------|-------|
| TypeScript migration | يشتت الطاقة — يأتي لاحقاً بعد الاستقرار |
| Storybook | تحسين شكلي — ليس أولوية هندسية |
| إعادة تنظيم المجلدات | لا قيمة عملية بدون تغيير في الكود |
| إعادة كتابة شاملة | المشروع يعمل — نحتاج تثبيت لا إعادة بناء |
| أكثر من refactor بالتوازي | يزيد مخاطر regression |
| ميزات جديدة | كل ميزة الآن تزيد الدين التقني |

---

## ملخص الجدول الزمني

```
يوم 1-2    المرحلة 1: Husky + CI + .env.example + قواعد هندسية
            ─── Checkpoint: بوابات الجودة تعمل ───

يوم 3-5    المرحلة 2: تفكيك LedgersPage.jsx (أخطر ملف)
            ─── Checkpoint: الصفحة ≤500 سطر + كل شيء يعمل ───

يوم 6-8    المرحلة 3: اختبارات ledger-health + ledger-planner
            ─── Checkpoint: شبكة أمان جاهزة ───

يوم 9-10   المرحلة 4: useModal + useFormHandler + توحيد PaymentModal
            ─── Checkpoint: أنماط موحدة ───

يوم 11-12  المرحلة 5: تفكيك CommissionsPage + PropertyDetailPage
            ─── Checkpoint: كل الصفحات ≤500 سطر ───

يوم 13-14  المرحلة 6: تقسيم DataContext تدريجياً
            ─── Checkpoint: God Object مفكك + backward compatible ───
```

---

## كيف تنفذ مع Claude

كل مرحلة تُنفذ في جلسة منفصلة. ابدأ كل جلسة بـ:

> "ابدأ المرحلة X من خطة التثبيت الهندسي. اقرأ EXECUTION-PLAN.md واتبع التعليمات بالضبط."

**قواعد التنفيذ**:
1. **اقرأ الملف المستهدف بالكامل قبل أي تعديل**
2. **commit بعد كل وحدة عمل ناجحة** — لا تجمع تغييرات كبيرة
3. **`npm run test` بعد كل commit** — إذا فشل، أصلح قبل المتابعة
4. **لا تغيير في السلوك** — refactor only، الوظائف تبقى كما هي
5. **إذا شككت، اسأل** — لا تجتهد في ملف حرج

---

*Stabilize → Split → Protect → Standardize*
*التثبيت أولاً، التوسع بعده.*
