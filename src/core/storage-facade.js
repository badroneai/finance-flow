/*
  قيد العقار (Finance Flow)
  Stage 3.1 — storage facade

  الهدف:
  - طبقة موحدة للوصول للتخزين (بدون تغيير سلوك).
  - في هذه المرحلة نُبقي التنفيذ فوق core/storage الحالي.
*/

import { storage } from '../../assets/js/core/storage.js';

export const storageFacade = {
  getRaw: (key) => storage.getRaw(key),
  setRaw: (key, value) => storage.setRaw(key, value),
  removeRaw: (key) => storage.removeRaw(key),
};
