# خطة تبسيط Core — قيد العقار (finance-flow)

تم إنشاؤها وفق برومبت 0.1. الهدف: تقليل عدد ملفات core دون كسر الوظائف الحالية.

---

## 1. أساسي — يبقى كما هو (أو يُعاد تنظيمهم لاحقاً دون دمج مع القوائم أدناه)

| الملف | الملاحظة |
|-------|----------|
| `src/core/ledger-store.js` | تخزين الدفاتر والعناصر المتكررة والدفتر النشط — يبقى كما هو. |
| `src/core/dataStore.js` | طبقة التخزين والـ CRUD للمعاملات والإعدادات — يبقى كما هو. |
| `src/domain/ledgers.js` | نموذج الدفتر والتحقق — يبقى كما هو. |
| `src/domain/ledgerTemplates.js` | قوالب البذور للالتزامات المتكررة — يبقى كما هو. |

---

## 2. دمج في ملف واحد: ledger-analytics.js

**الملف الجديد:** `src/core/ledger-analytics.js`

**المصادر المدمجة:**
- `src/core/ledger-reports.js` — تقارير، دلو، P&amp;L، امتثال تقارير
- `src/core/ledger-budgets.js` — تطبيع ميزانيات وتقييم صحة الميزانية
- `src/core/ledger-variance.js` — فعلي vs متوقع، تباين، أهداف، دخل

**قواعد الدمج:**
- تصدير كل الدوال العامة **بنفس أسمائها** لعدم كسر المستوردين (LedgersPage, LedgerReportsTab, pulse-engine).
- إضافة تعليقات واضحة تفصل الأقسام الثلاثة (Reports / Budgets / Variance).
- حل تعارض الأسماء إن وُجد (مثلاً مساعدات محلية مثل `asNum`, `monthKeyFromDate` تُضمّن مرة واحدة أو تُعاد تسميتها داخل الملف فقط).

---

## 3. دمج في ملف واحد: ledger-health.js

**الملف الجديد:** `src/core/ledger-health.js`

**المصادر المدمجة:**
- `src/core/ledger-compliance.js` — درع الامتثال (Compliance Shield)
- `src/core/ledger-intelligence-v1.js` — صحة الدفتر، الإسقاط، السيناريو
- `src/core/ledger-brain.js` — معدل الحرق، المخاطر، اللعب اليومي، المقارنة المرجعية

**قواعد الدمج:**
- تصدير كل الدوال والثوابت العامة **بنفس أسمائها** (مثل `computeComplianceShield`, `computeLedgerHealth`, `calculateBurnRateBundle`, `SAUDI_BENCHMARKS`, إلخ).
- تعليقات تفصل: Compliance / Intelligence v1 / Brain.

---

## 4. دمج في ملف واحد: ledger-planner.js

**الملف الجديد:** `src/core/ledger-planner.js`

**المصادر المدمجة:**
- `src/core/ledger-inbox.js` — صندوق الوارد اليومي (buildLedgerInbox, addDaysISO)
- `src/core/ledger-cash-plan.js` — خطة التدفق النقدي (computeCashPlan)
- `src/core/ledger-forecast.js` — تشغيل شهري، تنبؤ 6 أشهر، فجوة نقدية، رؤى

**قواعد الدمج:**
- تصدير كل الدوال **بنفس أسمائها** (مثل `buildLedgerInbox`, `addDaysISO`, `computeCashPlan`, `normalizeMonthlyRunRate`, `forecast6m`, `cashGapModel`, `insightsFromForecast`).
- تعليقات تفصل: Inbox / Cash Plan / Forecast.

---

## 5. مؤجل — لا يُحذف، يُعزل أو يُترك لمرحلة لاحقة

| الملف | الملاحظة |
|-------|----------|
| `src/core/ledger-budget-authority.js` | سلطة الميزانية (دلاء، استغلال، قفل صارم). يُؤجل دمجه؛ يبقى ملفاً منفصلاً حتى تُحدد مرحلة لاحقة لدمجه أو إعادة تسميته. |
| `src/core/ledger-item-history.js` | تاريخ العنصر وإثبات الدفع (clampHistory, pushHistoryEntry, lastPayNowAt, إلخ). يُؤجل؛ يبقى كما هو لضمان استقرار مسار التدقيق (audit trail). |

---

## 6. تحديثات مطلوبة بعد تنفيذ الدمج (برومبت 0.2)

- **LedgersPage.jsx:** استبدال استيراد `ledger-reports`, `ledger-budgets`, `ledger-variance` باستيراد واحد من `ledger-analytics.js`؛ واستبدال استيراد `ledger-compliance`, `ledger-intelligence-v1`, و`exports-map` (لـ ledgerBrain) باستيراد من `ledger-health.js`؛ واستبدال استيراد `ledger-inbox`, `ledger-cash-plan` و`exports-map` (لـ ledgerForecast) باستيراد من `ledger-planner.js`. تحديث `exports-map.js` ليعيد التصدير من الملفات الجديدة إن بقي مستخدماً.
- **LedgerReportsTab.jsx:** استيراد دوال التقارير من `ledger-analytics.js` بدلاً من `ledger-reports.js`.
- **pulse-engine.js:** استيراد الدوال المطلوبة من `ledger-analytics.js`, `ledger-health.js`, `ledger-planner.js` بدلاً من الملفات القديمة.
- **حذف أو إهمال الملفات القديمة** بعد التأكد من عدم وجود مراجع:  
  `ledger-reports.js`, `ledger-budgets.js`, `ledger-variance.js`, `ledger-compliance.js`, `ledger-intelligence-v1.js`, `ledger-brain.js`, `ledger-inbox.js`, `ledger-cash-plan.js`, `ledger-forecast.js`.

---

*تم الإعداد وفق برومبت 0.1 — بدون تعديل أي كود.*
