/*
  قيد العقار (Finance Flow)
  data-utils.js — أدوات مشتركة لطبقة البيانات

  تحويل أسماء الحقول بين camelCase و snake_case،
  ومقارنة مستقرة لمنع إعادة الرسم غير الضرورية.
*/

/**
 * مقارنة مستقرة — تمنع إعادة الرسم إذا البيانات لم تتغير فعلاً.
 * للبيانات المُحمّلة من Supabase (مراجع جديدة كل مرة)، نقارن بالمحتوى.
 * @param {Function} setter - دالة setState
 * @param {Array} newArr - المصفوفة الجديدة
 * @param {Object} prevRef - مرجع React يحتوي المصفوفة السابقة
 */
export function stableSetArray(setter, newArr, prevRef) {
  const prev = prevRef.current;
  if (prev.length === newArr.length) {
    let same = true;
    for (let i = 0; i < prev.length; i++) {
      if (prev[i]?.id !== newArr[i]?.id || prev[i]?.updatedAt !== newArr[i]?.updatedAt) {
        same = false;
        break;
      }
    }
    if (same) return;
  }
  prevRef.current = newArr;
  setter(newArr);
}

/**
 * يحوّل مفاتيح الكائن من snake_case إلى camelCase
 * @param {Object|Array} obj
 * @returns {Object|Array}
 */
export function toCamelCase(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toCamelCase);
  if (obj instanceof Date) return obj;

  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    result[camelKey] =
      value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)
        ? toCamelCase(value)
        : value;
  }
  return result;
}

/**
 * يحوّل مفاتيح الكائن من camelCase إلى snake_case
 * @param {Object|Array} obj
 * @returns {Object|Array}
 */
export function toSnakeCase(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toSnakeCase);
  if (obj instanceof Date) return obj;

  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase());
    result[snakeKey] = value;
  }
  return result;
}
