/*
  Authority Layer v8 — Compliance Shield (Pure)

  Computes:
  - Compliance Score (0-100)
  - Top drivers (up to 3 items)

  Rules (as requested):
  - Penalize:
    - System item unpriced
    - System item overdue
    - High-risk unpriced
  - Bonus:
    - If no system item is overdue
*/

const toMs = (dateStr) => {
  const s = String(dateStr || '').trim();
  if (!s) return null;
  const d = new Date(s + 'T00:00:00');
  const ms = d.getTime();
  return Number.isNaN(ms) ? null : ms;
};

const startOfDayMs = (d = new Date()) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
};

const risk = (r) => String(r || '').toLowerCase();

export function computeComplianceShield({ ledgerId, recurringItems = [], now = new Date() } = {}) {
  const lid = String(ledgerId || '').trim();
  const list = (Array.isArray(recurringItems) ? recurringItems : []).filter(r => String(r?.ledgerId || '') === lid);

  const todayMs = startOfDayMs(now);

  let score = 100;
  const drivers = [];

  let hasSystemOverdue = false;

  for (const r of list) {
    const cat = String(r?.category || 'other').toLowerCase();
    const amt = Number(r?.amount) || 0;
    const dueMs = toMs(r?.nextDueDate);
    const overdue = (dueMs != null) ? (dueMs < todayMs) : false;

    const highRisk = risk(r?.riskLevel) === 'high';

    if (cat === 'system') {
      if (amt <= 0) {
        score -= 20;
        drivers.push({ id: r.id, title: r.title || '—', reason: 'بند نظامي غير مسعّر', weight: 20 });
      }
      if (overdue) {
        score -= 25;
        drivers.push({ id: r.id, title: r.title || '—', reason: 'بند نظامي متأخر', weight: 25 });
        hasSystemOverdue = true;
      }
    }

    if (highRisk && amt <= 0) {
      score -= 15;
      drivers.push({ id: r.id, title: r.title || '—', reason: 'عالي المخاطر غير مسعّر', weight: 15 });
    }
  }

  if (!hasSystemOverdue) {
    score += 10;
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  drivers.sort((a, b) => (b.weight - a.weight));

  const status = score >= 85 ? 'متوافق' : score >= 60 ? 'يحتاج انتباه' : 'خطر نظامي';

  return {
    ledgerId: lid,
    score,
    status,
    drivers: drivers.slice(0, 3),
  };
}
