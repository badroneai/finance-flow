---
paths:
  - "src/core/**/*.js"
---
# قواعد Core Services

> آخر تحديث: 2026-03-29

- كل محرك/خدمة يحتاج ملف اختبار مقابل في `src/core/__tests__/`
- لا تعدّل `supabase.js` أو `storage-facade.js` بدون موافقة صريحة
- Error handling إلزامي — كل دالة تحتاج try/catch، لا throw بدون catch
- استخدم `storage-facade.js` للتخزين، لا `localStorage` مباشرة
- Supabase calls فقط في `supabase-store.js` و `storage-facade.js`
- لا JSX — لا DOM manipulation
- تنسيق الأخطاء: `console.warn('[قيد العقار] ⚠️ [الوصف]:', err.message)`

## الملفات الحساسة (تحتاج مراجعة إضافية)
- `supabase.js` — عميل Supabase المركزي
- `storage-facade.js` — الواجهة الموحدة (Supabase + localStorage fallback)
- `theme-ui.js` — إعدادات الثيم، تأثر على كل التطبيق

## جميع الملفات (24 ملف)

### التنبيهات (2 ملف)
| الملف | الوظيفة | دوال رئيسية | اختبارات |
|--------|---------|-------------|----------|
| `alert-engine.js` | محرك التنبيهات الذكية | calculateAlerts, getHiddenIds, buildAggregateAlerts | ✓ |
| `alert-manager.js` | تأجيل وأرشفة التنبيهات | dismiss, snooze, readState, getActiveDismissals | ✗ |

### المحركات المالية (3 ملف)
| الملف | الوظيفة | دوال رئيسية | اختبارات |
|--------|---------|-------------|----------|
| `pulse-engine.js` | محرك النبض المالي | calculateHealthScore, calculatePulse, buildPulseContext | ✓ |
| `inbox-engine.js` | محرك صندوق الوارد | calculateInbox, buildInboxBuckets, sortInboxItems | ✓ |
| `contract-payment-service.js` | تسجيل دفعات العقود (عملية ذرية) | recordContractPayment | ✓ |

### الدفاتر المالية (7 ملف)
| الملف | الوظيفة | دوال رئيسية | اختبارات |
|--------|---------|-------------|----------|
| `ledger-store.js` | طبقة تخزين الدفاتر (localStorage) | getLedgers, setLedgers, getRecurringItems, getActiveLedgerId | ✗ |
| `ledger-analytics.js` | تحليلات الدفاتر (reports + budgets + variance) | getBucketForRecurring, buildTxMetaFromRecurring, computePL | ✓ |
| `ledger-planner.js` | التخطيط والتنبؤ (inbox + cash-plan + forecast) | buildLedgerInbox, computeCashPlan, calculateInbox | ✗ |
| `ledger-health.js` | صحة الدفتر والامتثال | computeLedgerHealth, computeComplianceShield, healthTrend | ✗ |
| `ledger-budget-authority.js` | السلطة المالية والميزانية | normalizeBudgets, computeUtilization, checkBudgetBreach | ✗ |
| `ledger-compare.js` | مقارنة الدفاتر (2-5 دفاتر) | compareLedgers, getComparativeStats | ✗ |
| `ledger-item-history.js` | سجل البنود المتكررة والإثبات | clampHistory, pushHistoryEntry, lastPayNowAt | ✗ |

### التقارير والتصدير (2 ملف)
| الملف | الوظيفة | دوال رئيسية | اختبارات |
|--------|---------|-------------|----------|
| `monthly-report-generator.js` | مولّد التقرير الشهري | generateMonthlyReport, computeReportSummary, buildReportFinancials | ✓ |
| `pdf-service.js` | تصدير PDF احترافي (RTL + عربي) | exportMonthlyReport, exportCommissionsReport, exportLedgerStatement | ✗ |

### التخزين (4 ملف)
| الملف | الوظيفة | دوال رئيسية | اختبارات |
|--------|---------|-------------|----------|
| `storage-facade.js` | الواجهة الموحدة للتخزين | getRaw, setRaw, getJSON, setJSON | ✗ |
| `storage-quota.js` | فحص حصة التخزين | checkStorageQuota | ✗ |
| `supabase.js` | عميل Supabase المركزي | supabase (client), isSupabaseConfigured, getCurrentUser | ✗ |
| `supabase-store.js` | طبقة بيانات Supabase السحابية (873 سطر) | profile.*, office.*, ledger.*, transaction.*, recurringItem.* | ✗ |

### البيانات والعقود (2 ملف)
| الملف | الوظيفة | دوال رئيسية | اختبارات |
|--------|---------|-------------|----------|
| `dataStore.js` | طبقة التخزين والبيانات | safeGet, safeSet, getActiveLedgerIdSafe, createCRUD | ✓ |
| `contracts.js` | الصحة المؤسسية (invariants) | invariant, assertFn, assertObj, assertArr | ✓ |

### الأدوات والإعدادات (3 ملف)
| الملف | الوظيفة | دوال رئيسية | اختبارات |
|--------|---------|-------------|----------|
| `theme-ui.js` | ثيم الواجهة والأرقام | getSavedTheme, getEffectiveTheme, setTheme, toggleNumerals | ✗ |
| `saudi-pricing.js` | معادلات التسعير السعودي | computeSuggestedAmount, CITY_FACTORS, SIZE_FACTORS | ✗ |
| `recurring-intelligence.js` | ذكاء البنود المتكررة | normalizeCategory, normalizeRisk, isDueWithinDays, isPastDue | ✗ |

### الربط (1 ملف)
| الملف | الوظيفة | اختبارات |
|--------|---------|----------|
| `exports-map.js` | خريطة الصادرات الموحدة — يعيد تصدير ledgerBrain, ledgerForecast, ledgerVariance | ✗ |

## تغطية الاختبارات

**8 ملفات مغطاة** من أصل 24 — الأولوية لتغطية الملفات غير المختبرة:

| ملف الاختبار | يغطي |
|-------------|-------|
| `alert-engine.test.js` | alert-engine |
| `contract-payment-service.test.js` | contract-payment-service |
| `contracts.test.js` | contracts |
| `dataStore-seed.test.js` | dataStore |
| `inbox-engine.test.js` | inbox-engine |
| `ledger-analytics.test.js` | ledger-analytics |
| `monthly-report-generator.test.js` | monthly-report-generator |
| `pulse-engine.test.js` | pulse-engine |
| `smoke.test.js` | smoke tests عامة |

## خريطة الاعتمادات

**الأكثر استخداماً:**
- `ledger-store.js` ← يعتمد عليه 8 ملفات
- `dataStore.js` ← يعتمد عليه 7 ملفات
- `recurring-intelligence.js` ← يعتمد عليه 3 ملفات

**ملفات معزولة (بدون اعتمادات core):**
- `contracts.js`, `storage-quota.js`, `saudi-pricing.js`, `theme-ui.js`
