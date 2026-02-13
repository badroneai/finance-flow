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

const mk = ({ title, frequency, nextDueDate, notes }) => ({
  title: String(title || '').trim(),
  amount: 0,
  frequency,
  nextDueDate,
  notes: String(notes || '').trim(),
});

export const LEDGER_TEMPLATES = {
  office: ({ todayISO }) => ([
    mk({ title: 'إيجار المكتب', frequency: 'monthly', nextDueDate: todayISO, notes: 'إلزامي غالبًا' }),
    mk({ title: 'رواتب الموظفين', frequency: 'monthly', nextDueDate: todayISO, notes: 'حسب الفريق' }),
    mk({ title: 'كهرباء المكتب', frequency: 'monthly', nextDueDate: todayISO, notes: '' }),
    mk({ title: 'إنترنت / اتصالات', frequency: 'monthly', nextDueDate: todayISO, notes: '' }),
    mk({ title: 'اشتراك منصات عقارية', frequency: 'monthly', nextDueDate: todayISO, notes: 'مثل: عقار/حراج/…' }),
    mk({ title: 'مصروفات تسويق وإعلانات', frequency: 'monthly', nextDueDate: todayISO, notes: '' }),
    mk({ title: 'صيانة عامة للمكتب', frequency: 'quarterly', nextDueDate: todayISO, notes: '' }),
    mk({ title: 'تجديد رخص/اشتراكات (سنوي)', frequency: 'yearly', nextDueDate: todayISO, notes: '' }),
    mk({ title: 'ضيافة/قهوة/مستلزمات', frequency: 'monthly', nextDueDate: todayISO, notes: '' }),
  ]),

  chalet: ({ todayISO }) => ([
    mk({ title: 'كهرباء', frequency: 'monthly', nextDueDate: todayISO, notes: '' }),
    mk({ title: 'ماء', frequency: 'monthly', nextDueDate: todayISO, notes: '' }),
    mk({ title: 'صيانة المكيفات', frequency: 'quarterly', nextDueDate: todayISO, notes: 'قبل مواسم الصيف' }),
    mk({ title: 'عامل نظافة/تنظيف', frequency: 'monthly', nextDueDate: todayISO, notes: 'حسب الاستخدام' }),
    mk({ title: 'مستلزمات (مناديل/منظفات)', frequency: 'monthly', nextDueDate: todayISO, notes: '' }),
    mk({ title: 'صيانة المسبح (إن وجد)', frequency: 'monthly', nextDueDate: todayISO, notes: '' }),
    mk({ title: 'صيانة الحديقة', frequency: 'monthly', nextDueDate: todayISO, notes: '' }),
    mk({ title: 'تأمين/حراسة (اختياري)', frequency: 'monthly', nextDueDate: todayISO, notes: 'اختياري' }),
    mk({ title: 'تجديد معدات (سنوي)', frequency: 'yearly', nextDueDate: todayISO, notes: '' }),
  ]),

  building: ({ todayISO }) => ([
    mk({ title: 'كهرباء (مشتركة)', frequency: 'monthly', nextDueDate: todayISO, notes: '' }),
    mk({ title: 'ماء (مشتركة)', frequency: 'monthly', nextDueDate: todayISO, notes: '' }),
    mk({ title: 'صيانة المصعد (إن وجد)', frequency: 'monthly', nextDueDate: todayISO, notes: '' }),
    mk({ title: 'نظافة الممرات', frequency: 'monthly', nextDueDate: todayISO, notes: '' }),
    mk({ title: 'حارس/بواب (إن وجد)', frequency: 'monthly', nextDueDate: todayISO, notes: '' }),
    mk({ title: 'صيانة دورية (سباكة/كهرباء)', frequency: 'quarterly', nextDueDate: todayISO, notes: '' }),
    mk({ title: 'مصاريف طوارئ', frequency: 'adhoc', nextDueDate: todayISO, notes: 'عند الحاجة' }),
    mk({ title: 'تأمين المبنى (سنوي)', frequency: 'yearly', nextDueDate: todayISO, notes: '' }),
    mk({ title: 'دهانات/ترميمات (سنوي)', frequency: 'yearly', nextDueDate: todayISO, notes: '' }),
  ]),

  villa: ({ todayISO }) => ([
    mk({ title: 'كهرباء', frequency: 'monthly', nextDueDate: todayISO, notes: '' }),
    mk({ title: 'ماء', frequency: 'monthly', nextDueDate: todayISO, notes: '' }),
    mk({ title: 'صيانة المكيفات', frequency: 'quarterly', nextDueDate: todayISO, notes: '' }),
    mk({ title: 'صيانة سباكة', frequency: 'quarterly', nextDueDate: todayISO, notes: '' }),
    mk({ title: 'نظافة/تنظيف', frequency: 'monthly', nextDueDate: todayISO, notes: '' }),
    mk({ title: 'صيانة الحديقة', frequency: 'monthly', nextDueDate: todayISO, notes: '' }),
    mk({ title: 'تأمين (سنوي)', frequency: 'yearly', nextDueDate: todayISO, notes: '' }),
    mk({ title: 'مصاريف طوارئ', frequency: 'adhoc', nextDueDate: todayISO, notes: 'عند الحاجة' }),
  ]),

  personal: ({ todayISO }) => ([
    mk({ title: 'اشتراك جوال/إنترنت', frequency: 'monthly', nextDueDate: todayISO, notes: '' }),
    mk({ title: 'وقود/تنقلات', frequency: 'monthly', nextDueDate: todayISO, notes: '' }),
    mk({ title: 'مصروفات منزلية', frequency: 'monthly', nextDueDate: todayISO, notes: '' }),
    mk({ title: 'تأمين سيارة (سنوي)', frequency: 'yearly', nextDueDate: todayISO, notes: '' }),
    mk({ title: 'صيانة سيارة', frequency: 'quarterly', nextDueDate: todayISO, notes: '' }),
    mk({ title: 'ادخار/استثمار', frequency: 'monthly', nextDueDate: todayISO, notes: 'اختياري' }),
    mk({ title: 'تبرعات/مساهمات', frequency: 'monthly', nextDueDate: todayISO, notes: 'اختياري' }),
    mk({ title: 'مصاريف طوارئ', frequency: 'adhoc', nextDueDate: todayISO, notes: 'عند الحاجة' }),
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

      return {
        id,
        ledgerId: lid,
        title: String(x.title || '').trim(),
        category: 'rent',
        amount: Number.isFinite(Number(x.amount)) ? Number(x.amount) : 0,
        frequency: freq,
        nextDueDate: String(x.nextDueDate || '').trim(),
        notes: String(x.notes || '').trim(),
        createdAt: ts,
        updatedAt: ts,
      };
    });
}
