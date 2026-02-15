/*
  قيد العقار — ثوابت التطبيق (مستخرجة من App.jsx)
  الخطوة 1: استخراج الثوابت والدوال المساعدة
*/

import { STORAGE_KEYS } from '../../assets/js/core/keys.js';

// ============================================
// KEYS (مفاتيح التخزين)
// ============================================
export const KEYS = {
  transactions: STORAGE_KEYS.TRANSACTIONS,
  commissions: STORAGE_KEYS.COMMISSIONS,
  drafts: STORAGE_KEYS.DRAFTS,
  settings: STORAGE_KEYS.SETTINGS,
  seeded: STORAGE_KEYS.SEEDED,
};

// ============================================
// TYPES (أنواع الحركات والعمولات والخطابات)
// ============================================
export const TRANSACTION_TYPES = { income: 'دخل', expense: 'خرج' };
export const TRANSACTION_CATEGORIES = { commission: 'عمولة', expense: 'مصروفات', deposit: 'إيداع', refund: 'استرجاع', salary: 'راتب', rent: 'إيجار', other: 'أخرى' };
export const PAYMENT_METHODS = { cash: 'نقدي', bank_transfer: 'تحويل بنكي', check: 'شيك', electronic: 'بطاقة إلكترونية' };
export const COMMISSION_STATUSES = { pending: 'معلقة', paid: 'مدفوعة' };
export const LETTER_TYPES = { intro: 'خطاب تعريف', request: 'خطاب مخاطبة', delegation: 'خطاب تفويض' };

// ============================================
// رسائل النجاح والخطأ والأزرار
// ============================================
export const MSG = {
  success: { saved: 'تم التسجيل بنجاح', updated: 'تم تحديث البيانات', deleted: 'تم الحذف بنجاح', transaction: 'تم تسجيل العملية المالية', commission: 'تم تسجيل العمولة بنجاح' },
  error: { required: 'هذا الحقل مطلوب', invalidAmount: 'المبلغ المدخل غير صحيح', duplicate: 'هذا العنصر موجود بالفعل', deleteFailed: 'لم يتم الحذف. يُنصح بالمحاولة مرة أخرى' },
  confirm: { deleteAction: 'هل أنت متأكد من هذا الإجراء؟' },
  buttons: { save: 'تسجيل البيانات', cancel: 'تراجع', delete: 'حذف نهائي' },
};

// ============================================
// خيارات فترة لوحة التحكم
// ============================================
export const DASHBOARD_PERIOD_OPTIONS = [
  { v: 'thisMonth', l: 'هذا الشهر' },
  { v: 'last3', l: 'آخر 3 أشهر' },
  { v: 'last6', l: 'آخر 6 أشهر' },
  { v: 'thisYear', l: 'هذا العام' },
  { v: 'custom', l: 'مخصص' },
];

// ============================================
// التنقل — مصفوفة بأسماء الأيقونات (يتم ربطها بـ Icons في App)
// ============================================
export const NAV_ITEMS = [
  { id: 'home', label: 'الرئيسية', iconKey: 'home' },
  { id: 'transactions', label: 'الحركات المالية', iconKey: 'list', group: 'finance' },
  { id: 'commissions', label: 'العمولات', iconKey: 'percent', group: 'finance' },
  { id: 'ledgers', label: 'الدفاتر', iconKey: 'list', group: 'finance' },
  { id: 'templates', label: 'قوالب الخطابات', iconKey: 'mail', group: 'letters' },
  { id: 'generator', label: 'إنشاء خطاب', iconKey: 'fileText', group: 'letters' },
  { id: 'drafts', label: 'المسودات', iconKey: 'fileText', group: 'letters' },
  { id: 'calendar', label: 'التقويم', iconKey: 'calendar', group: 'notes' },
  { id: 'notes', label: 'الملاحظات', iconKey: 'notes', group: 'notes' },
  { id: 'help', label: 'دليل سريع', iconKey: 'info' },
  { id: 'settings', label: 'الإعدادات', iconKey: 'settings' },
];

// ============================================
// بيانات البذور (Seed) — واقعية وتغطي آخر 6 أشهر للوحة التحكم والبحث
// ============================================
export const SEED_TRANSACTIONS = [
  // أيلول 2025
  { type: 'income', category: 'commission', amount: 22000, paymentMethod: 'bank_transfer', date: '2025-09-05', description: 'عمولة بيع شقة - عميل عبدالرحمن الشمري' },
  { type: 'expense', category: 'rent', amount: 12000, paymentMethod: 'bank_transfer', date: '2025-09-01', description: 'إيجار مكتب شهر سبتمبر' },
  { type: 'income', category: 'deposit', amount: 45000, paymentMethod: 'bank_transfer', date: '2025-09-12', description: 'دفعة عقد بيع أرض - شركة المستقبل العقارية' },
  { type: 'expense', category: 'expense', amount: 2800, paymentMethod: 'cash', date: '2025-09-18', description: 'صيانة دورات مياه وإصلاح إضاءة' },
  { type: 'income', category: 'commission', amount: 9500, paymentMethod: 'check', date: '2025-09-22', description: 'عمولة تأجير محل - حي النخيل' },
  { type: 'expense', category: 'salary', amount: 7500, paymentMethod: 'bank_transfer', date: '2025-09-28', description: 'راتب سكرتير مكتب' },
  // تشرين الأول 2025
  { type: 'income', category: 'commission', amount: 18500, paymentMethod: 'bank_transfer', date: '2025-10-03', description: 'عمولة بيع فيلا - عائلة الدوسري' },
  { type: 'expense', category: 'rent', amount: 12000, paymentMethod: 'bank_transfer', date: '2025-10-01', description: 'إيجار مكتب شهر أكتوبر' },
  { type: 'income', category: 'refund', amount: 1500, paymentMethod: 'cash', date: '2025-10-08', description: 'استرجاع مصروف إعلان ملغى' },
  { type: 'expense', category: 'expense', amount: 4200, paymentMethod: 'electronic', date: '2025-10-15', description: 'إعلانات ورقية ولوحات إرشادية' },
  { type: 'income', category: 'commission', amount: 31000, paymentMethod: 'bank_transfer', date: '2025-10-20', description: 'عمولة بيع أرض سكنية - عميل ناصر العتيبي' },
  { type: 'expense', category: 'other', amount: 1100, paymentMethod: 'cash', date: '2025-10-25', description: 'مصروفات مكتبية وقرطاسية' },
  // تشرين الثاني 2025
  { type: 'income', category: 'commission', amount: 14200, paymentMethod: 'bank_transfer', date: '2025-11-02', description: 'عمولة تأجير فيلا - عميل خالد المطيري' },
  { type: 'expense', category: 'rent', amount: 12000, paymentMethod: 'bank_transfer', date: '2025-11-01', description: 'إيجار مكتب شهر نوفمبر' },
  { type: 'income', category: 'deposit', amount: 28000, paymentMethod: 'check', date: '2025-11-10', description: 'دفعة عميل - صفقة بيع محل تجاري' },
  { type: 'expense', category: 'salary', amount: 7500, paymentMethod: 'bank_transfer', date: '2025-11-28', description: 'راتب سكرتير مكتب' },
  { type: 'income', category: 'commission', amount: 8800, paymentMethod: 'cash', date: '2025-11-15', description: 'عمولة وساطة تأجير شقة - حي الروضة' },
  { type: 'expense', category: 'expense', amount: 3500, paymentMethod: 'electronic', date: '2025-11-20', description: 'مصروفات تسويق رقمي ومنصات عقارية' },
  // كانون الأول 2025
  { type: 'income', category: 'commission', amount: 26500, paymentMethod: 'bank_transfer', date: '2025-12-05', description: 'عمولة بيع عمارة - شركة الأمان للاستثمار' },
  { type: 'expense', category: 'rent', amount: 12000, paymentMethod: 'bank_transfer', date: '2025-12-01', description: 'إيجار مكتب شهر ديسمبر' },
  { type: 'income', category: 'commission', amount: 12000, paymentMethod: 'bank_transfer', date: '2025-12-12', description: 'عمولة تأجير مكتب - شركة التقنية المتقدمة' },
  { type: 'expense', category: 'expense', amount: 2100, paymentMethod: 'cash', date: '2025-12-18', description: 'صيانة تكييف وتنظيف واجهة' },
  { type: 'income', category: 'refund', amount: 800, paymentMethod: 'cash', date: '2025-12-22', description: 'استرجاع رسوم إضافية عميل' },
  { type: 'expense', category: 'other', amount: 900, paymentMethod: 'cash', date: '2025-12-28', description: 'ضيافة عملاء وقهوة مكتب' },
  // كانون الثاني 2026
  { type: 'income', category: 'commission', amount: 38000, paymentMethod: 'bank_transfer', date: '2026-01-08', description: 'عمولة بيع أرض تجارية - عميل فيصل القحطاني' },
  { type: 'expense', category: 'rent', amount: 12000, paymentMethod: 'bank_transfer', date: '2026-01-01', description: 'إيجار مكتب شهر يناير' },
  { type: 'income', category: 'deposit', amount: 52000, paymentMethod: 'bank_transfer', date: '2026-01-14', description: 'دفعة عقد بيع فيلا - عائلة السعيد' },
  { type: 'expense', category: 'salary', amount: 8000, paymentMethod: 'bank_transfer', date: '2026-01-30', description: 'راتب موظف محاسبة' },
  { type: 'income', category: 'commission', amount: 15500, paymentMethod: 'check', date: '2026-01-20', description: 'عمولة تأجير شقة - حي الورود' },
  { type: 'expense', category: 'expense', amount: 4100, paymentMethod: 'electronic', date: '2026-01-25', description: 'إعلانات وإعلانات منزلية' },
  // شباط 2026
  { type: 'income', category: 'commission', amount: 28400, paymentMethod: 'bank_transfer', date: '2026-02-03', description: 'عمولة بيع أرض - شركة النخيل العقارية' },
  { type: 'expense', category: 'rent', amount: 12000, paymentMethod: 'bank_transfer', date: '2026-02-01', description: 'إيجار مكتب شهر فبراير' },
  { type: 'income', category: 'commission', amount: 19200, paymentMethod: 'bank_transfer', date: '2026-02-10', description: 'عمولة بيع محل - عميل سعد الدوسري' },
  { type: 'expense', category: 'expense', amount: 3200, paymentMethod: 'cash', date: '2026-02-07', description: 'مصروفات تسويق وطباعة بروشورات' },
  { type: 'income', category: 'refund', amount: 1200, paymentMethod: 'cash', date: '2026-02-12', description: 'استرجاع مصروفات عميل' },
  { type: 'expense', category: 'other', amount: 1850, paymentMethod: 'electronic', date: '2026-02-15', description: 'مصروفات متنوعة واشتراكات' },
];

export const SEED_COMMISSIONS = [
  { clientName: 'صفقة بيع فيلا - عميل خالد الشمري', dealValue: 850000, officePercent: 3, agentName: 'محمد السعيد', agentPercent: 97, status: 'pending', dueDate: '2026-03-05' },
  { clientName: 'تأجير محل تجاري - شركة النور للتجارة', dealValue: 320000, officePercent: 2, agentName: 'فهد العتيبي', agentPercent: 98, status: 'paid', dueDate: '2025-10-15', paidDate: '2025-10-18' },
  { clientName: 'بيع أرض سكنية - حي الملقا', dealValue: 650000, officePercent: 2.5, agentName: 'سارة القحطاني', agentPercent: 97.5, status: 'pending', dueDate: '2026-03-20' },
  { clientName: 'تأجير فيلا - عائلة الأحمد', dealValue: 180000, officePercent: 3, agentName: 'عبدالله المطيري', agentPercent: 97, status: 'paid', dueDate: '2025-09-20', paidDate: '2025-09-22' },
  { clientName: 'بيع شقة - عميل ناصر الدوسري', dealValue: 420000, officePercent: 2, agentName: 'نورة الدوسري', agentPercent: 98, status: 'pending', dueDate: '2026-04-01' },
  { clientName: 'استثمار عقاري - شركة الخليج للاستثمار', dealValue: 1500000, officePercent: 1.5, agentName: 'أحمد الشمري', agentPercent: 98.5, status: 'paid', dueDate: '2026-01-10', paidDate: '2026-01-12' },
  { clientName: 'تأجير مكتب - شركة التقنية المتقدمة', dealValue: 240000, officePercent: 2.5, agentName: 'ريم العتيبي', agentPercent: 97.5, status: 'paid', dueDate: '2025-12-01', paidDate: '2025-12-03' },
  { clientName: 'بيع أرض تجارية - عميل فيصل القحطاني', dealValue: 1200000, officePercent: 2, agentName: 'خالد المطيري', agentPercent: 98, status: 'pending', dueDate: '2026-04-15' },
  { clientName: 'تأجير شقة - عميل عبدالرحمن', dealValue: 90000, officePercent: 3, agentName: 'لطيفة السعيد', agentPercent: 97, status: 'paid', dueDate: '2025-11-10', paidDate: '2025-11-12' },
  { clientName: 'بيع محل - حي النخيل', dealValue: 580000, officePercent: 2.5, agentName: 'سعد الدوسري', agentPercent: 97.5, status: 'pending', dueDate: '2026-03-25' },
];

export const SEED_DRAFTS = [
  { templateType: 'intro', fields: { officeName: 'مكتب مثال العقاري', recipientName: 'السيد أحمد', recipientOrg: 'شركة العقار الذهبي', date: '2025-02-15', managerName: 'خالد الأحمد' } },
  { templateType: 'request', fields: { officeName: 'مكتب مثال العقاري', recipientOrg: 'بلدية بريدة', subject: 'طلب تصريح', body: 'نرجو التكرم بإصدار تصريح...', date: '2025-02-10', managerName: 'خالد الأحمد' } },
];

export const SEED_SETTINGS = { officeName: 'مكتب مثال العقاري', phone: '0501234567', email: 'info@example-realestate.sa', defaultCommissionPercent: 50, theme: 'light', numerals: 'ar' };

// ============================================
// نسخة احتياطية ورسائل تخزين
// ============================================
export const BACKUP_VERSION = 1;
export const STORAGE_ERROR_MESSAGE = 'لم يتم الحفظ. مساحة التخزين ممتلئة. يُنصح بتصدير نسخة احتياطية ثم حذف بعض البيانات.';

// ============================================
// إعادة تصدير مجمّعة (default)
// ============================================
export default {
  KEYS,
  MSG,
  TRANSACTION_TYPES,
  TRANSACTION_CATEGORIES,
  PAYMENT_METHODS,
  COMMISSION_STATUSES,
  LETTER_TYPES,
  DASHBOARD_PERIOD_OPTIONS,
  NAV_ITEMS,
  SEED_TRANSACTIONS,
  SEED_COMMISSIONS,
  SEED_DRAFTS,
  SEED_SETTINGS,
  BACKUP_VERSION,
  STORAGE_ERROR_MESSAGE,
};
