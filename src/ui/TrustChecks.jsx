/*
  قيد العقار — تنبيه التصفح الخاص وامتلاء التخزين (مستخرج من App.jsx — الخطوة 2)
*/

import React, { useEffect } from 'react';
import { useToast } from '../contexts/ToastContext.jsx';
import { detectPrivateBrowsing } from '../core/dataStore.js';
import { checkStorageQuota } from '../core/storage-quota.js';
import { storageFacade } from '../core/storage-facade.js';

export const TrustChecks = () => {
  const toast = useToast();
  useEffect(() => {
    if (detectPrivateBrowsing()) {
      toast('البيانات تُحفظ على هذا الجهاز فقط. في وضع التصفح الخاص قد تُفقد عند إغلاق المتصفح. للحفاظ عليها استخدم التصفح العادي.', 'warning');
    }
    if (!checkStorageQuota(storageFacade)) {
      toast('مساحة التخزين قريبة من الامتلاء. يُنصح بتصدير نسخة احتياطية أو حذف بعض البيانات.', 'warning');
    }
  }, [toast]);
  return null;
};
