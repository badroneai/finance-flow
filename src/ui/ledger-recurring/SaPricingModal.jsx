// معالج التسعير السعودي — أسعار مقترحة حسب المدينة وحجم المكتب
function SaPricingModal({
  saPricingOpen,
  setSaPricingOpen,
  saCity,
  setSaCity,
  saSize,
  setSaSize,
  saOnlyUnpriced,
  setSaOnlyUnpriced,
  applySaudiAutoPricingForLedger,
  activeId,
  toast,
  refresh,
}) {
  if (!saPricingOpen) return null;

  return (
    <div
      className="modal-batch__backdrop modal-batch__backdrop--center"
      onClick={() => setSaPricingOpen(false)}
    >
      <div
        className="panel-card modal-surface modal-surface--md"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ledger-panel__header">
          <div>
            <h4 className="ledger-panel__title">تسعير تلقائي (أسعار السوق السعودي)</h4>
            <p className="ledger-panel__subtitle">
              يطبّق أسعاراً مقترحة بناءً على المدينة وحجم المكتب.
            </p>
          </div>
        </div>
        <div className="modal-batch__stack">
          <div>
            <label className="modal-batch__label modal-batch__label--xs">المدينة</label>
            <select
              value={saCity}
              onChange={(e) => setSaCity(e.target.value)}
              className="modal-batch__input modal-batch__input--surface"
              aria-label="المدينة"
            >
              <option value="riyadh">الرياض</option>
              <option value="jeddah">جدة</option>
              <option value="dammam">الدمام</option>
              <option value="qassim">القصيم</option>
              <option value="other">أخرى</option>
            </select>
          </div>
          <div>
            <label className="modal-batch__label modal-batch__label--xs">حجم المكتب</label>
            <select
              value={saSize}
              onChange={(e) => setSaSize(e.target.value)}
              className="modal-batch__input modal-batch__input--surface"
              aria-label="حجم المكتب"
            >
              <option value="small">صغير</option>
              <option value="medium">متوسط</option>
              <option value="large">كبير</option>
            </select>
          </div>
          <label className="modal-batch__checkbox-row">
            <input
              type="checkbox"
              checked={saOnlyUnpriced}
              onChange={(e) => setSaOnlyUnpriced(e.target.checked)}
            />
            فقط البنود غير المسعّرة
          </label>
        </div>
        <div className="modal-batch__actions">
          <button type="button" onClick={() => setSaPricingOpen(false)} className="btn-secondary">
            إلغاء
          </button>
          <button
            type="button"
            onClick={() => {
              const result = applySaudiAutoPricingForLedger({
                ledgerId: activeId,
                city: saCity,
                size: saSize,
                onlyUnpriced: saOnlyUnpriced,
              });
              if (result.ok) {
                toast.success('تم تطبيق التسعير');
                setSaPricingOpen(false);
                refresh();
              } else toast.error(result.message || 'تعذر التطبيق');
            }}
            className="btn-primary"
          >
            تطبيق التسعير
          </button>
        </div>
      </div>
    </div>
  );
}

export default SaPricingModal;
