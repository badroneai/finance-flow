import { CATEGORY_LABELS_AR } from './recurring-labels.js';

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
    <div className="panel-card ledger-panel ledger-content-panel">
      <div className="ledger-panel__header">
        <div>
          <span className="ledger-panel__eyebrow">القائمة التشغيلية</span>
          <h4 className="ledger-panel__title">الالتزامات الحالية</h4>
          <p className="ledger-panel__subtitle">
            راجع البنود النشطة، صِفّها حسب الأولوية، ثم اتخذ الإجراءات مباشرة من نفس السياق.
          </p>
        </div>
        <div className="ledger-segmented">
          {[
            { key: 'all', label: 'الكل', count: allItems.length },
            { key: 'overdue', label: 'متأخر', count: overdueCount },
            { key: 'soon', label: 'قريب', count: soonCount },
          ].map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setListFilter(f.key)}
              className={`ledger-segmented__button ${listFilter === f.key ? 'is-active' : ''}`}
            >
              {f.label}{' '}
              {f.count > 0 && <span className="ledger-segmented__count">({f.count})</span>}
            </button>
          ))}
        </div>
      </div>

      {/* أزرار التسعير السريع */}
      {unpricedList && unpricedList.length > 0 && (
        <div className="ledger-callout ledger-callout--warning">
          <span className="ledger-callout__text ledger-callout__text--warning">
            {unpricedList.length} التزام بدون مبلغ
          </span>
          <button
            type="button"
            onClick={openPricingWizard}
            className="ledger-chip-action ledger-chip-action--warning"
          >
            معالج التسعير
          </button>
          <button
            type="button"
            onClick={() => setSaPricingOpen(true)}
            className="ledger-chip-action ledger-chip-action--ghost-warning"
          >
            تسعير تلقائي (سعودي)
          </button>
        </div>
      )}

      {filteredItems.length === 0 ? (
        <div className="ledger-empty-wrap">
          <div className="ledger-empty-wrap__note">
            <p className="ledger-empty-wrap__title">
              لا توجد التزامات
              {listFilter !== 'all' ? ` (${listFilter === 'overdue' ? 'متأخرة' : 'قريبة'})` : ''}
            </p>
            {allItems.length === 0 && (
              <p className="ledger-empty-wrap__description">
                أضف أول التزام مثل إيجار المكتب أو فاتورة الكهرباء لتبدأ المتابعة من مكان واحد.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="ledger-stack">
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
                className="ledger-item-card"
                data-overdue={isPastDue(item) ? '1' : '0'}
              >
                <div className="ledger-item-card__body">
                  <div className="ledger-item-card__content">
                    <div className="ledger-row ledger-row--wrap">
                      <p className="ledger-item-card__title">{item.title || '—'}</p>
                    </div>
                    <div className="ledger-item-card__badges">
                      <span className={`ledger-item-card__badge ${status.modifier}`}>
                        {status.label}
                      </span>
                      <span className="ledger-item-card__badge">{catLabel}</span>
                    </div>
                    <div className="ledger-item-card__meta">
                      <span>{freqLabel}</span>
                      {item.nextDueDate && <span>الاستحقاق: {item.nextDueDate}</span>}
                      <span className="ledger-item-card__amount">
                        {Number(item.amount) > 0 ? (
                          <Currency value={item.amount} />
                        ) : (
                          <span className="ledger-item-card__amount--unpriced">غير مسعّر</span>
                        )}
                      </span>
                    </div>
                    {item.notes?.trim() && (
                      <div className="ledger-item-card__note">{item.notes}</div>
                    )}
                  </div>

                  <div className="ledger-item-card__actions">
                    <button
                      type="button"
                      onClick={() => {
                        const r = (Array.isArray(recurring) ? recurring : []).find(
                          (x) => x.id === item.id
                        );
                        if (r) startPayNow(r);
                      }}
                      disabled={Number(item.amount) === 0}
                      className={`ledger-chip-action ledger-chip-action--success ${Number(item.amount) === 0 ? 'is-disabled' : ''}`}
                      aria-label="سجّل دفعة"
                    >
                      سجّل دفعة
                    </button>
                    <button
                      type="button"
                      onClick={() => startEditRecurring(item)}
                      className="ledger-chip-action ledger-chip-action--neutral"
                      aria-label="تعديل"
                    >
                      تعديل
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteRecurring(item.id)}
                      className="ledger-chip-action ledger-chip-action--danger"
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
