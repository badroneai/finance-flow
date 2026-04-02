// مودال تسجيل الدفعة — يظهر عند الضغط على "سجّل دفعة" في قائمة الالتزامات
function PayNowModal({ payOpen, paySource, payForm, setPayForm, submitPayNow, setPayOpen }) {
  if (!payOpen || !paySource) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={() => setPayOpen(false)}
    >
      <div
        className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] shadow-lg p-5 w-full max-w-md"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        <h4 className="font-bold text-[var(--color-text)] mb-3">تسجيل دفعة — {paySource.title}</h4>
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
          <button
            type="button"
            onClick={() => setPayOpen(false)}
            className="px-4 py-2 rounded-lg border border-[var(--color-border)] text-[var(--color-text)] text-sm font-medium hover:bg-[var(--color-bg)]"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={submitPayNow}
            className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-[var(--color-text-inverse)] text-sm font-medium hover:bg-[var(--color-primary-strong)]"
          >
            تسجيل الدفعة
          </button>
        </div>
      </div>
    </div>
  );
}

export default PayNowModal;
