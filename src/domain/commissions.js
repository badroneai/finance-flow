/*
  Domain: Commissions
  - Pure helpers only (no UI text).
  - No storage access.
*/

export function filterCommissions(items, filters) {
  let list = Array.isArray(items) ? [...items] : [];
  const f = filters || {};

  if (f.search && String(f.search).trim()) {
    const s = String(f.search).trim().toLowerCase();
    list = list.filter(c => (c.clientName || '').toLowerCase().includes(s) || (c.agentName || '').toLowerCase().includes(s));
  }
  if (f.status) list = list.filter(c => c.status === f.status);
  if (f.agent) list = list.filter(c => (c.agentName || '') === f.agent);

  if (f.fromDate || f.toDate) {
    list = list.filter(c => {
      const dateVal = c.dueDate || c.paidDate || null;
      if (!dateVal) return false;
      if (f.fromDate && dateVal < f.fromDate) return false;
      if (f.toDate && dateVal > f.toDate) return false;
      return true;
    });
  }

  return list;
}

export function computeCommissionTotals(cms) {
  const list = Array.isArray(cms) ? cms : [];
  const pending = list.filter(c => c.status === 'pending');
  const paid = list.filter(c => c.status === 'paid');

  const pendingOffice = pending.reduce((s, c) => s + (Number(c.dealValue) || 0) * (Number(c.officePercent) || 0) / 100, 0);
  const paidOffice = paid.reduce((s, c) => s + (Number(c.dealValue) || 0) * (Number(c.officePercent) || 0) / 100, 0);
  const totalAgent = list.reduce((s, c) => s + (Number(c.dealValue) || 0) * (Number(c.agentPercent) || 0) / 100, 0);

  return { pendingOffice, paidOffice, totalOffice: pendingOffice + paidOffice, totalAgent };
}

export function listAgentNames(allCms) {
  const list = Array.isArray(allCms) ? allCms : [];
  return [...new Set(list.map(c => c.agentName).filter(Boolean))].sort();
}
