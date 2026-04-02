// ledger-helpers — ثوابت ومساعدات مشتركة بين hooks الدفاتر

export const LEDGER_TYPE_LABELS = {
  office: 'مكتب',
  chalet: 'شاليه',
  apartment: 'شقة',
  villa: 'فيلا',
  building: 'عمارة',
  personal: 'شخصي',
  other: 'أخرى',
};

export const CATEGORY_LABEL = {
  system: 'إيجار ورسوم',
  operational: 'تشغيل ومرافق',
  maintenance: 'صيانة',
  marketing: 'تسويق وإعلان',
  adhoc: 'عند الحاجة',
};

export const sections = [
  { key: 'system', title: 'نظامي' },
  { key: 'operational', title: 'تشغيلي' },
  { key: 'maintenance', title: 'صيانة' },
  { key: 'marketing', title: 'تسويق' },
  { key: 'adhoc', title: 'عند الحاجة' },
  { key: 'uncategorized', title: 'أخرى' },
];

// دعم الأرقام العربية/الهندية والفواصل الشائعة لتحليل المبالغ
export const normalizeNumeralsToAscii = (input) => {
  const s = String(input ?? '');
  const map = {
    '٠': '0',
    '١': '1',
    '٢': '2',
    '٣': '3',
    '٤': '4',
    '٥': '5',
    '٦': '6',
    '٧': '7',
    '٨': '8',
    '٩': '9',
    '۰': '0',
    '۱': '1',
    '۲': '2',
    '۳': '3',
    '۴': '4',
    '۵': '5',
    '۶': '6',
    '۷': '7',
    '۸': '8',
    '۹': '9',
  };
  return s
    .split('')
    .map((ch) => map[ch] ?? ch)
    .join('')
    .replace(/[\s\u00A0]/g, '')
    .replace(/[٬,]/g, '')
    .replace(/[٫]/g, '.');
};

export const parseRecurringAmount = (raw) => {
  const normalized = normalizeNumeralsToAscii(raw);
  const n = Number(normalized);
  return Number.isFinite(n) ? n : NaN;
};

export const ensureDateValue = (d) => {
  const x = String(d || '').trim();
  if (x) return x;
  const t = new Date();
  t.setDate(t.getDate() + 30);
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
};
