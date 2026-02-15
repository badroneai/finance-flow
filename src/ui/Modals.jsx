import React, { useEffect, useRef } from 'react';
import { Icons } from './ui-common.jsx';

// Extracted from App.jsx (Stage 5 Close): Modal + ConfirmDialog

const FOCUSABLE_SELECTOR = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

function getFocusableElements(container) {
  if (!container) return [];
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
    (el) => el.offsetParent !== null && !el.disabled
  );
}

function useFocusTrap(open, containerRef) {
  useEffect(() => {
    if (!open || !containerRef?.current) return;
    const el = containerRef.current;
    const focusable = getFocusableElements(el);
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();

    const onKeyDown = (e) => {
      if (e.key !== 'Tab') return;
      const current = document.activeElement;
      if (!el.contains(current)) return;
      if (e.shiftKey) {
        if (current === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (current === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, containerRef]);
}

export const ConfirmDialog = ({
  open,
  title,
  message,
  messageList,
  dangerText,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  danger = false,
  MSG,
}) => {
  const dialogRef = useRef(null);
  useFocusTrap(open, dialogRef);
  if (!open) return null;
  const cancelText = cancelLabel || MSG?.buttons?.cancel || 'إلغاء';

  return (
    <div className="confirm-overlay fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onCancel}>
      <div ref={dialogRef} className={`confirm-modal bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full ${danger ? 'confirm-modal danger' : ''}`} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="confirmDialogTitle" aria-describedby="confirmDialogDesc">
        <h3 id="confirmDialogTitle" className="text-lg font-bold text-gray-900">{title || 'تأكيد'}</h3>
        {message ? <p id="confirmDialogDesc" className="text-sm text-gray-600 mt-2">{message}</p> : null}
        {Array.isArray(messageList) && messageList.length ? (
          <ul className="mt-2 text-sm text-gray-600 list-disc" style={{ paddingInlineStart: '1.2rem' }}>
            {messageList.map((x, idx) => <li key={idx}>{x}</li>)}
          </ul>
        ) : null}
        {dangerText ? <p className="text-xs text-red-600 mt-2">{dangerText}</p> : null}
        <div className="confirm-actions flex gap-3 justify-end mt-4">
          <button onClick={onCancel} className="btn-secondary px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium" aria-label="تراجع">{cancelText}</button>
          <button onClick={onConfirm} className={`px-4 py-2 rounded-lg text-white text-sm font-medium ${danger ? 'btn-danger bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`} aria-label="تأكيد">{confirmLabel || 'تأكيد'}</button>
        </div>
      </div>
    </div>
  );
};

export const Modal = ({ open, onClose, title, children, wide = false }) => {
  const dialogRef = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);
  useFocusTrap(open, dialogRef);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center bg-black/50 p-4 overflow-y-auto" onClick={onClose}>
      <div ref={dialogRef} className={`bg-white rounded-xl shadow-2xl mt-8 mb-8 w-full ${wide ? 'max-w-3xl' : 'max-w-lg'}`} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="modalTitle">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 id="modalTitle" className="text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100" aria-label="إغلاق"><Icons.x size={20}/></button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
};
