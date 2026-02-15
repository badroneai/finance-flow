/**
 * alert-manager.js — نظام تأجيل وأرشفة التنبيهات (برومبت 3.3)
 * يتشارك المفتاح ff_alert_state مع alert-engine.js لتصفية التنبيهات المخفاة.
 */

export const STORAGE_KEY = 'ff_alert_state';
const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function readState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { dismissed: {}, snoozed: {}, dismissedTypes: {} };
    const data = JSON.parse(raw);
    return {
      dismissed: data?.dismissed && typeof data.dismissed === 'object' ? data.dismissed : {},
      snoozed: data?.snoozed && typeof data.snoozed === 'object' ? data.snoozed : {},
      dismissedTypes: data?.dismissedTypes && typeof data.dismissedTypes === 'object' ? data.dismissedTypes : {},
    };
  } catch {
    return { dismissed: {}, snoozed: {}, dismissedTypes: {} };
  }
}

function writeState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

/**
 * رفض تنبيه (لا يظهر مجددًا لمدة 7 أيام).
 * @param {string} alertId - معرّف التنبيه
 * @param {string} [alertType] - نوع التنبيه (لإحصائيات mostDismissedType)
 */
function dismiss(alertId, alertType) {
  const state = readState();
  state.dismissed[alertId] = Date.now() + DISMISS_TTL_MS;
  if (alertType) state.dismissedTypes[alertType] = (state.dismissedTypes[alertType] || 0) + 1;
  writeState(state);
}

/**
 * تأجيل تنبيه (يظهر مجددًا بعد X ساعات).
 * @param {string} alertId - معرّف التنبيه
 * @param {number} [hours=24] - عدد ساعات التأجيل
 */
function snooze(alertId, hours = 24) {
  const state = readState();
  state.snoozed[alertId] = Date.now() + hours * 60 * 60 * 1000;
  writeState(state);
}

/**
 * هل التنبيه مخفي (مرفوض أو مؤجل)؟
 * @param {string} alertId - معرّف التنبيه
 * @returns {boolean}
 */
function isHidden(alertId) {
  const state = readState();
  const now = Date.now();
  if (state.dismissed[alertId] != null && state.dismissed[alertId] > now) return true;
  if (state.snoozed[alertId] != null && state.snoozed[alertId] > now) return true;
  return false;
}

/** تنظيف المنتهية (انتهت صلاحية الرفض أو التأجيل). */
function cleanup() {
  const state = readState();
  const now = Date.now();
  let changed = false;
  for (const [id, expiry] of Object.entries(state.dismissed)) {
    if (expiry <= now) {
      delete state.dismissed[id];
      changed = true;
    }
  }
  for (const [id, showAfter] of Object.entries(state.snoozed)) {
    if (showAfter <= now) {
      delete state.snoozed[id];
      changed = true;
    }
  }
  if (changed) writeState(state);
}

/**
 * إحصائيات (للذكاء).
 * @returns {{ totalDismissed: number, totalSnoozed: number, mostDismissedType: string }}
 */
function getStats() {
  const state = readState();
  const types = state.dismissedTypes || {};
  const entries = Object.entries(types);
  const mostDismissedType = entries.length
    ? entries.sort((a, b) => b[1] - a[1])[0][0]
    : '';
  return {
    totalDismissed: Number(Object.keys(state.dismissed || {}).length),
    totalSnoozed: Number(Object.keys(state.snoozed || {}).length),
    mostDismissedType: String(mostDismissedType),
  };
}

export const AlertManager = {
  dismiss,
  snooze,
  isHidden,
  cleanup,
  getStats,
};
