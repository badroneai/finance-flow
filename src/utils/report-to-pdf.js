/**
 * report-to-pdf.js — تصدير التقرير الشهري إلى PDF والمشاركة (برومبت 5.2)
 * يستخدم window.print() مع @media print لتصدير PDF، و Web Share API للمشاركة.
 */

/**
 * اسم ملف التقرير المقترح: تقرير_قيد_{اسم_الدفتر}_{الشهر}_{السنة}.pdf
 * @param {Object} meta - meta من التقرير (ledgerName, month, year)
 * @returns {string}
 */
export function getReportFilename(meta) {
  const name = String(meta?.ledgerName || 'دفتر').replace(/[/\\?%*:|"<>]/g, '_').trim() || 'دفتر';
  const month = Number(meta?.month) || new Date().getMonth() + 1;
  const year = Number(meta?.year) || new Date().getFullYear();
  return `تقرير_قيد_${name}_${month}_${year}.pdf`;
}

/**
 * طباعة التقرير (المستخدم يختار "حفظ كـ PDF" في حوار الطباعة).
 * يضبط عنوان الصفحة مؤقتاً لاقتراح اسم الملف. الاعتماد على @media print في الصفحة لإظهار منطقة التقرير فقط.
 * @param {HTMLElement} [_element] - غير مستخدم؛ الطباعة تعتمد على CSS print في صفحة التقرير
 * @param {string} [suggestedFilename] - اسم الملف المقترح
 */
export function printReport(_element, suggestedFilename) {
  const prevTitle = document.title;
  if (suggestedFilename) document.title = suggestedFilename.replace(/\.pdf$/i, '') || prevTitle;
  try {
    window.print();
  } finally {
    document.title = prevTitle;
  }
}

/**
 * مشاركة التقرير عبر Web Share API (رابط الصفحة + عنوان ووصف).
 * @param {Object} options - { title, text, url }
 * @returns {Promise<boolean>} نجاح المشاركة
 */
export async function shareReport(options = {}) {
  const { title = 'تقرير قيد العقار', text = '', url = window.location.href } = options;
  if (!navigator.share) return false;
  try {
    await navigator.share({
      title,
      text: text || title,
      url,
    });
    return true;
  } catch (e) {
    if (e.name === 'AbortError') return false;
    throw e;
  }
}
