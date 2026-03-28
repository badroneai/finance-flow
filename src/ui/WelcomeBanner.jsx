/*
  قيد العقار — بانر الترحيب (مستخرج من App.jsx — الخطوة 2)

  SPR-008: يستخدم DataContext بدل قراءة localStorage مباشرة.
  يعمل بشكل صحيح في الوضعين (سحابي + محلي).
*/

import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext.jsx';
import { storageFacade } from '../core/storage-facade.js';
import { STORAGE_KEYS } from '../constants/index.js';

export const WelcomeBanner = () => {
  const [show, setShow] = useState(false);

  let transactions = [];
  let commissions = [];
  try {
    const data = useData();
    transactions = data?.transactions || [];
    commissions = data?.commissions || [];
  } catch {
    // خارج DataProvider — الافتراضي مصفوفات فارغة
  }

  useEffect(() => {
    const hasSeenBanner = storageFacade.getRaw(STORAGE_KEYS.UI_WELCOME);
    const hasData = transactions.length > 0 || commissions.length > 0;
    if (!hasSeenBanner && !hasData) {
      setShow(true);
    } else {
      setShow(false);
    }
  }, [transactions.length, commissions.length]);

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
          <p>
            ابدأ بإنشاء دفتر (عقار)، ثم سجّل الدخل والمصروفات، وسيتم احتساب التحليل المالي تلقائيًا.
          </p>
        </div>
        <button type="button" onClick={dismiss} className="banner-close" aria-label="إغلاق">
          ×
        </button>
      </div>
    </div>
  );
};
