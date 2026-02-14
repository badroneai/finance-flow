// Stage 7 — Institutional Hardening
// Lightweight runtime contracts (dev-friendly, production-safe)

const isDev = (() => {
  try {
    // Vite
    if (typeof import.meta !== 'undefined' && import.meta.env && typeof import.meta.env.DEV !== 'undefined') {
      return !!import.meta.env.DEV;
    }
  } catch {}
  return false;
})();

const safeJson = (v) => {
  try { return JSON.stringify(v); } catch { return String(v); }
};

export function invariant(condition, message, context) {
  if (condition) return true;

  const suffix = context == null ? '' : ` | context=${safeJson(context)}`;
  const full = `[FF_CONTRACT] ${String(message || 'Invariant failed')}${suffix}`;

  // Dev: fail fast with actionable error
  if (isDev) {
    throw new Error(full);
  }

  // Prod: do not crash; warn and continue
  try { console.warn(full); } catch {}
  return false;
}

export function assertFn(fn, name) {
  invariant(typeof fn === 'function', `${name || 'fn'} must be a function`, { typeof: typeof fn });
  return fn;
}

export function assertObj(obj, name) {
  invariant(obj != null && typeof obj === 'object' && !Array.isArray(obj), `${name || 'obj'} must be an object`, { typeof: typeof obj });
  return obj;
}

export function assertArr(arr, name) {
  invariant(Array.isArray(arr), `${name || 'arr'} must be an array`, { typeof: typeof arr });
  return arr;
}
