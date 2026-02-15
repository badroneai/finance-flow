/*
  قيد العقار — دوال مساعدة عامة (مستخرجة من App.jsx)
*/

/** توليد معرف فريد */
export const genId = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).substr(2));

/** تاريخ/وقت ISO الحالي */
export const now = () => new Date().toISOString();

/** تاريخ اليوم بصيغة YYYY-MM-DD */
export const today = () => new Date().toISOString().split('T')[0];

/** إرجاع true إذا كانت السلسلة تاريخاً صالحاً (مثل YYYY-MM-DD) */
export const isValidDateStr = (str) => {
  const s = String(str ?? '').trim();
  if (!s) return false;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return false;
  const back = d.toISOString().split('T')[0];
  return back === s;
};

/** تحويل آمن لرقم مع fallback (يمنع حفظ NaN في التخزين) */
export const safeNum = (val, fallback = 0) => {
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
};

export default { genId, now, today, isValidDateStr, safeNum };
