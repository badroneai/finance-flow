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

export function createDefaultLedger() {
  const ts = nowISO();
  return {
    id: genId(),
    name: 'الدفتر الافتراضي',
    type: 'office',
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
  const okType = typeof x.type === 'string' && x.type.length > 0;
  const okCurrency = typeof x.currency === 'string' && x.currency.length > 0;
  const okCreatedAt = typeof x.createdAt === 'string' && x.createdAt.length > 0;
  const okUpdatedAt = typeof x.updatedAt === 'string' && x.updatedAt.length > 0;
  const okArchived = typeof x.archived === 'boolean';

  return Boolean(okId && okName && okType && okCurrency && okCreatedAt && okUpdatedAt && okArchived);
}
