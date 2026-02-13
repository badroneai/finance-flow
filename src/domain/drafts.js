/*
  Domain: Drafts
  Pure helpers only.
*/

/** تنسيق التاريخ للمسودات والقوالب: ميلادي + هجري (يتبع إعداد numerals) */
export function formatDraftDate(dateStr, formatDateHeaderFn) {
  return dateStr ? formatDateHeaderFn(dateStr) : '';
}
