/*
  Domain: Recurring Items
  PR-1 (Ledgers 1/3) — Storage + default ledger (no UI)

  Notes:
  - Pure helpers only.
  - No UI coupling.
*/

const nowISO = () => new Date().toISOString();

const genId = () => {
  try {
    if (crypto && typeof crypto.randomUUID === 'function') return `rec_${crypto.randomUUID()}`;
  } catch {}
  return `rec_${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
};

export function createRecurringItem({ ledgerId, title, category, amount, frequency, nextDueDate, notes }) {
  const ts = nowISO();
  return {
    id: genId(),
    ledgerId: String(ledgerId || ''),
    title: String(title || ''),
    category: String(category || ''),
    amount: Number(amount || 0),
    frequency: String(frequency || ''),
    nextDueDate: String(nextDueDate || ''),
    notes: String(notes || ''),
    createdAt: ts,
    updatedAt: ts,
  };
}

export function withUpdatedAt(item) {
  return { ...item, updatedAt: nowISO() };
}

export function validateRecurringItem(input) {
  const x = input || {};
  const okId = typeof x.id === 'string' && x.id.length > 0;
  const okLedgerId = typeof x.ledgerId === 'string' && x.ledgerId.length > 0;
  const okTitle = typeof x.title === 'string' && x.title.trim().length > 0;
  const okCategory = typeof x.category === 'string' && x.category.length > 0;
  const okAmount = typeof x.amount === 'number' && !Number.isNaN(x.amount);
  const okFrequency = typeof x.frequency === 'string' && x.frequency.length > 0;
  const okNextDueDate = typeof x.nextDueDate === 'string' && x.nextDueDate.length > 0;
  const okNotes = typeof x.notes === 'string';
  const okCreatedAt = typeof x.createdAt === 'string' && x.createdAt.length > 0;
  const okUpdatedAt = typeof x.updatedAt === 'string' && x.updatedAt.length > 0;

  return Boolean(okId && okLedgerId && okTitle && okCategory && okAmount && okFrequency && okNextDueDate && okNotes && okCreatedAt && okUpdatedAt);
}

// Optional pure helper: normalize frequency
export function normalizeFrequency(freq) {
  const f = String(freq || '').toLowerCase();
  if (f === 'monthly' || f === 'quarterly' || f === 'yearly') return f;
  return 'monthly';
}
