/*
  Ledger Inbox v6 — Daily Ops Inbox (Pure)

  Constraints:
  - Pure functions only
  - No storage reads/writes
  - No external libs
*/

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const toMs = (dateStr) => {
  const s = String(dateStr || '').trim();
  if (!s) return null;
  const d = new Date(s + 'T00:00:00');
  const ms = d.getTime();
  return Number.isNaN(ms) ? null : ms;
};

const isPastDue = (r, nowMs) => {
  if (!r || Number(r?.amount) <= 0) return false;
  const ms = toMs(r?.nextDueDate);
  if (ms == null) return false;
  return ms < nowMs;
};

const isDueWithinDays = (r, days, nowMs) => {
  if (!r || Number(r?.amount) <= 0) return false;
  const ms = toMs(r?.nextDueDate);
  if (ms == null) return false;
  const end = nowMs + days * 24 * 60 * 60 * 1000;
  return ms >= nowMs && ms <= end;
};

const isSnoozedActive = (r, nowMs) => {
  const until = toMs(r?.snoozeUntil);
  if (until == null) return false;
  return until > nowMs;
};

const normalizeRisk = (risk) => {
  const x = String(risk || '').toLowerCase();
  return (x === 'high' || x === 'medium' || x === 'low') ? x : '';
};

const normalizeStatus = (s) => {
  const x = String(s || '').toLowerCase();
  return (x === 'open' || x === 'snoozed' || x === 'resolved') ? x : 'open';
};

export function buildLedgerInbox({ ledgerId, recurringItems = [], now = new Date() } = {}) {
  const lid = String(ledgerId || '').trim();
  const list = (Array.isArray(recurringItems) ? recurringItems : []).filter(r => String(r?.ledgerId || '') === lid);

  const nowMs = (() => {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  })();

  const items = [];

  for (const r of list) {
    const status = normalizeStatus(r?.status);
    const snoozed = isSnoozedActive(r, nowMs);

    // Hide resolved unless overdue again
    const overdue = isPastDue(r, nowMs);
    if (status === 'resolved' && !overdue) continue;

    // Hide snoozed until date
    if (status === 'snoozed' && snoozed && !overdue) continue;

    const required = !!r?.required;
    const highRisk = normalizeRisk(r?.riskLevel) === 'high';
    const unpriced = Number(r?.amount) === 0;

    let reason = null;
    let priority = 0;

    if (highRisk && overdue) { reason = 'خطر متأخر'; priority = 100; }
    else if (overdue) { reason = 'متأخر'; priority = 90; }
    else if (required && highRisk && unpriced) { reason = 'خطر غير مسعّر'; priority = 85; }
    else if (required && unpriced) { reason = 'إلزامي غير مسعّر'; priority = 75; }
    else if (isDueWithinDays(r, 7, nowMs)) { reason = 'مستحق خلال 7 أيام'; priority = 70; }
    else if (isDueWithinDays(r, 14, nowMs)) { reason = 'مستحق خلال 14 يوم'; priority = 60; }

    if (!reason) continue;

    items.push({
      id: r.id,
      ledgerId: lid,
      title: r.title || '',
      amount: Number(r.amount) || 0,
      nextDueDate: r.nextDueDate || '',
      required,
      riskLevel: normalizeRisk(r?.riskLevel) || '',
      status,
      snoozeUntil: r.snoozeUntil || '',
      note: String(r.note || ''),
      lastPaidAt: r.lastPaidAt || '',
      reason,
      priority,
    });
  }

  // Sort by priority then due date then title
  items.sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    const da = toMs(a.nextDueDate) ?? 0;
    const db = toMs(b.nextDueDate) ?? 0;
    if (da !== db) return da - db;
    return String(a.title || '').localeCompare(String(b.title || ''), 'ar');
  });

  return items;
}

export function addDaysISO(days) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + Number(days || 0));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
