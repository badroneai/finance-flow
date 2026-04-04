/*
  قيد العقار — مكونات واجهة مشتركة (مستخرجة من App.jsx — الخطوة 2)
*/

import React from 'react';

// ============================================
// ICONS (SVG Components)
// ============================================
export const Icon = ({ d, size = 20, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d={d} />
  </svg>
);

export const Icons = {
  home: (p) => <Icon {...p} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10" />,
  dashboard: (p) => (
    <svg
      {...{
        width: p?.size || 20,
        height: p?.size || 20,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: '2',
        className: p?.className || '',
      }}
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="4" rx="1" />
      <rect x="14" y="11" width="7" height="10" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  list: (p) => (
    <svg
      {...{
        width: p?.size || 20,
        height: p?.size || 20,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: '2',
        className: p?.className || '',
      }}
    >
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <circle cx="4" cy="6" r="1" fill="currentColor" />
      <circle cx="4" cy="12" r="1" fill="currentColor" />
      <circle cx="4" cy="18" r="1" fill="currentColor" />
    </svg>
  ),
  percent: (p) => (
    <Icon {...p} d="M19 5L5 19 M9 7a2 2 0 11-4 0 2 2 0 014 0z M19 17a2 2 0 11-4 0 2 2 0 014 0z" />
  ),
  mail: (p) => (
    <svg
      {...{
        width: p?.size || 20,
        height: p?.size || 20,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: '2',
        className: p?.className || '',
      }}
    >
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M22 4L12 13 2 4" />
    </svg>
  ),
  fileText: (p) => (
    <svg
      {...{
        width: p?.size || 20,
        height: p?.size || 20,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: '2',
        className: p?.className || '',
      }}
    >
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  settings: (p) => (
    <svg
      {...{
        width: p?.size || 20,
        height: p?.size || 20,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: '2',
        className: p?.className || '',
      }}
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  ),
  info: (p) => (
    <svg
      {...{
        width: p?.size || 20,
        height: p?.size || 20,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: '2',
        className: p?.className || '',
      }}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  ),
  plus: (p) => <Icon {...p} d="M12 5v14 M5 12h14" />,
  edit: (p) => (
    <Icon
      {...p}
      d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7 M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
    />
  ),
  trash: (p) => (
    <svg
      {...{
        width: p?.size || 20,
        height: p?.size || 20,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: '2',
        className: p?.className || '',
      }}
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    </svg>
  ),
  x: (p) => <Icon {...p} d="M18 6L6 18 M6 6l12 12" />,
  check: (p) => <Icon {...p} d="M20 6L9 17l-5-5" />,
  download: (p) => (
    <Icon {...p} d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M7 10l5 5 5-5 M12 15V3" />
  ),
  printer: (p) => (
    <svg
      {...{
        width: p?.size || 20,
        height: p?.size || 20,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: '2',
        className: p?.className || '',
      }}
    >
      <path d="M6 9V2h12v7" />
      <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  ),
  menu: (p) => (
    <svg
      {...{
        width: p?.size || 20,
        height: p?.size || 20,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: '2',
        className: p?.className || '',
      }}
    >
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
  chevronDown: (p) => <Icon {...p} d="M6 9l6 6 6-6" />,
  search: (p) => <Icon {...p} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />,
  filter: (p) => (
    <svg
      {...{
        width: p?.size || 20,
        height: p?.size || 20,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: '2',
        className: p?.className || '',
      }}
    >
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  ),
  arrowUp: (p) => <Icon {...p} d="M12 19V5 M5 12l7-7 7 7" />,
  arrowDown: (p) => <Icon {...p} d="M12 5v14 M19 12l-7 7-7-7" />,
  empty: (p) => (
    <svg
      {...{
        width: p?.size || 64,
        height: p?.size || 64,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: '1.5',
        className: p?.className || 'text-[var(--color-muted)]',
      }}
    >
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <line x1="9" y1="13" x2="15" y2="13" />
    </svg>
  ),
  calendar: (p) => (
    <svg
      {...{
        width: p?.size || 20,
        height: p?.size || 20,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: '2',
        className: p?.className || '',
      }}
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  notes: (p) => (
    <svg
      {...{
        width: p?.size || 20,
        height: p?.size || 20,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: '2',
        className: p?.className || '',
      }}
    >
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  pulse: (p) => (
    <svg
      {...{
        width: p?.size || 20,
        height: p?.size || 20,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: '2',
        className: p?.className || '',
      }}
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  ),
  inbox: (p) => (
    <svg
      {...{
        width: p?.size || 20,
        height: p?.size || 20,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: '2',
        className: p?.className || '',
      }}
    >
      <path d="M22 12h-6l-2 3H10L8 12H2" />
      <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
    </svg>
  ),
  ledgers: (p) => (
    <svg
      {...{
        width: p?.size || 20,
        height: p?.size || 20,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: '2',
        className: p?.className || '',
      }}
    >
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
      <line x1="8" y1="6" x2="16" y2="6" />
      <line x1="8" y1="10" x2="16" y2="10" />
    </svg>
  ),
  transactions: (p) => (
    <svg
      {...{
        width: p?.size || 20,
        height: p?.size || 20,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: '2',
        className: p?.className || '',
      }}
    >
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
    </svg>
  ),
  report: (p) => (
    <svg
      {...{
        width: p?.size || 20,
        height: p?.size || 20,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: '2',
        className: p?.className || '',
      }}
    >
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  moreMenu: (p) => (
    <svg
      {...{
        width: p?.size || 20,
        height: p?.size || 20,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: '2',
        className: p?.className || '',
      }}
    >
      <circle cx="12" cy="5" r="1" fill="currentColor" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      <circle cx="12" cy="19" r="1" fill="currentColor" />
    </svg>
  ),
  properties: (p) => (
    <svg
      {...{
        width: p?.size || 20,
        height: p?.size || 20,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: '2',
        className: p?.className || '',
      }}
    >
      <path d="M3 21h18" />
      <path d="M5 21V7l8-4v18" />
      <path d="M19 21V11l-6-4" />
      <path d="M9 9v.01" />
      <path d="M9 12v.01" />
      <path d="M9 15v.01" />
      <path d="M9 18v.01" />
    </svg>
  ),
  commissions: (p) => (
    <svg
      {...{
        width: p?.size || 20,
        height: p?.size || 20,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: '2',
        className: p?.className || '',
      }}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M16 8h-6a2 2 0 100 4h4a2 2 0 110 4H8" strokeLinecap="round" />
      <line x1="12" y1="6" x2="12" y2="8" />
      <line x1="12" y1="16" x2="12" y2="18" />
    </svg>
  ),
  contacts: (p) => (
    <svg
      {...{
        width: p?.size || 20,
        height: p?.size || 20,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: '2',
        className: p?.className || '',
      }}
    >
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  contracts: (p) => (
    <svg
      {...{
        width: p?.size || 20,
        height: p?.size || 20,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: '2',
        className: p?.className || '',
      }}
    >
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  ),
};

// ============================================
// FORM & SETTINGS FIELDS
// ============================================
export const FormField = ({ label, error, children, id: fieldId }) => {
  const errorId = fieldId ? `${fieldId}-error` : undefined;
  const child = React.Children.only(children);
  const enhancedChild =
    fieldId && React.isValidElement(child)
      ? React.cloneElement(child, {
          id: fieldId,
          'aria-invalid': !!error,
          'aria-describedby': error ? errorId : undefined,
        })
      : children;
  return (
    <div className="field-group">
      {fieldId ? (
        <label className="field-label" htmlFor={fieldId}>
          {label}
        </label>
      ) : (
        <label className="field-label">{label}</label>
      )}
      {enhancedChild}
      {error && (
        <p id={errorId} className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export const SettingsField = ({ label, children }) => (
  <div className="settings-field">
    <label className="field-label">{label}</label>
    {children}
  </div>
);

// ============================================
// COMMON COMPONENTS
// ============================================
export const SummaryCard = ({ label, value, color = 'blue', icon }) => {
  const colorMap = {
    blue: '--color-info',
    green: '--color-success',
    red: '--color-danger',
    yellow: '--color-warning',
  };
  const colorVar = colorMap[color] || colorMap.blue;
  return (
    <div className={`summary-card summary-card--${color}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="summary-card__label">{label}</span>
        {icon && (
          <span className="summary-card__icon" style={{ color: `var(${colorVar})` }}>
            {icon}
          </span>
        )}
      </div>
      <div className="summary-card__value" style={{ color: `var(${colorVar})` }}>
        {value}
      </div>
    </div>
  );
};

/**
 * زر إضافة عائم — يظهر على الجوال فقط فوق BottomNav
 * يُستخدم في الصفحات الرئيسية (عقارات، جهات اتصال، عقود، حركات)
 */
export const MobileFAB = ({ onClick, label = 'إضافة', icon }) => {
  const FABIcon = icon || Icons.plus;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="md:hidden fixed z-40 rounded-full shadow-lg flex items-center justify-center no-print transition-transform active:scale-95"
      style={{
        bottom: 'calc(3.5rem + env(safe-area-inset-bottom, 0px) + 1rem)',
        insetInlineStart: '1rem',
        width: '3.5rem',
        height: '3.5rem',
        backgroundColor: 'var(--color-primary)',
        color: 'var(--color-text-inverse)',
        boxShadow: 'var(--shadow)',
      }}
    >
      <FABIcon size={24} />
    </button>
  );
};

export const EmptyState = ({ message, icon, title, description, actionLabel, onAction }) => (
  <div className="empty-state">
    <div className="empty-icon">
      {icon || <Icons.empty size={40} className="text-[var(--color-muted)]" aria-hidden="true" />}
    </div>
    {title && <h3>{title}</h3>}
    <p>{message || description}</p>
    {actionLabel && onAction && (
      <button type="button" onClick={onAction} className="btn-primary mt-4">
        {actionLabel}
      </button>
    )}
  </div>
);

export const EnhancedEmptyState = ({ icon, title, description, ctaText, onCtaClick }) => (
  <EmptyState
    icon={icon}
    title={title}
    description={description}
    actionLabel={ctaText}
    onAction={onCtaClick}
  />
);

export const Badge = ({ children, color = 'blue' }) => {
  const colorMap = {
    blue: { bg: 'var(--color-info-bg)', text: 'var(--color-info)' },
    green: { bg: 'var(--color-success-bg)', text: 'var(--color-success)' },
    red: { bg: 'var(--color-danger-bg)', text: 'var(--color-danger)' },
    yellow: { bg: 'var(--color-warning-bg)', text: 'var(--color-warning)' },
    gray: { bg: 'var(--color-bg)', text: 'var(--color-muted)' },
  };
  const colorVar = colorMap[color] || colorMap.blue;
  return (
    <span
      className={`badge badge--${color} inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium`}
      style={{ backgroundColor: colorVar.bg, color: colorVar.text }}
    >
      {children}
    </span>
  );
};
