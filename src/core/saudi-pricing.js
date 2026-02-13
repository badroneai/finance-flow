// Saudi auto-pricing helpers (no external deps)

const asStr = (v) => String(v ?? '').trim();

export const CITY_FACTORS = {
  riyadh: 1.15,
  jeddah: 1.10,
  dammam: 1.05,
  qassim: 0.95,
  other: 1.0,
};

export const SIZE_FACTORS = {
  small: 0.85,
  medium: 1.0,
  large: 1.25,
};

export function normalizeCity(city) {
  const c = asStr(city).toLowerCase();
  return (c === 'riyadh' || c === 'jeddah' || c === 'dammam' || c === 'qassim' || c === 'other') ? c : 'other';
}

export function normalizeSize(size) {
  const s = asStr(size).toLowerCase();
  return (s === 'small' || s === 'medium' || s === 'large') ? s : 'medium';
}

export function computeSuggestedAmount({ typical, city, size, eligible }) {
  const base = Number(typical) || 0;
  if (base <= 0) return 0;
  const cf = eligible ? (CITY_FACTORS[normalizeCity(city)] || 1.0) : 1.0;
  const sf = SIZE_FACTORS[normalizeSize(size)] || 1.0;
  return Math.round(base * cf * sf);
}
