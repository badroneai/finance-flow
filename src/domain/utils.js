/*
  Domain Utils (Notes/Calendar)
  Pure helpers only — no UI copy.
*/

export function gregorianToHijri(gY, gM, gD) {
  const d = new Date(gY, gM - 1, gD);
  const jd = Math.floor((d.getTime() - new Date(1970, 0, 1).getTime()) / 86400000) + 2440588;
  const l = jd - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  const ll = l - 10631 * n + 354;
  const jj = Math.floor((10985 - ll) / 5316) * Math.floor((50 * ll) / 17719) + Math.floor(ll / 5670) * Math.floor((43 * ll) / 15238);
  const ll2 = ll - Math.floor((30 - jj) / 15) * Math.floor((17719 * jj) / 50) - Math.floor(jj / 16) * Math.floor((15238 * jj) / 43) + 29;
  const hM = Math.floor((24 * ll2) / 709);
  const hD = ll2 - Math.floor((709 * hM) / 24);
  const hY = 30 * n + jj - 30;
  return { year: hY, month: hM, day: hD };
}

export function getKeyNC(y, m, d) {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function getDaysInMonthNC(year, month) {
  return new Date(year, month, 0).getDate();
}

export function toArabicNumNC(n, numeralsMode = 'ar') {
  const s = String(n);
  if ((numeralsMode || 'ar') === 'en') return s;
  return s.replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
}
