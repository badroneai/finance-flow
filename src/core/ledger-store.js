/*
  Core: Ledger Store (LocalStorage)
  PR-1 (Ledgers 1/3) — Storage + default ledger (no UI)

  Constraints:
  - Use existing storageFacade (no new storage system).
  - Only new keys:
    - ff_ledgers
    - ff_recurring_items
    - ff_active_ledger_id
*/

import { storageFacade } from './storage-facade.js';
import { createDefaultLedger, validateLedger, withLedgerDefaults } from '../domain/ledgers.js';

export const LEDGER_STORAGE_KEYS = {
  LEDGERS: 'ff_ledgers',
  RECURRING_ITEMS: 'ff_recurring_items',
  ACTIVE_LEDGER_ID: 'ff_active_ledger_id',
};

export function getLedgers() {
  const raw = storageFacade.getJSON(LEDGER_STORAGE_KEYS.LEDGERS, []);
  const list = Array.isArray(raw) ? raw : [];
  // Backward compatible migration-on-read: add defaults for older ledgers.
  return list.map(withLedgerDefaults);
}

export function setLedgers(list) {
  storageFacade.setJSON(LEDGER_STORAGE_KEYS.LEDGERS, Array.isArray(list) ? list : []);
}

export function getRecurringItems() {
  return storageFacade.getJSON(LEDGER_STORAGE_KEYS.RECURRING_ITEMS, []);
}

export function setRecurringItems(list) {
  storageFacade.setJSON(LEDGER_STORAGE_KEYS.RECURRING_ITEMS, Array.isArray(list) ? list : []);
}

export function getActiveLedgerId() {
  return storageFacade.getRaw(LEDGER_STORAGE_KEYS.ACTIVE_LEDGER_ID);
}

export function setActiveLedgerId(id) {
  const v = id == null ? '' : String(id);
  if (!v) return;
  storageFacade.setRaw(LEDGER_STORAGE_KEYS.ACTIVE_LEDGER_ID, v);
  // Notify listeners (e.g., transactions page) that the active ledger changed.
  try { window.dispatchEvent(new CustomEvent('ledger:activeChanged')); } catch {}
}

/**
 * Migration: ensure default ledger exists.
 * Idempotent: never creates a second default ledger if ledgers already exist.
 */
export function ensureDefaultLedger() {
  const existing = getLedgers();
  const ledgers = Array.isArray(existing) ? existing.filter(validateLedger) : [];

  if (ledgers.length === 0) {
    const def = createDefaultLedger();
    setLedgers([def]);
    setActiveLedgerId(def.id);
    return { created: true, id: def.id };
  }

  const active = getActiveLedgerId();
  if (!active) {
    setActiveLedgerId(ledgers[0].id);
    return { created: false, id: ledgers[0].id };
  }

  return { created: false, id: active };
}
