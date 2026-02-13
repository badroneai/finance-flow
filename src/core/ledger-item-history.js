/*
  Fast Track v8 — Item History + Proof (Audit Trail)

  Pure utilities for recurring item history.

  Constraints:
  - Pure functions only
  - No storage reads/writes
  - No external libs
*/

const MAX_HISTORY = 20;

const toMs = (iso) => {
  const s = String(iso || '').trim();
  if (!s) return null;
  const ms = new Date(s).getTime();
  return Number.isNaN(ms) ? null : ms;
};

export function clampHistory(history, max = MAX_HISTORY) {
  const list = Array.isArray(history) ? history : [];
  if (list.length <= max) return list;
  return list.slice(list.length - max);
}

export function pushHistoryEntry(item, entry, max = MAX_HISTORY) {
  const it = item ? { ...item } : {};
  const h = Array.isArray(it.history) ? [...it.history] : [];
  const e = entry ? { ...entry } : null;
  if (!e) return it;

  // Minimal validation / normalization
  const at = String(e.at || new Date().toISOString());
  const type = String(e.type || '').trim();
  if (!type) return it;

  h.push({
    at,
    type,
    amount: (e.amount == null ? undefined : Number(e.amount)),
    txId: e.txId ? String(e.txId) : undefined,
    meta: e.meta && typeof e.meta === 'object' ? { ...e.meta } : undefined,
  });

  it.history = clampHistory(h, max);
  return it;
}

export function lastPayNowAt(history) {
  const list = Array.isArray(history) ? history : [];
  for (let i = list.length - 1; i >= 0; i--) {
    const e = list[i];
    if (e && e.type === 'pay_now' && e.at) return String(e.at);
  }
  return '';
}

export function summarizePayNow(history, { now = new Date() } = {}) {
  const list = Array.isArray(history) ? history : [];
  const nowMs = new Date(now).getTime();

  const day = 24 * 60 * 60 * 1000;
  const ms90 = 90 * day;
  const ms12m = 365 * day;

  let paid90 = 0;
  let paid12m = 0;
  let count12m = 0;

  for (const e of list) {
    if (!e || e.type !== 'pay_now') continue;
    const atMs = toMs(e.at);
    if (atMs == null) continue;
    const amt = Number(e.amount) || 0;

    if (nowMs - atMs <= ms12m) {
      paid12m += amt;
      count12m += 1;
      if (nowMs - atMs <= ms90) paid90 += amt;
    }
  }

  return { paid90, paid12m, count12m };
}

export function daysSince(iso, { now = new Date() } = {}) {
  const ms = toMs(iso);
  if (ms == null) return null;
  const nowMs = new Date(now).getTime();
  const diff = Math.max(0, nowMs - ms);
  return Math.floor(diff / (24 * 60 * 60 * 1000));
}
