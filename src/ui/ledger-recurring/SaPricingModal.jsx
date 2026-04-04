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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
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
        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-medium text-[var(--color-text)] mb-1">
              المدينة
            </label>
            <select
              value={saCity}
              onChange={(e) => setSaCity(e.target.value)}
              className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm bg-[var(--color-surface)]"
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
            <label className="block text-xs font-medium text-[var(--color-text)] mb-1">
              حجم المكتب
            </label>
            <select
              value={saSize}
              onChange={(e) => setSaSize(e.target.value)}
              className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm bg-[var(--color-surface)]"
              aria-label="حجم المكتب"
            >
              <option value="small">صغير</option>
              <option value="medium">متوسط</option>
              <option value="large">كبير</option>
            </select>
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-[var(--color-text)]">
            <input
              type="checkbox"
              checked={saOnlyUnpriced}
              onChange={(e) => setSaOnlyUnpriced(e.target.checked)}
            />
            فقط البنود غير المسعّرة
          </label>
        </div>
        <div className="flex gap-2 justify-end mt-4">
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
