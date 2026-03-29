# Domain Logic — قائمة محدّثة (v2)

> آخر تحديث: 2026-03-29

طبقة `src/domain/` تحتوي **منطق الأعمال النقي** — بدون React، بدون side effects، بدون تخزين.
كل دالة تستقبل بيانات وتُرجع نتيجة.

## الملفات (23 ملف + index)

### المالية والمدفوعات
| الملف | الوظيفة | دوال رئيسية |
|--------|---------|-------------|
| `transactions.js` | فلترة وترتيب المعاملات المالية | filterTransactions, sortTransactions |
| `commissions.js` | فلترة العمولات حسب الحالة/الوكيل/التاريخ | filterCommissions |
| `contract-finance.js` | بناء الجداول المالية وحساب ماليات العقد | buildContractSchedule, buildContractFinancials |
| `contract-payments.js` | التحقق من بيانات الدفع وبناء payloads | validatePayment, buildPaymentPayload, buildTransactionPayload |
| `receipt.js` | توليد أرقام الإيصالات وبناء النموذج الموحد | generateReceiptNumber (RCP-YYYYMMDD-XXXX), buildReceiptModel, buildReceiptFromDue |
| `dues.js` | تجميع المستحقات التشغيلية واكتشاف العقود المنتهية | buildOperationalDues, getExpiringContracts |

### العقود
| الملف | الوظيفة |
|--------|---------|
| `contracts.js` | خيارات نوع/حالة/دورة الدفع — حسابات الدورات وعدد الأقساط |
| `contract-alerts.js` | توليد كائنات التنبيه (id, type, severity, title, actionType) متوافقة مع alert-engine |

### الدفاتر والبنود المتكررة
| الملف | الوظيفة |
|--------|---------|
| `ledgers.js` | إنشاء/إدارة الدفاتر (مكتب، شاليه، شقة، فيلا، عمارة، شخصي، أخرى) + توليد IDs |
| `ledgerTemplates.js` | قوالب البنود المتكررة حسب نوع الدفتر |
| `recurringItems.js` | إنشاء بنود متكررة مع التكرار والمبالغ وتواريخ الاستحقاق |

### العقارات والوحدات
| الملف | الوظيفة |
|--------|---------|
| `properties.js` | خيارات نوع/حالة العقار (شقة، فيلا، مكتب، أرض، مستودع) + قائمة المدن السعودية |
| `units.js` | خيارات نوع/حالة الوحدة + helpers للتسميات والألوان |

### جهات الاتصال
| الملف | الوظيفة |
|--------|---------|
| `contacts.js` | أنواع جهات الاتصال (مستأجر، مالك، مشتري، وكيل، مورد) + أنواع الهوية (وطنية، إقامة، جواز) + بيانات المدن |

### التقويم والوقت
| الملف | الوظيفة |
|--------|---------|
| `calendar.js` | بناء شبكة التقويم الشهري (42 يوم: الشهر السابق + الحالي + التالي) |
| `utils.js` | تحويل ميلادي ↔ هجري — توليد مفاتيح التاريخ — أيام الشهر |

### المراسلات والتوثيق
| الملف | الوظيفة |
|--------|---------|
| `letters.js` | التحقق من الحقول المطلوبة للخطابات مقابل القوالب |
| `letterTemplates.js` | قوالب الخطابات (تعريف، طلب، تفويض) مع نصوص عربية افتراضية |
| `drafts.js` | تنسيق التواريخ للمسودات (ميلادي + هجري) |
| `notes.js` | إضافة/تبديل/حذف الملاحظات اليومية — إدارة الملاحظات المثبتة بألوان |

### التقارير والتحليلات
| الملف | الوظيفة |
|--------|---------|
| `reports.js` | حساب نطاقات التواريخ للداشبورد (هذا الشهر، آخر 3، آخر 6، هذا العام، مخصص) |
| `charts.js` | تحليل مفاتيح الأشهر وحساب نطاقات البيانات الفعلية للرسوم البيانية |

## الاختبارات (`__tests__/`)

| ملف الاختبار | يغطي |
|-------------|-------|
| `contract-finance.test.js` | buildContractSchedule, buildContractFinancials |
| `contract-payments.test.js` | validatePayment, buildPaymentPayload, buildTransactionPayload |
| `dues.test.js` | buildOperationalDues, getExpiringContracts |
| `receipt.test.js` | generateReceiptNumber, buildReceiptModel, buildReceiptFromDue |

## القواعد الثابتة

1. **لا React** — لا imports, لا hooks, لا DOM
2. **لا side effects** — لا fetch, لا localStorage, لا console.log
3. **Pure functions فقط** — نفس المدخلات = نفس المخرجات
4. **JSDoc إلزامي** — كل دالة مُصدّرة موثقة
5. **الأموال بالهللات** (0.01 ر.س) لتفادي أخطاء التقريب
6. **اختبارات إلزامية** لأي ملف جديد في domain/
