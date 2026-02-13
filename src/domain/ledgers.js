/*
  Domain: Ledgers
  PR-1 (Ledgers 1/3) — Storage + default ledger (no UI)

  Notes:
  - Pure helpers only.
  - No dependency on UI.
  - No external libraries.
*/

const nowISO = () => new Date().toISOString();

const genId = () => {
  try {
    if (crypto && typeof crypto.randomUUID === 'function') return `ledg_${crypto.randomUUID()}`;
  } catch {}
  return `ledg_${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
};

export const LEDGER_TYPES = {
  office: 'office',
  chalet: 'chalet',
  apartment: 'apartment',
  villa: 'villa',
  building: 'building',
  personal: 'personal',
  other: 'other',
};

export function normalizeLedgerType(type) {
  const t = String(type || '').toLowerCase();
  if (t === LEDGER_TYPES.office) return LEDGER_TYPES.office;
  if (t === LEDGER_TYPES.chalet) return LEDGER_TYPES.chalet;
  if (t === LEDGER_TYPES.apartment) return LEDGER_TYPES.apartment;
  if (t === LEDGER_TYPES.villa) return LEDGER_TYPES.villa;
  if (t === LEDGER_TYPES.building) return LEDGER_TYPES.building;
  if (t === LEDGER_TYPES.personal) return LEDGER_TYPES.personal;
  if (t === LEDGER_TYPES.other) return LEDGER_TYPES.other;
  return LEDGER_TYPES.office;
}

export function normalizeLedgerNote(note, { maxLen = 120 } = {}) {
  const s = String(note ?? '').trim();
  if (!s) return '';
  return s.length > maxLen ? s.slice(0, maxLen) : s;
}

export function withLedgerDefaults(ledger) {
  const x = ledger || {};
  const type = normalizeLedgerType(x.type);
  const note = normalizeLedgerNote(x.note, { maxLen: 120 });
  return { ...x, type, note };
}

export function createDefaultLedger() {
  const ts = nowISO();
  return {
    id: genId(),
    name: 'الدفتر الافتراضي',
    type: LEDGER_TYPES.office,
    note: '',
    currency: 'SAR',
    createdAt: ts,
    updatedAt: ts,
    archived: false,
  };
}

export function withUpdatedAt(ledger) {
  return { ...ledger, updatedAt: nowISO() };
}

export function validateLedger(input) {
  const x = input || {};
  const okId = typeof x.id === 'string' && x.id.length > 0;
  const okName = typeof x.name === 'string' && x.name.trim().length > 0;
  const okType = typeof x.type === 'string' && normalizeLedgerType(x.type).length > 0;
  const okNote = typeof x.note === 'string';
  const okCurrency = typeof x.currency === 'string' && x.currency.length > 0;
  const okCreatedAt = typeof x.createdAt === 'string' && x.createdAt.length > 0;
  const okUpdatedAt = typeof x.updatedAt === 'string' && x.updatedAt.length > 0;
  const okArchived = typeof x.archived === 'boolean';

  return Boolean(okId && okName && okType && okNote && okCurrency && okCreatedAt && okUpdatedAt && okArchived);
}
