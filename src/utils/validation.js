/**
 * أدوات التحقق من صحة البيانات — قيد العقار
 */

/**
 * التحقق من بيانات العقد
 * @param {Object} data - بيانات العقد
 * @returns {Object} كائن الأخطاء (فارغ إذا لا توجد أخطاء)
 */
export const validateContract = (data) => {
  const errors = {};

  if (data.end_date && data.start_date && data.end_date < data.start_date) {
    errors.dates = 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية';
  }

  if (data.total_amount != null && Number(data.total_amount) < 0) {
    errors.total_amount = 'المبلغ الإجمالي لا يمكن أن يكون سالباً';
  }

  if (data.monthly_rent != null && Number(data.monthly_rent) < 0) {
    errors.monthly_rent = 'الإيجار الشهري لا يمكن أن يكون سالباً';
  }

  if (data.deposit_amount != null && Number(data.deposit_amount) < 0) {
    errors.deposit_amount = 'مبلغ التأمين لا يمكن أن يكون سالباً';
  }

  return errors;
};

/**
 * التحقق من بيانات العقار
 * @param {Object} data - بيانات العقار
 * @returns {Object} كائن الأخطاء
 */
export const validateProperty = (data) => {
  const errors = {};

  if (data.purchase_price != null && Number(data.purchase_price) < 0) {
    errors.purchase_price = 'سعر الشراء لا يمكن أن يكون سالباً';
  }

  if (data.monthly_rent != null && Number(data.monthly_rent) < 0) {
    errors.monthly_rent = 'الإيجار الشهري لا يمكن أن يكون سالباً';
  }

  if (data.area_sqm != null && Number(data.area_sqm) <= 0) {
    errors.area_sqm = 'المساحة يجب أن تكون أكبر من صفر';
  }

  return errors;
};

/**
 * التحقق من مبلغ مالي
 * @param {number|string} amount - المبلغ
 * @param {string} [label] - اسم الحقل (اختياري)
 * @returns {string|null} رسالة الخطأ أو null
 */
export const validateAmount = (amount, label = 'المبلغ') => {
  const num = Number(amount);
  if (isNaN(num)) return `${label} غير صالح`;
  if (num < 0) return `${label} لا يمكن أن يكون سالباً`;
  return null;
};

/**
 * التحقق من نطاق التواريخ
 * @param {string} startDate
 * @param {string} endDate
 * @returns {string|null} رسالة الخطأ أو null
 */
export const validateDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return null;
  if (endDate < startDate) {
    return 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية';
  }
  return null;
};
