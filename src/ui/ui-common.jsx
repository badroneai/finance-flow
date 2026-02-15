/*
  قيد العقار — مكونات واجهة مشتركة (مستخرجة من App.jsx — الخطوة 2)
*/

import React from 'react';

// ============================================
// ICONS (SVG Components)
// ============================================
export const Icon = ({ d, size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d={d} /></svg>
);

export const Icons = {
  home: (p) => <Icon {...p} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10" />,
  dashboard: (p) => <svg {...{ width: p?.size || 20, height: p?.size || 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", className: p?.className || '' }}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="4" rx="1" /><rect x="14" y="11" width="7" height="10" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /></svg>,
  list: (p) => <svg {...{ width: p?.size || 20, height: p?.size || 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", className: p?.className || '' }}><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><circle cx="4" cy="6" r="1" fill="currentColor" /><circle cx="4" cy="12" r="1" fill="currentColor" /><circle cx="4" cy="18" r="1" fill="currentColor" /></svg>,
  percent: (p) => <Icon {...p} d="M19 5L5 19 M9 7a2 2 0 11-4 0 2 2 0 014 0z M19 17a2 2 0 11-4 0 2 2 0 014 0z" />,
  mail: (p) => <svg {...{ width: p?.size || 20, height: p?.size || 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", className: p?.className || '' }}><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 4L12 13 2 4" /></svg>,
  fileText: (p) => <svg {...{ width: p?.size || 20, height: p?.size || 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", className: p?.className || '' }}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>,
  settings: (p) => <svg {...{ width: p?.size || 20, height: p?.size || 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", className: p?.className || '' }}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>,
  info: (p) => <svg {...{ width: p?.size || 20, height: p?.size || 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", className: p?.className || '' }}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>,
  plus: (p) => <Icon {...p} d="M12 5v14 M5 12h14" />,
  edit: (p) => <Icon {...p} d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7 M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />,
  trash: (p) => <svg {...{ width: p?.size || 20, height: p?.size || 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", className: p?.className || '' }}><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>,
  x: (p) => <Icon {...p} d="M18 6L6 18 M6 6l12 12" />,
  check: (p) => <Icon {...p} d="M20 6L9 17l-5-5" />,
  download: (p) => <Icon {...p} d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M7 10l5 5 5-5 M12 15V3" />,
  printer: (p) => <svg {...{ width: p?.size || 20, height: p?.size || 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", className: p?.className || '' }}><path d="M6 9V2h12v7" /><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>,
  menu: (p) => <svg {...{ width: p?.size || 20, height: p?.size || 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", className: p?.className || '' }}><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>,
  chevronDown: (p) => <Icon {...p} d="M6 9l6 6 6-6" />,
  search: (p) => <Icon {...p} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />,
  filter: (p) => <svg {...{ width: p?.size || 20, height: p?.size || 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", className: p?.className || '' }}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>,
  arrowUp: (p) => <Icon {...p} d="M12 19V5 M5 12l7-7 7 7" />,
  arrowDown: (p) => <Icon {...p} d="M12 5v14 M19 12l-7 7-7-7" />,
  empty: (p) => <svg {...{ width: p?.size || 64, height: p?.size || 64, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", className: p?.className || 'text-gray-300' }}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><line x1="9" y1="13" x2="15" y2="13" /></svg>,
  calendar: (p) => <svg {...{ width: p?.size || 20, height: p?.size || 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", className: p?.className || '' }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
  notes: (p) => <svg {...{ width: p?.size || 20, height: p?.size || 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", className: p?.className || '' }}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>,
};

// ============================================
// FORM & SETTINGS FIELDS
// ============================================
export const FormField = ({ label, error, children, id: fieldId }) => {
  const errorId = fieldId ? `${fieldId}-error` : undefined;
  const child = React.Children.only(children);
  const enhancedChild = fieldId && React.isValidElement(child)
    ? React.cloneElement(child, { id: fieldId, 'aria-invalid': !!error, 'aria-describedby': error ? errorId : undefined })
    : children;
  return (
    <div className="mb-3">
      {fieldId ? <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor={fieldId}>{label}</label> : <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      {enhancedChild}
      {error && <p id={errorId} className="text-red-500 text-xs mt-1" role="alert">{error}</p>}
    </div>
  );
};

export const SettingsField = ({ label, children }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    {children}
  </div>
);

// ============================================
// COMMON COMPONENTS
// ============================================
export const SummaryCard = ({ label, value, color = 'blue', icon }) => (
  <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs font-medium text-gray-500">{label}</span>
      {icon && <span className={`text-${color}-600`}>{icon}</span>}
    </div>
    <div className={`text-xl font-bold text-${color}-600`}>{value}</div>
  </div>
);

export const EmptyState = ({ message, icon }) => (
  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
    {icon || <Icons.empty size={64} aria-hidden="true" />}
    <p className="mt-4 text-sm">{message}</p>
  </div>
);

export const EnhancedEmptyState = ({ icon, title, description, ctaText, onCtaClick }) => (
  <div className="empty-state">
    {icon ? <div className="empty-icon">{icon}</div> : null}
    <h3>{title}</h3>
    <p>{description}</p>
    {ctaText && onCtaClick && (
      <button type="button" onClick={onCtaClick} className="empty-cta">
        {ctaText}
      </button>
    )}
  </div>
);

export const Badge = ({ children, color = 'blue' }) => {
  const colors = { blue: 'bg-blue-50 text-blue-700', green: 'bg-green-50 text-green-700', red: 'bg-red-50 text-red-700', yellow: 'bg-yellow-50 text-yellow-700', gray: 'bg-gray-100 text-gray-600' };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[color] || colors.blue}`}>{children}</span>;
};
