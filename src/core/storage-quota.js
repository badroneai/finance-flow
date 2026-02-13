/*
  Storage quota helper (Stage 3 fast-track)
  Pure logic wrapper around storage facade.
  No behavior changes.
*/

export function checkStorageQuota(storageFacade) {
  try {
    const test = new Array(1024 * 512).join('a');
    storageFacade.setRaw('_ff_quota_test', test);
    storageFacade.removeRaw('_ff_quota_test');
    return true;
  } catch (e) {
    if (e && (e.name === 'QuotaExceededError' || e.code === 22)) return false;
    return true;
  }
}
