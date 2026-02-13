/*
  Domain: Notes (Daily notes + pinned notes)
  Pure list/map operations only — no UI copy.
*/

export function addDailyNote(dailyNotesMap, selectedKey, text) {
  const t = (text || '').trim();
  if (!t) return dailyNotesMap;
  const prev = dailyNotesMap || {};
  const list = prev[selectedKey] || [];
  return {
    ...prev,
    [selectedKey]: [...list, { id: `d${Date.now()}`, text: t, done: false, createdAt: Date.now() }],
  };
}

export function toggleDailyNote(list, id) {
  const items = Array.isArray(list) ? list : [];
  return items.map(n => (n.id === id ? { ...n, done: !n.done } : n));
}

export function deleteDailyNote(list, id) {
  const items = Array.isArray(list) ? list : [];
  return items.filter(n => n.id !== id);
}

export function addPinnedNote(list, text, color, fallbackColor) {
  const t = (text || '').trim();
  if (!t) return list;
  const items = Array.isArray(list) ? list : [];
  return [...items, { id: `p${Date.now()}`, text: t, color: color || fallbackColor, createdAt: Date.now() }];
}

export function deletePinnedNote(list, id) {
  const items = Array.isArray(list) ? list : [];
  return items.filter(n => n.id !== id);
}

export function updatePinnedNote(list, id, text) {
  const items = Array.isArray(list) ? list : [];
  return items.map(n => (n.id === id ? { ...n, text } : n));
}
