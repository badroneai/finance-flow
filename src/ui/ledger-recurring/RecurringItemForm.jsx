// نموذج إضافة / تعديل التزام — القسم الأول الذي يراه المستخدم
function RecurringItemForm({
  recForm,
  setRecForm,
  recEditingId,
  setRecEditingId,
  saveRecurring,
  resetRecForm,
}) {
  return (
    <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 md:p-5 shadow-sm mb-4">
      <h4 className="font-bold text-[var(--color-text)] mb-3">
        {recEditingId ? 'تعديل الالتزام' : 'إضافة التزام جديد'}
      </h4>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-[var(--color-text)] mb-1">
            اسم الالتزام
          </label>
          <input
            type="text"
            value={recForm.title}
            onChange={(e) => setRecForm((p) => ({ ...p, title: e.target.value }))}
            maxLength={200}
            className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
            aria-label="اسم الالتزام"
            placeholder="مثال: إيجار المكتب"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--color-text)] mb-1">
            المبلغ (ر.س)
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={recForm.amount}
            onChange={(e) => setRecForm((p) => ({ ...p, amount: e.target.value }))}
            className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
            aria-label="المبلغ"
            placeholder="0"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--color-text)] mb-1">التكرار</label>
          <select
            value={recForm.frequency}
            onChange={(e) => setRecForm((p) => ({ ...p, frequency: e.target.value }))}
            className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm bg-[var(--color-surface)]"
            aria-label="التكرار"
          >
            <option value="monthly">شهري</option>
            <option value="quarterly">ربع سنوي</option>
            <option value="yearly">سنوي</option>
            <option value="adhoc">عند الحاجة</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--color-text)] mb-1">
            تاريخ الاستحقاق القادم
          </label>
          <input
            type="date"
            value={recForm.nextDueDate}
            onChange={(e) => setRecForm((p) => ({ ...p, nextDueDate: e.target.value }))}
            className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
            aria-label="تاريخ الاستحقاق القادم"
          />
        </div>
        <div className="md:col-span-2 lg:col-span-2">
          <label className="block text-xs font-medium text-[var(--color-text)] mb-1">
            ملاحظات (اختياري)
          </label>
          <input
            type="text"
            value={recForm.notes || ''}
            onChange={(e) => setRecForm((p) => ({ ...p, notes: e.target.value }))}
            className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
            aria-label="ملاحظات"
            placeholder="ملاحظة اختيارية"
          />
        </div>
      </div>
      <div className="flex gap-2 justify-end mt-3">
        {recEditingId && (
          <button
            type="button"
            onClick={() => {
              setRecEditingId(null);
              resetRecForm();
            }}
            className="px-4 py-2 rounded-lg border border-[var(--color-border)] text-[var(--color-text)] text-sm font-medium hover:bg-[var(--color-bg)]"
          >
            إلغاء
          </button>
        )}
        <button
          type="button"
          onClick={saveRecurring}
          className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-[var(--color-text-inverse)] text-sm font-medium hover:bg-[var(--color-primary-strong)]"
          aria-label={recEditingId ? 'حفظ التعديل' : 'إضافة التزام'}
        >
          {recEditingId ? 'حفظ التعديل' : 'إضافة التزام'}
        </button>
      </div>
    </div>
  );
}

export default RecurringItemForm;
