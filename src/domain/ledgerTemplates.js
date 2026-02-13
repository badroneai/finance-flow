// Ledger Templates System (seed recurring items)
// Purpose: Provide ready-made recurring items per ledger type.

const asType = (t) => String(t || '').toLowerCase();

const pad2 = (n) => String(n).padStart(2, '0');

const toISODate = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

const addDays = (d, days) => {
  const x = new Date(d.getTime());
  x.setDate(x.getDate() + Number(days || 0));
  return x;
};

const firstOfNextMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 1);

const mk = ({
  title,
  frequency,
  nextDueDate,
  notes,
  category,
  required,
  riskLevel,
  saHint,
  priceBand,
  defaultFreq,
  cityFactorEligible,
}) => ({
  title: String(title || '').trim(),
  amount: 0,
  frequency,
  nextDueDate,
  notes: String(notes || '').trim(),
  // Intelligence metadata (seeded only)
  category, // system | operational | maintenance | marketing
  required: !!required,
  riskLevel, // high | medium | low
  // Saudi template metadata (seeded only)
  saHint: String(saHint || '').trim(),
  priceBand: priceBand && typeof priceBand === 'object' ? priceBand : null, // {min,max,typical}
  defaultFreq: String(defaultFreq || frequency || '').trim(),
  cityFactorEligible: !!cityFactorEligible,
});

export const LEDGER_TEMPLATES = {
  // Saudi Real-estate office
  office: ({ todayISO }) => ([
    mk({ title: 'إيجار المكتب', frequency: 'monthly', defaultFreq: 'monthly', nextDueDate: todayISO, notes: 'إلزامي غالبًا', category: 'system', required: true, riskLevel: 'high', saHint: 'أساس التشغيل (موقع/سمعة).', priceBand: { min: 2500, max: 18000, typical: 7000 }, cityFactorEligible: true }),
    mk({ title: 'رواتب الموظفين', frequency: 'monthly', defaultFreq: 'monthly', nextDueDate: todayISO, notes: 'حسب الفريق', category: 'system', required: true, riskLevel: 'high', saHint: 'لا تتأخر عن الرواتب.', priceBand: { min: 0, max: 45000, typical: 12000 }, cityFactorEligible: true }),
    mk({ title: 'كهرباء المكتب', frequency: 'monthly', defaultFreq: 'monthly', nextDueDate: todayISO, notes: '', category: 'system', required: true, riskLevel: 'medium', saHint: 'خاصة مع التكييف.', priceBand: { min: 200, max: 2500, typical: 650 }, cityFactorEligible: true }),
    mk({ title: 'إنترنت / اتصالات', frequency: 'monthly', defaultFreq: 'monthly', nextDueDate: todayISO, notes: '', category: 'operational', required: true, riskLevel: 'medium', saHint: 'العميل يتواصل دائمًا.', priceBand: { min: 200, max: 1200, typical: 350 }, cityFactorEligible: false }),
    mk({ title: 'مياه / خدمات', frequency: 'monthly', defaultFreq: 'monthly', nextDueDate: todayISO, notes: '', category: 'system', required: false, riskLevel: 'low', saHint: 'بنود صغيرة لكن تتكرر.', priceBand: { min: 0, max: 600, typical: 150 }, cityFactorEligible: false }),
    mk({ title: 'مستلزمات مكتبية (ورق/حبر)', frequency: 'monthly', defaultFreq: 'monthly', nextDueDate: todayISO, notes: '', category: 'operational', required: false, riskLevel: 'low', saHint: 'تحافظ على انسيابية العمل.', priceBand: { min: 0, max: 800, typical: 200 }, cityFactorEligible: false }),
    mk({ title: 'ضيافة/قهوة/مستلزمات', frequency: 'monthly', defaultFreq: 'monthly', nextDueDate: todayISO, notes: '', category: 'operational', required: false, riskLevel: 'low', saHint: 'تعكس احترافية المكتب.', priceBand: { min: 0, max: 1200, typical: 300 }, cityFactorEligible: false }),
    mk({ title: 'اشتراك منصات عقارية', frequency: 'monthly', defaultFreq: 'monthly', nextDueDate: todayISO, notes: 'مثل: عقار/حراج/…', category: 'marketing', required: false, riskLevel: 'low', saHint: 'مصدر leads.', priceBand: { min: 0, max: 6000, typical: 800 }, cityFactorEligible: true }),
    mk({ title: 'مصروفات تسويق وإعلانات', frequency: 'monthly', defaultFreq: 'monthly', nextDueDate: todayISO, notes: '', category: 'marketing', required: false, riskLevel: 'low', saHint: 'يزيد تدفق العملاء.', priceBand: { min: 0, max: 15000, typical: 2000 }, cityFactorEligible: true }),
    mk({ title: 'بنزين/تنقلات فريق الميدان', frequency: 'monthly', defaultFreq: 'monthly', nextDueDate: todayISO, notes: '', category: 'operational', required: false, riskLevel: 'medium', saHint: 'زيارات ومعاينات.', priceBand: { min: 0, max: 4000, typical: 800 }, cityFactorEligible: true }),
    mk({ title: 'تصوير/مونتاج (اختياري)', frequency: 'monthly', defaultFreq: 'monthly', nextDueDate: todayISO, notes: 'للعروض', category: 'marketing', required: false, riskLevel: 'low', saHint: 'يحسن عرض العقار.', priceBand: { min: 0, max: 5000, typical: 700 }, cityFactorEligible: true }),
    mk({ title: 'صيانة عامة للمكتب', frequency: 'quarterly', defaultFreq: 'quarterly', nextDueDate: todayISO, notes: '', category: 'maintenance', required: false, riskLevel: 'medium', saHint: 'تجنب الأعطال الصغيرة.', priceBand: { min: 0, max: 2500, typical: 500 }, cityFactorEligible: false }),
    mk({ title: 'نظافة/عامل (اختياري)', frequency: 'monthly', defaultFreq: 'monthly', nextDueDate: todayISO, notes: '', category: 'operational', required: false, riskLevel: 'low', saHint: 'حسب حجم المكتب.', priceBand: { min: 0, max: 3500, typical: 800 }, cityFactorEligible: true }),
    mk({ title: 'تجديد رخص/اشتراكات (سنوي)', frequency: 'yearly', defaultFreq: 'yearly', nextDueDate: todayISO, notes: '', category: 'system', required: true, riskLevel: 'high', saHint: 'لا توقف العمل بسبب انتهاء التراخيص.', priceBand: { min: 0, max: 12000, typical: 2500 }, cityFactorEligible: false }),
    mk({ title: 'مصاريف طوارئ', frequency: 'adhoc', defaultFreq: 'adhoc', nextDueDate: todayISO, notes: 'احتياطي', category: 'operational', required: false, riskLevel: 'high', saHint: 'للأمور المفاجئة.', priceBand: { min: 0, max: 0, typical: 0 }, cityFactorEligible: false }),
  ]),

  // Chalet / Rest house
  chalet: ({ todayISO }) => ([
    mk({ title: 'كهرباء', frequency: 'monthly', defaultFreq: 'monthly', nextDueDate: todayISO, notes: '', category: 'system', required: true, riskLevel: 'high', saHint: 'التكييف يرفع الفاتورة.', priceBand: { min: 150, max: 2500, typical: 650 }, cityFactorEligible: true }),
    mk({ title: 'ماء', frequency: 'monthly', defaultFreq: 'monthly', nextDueDate: todayISO, notes: '', category: 'system', required: true, riskLevel: 'medium', saHint: 'خصوصًا في المسابح.', priceBand: { min: 0, max: 800, typical: 180 }, cityFactorEligible: false }),
    mk({ title: 'إنترنت (اختياري)', frequency: 'monthly', defaultFreq: 'monthly', nextDueDate: todayISO, notes: '', category: 'operational', required: false, riskLevel: 'low', saHint: 'للضيوف/المالك.', priceBand: { min: 0, max: 400, typical: 200 }, cityFactorEligible: false }),
    mk({ title: 'صيانة المكيفات', frequency: 'quarterly', defaultFreq: 'quarterly', nextDueDate: todayISO, notes: 'قبل الصيف', category: 'maintenance', required: true, riskLevel: 'high', saHint: 'تجنب الأعطال وقت الذروة.', priceBand: { min: 200, max: 1500, typical: 450 }, cityFactorEligible: false }),
    mk({ title: 'تنظيف (بعد كل حجز)', frequency: 'adhoc', defaultFreq: 'adhoc', nextDueDate: todayISO, notes: 'حسب الاستخدام', category: 'operational', required: false, riskLevel: 'medium', saHint: 'أساسي للتقييمات.', priceBand: { min: 150, max: 600, typical: 250 }, cityFactorEligible: true }),
    mk({ title: 'عامل نظافة/تنظيف', frequency: 'monthly', defaultFreq: 'monthly', nextDueDate: todayISO, notes: 'حسب الاستخدام', category: 'operational', required: false, riskLevel: 'medium', saHint: 'مناسب للمواسم.', priceBand: { min: 0, max: 3000, typical: 900 }, cityFactorEligible: true }),
    mk({ title: 'مستلزمات (مناديل/منظفات)', frequency: 'monthly', defaultFreq: 'monthly', nextDueDate: todayISO, notes: '', category: 'operational', required: false, riskLevel: 'low', saHint: 'بنود صغيرة لكنها دائمة.', priceBand: { min: 0, max: 600, typical: 200 }, cityFactorEligible: false }),
    mk({ title: 'صيانة المسبح (إن وجد)', frequency: 'monthly', defaultFreq: 'monthly', nextDueDate: todayISO, notes: '', category: 'maintenance', required: false, riskLevel: 'medium', saHint: 'نظافة المياه مهمة.', priceBand: { min: 0, max: 1500, typical: 500 }, cityFactorEligible: true }),
    mk({ title: 'صيانة الحديقة', frequency: 'monthly', defaultFreq: 'monthly', nextDueDate: todayISO, notes: '', category: 'maintenance', required: false, riskLevel: 'low', saHint: 'ري وتشجير.', priceBand: { min: 0, max: 1200, typical: 350 }, cityFactorEligible: true }),
    mk({ title: 'مكافحة حشرات', frequency: 'quarterly', defaultFreq: 'quarterly', nextDueDate: todayISO, notes: '', category: 'maintenance', required: false, riskLevel: 'medium', saHint: 'خصوصًا في المزارع.', priceBand: { min: 0, max: 800, typical: 250 }, cityFactorEligible: true }),
    mk({ title: 'تأمين/حراسة (اختياري)', frequency: 'monthly', defaultFreq: 'monthly', nextDueDate: todayISO, notes: 'اختياري', category: 'system', required: false, riskLevel: 'low', saHint: 'حسب الموقع.', priceBand: { min: 0, max: 4000, typical: 1200 }, cityFactorEligible: true }),
    mk({ title: 'صيانة أجهزة/أثاث', frequency: 'quarterly', defaultFreq: 'quarterly', nextDueDate: todayISO, notes: '', category: 'maintenance', required: false, riskLevel: 'low', saHint: 'تمديد عمر الأثاث.', priceBand: { min: 0, max: 1500, typical: 300 }, cityFactorEligible: false }),
    mk({ title: 'تجديد معدات (سنوي)', frequency: 'yearly', defaultFreq: 'yearly', nextDueDate: todayISO, notes: '', category: 'maintenance', required: false, riskLevel: 'medium', saHint: 'مفارش/أدوات شواء…', priceBand: { min: 0, max: 6000, typical: 1500 }, cityFactorEligible: false }),
    mk({ title: 'مصاريف طوارئ', frequency: 'adhoc', defaultFreq: 'adhoc', nextDueDate: todayISO, notes: 'عند الحاجة', category: 'operational', required: false, riskLevel: 'high', saHint: 'احتياطي سريع.', priceBand: { min: 0, max: 0, typical: 0 }, cityFactorEligible: false }),
  ]),

  // Small residential building
  building: ({ todayISO }) => ([
    mk({ title: 'كهرباء (مشتركة)', frequency: 'monthly', defaultFreq: 'monthly', nextDueDate: todayISO, notes: '', category: 'system', required: true, riskLevel: 'high', saHint: 'تؤثر على السلم/المصعد.', priceBand: { min: 200, max: 4000, typical: 900 }, cityFactorEligible: true }),
    mk({ title: 'ماء (مشتركة)', frequency: 'monthly', defaultFreq: 'monthly', nextDueDate: todayISO, notes: '', category: 'system', required: true, riskLevel: 'high', saHint: 'خاصة لو ري/نظافة.', priceBand: { min: 0, max: 1500, typical: 300 }, cityFactorEligible: false }),
    mk({ title: 'نظافة الممرات', frequency: 'monthly', defaultFreq: 'monthly', nextDueDate: todayISO, notes: '', category: 'operational', required: true, riskLevel: 'medium', saHint: 'تجربة ساكن أفضل.', priceBand: { min: 0, max: 4000, typical: 900 }, cityFactorEligible: true }),
    mk({ title: 'حارس/بواب (إن وجد)', frequency: 'monthly', defaultFreq: 'monthly', nextDueDate: todayISO, notes: '', category: 'operational', required: false, riskLevel: 'medium', saHint: 'حسب عدد الوحدات.', priceBand: { min: 0, max: 7000, typical: 2500 }, cityFactorEligible: true }),
    mk({ title: 'صيانة المصعد (إن وجد)', frequency: 'monthly', defaultFreq: 'monthly', nextDueDate: todayISO, notes: '', category: 'maintenance', required: true, riskLevel: 'high', saHint: 'تجنب الأعطال والشكاوى.', priceBand: { min: 0, max: 2500, typical: 700 }, cityFactorEligible: true }),
    mk({ title: 'صيانة دورية (سباكة/كهرباء)', frequency: 'quarterly', defaultFreq: 'quarterly', nextDueDate: todayISO, notes: '', category: 'maintenance', required: false, riskLevel: 'medium', saHint: 'قلل الأعطال.', priceBand: { min: 0, max: 2500, typical: 500 }, cityFactorEligible: true }),
    mk({ title: 'مكافحة حشرات', frequency: 'quarterly', defaultFreq: 'quarterly', nextDueDate: todayISO, notes: '', category: 'maintenance', required: false, riskLevel: 'medium', saHint: 'يحمي الممتلكات.', priceBand: { min: 0, max: 1000, typical: 300 }, cityFactorEligible: true }),
    mk({ title: 'رسوم/اشتراك كاميرات (إن وجد)', frequency: 'monthly', defaultFreq: 'monthly', nextDueDate: todayISO, notes: '', category: 'system', required: false, riskLevel: 'low', saHint: 'أمان إضافي.', priceBand: { min: 0, max: 600, typical: 120 }, cityFactorEligible: false }),
    mk({ title: 'تأمين المبنى (سنوي)', frequency: 'yearly', defaultFreq: 'yearly', nextDueDate: todayISO, notes: '', category: 'system', required: true, riskLevel: 'high', saHint: 'تخفيف المخاطر.', priceBand: { min: 0, max: 20000, typical: 3500 }, cityFactorEligible: true }),
    mk({ title: 'دهانات/ترميمات (سنوي)', frequency: 'yearly', defaultFreq: 'yearly', nextDueDate: todayISO, notes: '', category: 'maintenance', required: false, riskLevel: 'medium', saHint: 'رفع قيمة العقار.', priceBand: { min: 0, max: 35000, typical: 6000 }, cityFactorEligible: true }),
    mk({ title: 'مصاريف طوارئ', frequency: 'adhoc', defaultFreq: 'adhoc', nextDueDate: todayISO, notes: 'عند الحاجة', category: 'operational', required: false, riskLevel: 'high', saHint: 'احتياطي سريع.', priceBand: { min: 0, max: 0, typical: 0 }, cityFactorEligible: false }),
    mk({ title: 'تحسينات/تجديدات (اختياري)', frequency: 'adhoc', defaultFreq: 'adhoc', nextDueDate: todayISO, notes: 'حسب الحاجة', category: 'maintenance', required: false, riskLevel: 'low', saHint: 'بند اختياري.', priceBand: { min: 0, max: 0, typical: 0 }, cityFactorEligible: false }),
  ]),

  // Villa rental
  villa: ({ todayISO }) => ([
    mk({ title: 'كهرباء', frequency: 'monthly', defaultFreq: 'monthly', nextDueDate: todayISO, notes: '', category: 'system', required: true, riskLevel: 'high', saHint: 'التكييف يرفع الفاتورة.', priceBand: { min: 200, max: 3500, typical: 900 }, cityFactorEligible: true }),
    mk({ title: 'ماء', frequency: 'monthly', defaultFreq: 'monthly', nextDueDate: todayISO, notes: '', category: 'system', required: true, riskLevel: 'medium', saHint: 'حسب الاستهلاك.', priceBand: { min: 0, max: 1200, typical: 220 }, cityFactorEligible: false }),
    mk({ title: 'صيانة المكيفات', frequency: 'quarterly', defaultFreq: 'quarterly', nextDueDate: todayISO, notes: '', category: 'maintenance', required: true, riskLevel: 'high', saHint: 'تجنب الأعطال في الصيف.', priceBand: { min: 200, max: 1800, typical: 500 }, cityFactorEligible: false }),
    mk({ title: 'نظافة/تنظيف', frequency: 'monthly', defaultFreq: 'monthly', nextDueDate: todayISO, notes: '', category: 'operational', required: false, riskLevel: 'medium', saHint: 'حسب السكن.', priceBand: { min: 0, max: 5000, typical: 1200 }, cityFactorEligible: true }),
    mk({ title: 'صيانة سباكة', frequency: 'quarterly', defaultFreq: 'quarterly', nextDueDate: todayISO, notes: '', category: 'maintenance', required: false, riskLevel: 'medium', saHint: 'تسريبات/سخانات.', priceBand: { min: 0, max: 2500, typical: 450 }, cityFactorEligible: true }),
    mk({ title: 'صيانة كهرباء', frequency: 'quarterly', defaultFreq: 'quarterly', nextDueDate: todayISO, notes: '', category: 'maintenance', required: false, riskLevel: 'medium', saHint: 'قواطع/إنارة.', priceBand: { min: 0, max: 2200, typical: 350 }, cityFactorEligible: true }),
    mk({ title: 'صيانة الحديقة', frequency: 'monthly', defaultFreq: 'monthly', nextDueDate: todayISO, notes: '', category: 'maintenance', required: false, riskLevel: 'low', saHint: 'ري وتشجير.', priceBand: { min: 0, max: 1500, typical: 450 }, cityFactorEligible: true }),
    mk({ title: 'مكافحة حشرات', frequency: 'quarterly', defaultFreq: 'quarterly', nextDueDate: todayISO, notes: '', category: 'maintenance', required: false, riskLevel: 'medium', saHint: 'مهم للمنازل.', priceBand: { min: 0, max: 900, typical: 250 }, cityFactorEligible: true }),
    mk({ title: 'تأمين (سنوي)', frequency: 'yearly', defaultFreq: 'yearly', nextDueDate: todayISO, notes: '', category: 'system', required: true, riskLevel: 'high', saHint: 'تخفيف المخاطر.', priceBand: { min: 0, max: 25000, typical: 4500 }, cityFactorEligible: true }),
    mk({ title: 'تجديد أثاث/أجهزة (سنوي)', frequency: 'yearly', defaultFreq: 'yearly', nextDueDate: todayISO, notes: '', category: 'maintenance', required: false, riskLevel: 'medium', saHint: 'رفع جودة التأجير.', priceBand: { min: 0, max: 30000, typical: 4000 }, cityFactorEligible: true }),
    mk({ title: 'مصاريف طوارئ', frequency: 'adhoc', defaultFreq: 'adhoc', nextDueDate: todayISO, notes: 'عند الحاجة', category: 'operational', required: false, riskLevel: 'high', saHint: 'احتياطي سريع.', priceBand: { min: 0, max: 0, typical: 0 }, cityFactorEligible: false }),
    mk({ title: 'تسويق/إعلانات (اختياري)', frequency: 'monthly', defaultFreq: 'monthly', nextDueDate: todayISO, notes: '', category: 'marketing', required: false, riskLevel: 'low', saHint: 'لرفع معدل التأجير.', priceBand: { min: 0, max: 5000, typical: 600 }, cityFactorEligible: true }),
  ]),

  // Personal / individual
  personal: ({ todayISO }) => ([
    mk({ title: 'اشتراك جوال/إنترنت', frequency: 'monthly', defaultFreq: 'monthly', nextDueDate: todayISO, notes: '', category: 'system', required: true, riskLevel: 'medium', saHint: 'أساس التواصل.', priceBand: { min: 150, max: 600, typical: 250 }, cityFactorEligible: false }),
    mk({ title: 'وقود/تنقلات', frequency: 'monthly', defaultFreq: 'monthly', nextDueDate: todayISO, notes: '', category: 'operational', required: false, riskLevel: 'medium', saHint: 'تنقلات يومية.', priceBand: { min: 0, max: 2500, typical: 600 }, cityFactorEligible: true }),
    mk({ title: 'مصروفات منزلية', frequency: 'monthly', defaultFreq: 'monthly', nextDueDate: todayISO, notes: '', category: 'system', required: true, riskLevel: 'high', saHint: 'مواد غذائية/احتياجات.', priceBand: { min: 800, max: 7000, typical: 2500 }, cityFactorEligible: true }),
    mk({ title: 'كهرباء المنزل', frequency: 'monthly', defaultFreq: 'monthly', nextDueDate: todayISO, notes: '', category: 'system', required: true, riskLevel: 'high', saHint: 'يتأثر بالمواسم.', priceBand: { min: 150, max: 3000, typical: 700 }, cityFactorEligible: true }),
    mk({ title: 'ماء المنزل', frequency: 'monthly', defaultFreq: 'monthly', nextDueDate: todayISO, notes: '', category: 'system', required: true, riskLevel: 'medium', saHint: 'حسب الاستهلاك.', priceBand: { min: 0, max: 800, typical: 180 }, cityFactorEligible: false }),
    mk({ title: 'تأمين سيارة (سنوي)', frequency: 'yearly', defaultFreq: 'yearly', nextDueDate: todayISO, notes: '', category: 'system', required: true, riskLevel: 'high', saHint: 'يغطي المخاطر.', priceBand: { min: 0, max: 6000, typical: 1800 }, cityFactorEligible: false }),
    mk({ title: 'صيانة سيارة', frequency: 'quarterly', defaultFreq: 'quarterly', nextDueDate: todayISO, notes: '', category: 'maintenance', required: false, riskLevel: 'medium', saHint: 'زيوت/فلاتر.', priceBand: { min: 0, max: 2000, typical: 350 }, cityFactorEligible: true }),
    mk({ title: 'اشتراك نادي/صحة (اختياري)', frequency: 'monthly', defaultFreq: 'monthly', nextDueDate: todayISO, notes: 'اختياري', category: 'operational', required: false, riskLevel: 'low', saHint: 'حسب نمط الحياة.', priceBand: { min: 0, max: 900, typical: 250 }, cityFactorEligible: true }),
    mk({ title: 'مكافحة حشرات (اختياري)', frequency: 'quarterly', defaultFreq: 'quarterly', nextDueDate: todayISO, notes: 'اختياري', category: 'maintenance', required: false, riskLevel: 'low', saHint: 'حسب المنطقة.', priceBand: { min: 0, max: 700, typical: 200 }, cityFactorEligible: true }),
    mk({ title: 'مصاريف طوارئ', frequency: 'adhoc', defaultFreq: 'adhoc', nextDueDate: todayISO, notes: 'عند الحاجة', category: 'operational', required: false, riskLevel: 'high', saHint: 'احتياطي.', priceBand: { min: 0, max: 0, typical: 0 }, cityFactorEligible: false }),
    mk({ title: 'تسويق/مصاريف شخصية (اختياري)', frequency: 'monthly', defaultFreq: 'monthly', nextDueDate: todayISO, notes: 'اختياري', category: 'marketing', required: false, riskLevel: 'low', saHint: 'حسب النشاط.', priceBand: { min: 0, max: 0, typical: 0 }, cityFactorEligible: false }),
    mk({ title: 'ادخار/استثمار (اختياري)', frequency: 'monthly', defaultFreq: 'monthly', nextDueDate: todayISO, notes: 'اختياري', category: 'operational', required: false, riskLevel: 'low', saHint: 'هدف مالي شخصي.', priceBand: { min: 0, max: 0, typical: 0 }, cityFactorEligible: false }),
  ]),
};

export function getTemplateForLedgerType(type, { now = new Date() } = {}) {
  const t = asType(type);
  const fn = LEDGER_TEMPLATES[t] || LEDGER_TEMPLATES.office;

  // For MVP, choose a logical upcoming date:
  // - Use first day of next month for monthly items.
  // - Else fallback to today + 30/90/365.
  const todayISO = toISODate(now);
  const nextMonthISO = toISODate(firstOfNextMonth(now));
  const plus90ISO = toISODate(addDays(now, 90));
  const plus365ISO = toISODate(addDays(now, 365));

  const raw = fn({ todayISO, nextMonthISO, plus90ISO, plus365ISO });

  // Normalize nextDueDate per frequency when template uses placeholders.
  return (Array.isArray(raw) ? raw : []).map((x) => {
    const freq = x.frequency;
    let nextDueDate = String(x.nextDueDate || '').trim();
    if (!nextDueDate) {
      if (freq === 'monthly') nextDueDate = nextMonthISO;
      else if (freq === 'quarterly') nextDueDate = plus90ISO;
      else if (freq === 'yearly') nextDueDate = plus365ISO;
      else nextDueDate = todayISO;
    }
    return { ...x, nextDueDate };
  });
}

export function seedRecurringForLedger({ ledgerId, ledgerType, now = new Date() } = {}) {
  const lid = String(ledgerId || '').trim();
  if (!lid) return [];

  const ts = new Date(now).toISOString();
  const items = getTemplateForLedgerType(ledgerType, { now });

  return items
    .filter(x => x && String(x.title || '').trim())
    .map((x) => {
      const id = (() => {
        try { if (crypto && typeof crypto.randomUUID === 'function') return `rec_${crypto.randomUUID()}`; } catch {}
        return `rec_${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
      })();

      const freq = (x.frequency === 'monthly' || x.frequency === 'quarterly' || x.frequency === 'yearly' || x.frequency === 'adhoc') ? x.frequency : 'monthly';

      const cat = String(x.category || '').toLowerCase();
      const category = (cat === 'system' || cat === 'operational' || cat === 'maintenance' || cat === 'marketing') ? cat : '';
      const risk = String(x.riskLevel || '').toLowerCase();
      const riskLevel = (risk === 'high' || risk === 'medium' || risk === 'low') ? risk : '';

      const band = x.priceBand && typeof x.priceBand === 'object' ? x.priceBand : null;
      const priceBand = band ? {
        min: Number.isFinite(Number(band.min)) ? Number(band.min) : 0,
        max: Number.isFinite(Number(band.max)) ? Number(band.max) : 0,
        typical: Number.isFinite(Number(band.typical)) ? Number(band.typical) : 0,
      } : null;

      return {
        id,
        ledgerId: lid,
        title: String(x.title || '').trim(),
        // category is used as a lightweight metadata field for seeded obligations
        category,
        required: !!x.required,
        riskLevel,
        // Saudi template metadata
        saHint: String(x.saHint || '').trim(),
        priceBand,
        defaultFreq: String(x.defaultFreq || freq || '').trim(),
        cityFactorEligible: !!x.cityFactorEligible,
        amount: Number.isFinite(Number(x.amount)) ? Number(x.amount) : 0,
        frequency: freq,
        nextDueDate: String(x.nextDueDate || '').trim(),
        notes: String(x.notes || '').trim(),
        createdAt: ts,
        updatedAt: ts,
      };
    });
}
