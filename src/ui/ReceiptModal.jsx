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
      try {
        printWin.print();
        printWin.close();
      } catch {}
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
      className="receipt-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-modal-title"
    >
      <div className="receipt-sheet modal-surface modal-surface--md" dir="rtl">
        {/* أزرار التحكم */}
        <div className="modal-sheet__header">
          <h2 id="receipt-modal-title" className="receipt-sheet__title">
            سند قبض
          </h2>
          <div className="receipt-sheet__actions">
            <button type="button" onClick={handlePrint} className="btn-secondary">
              طباعة
            </button>
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={exporting}
              className="btn-primary u-disabled-muted"
            >
              {exporting ? 'جاري التصدير...' : 'تصدير PDF'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="modal-sheet__close"
              aria-label="إغلاق"
            >
              ✕
            </button>
          </div>
        </div>

        {/* محتوى الإيصال القابل للطباعة */}
        <div ref={printRef} className="receipt-sheet__body">
          {/* رأس الإيصال */}
          <div className="receipt__header">
            <h3 className="receipt__office-name">
              {receipt.officeName || 'قيد العقار'}
            </h3>
            <p className="receipt__subtitle">سند قبض</p>
            <p className="receipt__number">
              رقم الإيصال: {receipt.receiptNumber}
            </p>
          </div>

          {/* بيانات الإيصال */}
          <div>
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
          <div className="receipt__amount-box">
            <p className="receipt__amount-label">المبلغ المستلم</p>
            <p className="receipt__amount-value">{formatCurrency(receipt.amount)}</p>
          </div>

          {/* بيانات ZATCA — الضريبة */}
          {receipt.vatAmount > 0 && (
            <div>
              <ReceiptRow
                label="ضريبة القيمة المضافة (15%)"
                value={formatCurrency(receipt.vatAmount)}
              />
              <ReceiptRow
                label="الإجمالي شامل الضريبة"
                value={formatCurrency(receipt.totalWithVat)}
              />
              {receipt.sellerTaxNumber && (
                <ReceiptRow label="الرقم الضريبي" value={receipt.sellerTaxNumber} />
              )}
            </div>
          )}

          {/* ملاحظة */}
          {receipt.note && (
            <div className="receipt__note">
              <strong>ملاحظة:</strong> {receipt.note}
            </div>
          )}

          {/* خانات التوقيع */}
          <div className="receipt__signatures">
            <div className="receipt__sig-col">
              <p className="receipt__sig-label">توقيع المستلم</p>
              <div className="receipt__sig-line" />
              <p className="receipt__sig-name">المكتب</p>
            </div>
            <div className="receipt__sig-col">
              <p className="receipt__sig-label">توقيع الدافع</p>
              <div className="receipt__sig-line" />
              <p className="receipt__sig-name">{receipt.tenantName || '—'}</p>
            </div>
          </div>

          {/* تذييل */}
          <p className="receipt__footer">
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
    <div className="receipt__row">
      <span className="receipt__row-label">{label}</span>
      <span className="receipt__row-value">{value}</span>
    </div>
  );
}
