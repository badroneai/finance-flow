// مودال تسجيل الدفعة — يظهر عند الضغط على "سجّل دفعة" في قائمة الالتزامات
function PayNowModal({ payOpen, paySource, payForm, setPayForm, submitPayNow, setPayOpen }) {
  if (!payOpen || !paySource) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={() => setPayOpen(false)}
    >
      <div
        className="panel-card modal-surface modal-surface--md"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ledger-panel__header">
          <div>
            <h4 className="ledger-panel__title">تسجيل دفعة — {paySource.title}</h4>
            <p className="ledger-panel__subtitle">أدخل عملية الدفع كما ستظهر في السجل المالي.</p>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-medium text-[var(--color-text)] mb-1">
              المبلغ
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={payForm.amount}
              onChange={(e) => setPayForm((p) => ({ ...p, amount: e.target.value }))}
              className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
              aria-label="المبلغ"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text)] mb-1">
              التاريخ
            </label>
            <input
              type="date"
              value={payForm.date}
              onChange={(e) => setPayForm((p) => ({ ...p, date: e.target.value }))}
              className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
              aria-label="التاريخ"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text)] mb-1">
              طريقة الدفع
            </label>
            <select
              value={payForm.paymentMethod}
              onChange={(e) => setPayForm((p) => ({ ...p, paymentMethod: e.target.value }))}
              className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm bg-[var(--color-surface)]"
              aria-label="طريقة الدفع"
            >
              <option value="cash">نقدي</option>
              <option value="bank_transfer">تحويل بنكي</option>
              <option value="check">شيك</option>
              <option value="card">بطاقة</option>
              <option value="other">أخرى</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text)] mb-1">الوصف</label>
            <input
              type="text"
              value={payForm.description}
              onChange={(e) => setPayForm((p) => ({ ...p, description: e.target.value }))}
              className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
              aria-label="الوصف"
            />
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-4">
          <button type="button" onClick={() => setPayOpen(false)} className="btn-secondary">
            إلغاء
          </button>
          <button type="button" onClick={submitPayNow} className="btn-primary">
            تسجيل الدفعة
          </button>
        </div>
      </div>
    </div>
  );
}

export default PayNowModal;
