// معالج التسعير السريع — يمر على البنود غير المسعّرة واحداً تلو الآخر
function PricingWizardModal({
  pricingOpen,
  pricingList,
  pricingIndex,
  pricingAmount,
  setPricingAmount,
  pricingDate,
  setPricingDate,
  applyQuickPricing,
  setPricingOpen,
  Currency,
}) {
  if (!pricingOpen || !pricingList || pricingList.length === 0) return null;

  const current = pricingList[pricingIndex];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={() => setPricingOpen(false)}
    >
      <div
        className="panel-card modal-surface modal-surface--md"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ledger-panel__header">
          <div>
            <h4 className="ledger-panel__title">معالج التسعير</h4>
            <p className="ledger-panel__subtitle">
              بند {pricingIndex + 1} من {pricingList.length}
            </p>
          </div>
        </div>
        <div className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] mb-3">
          <div className="font-semibold text-[var(--color-text)]">{current?.title || '—'}</div>
          {current?.priceBand && (
            <div className="text-xs text-[var(--color-muted)] mt-1">
              نطاق السعر: <Currency value={current.priceBand.min || 0} /> —{' '}
              <Currency value={current.priceBand.max || 0} />
              {current.priceBand.typical > 0 && (
                <>
                  {' '}
                  (المتوسط: <Currency value={current.priceBand.typical} />)
                </>
              )}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-medium text-[var(--color-text)] mb-1">
              المبلغ (ر.س)
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={pricingAmount}
              onChange={(e) => setPricingAmount(e.target.value)}
              className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
              aria-label="المبلغ"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text)] mb-1">
              تاريخ الاستحقاق القادم
            </label>
            <input
              type="date"
              value={pricingDate}
              onChange={(e) => setPricingDate(e.target.value)}
              className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
              aria-label="تاريخ الاستحقاق"
            />
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-4">
          <button type="button" onClick={() => setPricingOpen(false)} className="btn-secondary">
            إلغاء
          </button>
          <button type="button" onClick={applyQuickPricing} className="btn-primary">
            حفظ وانتقل للتالي
          </button>
        </div>
      </div>
    </div>
  );
}

export default PricingWizardModal;
