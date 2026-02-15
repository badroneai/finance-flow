/**
 * P2 #14: تصدير CSV مشترك — تهريب حقول (RFC 4180) وتنزيل الملف.
 * يُستخدم من صفحة الحركات، صفحة العمولات، وتبويب تقارير الدفتر.
 */

/** تهريب حقل CSV (RFC 4180) */
export function csvEscape(v) {
  const s = v == null ? '' : String(v);
  if (/[,\r\n"]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

/**
 * ينشئ ملف CSV ويُطلق تنزيله.
 * @param {{ filename: string, headers: string[], rows: (string|number)[][] }} opts
 */
export function downloadCSV({ filename, headers, rows }) {
  const BOM = '\uFEFF';
  const all = [headers, ...rows]
    .map((r) => r.map(csvEscape).join(','))
    .join('\n');
  const blob = new Blob([BOM + all], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}
