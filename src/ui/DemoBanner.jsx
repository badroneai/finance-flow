/*
  قيد العقار (Finance Flow)
  DemoBanner.jsx — بانر الوضع التجريبي (SPR-015)

  يظهر أعلى التطبيق عندما يكون في وضع Demo.
*/

import React from 'react';
import { useDemo } from '../contexts/DemoContext.jsx';

export const DemoBanner = () => {
  const { isDemo, exitDemo } = useDemo();

  if (!isDemo) return null;

  return (
    <div
      dir="rtl"
      role="status"
      aria-live="polite"
      style={{
        background: 'linear-gradient(135deg, #0F1C2E 0%, #1A2A42 100%)',
        color: '#fff',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        flexWrap: 'wrap',
        fontSize: '14px',
        fontFamily: '"IBM Plex Sans Arabic", sans-serif',
        position: 'sticky',
        top: 0,
        zIndex: 9999,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '16px' }} aria-hidden="true">
          &#9888;
        </span>
        أنت في <strong style={{ margin: '0 4px' }}>الوضع التجريبي</strong> — البيانات لن تُحفظ بعد
        إغلاق المتصفح
      </span>
      <button
        type="button"
        onClick={exitDemo}
        style={{
          background: '#6B5A2E',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          padding: '6px 16px',
          fontSize: '13px',
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: '"IBM Plex Sans Arabic", sans-serif',
          transition: 'background 0.2s',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={(e) => {
          e.target.style.background = '#7d6b38';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = '#6B5A2E';
        }}
      >
        سجّل حسابك الآن
      </button>
    </div>
  );
};
