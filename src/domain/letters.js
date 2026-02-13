/*
  Domain: Letters
  Pure validation/helpers only.
*/

export function validateLetterFields(template, fields, fieldLabels) {
  const errs = {};
  const list = template?.fields || [];
  list.forEach((k) => {
    if (!fields?.[k]?.trim()) errs[k] = `${fieldLabels[k]} مطلوب`;
  });
  return errs;
}
