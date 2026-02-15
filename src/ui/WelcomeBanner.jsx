/*
  قيد العقار — بانر الترحيب (مستخرج من App.jsx — الخطوة 2)
*/

import React, { useState, useEffect } from 'react';
import { storageFacade } from '../core/storage-facade.js';
import { safeGet } from '../core/dataStore.js';
import { KEYS } from '../constants/index.js';
import { STORAGE_KEYS } from '../../assets/js/core/keys.js';

export const WelcomeBanner = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const hasSeenBanner = storageFacade.getRaw(STORAGE_KEYS.UI_WELCOME);
    const tx = safeGet(KEYS.transactions, []);
    const comm = safeGet(KEYS.commissions, []);
    const hasData = tx.length > 0 || comm.length > 0;
    if (!hasSeenBanner && !hasData) setShow(true);
  }, []);

  const dismiss = () => {
    setShow(false);
    storageFacade.setRaw(STORAGE_KEYS.UI_WELCOME, 'true');
  };

  if (!show) return null;
  return (
    <div className="welcome-banner no-print" role="region" aria-label="ترحيب">
      <div className="banner-content">
        <div className="banner-text">
          <strong>مرحبًا بك في قيد العقار!</strong>
          <p>ابدأ بإضافة عقار، ثم سجّل الدخل والمصروفات، وسيتم احتساب التحليل المالي تلقائيًا.</p>
        </div>
        <button type="button" onClick={dismiss} className="banner-close" aria-label="إغلاق">×</button>
      </div>
    </div>
  );
};
