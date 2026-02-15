# خريطة التبعيات — قيد العقار (finance-flow)

تم إنشاؤها وفق برومبت 0.1. لا يشمل هذا الملف سوى الملفات المذكورة في التعليمات.

---

## 1. رسم شجري للتبعيات

```
src/domain/ledgers.js          (لا يستورد من core/domain آخر)
src/domain/ledgerTemplates.js  (لا يستورد من core/domain آخر)

src/core/storage-facade.js      (لا يُفحص هنا؛ مُستورد من عدة ملفات)
src/core/contracts.js           (لا يُفحص هنا)
src/core/recurring-intelligence.js (لا يُفحص هنا)

src/core/ledger-store.js
  ← storage-facade.js
  ← domain/ledgers.js (createDefaultLedger, validateLedger, withLedgerDefaults)

src/core/dataStore.js
  ← storage-facade.js
  ← ledger-store.js (getActiveLedgerId)
  ← constants/index.js, utils/helpers.js

src/core/ledger-reports.js
  ← recurring-intelligence.js (normalizeCategory, normalizeRisk, isSeededRecurring, isPastDue)
  ← contracts.js (assertArr)

src/core/ledger-budgets.js
  (لا يستورد من ملفات أخرى في القائمة)

src/core/ledger-compliance.js
  (لا يستورد — دوال نقية فقط)

src/core/ledger-inbox.js
  (لا يستورد — دوال نقية فقط)

src/core/ledger-cash-plan.js
  (لا يستورد — دوال نقية فقط)

src/core/ledger-item-history.js
  (لا يستورد — دوال نقية فقط)

src/core/ledger-budget-authority.js
  (لا يستورد — دوال نقية فقط)

src/core/ledger-forecast.js
  (لا يستورد — دوال نقية فقط)

src/core/ledger-variance.js
  (لا يستورد — دوال نقية فقط؛ يستقبل forecast6m output كمعامل)

src/core/ledger-intelligence-v1.js
  (لا يستورد — دوال نقية فقط)

src/core/ledger-brain.js
  (لا يستورد — دوال نقية فقط)

src/core/exports-map.js
  ← ledger-brain.js, ledger-forecast.js, ledger-variance.js, ledger-intelligence-v1.js

src/core/pulse-engine.js
  ← ledger-store.js, dataStore.js, ledger-inbox.js, ledger-cash-plan.js,
     ledger-intelligence-v1.js, ledger-compliance.js, ledger-reports.js

---

src/pages/LedgersPage.jsx
  ← ledger-store.js, ledgerTemplates.js, recurring-intelligence.js,
     ledger-budgets.js, ledger-intelligence-v1.js, exports-map.js (ledgerBrain, ledgerForecast, ledgerVariance),
     ledger-inbox.js, ledger-cash-plan.js, ledger-item-history.js,
     ledger-budget-authority.js, ledger-compliance.js, ledger-reports.js, dataStore.js,
     LedgerHeader, LedgerTabsShell, LedgerRecurringTab, LedgerPerformanceTab, LedgerReportsTab, contracts

src/pages/TransactionsPage.jsx
  ← dataStore.js (dataStore, getActiveLedgerIdSafe)

src/pages/InboxPage.jsx
  ← ledger-store.js (getActiveLedgerId, getRecurringItems, getLedgers)

src/ui/ledger/LedgerHeader.jsx
  (لا يستورد من core/domain — مكوّن عرض فقط، يستقبل tab, onTabSelect)

src/ui/ledger/LedgerTabsShell.jsx
  (لا يستورد من core/domain — مكوّن عرض فقط)

src/tabs/LedgerRecurringTab.jsx
  ← LedgerInboxTab, LedgerForecastTab (يستقبل كل البيانات عبر props من LedgersPage)

src/tabs/LedgerReportsTab.jsx
  ← ledger-reports.js (computePL, computeTopBuckets)
  ← utils/csvExport.js

src/tabs/LedgerPerformanceTab.jsx
  (لا يستورد من core — يستقبل كل البيانات عبر props من LedgersPage)

src/main.jsx
  ← ledger-store.js (ensureDefaultLedger)

src/App.jsx
  ← dataStore.js
  ← storage-facade.js (مستورد من مكان آخر إن وُجد)
```

---

## 2. الدوال المُصدّرة واستخداماتها

### ledger-store.js
| الدالة/الثابت | المُستورد |
|----------------|-----------|
| `LEDGER_STORAGE_KEYS` | (داخلي/مفتاح تخزين) |
| `getLedgers` | LedgersPage, InboxPage, pulse-engine, main (ضمن ensureDefaultLedger) |
| `setLedgers` | LedgersPage |
| `getRecurringItems` | LedgersPage, InboxPage, pulse-engine |
| `setRecurringItems` | LedgersPage |
| `getActiveLedgerId` | dataStore, LedgersPage, InboxPage, pulse-engine, TransactionsPage (عبر getActiveLedgerIdSafe) |
| `setActiveLedgerId` | LedgersPage |
| `ensureDefaultLedger` | main.jsx |

### ledger-reports.js
| الدالة | المُستورد |
|--------|-----------|
| `getBucketForRecurring` | LedgersPage |
| `buildTxMetaFromRecurring` | LedgersPage |
| `filterTransactionsForLedgerByMeta` | LedgersPage, LedgerReportsTab (عبر props) |
| `computePL` | LedgersPage, LedgerReportsTab, pulse-engine |
| `computeTopBuckets` | LedgersPage, LedgerReportsTab |
| `computeComplianceScore` | LedgersPage |

### ledger-budgets.js
| الدالة | المُستورد |
|--------|-----------|
| `normalizeBudgets` | LedgersPage |
| `computeBudgetHealth` | LedgersPage |

### ledger-compliance.js
| الدالة | المُستورد |
|--------|-----------|
| `computeComplianceShield` | LedgersPage, pulse-engine |

### ledger-inbox.js
| الدالة | المُستورد |
|--------|-----------|
| `buildLedgerInbox` | LedgersPage, pulse-engine |
| `addDaysISO` | LedgersPage |

### ledger-cash-plan.js
| الدالة | المُستورد |
|--------|-----------|
| `computeCashPlan` | LedgersPage, pulse-engine |

### ledger-item-history.js
| الدالة | المُستورد |
|--------|-----------|
| `clampHistory` | داخلي في pushHistoryEntry فقط |
| `pushHistoryEntry` | LedgersPage |
| `lastPayNowAt` | LedgersPage |
| `summarizePayNow` | LedgersPage |
| `daysSince` | LedgersPage |

### ledger-budget-authority.js
| الدالة | المُستورد |
|--------|-----------|
| `normalizeBudgets` | LedgersPage (كـ normalizeAuthorityBudgets) |
| `recurringCategoryToBucket` | داخلي + LedgersPage (إن استُخدمت) |
| `monthKeyFromDate` | LedgersPage |
| `computeSpendByBucketFromHistory` | LedgersPage |
| `computeBudgetUtilization` | LedgersPage |
| `wouldBreachHardLock` | LedgersPage |

### ledger-forecast.js (عبر exports-map كـ ledgerForecast)
| الدالة | المُستورد |
|--------|-----------|
| `normalizeMonthlyRunRate` | LedgersPage |
| `forecast6m` | LedgersPage (وُمدخل لـ ledger-variance) |
| `cashGapModel` | LedgersPage |
| `insightsFromForecast` | LedgersPage |

### ledger-variance.js (عبر exports-map كـ ledgerVariance)
| الدالة | المُستورد |
|--------|-----------|
| `computeActualsByMonth` | LedgersPage (عبر getLast4MonthsTable) |
| `computeExpectedByMonth` | LedgersPage (عبر getLast4MonthsTable) |
| `variance` | LedgersPage |
| `targetsEvaluation` | LedgersPage |
| `buildIncomeModelFn` | LedgersPage |
| `getLast4MonthsTable` | LedgersPage |

### ledger-intelligence-v1.js
| الدالة/الثابت | المُستورد |
|----------------|-----------|
| `isSeededOnly` | LedgersPage |
| `freqMultiplier` | (قد يُستخدم داخلياً أو من مكان آخر) |
| `computeLedgerHealth` | LedgersPage, pulse-engine |
| `computeLedgerProjection` | LedgersPage |
| `computeScenario` | LedgersPage |

### ledger-brain.js (عبر exports-map كـ ledgerBrain)
| الدالة/الثابت | المُستورد |
|----------------|-----------|
| `calculateBurnRate`, `calculateMonthlyFixed`, `calculateNext90DayRisk`, إلخ. | LedgersPage (عبر destructure من ledgerBrain) |
| `SAUDI_BENCHMARKS` | LedgersPage (إن استُخدم) |
| `getBenchmarkComparison` | LedgersPage |

### dataStore.js
| التصدير | المُستورد |
|---------|-----------|
| `getActiveLedgerIdSafe` | TransactionsPage |
| `safeGet`, `safeSet`, `createCrud` | عدة صفحات ووحدات |
| `dataStore` | App, LedgersPage, SettingsPage, GeneratorPage, DashboardPage, DraftsPage, HomePage, CommissionsPage, LedgerReportsTab (عبر props) |
| `detectPrivateBrowsing` | TrustChecks |

### domain/ledgers.js
| الدالة/الثابت | المُستورد |
|----------------|-----------|
| `LEDGER_TYPES`, `normalizeLedgerType`, `normalizeLedgerNote`, `withLedgerDefaults`, `createDefaultLedger`, `withUpdatedAt`, `validateLedger` | ledger-store.js فقط |

### domain/ledgerTemplates.js
| التصدير | المُستورد |
|---------|-----------|
| `LEDGER_TEMPLATES`, `seedRecurringForLedger` | LedgersPage فقط |

---

## 3. الأحداث (Events) — أين تُطلق وأين تُستقبل

| الحدث | الإطلاق | الاستقبال |
|-------|---------|-----------|
| `ledger:activeChanged` | `ledger-store.js` (داخل `setActiveLedgerId`) | `InboxPage.jsx`, `TransactionsPage.jsx`, `PulseAlertsBanner.jsx` |
| `ui:help` | `LedgersPage.jsx`, `LedgerRecurringTab.jsx` (زر "افتح المساعدة") | `App.jsx` (`onHelp`) |
| `ui:numerals` | `theme-ui.js` | `App.jsx` |
| `ui:dateHeader` | `theme-ui.js` | `App.jsx` |

---

## 4. الملفات "الميتة" (غير المستخدمة)

ضمن نطاق الملفات المطلوب فحصها **لا يوجد ملف ميت**. كل الملفات المذكورة في البرومبت مُستوردة ومُستخدمة:

- **ledger-store, dataStore, domain/ledgers, domain/ledgerTemplates**: مستخدمة من LedgersPage و/أو main و/أو InboxPage و/أو TransactionsPage و/أو pulse-engine.
- **ledger-reports, ledger-budgets, ledger-compliance, ledger-inbox, ledger-cash-plan, ledger-item-history, ledger-budget-authority, ledger-forecast, ledger-variance, ledger-intelligence-v1, ledger-brain**: مستخدمة من LedgersPage و/أو pulse-engine و/أو LedgerReportsTab أو عبر exports-map.

ملاحظة: `LedgerHeader.jsx` و `LedgerTabsShell.jsx` و `LedgerPerformanceTab.jsx` لا تستورد من core أو domain؛ هي مكونات عرض وتستقبل البيانات عبر props من LedgersPage — وهذا متوقع ولا يعني أنها ميتة.

---

*تم الإعداد وفق برومبت 0.1 — بدون تعديل أي كود.*
