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
    <div className="panel-card ledger-panel ledger-control-panel">
      <div className="ledger-panel__header">
        <div>
          <span className="ledger-panel__eyebrow">منطقة الإدخال</span>
          <h4 className="ledger-panel__title">
            {recEditingId ? 'تعديل الالتزام' : 'إضافة التزام جديد'}
          </h4>
          <p className="ledger-panel__subtitle">
            أدخل بيانات الالتزام الأساسية ثم انتقل لإدارته من القائمة أدناه.
          </p>
        </div>
      </div>
      <div className="ledger-form-grid">
        <div className="ledger-create-form__field">
          <label className="ledger-form-label">اسم الالتزام</label>
          <input
            type="text"
            value={recForm.title}
            onChange={(e) => setRecForm((p) => ({ ...p, title: e.target.value }))}
            maxLength={200}
            className="ledger-form-input"
            aria-label="اسم الالتزام"
            placeholder="مثال: إيجار المكتب"
          />
        </div>
        <div className="ledger-create-form__field">
          <label className="ledger-form-label">المبلغ (ر.س)</label>
          <input
            type="text"
            inputMode="decimal"
            value={recForm.amount}
            onChange={(e) => setRecForm((p) => ({ ...p, amount: e.target.value }))}
            className="ledger-form-input"
            aria-label="المبلغ"
            placeholder="0"
          />
        </div>
        <div className="ledger-create-form__field">
          <label className="ledger-form-label">التكرار</label>
          <select
            value={recForm.frequency}
            onChange={(e) => setRecForm((p) => ({ ...p, frequency: e.target.value }))}
            className="ledger-form-input ledger-form-select"
            aria-label="التكرار"
          >
            <option value="monthly">شهري</option>
            <option value="quarterly">ربع سنوي</option>
            <option value="yearly">سنوي</option>
            <option value="adhoc">عند الحاجة</option>
          </select>
        </div>
        <div className="ledger-create-form__field">
          <label className="ledger-form-label">تاريخ الاستحقاق القادم</label>
          <input
            type="date"
            value={recForm.nextDueDate}
            onChange={(e) => setRecForm((p) => ({ ...p, nextDueDate: e.target.value }))}
            className="ledger-form-input"
            aria-label="تاريخ الاستحقاق القادم"
          />
        </div>
        <div className="ledger-create-form__field ledger-form-grid--span-rest">
          <label className="ledger-form-label">ملاحظات (اختياري)</label>
          <input
            type="text"
            value={recForm.notes || ''}
            onChange={(e) => setRecForm((p) => ({ ...p, notes: e.target.value }))}
            className="ledger-form-input"
            aria-label="ملاحظات"
            placeholder="ملاحظة اختيارية"
          />
        </div>
      </div>
      <div className="ledger-panel__toolbar">
        <p className="ledger-muted-note">
          أدخل البيانات الأساسية أولاً ثم استخدم القائمة أدناه لإدارة التفاصيل والسداد.
        </p>
        <div className="ledger-panel__toolbar-group">
          {recEditingId && (
            <button
              type="button"
              onClick={() => {
                setRecEditingId(null);
                resetRecForm();
              }}
              className="btn-secondary"
            >
              إلغاء
            </button>
          )}
          <button
            type="button"
            onClick={saveRecurring}
            className="btn-primary"
            aria-label={recEditingId ? 'حفظ التعديل' : 'إضافة التزام'}
          >
            {recEditingId ? 'حفظ التعديل' : 'إضافة التزام'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default RecurringItemForm;
