import { useEffect, useRef } from 'react';
import { Icons } from './ui-common.jsx';

// Extracted from App.jsx (Stage 5 Close): Modal + ConfirmDialog

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

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
    <div className="confirm-overlay" onClick={onCancel}>
      <div
        ref={dialogRef}
        className={`confirm-modal modal-surface modal-surface--sm${danger ? ' confirm-modal--danger' : ''}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmDialogTitle"
        aria-describedby="confirmDialogDesc"
      >
        <h3 id="confirmDialogTitle" className="confirm-modal__title">
          {title || 'تأكيد'}
        </h3>
        {message ? (
          <p id="confirmDialogDesc" className="confirm-modal__message">
            {message}
          </p>
        ) : null}
        {Array.isArray(messageList) && messageList.length ? (
          <ul className="confirm-modal__list">
            {messageList.map((x, idx) => (
              <li key={idx}>{x}</li>
            ))}
          </ul>
        ) : null}
        {dangerText ? (
          <p className="confirm-modal__danger-text">{dangerText}</p>
        ) : null}
        <div className="confirm-actions">
          <button onClick={onCancel} className="btn-secondary" aria-label="تراجع">
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={danger ? 'btn-primary confirm-modal__btn--danger' : 'btn-primary'}
            aria-label="تأكيد"
          >
            {confirmLabel || 'تأكيد'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const Modal = ({ open, onClose, title, children, wide = false }) => {
  const dialogRef = useRef(null);
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);
  useFocusTrap(open, dialogRef);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        ref={dialogRef}
        className={`modal-dialog modal-surface ${wide ? 'modal-surface--wide' : 'modal-surface--md'}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modalTitle"
      >
        <div className="modal-header">
          <h3 id="modalTitle" className="modal-title">
            {title}
          </h3>
          <button onClick={onClose} className="modal-close" aria-label="إغلاق">
            <Icons.x size={20} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};
