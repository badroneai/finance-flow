// Recurring intelligence helpers (display-only calculations + sorting/grouping)

const asStr = (v) => String(v ?? '').trim();

export function isSeededRecurring(item) {
  if (!item || typeof item !== 'object') return false;
  const cat = asStr(item.category).toLowerCase();
  const risk = asStr(item.riskLevel).toLowerCase();
  const req = item.required;
  const catOk = cat === 'system' || cat === 'operational' || cat === 'maintenance' || cat === 'marketing';
  const riskOk = risk === 'high' || risk === 'medium' || risk === 'low';
  const reqOk = typeof req === 'boolean';
  return catOk && riskOk && reqOk;
}

export function normalizeCategory(cat) {
  const c = asStr(cat).toLowerCase();
  return (c === 'system' || c === 'operational' || c === 'maintenance' || c === 'marketing') ? c : '';
}

export function normalizeRisk(risk) {
  const r = asStr(risk).toLowerCase();
  return (r === 'high' || r === 'medium' || r === 'low') ? r : '';
}

export function normalizeFrequency(freq) {
  const f = asStr(freq).toLowerCase();
  return (f === 'monthly' || f === 'quarterly' || f === 'yearly' || f === 'adhoc') ? f : 'monthly';
}

export function isDueWithinDays(item, days, { now = new Date() } = {}) {
  const d = asStr(item?.nextDueDate);
  if (!d) return false;
  const due = new Date(d + 'T00:00:00');
  if (Number.isNaN(due.getTime())) return false;
  const end = new Date(now.getTime());
  end.setDate(end.getDate() + Number(days || 0));
  return due.getTime() <= end.getTime();
}

export function isPastDue(item, { now = new Date() } = {}) {
  const d = asStr(item?.nextDueDate);
  if (!d) return false;
  const due = new Date(d + 'T00:00:00');
  if (Number.isNaN(due.getTime())) return false;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return due.getTime() < today.getTime();
}

export function recurringGroupKey(item) {
  const freq = normalizeFrequency(item?.frequency);
  if (freq === 'adhoc') return 'adhoc';
  const cat = normalizeCategory(item?.category);
  return cat || 'uncategorized';
}

export function recurringPriorityInSection(item) {
  const req = !!item?.required;
  const risk = normalizeRisk(item?.riskLevel);
  const due = asStr(item?.nextDueDate);

  // required first
  const pReq = req ? 0 : 10;
  // high-risk first
  const pRisk = risk === 'high' ? 0 : 5;

  return {
    p: pReq + pRisk,
    due,
    title: asStr(item?.title).toLowerCase(),
  };
}

export function sortRecurringInSection(list) {
  return [...(Array.isArray(list) ? list : [])].sort((a, b) => {
    const A = recurringPriorityInSection(a);
    const B = recurringPriorityInSection(b);
    if (A.p !== B.p) return A.p - B.p;
    if (A.due && B.due && A.due !== B.due) return A.due.localeCompare(B.due);
    return A.title.localeCompare(B.title);
  });
}

export function computeRecurringDashboard(list, { now = new Date() } = {}) {
  const items = Array.isArray(list) ? list : [];
  const priced = items.filter(x => Number(x?.amount) > 0);

  const sum = (xs) => xs.reduce((acc, x) => acc + (Number(x?.amount) || 0), 0);

  const monthlyTotal = sum(priced.filter(x => normalizeFrequency(x.frequency) === 'monthly'));
  const yearlyTotal = sum(priced.filter(x => normalizeFrequency(x.frequency) === 'yearly'));
  const within30Total = sum(priced.filter(x => isDueWithinDays(x, 30, { now })));

  const totalCount = items.length;
  const requiredCount = items.filter(x => !!x?.required).length;
  const unpricedCount = items.filter(x => Number(x?.amount) === 0).length;
  const highRiskCount = items.filter(x => normalizeRisk(x?.riskLevel) === 'high').length;

  const next3 = [...items]
    .filter(x => asStr(x?.nextDueDate))
    .sort((a, b) => asStr(a.nextDueDate).localeCompare(asStr(b.nextDueDate)))
    .slice(0, 3);

  return {
    monthlyTotal,
    yearlyTotal,
    within30Total,
    totalCount,
    requiredCount,
    unpricedCount,
    highRiskCount,
    next3,
  };
}

export function computeLedgerCompleteness(list) {
  const items = Array.isArray(list) ? list : [];
  const seeded = items.filter(isSeededRecurring);
  if (seeded.length === 0) return null;
  const pricedSeeded = seeded.filter(x => Number(x?.amount) > 0).length;
  const pct = Math.round((pricedSeeded / seeded.length) * 100);
  return { pct, total: seeded.length, priced: pricedSeeded };
}

export function groupRecurringBySections(list) {
  const items = Array.isArray(list) ? list : [];
  const groups = {
    system: [],
    operational: [],
    maintenance: [],
    marketing: [],
    adhoc: [],
    uncategorized: [],
  };

  for (const r of items) {
    const key = recurringGroupKey(r);
    if (groups[key]) groups[key].push(r);
    else groups.uncategorized.push(r);
  }

  return groups;
}

export function sectionStats(list) {
  const items = Array.isArray(list) ? list : [];
  const subtotal = items.reduce((acc, x) => acc + ((Number(x?.amount) > 0) ? Number(x.amount) : 0), 0);
  const count = items.length;
  const unpricedCount = items.filter(x => Number(x?.amount) === 0).length;
  return { subtotal, count, unpricedCount };
}
