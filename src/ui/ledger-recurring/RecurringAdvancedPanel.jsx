import { CATEGORY_LABELS_AR } from './recurring-labels.js';

// لوحة التحليلات المتقدمة — مطوية افتراضياً
function RecurringAdvancedPanel({
  advancedOpen,
  setAdvancedOpen,
  outlook,
  categoryDist,
  brain,
  health,
  completeness,
  budgetForm,
  setBudgetForm,
  saveLedgerBudgets,
  budgetsHealth,
  actuals,
  Currency,
}) {
  return (
    <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] shadow-sm mb-4">
      <button
        type="button"
        onClick={() => setAdvancedOpen(!advancedOpen)}
        className="w-full flex items-center justify-between p-4 md:p-5 text-[var(--color-text)] font-bold hover:bg-[var(--color-bg)] rounded-xl transition-colors"
        aria-expanded={advancedOpen}
      >
        <span>عرض التحليلات المتقدمة</span>
        <span className="text-lg">{advancedOpen ? '▲' : '▼'}</span>
      </button>

      {advancedOpen && (
        <div className="p-4 md:p-5 pt-0 flex flex-col gap-4">
          {/* توقعات 30/60/90 يوم */}
          <div>
            <h5 className="font-semibold text-[var(--color-text)] mb-2">توقعات الاستحقاق</h5>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: '30 يوم', data: outlook?.d30 },
                { label: '60 يوم', data: outlook?.d60 },
                { label: '90 يوم', data: outlook?.d90 },
              ].map(({ label, data }) => (
                <div
                  key={label}
                  className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-center"
                >
                  <div className="text-xs text-[var(--color-muted)]">{label}</div>
                  <div className="mt-1 font-bold text-[var(--color-text)]">
                    <Currency value={data?.pricedTotal || 0} />
                  </div>
                  {(data?.unpricedCount || 0) > 0 && (
                    <div className="text-[11px] text-[var(--color-warning)] mt-1">
                      {data.unpricedCount} غير مسعّر
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* توزيع حسب التصنيف */}
          {categoryDist.total > 0 && (
            <div>
              <h5 className="font-semibold text-[var(--color-text)] mb-2">
                توزيع الالتزامات حسب التصنيف
              </h5>
              <div className="flex flex-col gap-2">
                {Object.entries(categoryDist.map)
                  .sort((a, b) => b[1] - a[1])
                  .map(([cat, amt]) => {
                    const pct =
                      categoryDist.total > 0 ? Math.round((amt / categoryDist.total) * 100) : 0;
                    return (
                      <div key={cat} className="flex items-center gap-3">
                        <span className="text-sm text-[var(--color-text)] w-28 shrink-0">
                          {CATEGORY_LABELS_AR[cat] || 'أخرى'}
                        </span>
                        <div className="flex-1 h-4 bg-[var(--color-bg)] rounded-full overflow-hidden border border-[var(--color-border)]">
                          <div
                            className="h-full bg-[var(--color-primary)] rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-[var(--color-muted)] w-16 text-end">
                          {pct}%
                        </span>
                        <span className="text-xs font-semibold text-[var(--color-text)] w-24 text-end">
                          <Currency value={amt} />
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* الميزانية */}
          <div>
            <h5 className="font-semibold text-[var(--color-text)] mb-2">أهداف الميزانية</h5>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[var(--color-text)] mb-1">
                  هدف شهري (ر.س)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={budgetForm.monthlyTarget}
                  onChange={(e) => setBudgetForm((p) => ({ ...p, monthlyTarget: e.target.value }))}
                  className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
                  aria-label="هدف شهري"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-text)] mb-1">
                  هدف سنوي (ر.س)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={budgetForm.yearlyTarget}
                  onChange={(e) => setBudgetForm((p) => ({ ...p, yearlyTarget: e.target.value }))}
                  className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
                  aria-label="هدف سنوي"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="flex justify-end mt-2">
              <button
                type="button"
                onClick={() =>
                  saveLedgerBudgets({
                    monthlyTarget: budgetForm.monthlyTarget,
                    yearlyTarget: budgetForm.yearlyTarget,
                  })
                }
                className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-[var(--color-text-inverse)] text-sm font-medium hover:bg-[var(--color-primary-strong)]"
              >
                حفظ الميزانية
              </button>
            </div>
            {budgetsHealth &&
              (budgetsHealth.monthlyTarget > 0 || budgetsHealth.yearlyTarget > 0) && (
                <div
                  className={`mt-2 p-3 rounded-xl border text-sm ${budgetsHealth.status === 'danger' ? 'border-[var(--color-danger)] bg-[var(--color-danger-bg)] text-[var(--color-danger)]' : budgetsHealth.status === 'warn' ? 'border-[var(--color-warning)] bg-[var(--color-warning-bg)] text-[var(--color-warning)]' : 'border-[var(--color-success)] bg-[var(--color-success-bg)] text-[var(--color-success)]'}`}
                >
                  {budgetsHealth.status === 'danger'
                    ? 'تجاوز الميزانية'
                    : budgetsHealth.status === 'warn'
                      ? 'قريب من حد الميزانية'
                      : 'ضمن الميزانية'}
                  {budgetsHealth.monthlyTarget > 0 && (
                    <>
                      {' '}
                      — الشهري: <Currency value={actuals.actualMonthly} /> من{' '}
                      <Currency value={budgetsHealth.monthlyTarget} />
                    </>
                  )}
                </div>
              )}
          </div>

          {/* صحة الدفتر (مبسّطة) */}
          {health && (
            <div>
              <h5 className="font-semibold text-[var(--color-text)] mb-2">صحة الدفتر</h5>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-center">
                  <div className="text-xs text-[var(--color-muted)]">الدرجة</div>
                  <div
                    className={`mt-1 text-2xl font-bold ${health.score >= 70 ? 'text-[var(--color-success)]' : health.score >= 40 ? 'text-[var(--color-warning)]' : 'text-[var(--color-danger)]'}`}
                  >
                    {health.score || 0}
                  </div>
                </div>
                <div className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-center">
                  <div className="text-xs text-[var(--color-muted)]">التسعير</div>
                  <div className="mt-1 text-lg font-bold text-[var(--color-text)]">
                    {health.pricingRatio != null
                      ? `${Math.round(health.pricingRatio * 100)}%`
                      : '—'}
                  </div>
                </div>
                <div className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-center">
                  <div className="text-xs text-[var(--color-muted)]">الانضباط</div>
                  <div className="mt-1 text-lg font-bold text-[var(--color-text)]">
                    {health.disciplineRatio != null
                      ? `${Math.round(health.disciplineRatio * 100)}%`
                      : '—'}
                  </div>
                </div>
                <div className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-center">
                  <div className="text-xs text-[var(--color-muted)]">اكتمال الدفتر</div>
                  <div className="mt-1 text-lg font-bold text-[var(--color-text)]">
                    {completeness?.pct ?? 0}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* معدل الإنفاق — مبسّط */}
          {brain?.burn && (
            <div>
              <h5 className="font-semibold text-[var(--color-text)] mb-2">معدل الإنفاق</h5>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-center">
                  <div className="text-xs text-[var(--color-muted)]">شهري</div>
                  <div className="mt-1 font-bold text-[var(--color-text)]">
                    <Currency value={brain.burn.monthly || 0} />
                  </div>
                </div>
                <div className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-center">
                  <div className="text-xs text-[var(--color-muted)]">90 يوم</div>
                  <div className="mt-1 font-bold text-[var(--color-text)]">
                    <Currency value={brain.burn.d90 || 0} />
                  </div>
                </div>
                <div className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-center">
                  <div className="text-xs text-[var(--color-muted)]">سنوي</div>
                  <div className="mt-1 font-bold text-[var(--color-text)]">
                    <Currency value={brain.burn.yearly || 0} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default RecurringAdvancedPanel;
