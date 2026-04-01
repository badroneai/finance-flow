/**
 * نافذة عرض سند القبض — قابلة للطباعة والتصدير PDF
 * تعرض إيصال الدفعة بتنسيق احترافي مع خيارات الطباعة والتصدير
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';
import { formatCurrency } from '../utils/format.jsx';

/**
 * @param {Object} props
 * @param {Object} props.receipt - نموذج الإيصال من buildReceiptModel
 * @param {Function} props.onClose - إغلاق النافذة
 */
export default function ReceiptModal({ receipt, onClose }) {
  const [exporting, setExporting] = useState(false);
  const backdropRef = useRef(null);
  const printRef = useRef(null);

  // إغلاق بـ Escape
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // إغلاق عند الضغط على الخلفية
  const handleBackdropClick = useCallback(
    (e) => {
      if (e.target === backdropRef.current) onClose();
    },
    [onClose]
  );

  // طباعة عبر المتصفح
  const handlePrint = useCallback(() => {
    const content = printRef.current;
    if (!content) return;

    const printWin = window.open('', '_blank', 'width=800,height=600');
    if (!printWin) return;

    printWin.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8" />
        <title>سند قبض — ${receipt.receiptNumber || ''}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: "IBM Plex Sans Arabic", Tahoma, Arial, sans-serif; direction: rtl; padding: 24px; color: #0F1C2E; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>${DOMPurify.sanitize(content.innerHTML, { FORCE_BODY: true })}</body>
      </html>
    `);
    printWin.document.close();
    // انتظار التحميل ثم الطباعة
    printWin.onload = () => {
      printWin.print();
      printWin.close();
    };
    // fallback إذا لم يُطلق onload
    setTimeout(() => {
      try { printWin.print(); printWin.close(); } catch {}
    }, 500);
  }, [receipt]);

  // تصدير PDF
  const handleExportPdf = useCallback(async () => {
    setExporting(true);
    try {
      const { exportReceiptPdf } = await import('../core/pdf-service.js');
      await exportReceiptPdf(receipt);
    } catch (err) {
      console.warn('[قيد العقار] ⚠️ فشل تصدير PDF:', err?.message || err);
    } finally {
      setExporting(false);
    }
  }, [receipt]);

  if (!receipt) return null;

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      style={{ background: 'var(--color-overlay)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-modal-title"
    >
      <div
        className="receipt-sheet w-full max-w-lg bg-[var(--color-surface)] rounded-t-2xl md:rounded-2xl max-h-[90vh] overflow-y-auto"
        dir="rtl"
      >
        {/* أزرار التحكم */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)] sticky top-0 bg-[var(--color-surface)] z-10 rounded-t-2xl">
          <h2 id="receipt-modal-title" className="text-lg font-bold text-[var(--color-text)]">
            سند قبض
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="btn-secondary"
            >
              طباعة
            </button>
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={exporting}
              className="btn-primary disabled:opacity-60"
            >
              {exporting ? 'جاري التصدير...' : 'تصدير PDF'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-muted)] hover:bg-[var(--color-bg)]"
              aria-label="إغلاق"
            >
              ✕
            </button>
          </div>
        </div>

        {/* محتوى الإيصال القابل للطباعة */}
        <div ref={printRef} className="p-5">
          {/* رأس الإيصال */}
          <div className="text-center pb-4 mb-4 border-b-2 border-[var(--color-text)]">
            <h3 className="text-xl font-bold text-[var(--color-text)]">
              {receipt.officeName || 'قيد العقار'}
            </h3>
            <p className="text-base font-bold mt-2" style={{ color: 'var(--color-primary)' }}>
              سند قبض
            </p>
            <p className="text-xs text-[var(--color-muted)] mt-1">
              رقم الإيصال: {receipt.receiptNumber}
            </p>
          </div>

          {/* بيانات الإيصال */}
          <div className="space-y-0">
            <ReceiptRow label="تاريخ الإصدار" value={receipt.issueDate} />
            <ReceiptRow label="اسم المستأجر" value={receipt.tenantName || '—'} />
            <ReceiptRow label="رقم العقد" value={receipt.contractNumber || '—'} />
            <ReceiptRow label="العقار" value={receipt.propertyName || '—'} />
            {receipt.unitName && <ReceiptRow label="الوحدة" value={receipt.unitName} />}
            <ReceiptRow label="طريقة الدفع" value={receipt.paymentMethodLabel} />
            {receipt.installmentNumber && (
              <ReceiptRow label="رقم القسط" value={receipt.installmentNumber} />
            )}
          </div>

          {/* المبلغ */}
          <div
            className="rounded-xl p-5 text-center my-5"
            style={{
              background: 'var(--color-success-bg)',
              border: '2px solid var(--color-success)',
            }}
          >
            <p className="text-xs font-medium" style={{ color: 'var(--color-success)' }}>
              المبلغ المستلم
            </p>
            <p
              className="text-2xl font-extrabold mt-1"
              style={{ color: 'var(--color-success)' }}
            >
              {formatCurrency(receipt.amount)}
            </p>
          </div>

          {/* ملاحظة */}
          {receipt.note && (
            <div
              className="rounded-lg p-3 mb-5 text-sm"
              style={{
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-muted)',
              }}
            >
              <strong>ملاحظة:</strong> {receipt.note}
            </div>
          )}

          {/* خانات التوقيع */}
          <div className="flex justify-between mt-10 pt-5 border-t-2 border-[var(--color-border)]">
            <div className="text-center w-2/5">
              <p className="text-xs text-[var(--color-muted)] mb-10">توقيع المستلم</p>
              <div className="border-b border-[var(--color-muted)] mb-1" />
              <p className="text-xs text-[var(--color-muted)]">المكتب</p>
            </div>
            <div className="text-center w-2/5">
              <p className="text-xs text-[var(--color-muted)] mb-10">توقيع الدافع</p>
              <div className="border-b border-[var(--color-muted)] mb-1" />
              <p className="text-xs text-[var(--color-muted)]">{receipt.tenantName || '—'}</p>
            </div>
          </div>

          {/* تذييل */}
          <p className="text-center text-xs text-[var(--color-muted)] mt-6 pt-3 border-t border-[var(--color-border)]">
            تم إنشاؤه بواسطة قيد العقار — {new Date().toLocaleDateString('ar-SA')}
          </p>
        </div>
      </div>
    </div>
  );
}

/** صف بيانات في الإيصال */
function ReceiptRow({ label, value }) {
  return (
    <div className="flex justify-between items-baseline py-2.5 border-b border-[var(--color-border)]">
      <span className="text-sm text-[var(--color-muted)] flex-shrink-0">{label}</span>
      <span className="text-sm font-semibold text-[var(--color-text)]">{value}</span>
    </div>
  );
}
