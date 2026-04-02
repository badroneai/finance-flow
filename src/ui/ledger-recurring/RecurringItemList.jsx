const CATEGORY_LABELS_AR = {
  system: 'إيجار ورسوم',
  operational: 'تشغيل ومرافق',
  maintenance: 'صيانة',
  marketing: 'تسويق وإعلان',
  adhoc: 'عند الحاجة',
  uncategorized: 'أخرى',
  other: 'أخرى',
};

const FREQUENCY_LABELS = {
  monthly: 'شهري',
  quarterly: 'ربع سنوي',
  yearly: 'سنوي',
  adhoc: 'عند الحاجة',
};

// قائمة الالتزامات — فلاتر + بطاقات + أزرار التسعير
function RecurringItemList({
  filteredItems,
  allItems,
  overdueCount,
  soonCount,
  listFilter,
  setListFilter,
  unpricedList,
  openPricingWizard,
  setSaPricingOpen,
  recurring,
  startPayNow,
  startEditRecurring,
  deleteRecurring,
  getStatusInfo,
  normalizeRecurringCategory,
  Currency,
  isPastDue,
}) {
  return (
    <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 md:p-5 shadow-sm mb-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h4 className="font-bold text-[var(--color-text)]">الالتزامات الحالية</h4>
        <div className="flex flex-wrap gap-1.5">
          {[
            { key: 'all', label: 'الكل', count: allItems.length },
            { key: 'overdue', label: 'متأخر', count: overdueCount },
            { key: 'soon', label: 'قريب', count: soonCount },
          ].map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setListFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${listFilter === f.key ? 'bg-[var(--color-primary)] text-[var(--color-text-inverse)] border-[var(--color-primary)]' : 'bg-[var(--color-surface)] text-[var(--color-muted)] border-[var(--color-border)] hover:bg-[var(--color-bg)]'}`}
            >
              {f.label} {f.count > 0 && <span className="opacity-75">({f.count})</span>}
            </button>
          ))}
        </div>
      </div>

      {/* أزرار التسعير السريع */}
      {unpricedList && unpricedList.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3 p-3 rounded-xl border border-[var(--color-warning)] bg-[var(--color-warning-bg)]">
          <span className="text-sm text-[var(--color-warning)]">
            {unpricedList.length} التزام بدون مبلغ
          </span>
          <button
            type="button"
            onClick={openPricingWizard}
            className="px-3 py-1.5 rounded-lg bg-[var(--color-warning)] text-[var(--color-text-inverse)] text-xs font-medium hover:bg-[var(--color-warning-light)]"
          >
            معالج التسعير
          </button>
          <button
            type="button"
            onClick={() => setSaPricingOpen(true)}
            className="px-3 py-1.5 rounded-lg border border-[var(--color-warning)] text-[var(--color-warning)] text-xs font-medium hover:bg-[var(--color-warning-bg)]"
          >
            تسعير تلقائي (سعودي)
          </button>
        </div>
      )}

      {filteredItems.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-[var(--color-text)] font-medium">
            لا توجد التزامات
            {listFilter !== 'all' ? ` (${listFilter === 'overdue' ? 'متأخرة' : 'قريبة'})` : ''}
          </p>
          {allItems.length === 0 && (
            <p className="text-sm text-[var(--color-muted)] mt-2">
              أضف أول التزام (مثل: إيجار المكتب، فاتورة الكهرباء، رسوم البلدية)
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filteredItems.map((item) => {
            const status = getStatusInfo(item);
            const catLabel =
              CATEGORY_LABELS_AR[normalizeRecurringCategory(item.category)] ||
              CATEGORY_LABELS_AR.other;
            const freqLabel =
              FREQUENCY_LABELS[String(item.frequency || '').toLowerCase()] || 'شهري';
            return (
              <div
                key={item.id}
                id={`rec-${item.id}`}
                className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] hover:shadow-sm transition-shadow"
                data-overdue={isPastDue(item) ? '1' : '0'}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-[var(--color-text)] truncate">
                        {item.title || '—'}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] border ${status.color}`}
                      >
                        {status.label}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[11px] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)]">
                        {catLabel}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-[var(--color-muted)]">
                      <span>{freqLabel}</span>
                      {item.nextDueDate && <span>الاستحقاق: {item.nextDueDate}</span>}
                      <span className="font-semibold text-[var(--color-text)]">
                        {Number(item.amount) > 0 ? (
                          <Currency value={item.amount} />
                        ) : (
                          <span className="text-[var(--color-warning)]">غير مسعّر</span>
                        )}
                      </span>
                    </div>
                    {item.notes?.trim() && (
                      <div className="text-xs text-[var(--color-muted)] mt-1">{item.notes}</div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-1.5 justify-end shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        const r = (Array.isArray(recurring) ? recurring : []).find(
                          (x) => x.id === item.id
                        );
                        if (r) startPayNow(r);
                      }}
                      disabled={Number(item.amount) === 0}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${Number(item.amount) === 0 ? 'bg-[var(--color-bg)] text-[var(--color-muted)] border-[var(--color-border)] cursor-not-allowed' : 'bg-[var(--color-success)] text-[var(--color-text-inverse)] border-[var(--color-success)] hover:bg-[var(--color-success-light)]'}`}
                      aria-label="سجّل دفعة"
                    >
                      سجّل دفعة
                    </button>
                    <button
                      type="button"
                      onClick={() => startEditRecurring(item)}
                      className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-[var(--color-text)] text-xs font-medium hover:bg-[var(--color-bg)]"
                      aria-label="تعديل"
                    >
                      تعديل
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteRecurring(item.id)}
                      className="px-3 py-1.5 rounded-lg border border-[var(--color-danger)] text-[var(--color-danger)] text-xs font-medium hover:bg-[var(--color-danger-bg)]"
                      aria-label="حذف"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default RecurringItemList;
