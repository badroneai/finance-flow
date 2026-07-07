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
      className="modal-batch__backdrop modal-batch__backdrop--center"
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
        <div className="modal-batch__preview">
          <div className="modal-batch__preview-title">{current?.title || '—'}</div>
          {current?.priceBand && (
            <div className="modal-batch__preview-meta">
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
        <div className="modal-batch__stack">
          <div>
            <label className="modal-batch__label modal-batch__label--xs">المبلغ (ر.س)</label>
            <input
              type="text"
              inputMode="decimal"
              value={pricingAmount}
              onChange={(e) => setPricingAmount(e.target.value)}
              className="modal-batch__input"
              aria-label="المبلغ"
              placeholder="0"
            />
          </div>
          <div>
            <label className="modal-batch__label modal-batch__label--xs">تاريخ الاستحقاق القادم</label>
            <input
              type="date"
              value={pricingDate}
              onChange={(e) => setPricingDate(e.target.value)}
              className="modal-batch__input"
              aria-label="تاريخ الاستحقاق"
            />
          </div>
        </div>
        <div className="modal-batch__actions">
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
