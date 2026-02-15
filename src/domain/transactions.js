/*
  Domain: Transactions
  - Pure helpers only (no UI text).
  - No storage access.
*/

export function filterTransactions(items, filters) {
  let out = Array.isArray(items) ? items : [];
  const f = filters || {};

  // Include items without date when filtering by range (do not hide as undefined)
  if (f.fromDate) out = out.filter(t => t.date == null || t.date === '' || t.date >= f.fromDate);
  if (f.toDate) out = out.filter(t => t.date == null || t.date === '' || t.date <= f.toDate);
  if (f.type) out = out.filter(t => t.type === f.type);
  if (f.category) out = out.filter(t => t.category === f.category);
  if (f.paymentMethod) out = out.filter(t => t.paymentMethod === f.paymentMethod);
  if (f.search) {
    const s = String(f.search).toLowerCase();
    out = out.filter(t => (t.description || '').toLowerCase().includes(s));
  }

  // Newest first; items without date sort to the end
  return out.sort((a, b) => {
    const ad = a.date != null && a.date !== '' ? String(a.date) : '';
    const bd = b.date != null && b.date !== '' ? String(b.date) : '';
    if (!bd && !ad) return 0;
    if (!bd) return -1;
    if (!ad) return 1;
    return bd.localeCompare(ad);
  });
}

export function sumTransactions(items) {
  const list = Array.isArray(items) ? items : [];
  const income = list.filter(t => t.type === 'income').reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const expense = list.filter(t => t.type === 'expense').reduce((s, t) => s + (Number(t.amount) || 0), 0);
  return { income, expense, net: income - expense };
}
