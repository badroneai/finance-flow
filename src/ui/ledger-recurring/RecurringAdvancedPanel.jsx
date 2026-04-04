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
  // ─── لون درجة الصحة حسب القيمة ───
  const scoreModifier = health
    ? health.score >= 70
      ? 'ledger-metric-card__value--success'
      : health.score >= 40
        ? 'ledger-metric-card__value--warning'
        : 'ledger-metric-card__value--danger'
    : '';

  // ─── modifier حالة الميزانية ───
  const budgetModifier = budgetsHealth
    ? budgetsHealth.status === 'danger'
      ? 'ledger-status-card--danger'
      : budgetsHealth.status === 'warn'
        ? 'ledger-status-card--warning'
        : 'ledger-status-card--success'
    : '';

  return (
    <div className="panel-card ledger-panel">
      <button
        type="button"
        onClick={() => setAdvancedOpen(!advancedOpen)}
        className="ledger-panel__toggle"
        aria-expanded={advancedOpen}
      >
        <span>عرض التحليلات المتقدمة</span>
        <span className="ledger-panel__toggle-icon">{advancedOpen ? '▲' : '▼'}</span>
      </button>

      {advancedOpen && (
        <div className="ledger-panel__body ledger-panel__body--flush-top">
          {/* توقعات 30/60/90 يوم */}
          <div>
            <h5 className="ledger-panel__title">توقعات الاستحقاق</h5>
            <div className="ledger-metric-grid">
              {[
                { label: '30 يوم', data: outlook?.d30 },
                { label: '60 يوم', data: outlook?.d60 },
                { label: '90 يوم', data: outlook?.d90 },
              ].map(({ label, data }) => (
                <div key={label} className="ledger-metric-card ledger-metric-card--center">
                  <div className="ledger-metric-card__label">{label}</div>
                  <div className="ledger-metric-card__value">
                    <Currency value={data?.pricedTotal || 0} />
                  </div>
                  {(data?.unpricedCount || 0) > 0 && (
                    <div className="ledger-metric-card__hint">{data.unpricedCount} غير مسعّر</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* توزيع حسب التصنيف */}
          {categoryDist.total > 0 && (
            <div>
              <h5 className="ledger-panel__title">توزيع الالتزامات حسب التصنيف</h5>
              <div className="ledger-stack ledger-stack--sm">
                {Object.entries(categoryDist.map)
                  .sort((a, b) => b[1] - a[1])
                  .map(([cat, amt]) => {
                    const pct =
                      categoryDist.total > 0 ? Math.round((amt / categoryDist.total) * 100) : 0;
                    return (
                      <div key={cat} className="ledger-dist-row">
                        <span className="ledger-dist-row__label">
                          {CATEGORY_LABELS_AR[cat] || 'أخرى'}
                        </span>
                        <div className="ledger-dist-row__bar">
                          <div className="ledger-dist-row__fill" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="ledger-dist-row__pct">{pct}%</span>
                        <span className="ledger-dist-row__amount">
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
            <h5 className="ledger-panel__title">أهداف الميزانية</h5>
            <div className="ledger-form-grid">
              <div className="ledger-create-form__field">
                <label className="ledger-form-label">هدف شهري (ر.س)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={budgetForm.monthlyTarget}
                  onChange={(e) => setBudgetForm((p) => ({ ...p, monthlyTarget: e.target.value }))}
                  className="ledger-form-input"
                  aria-label="هدف شهري"
                  placeholder="0"
                />
              </div>
              <div className="ledger-create-form__field">
                <label className="ledger-form-label">هدف سنوي (ر.س)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={budgetForm.yearlyTarget}
                  onChange={(e) => setBudgetForm((p) => ({ ...p, yearlyTarget: e.target.value }))}
                  className="ledger-form-input"
                  aria-label="هدف سنوي"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="ledger-row ledger-row--end ledger-panel__alerts">
              <button
                type="button"
                onClick={() =>
                  saveLedgerBudgets({
                    monthlyTarget: budgetForm.monthlyTarget,
                    yearlyTarget: budgetForm.yearlyTarget,
                  })
                }
                className="btn-primary"
              >
                حفظ الميزانية
              </button>
            </div>
            {budgetsHealth &&
              (budgetsHealth.monthlyTarget > 0 || budgetsHealth.yearlyTarget > 0) && (
                <div className={`ledger-status-card ${budgetModifier} ledger-panel__alerts`}>
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
              <h5 className="ledger-panel__title">صحة الدفتر</h5>
              <div className="ledger-metric-grid">
                <div className="ledger-metric-card ledger-metric-card--center">
                  <div className="ledger-metric-card__label">الدرجة</div>
                  <div
                    className={`ledger-metric-card__value ledger-metric-card__value--xl ${scoreModifier}`}
                  >
                    {health.score || 0}
                  </div>
                </div>
                <div className="ledger-metric-card ledger-metric-card--center">
                  <div className="ledger-metric-card__label">التسعير</div>
                  <div className="ledger-metric-card__value ledger-metric-card__value--lg">
                    {health.pricingRatio != null
                      ? `${Math.round(health.pricingRatio * 100)}%`
                      : '—'}
                  </div>
                </div>
                <div className="ledger-metric-card ledger-metric-card--center">
                  <div className="ledger-metric-card__label">الانضباط</div>
                  <div className="ledger-metric-card__value ledger-metric-card__value--lg">
                    {health.disciplineRatio != null
                      ? `${Math.round(health.disciplineRatio * 100)}%`
                      : '—'}
                  </div>
                </div>
                <div className="ledger-metric-card ledger-metric-card--center">
                  <div className="ledger-metric-card__label">اكتمال الدفتر</div>
                  <div className="ledger-metric-card__value ledger-metric-card__value--lg">
                    {completeness?.pct ?? 0}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* معدل الإنفاق — مبسّط */}
          {brain?.burn && (
            <div>
              <h5 className="ledger-panel__title">معدل الإنفاق</h5>
              <div className="ledger-metric-grid">
                <div className="ledger-metric-card ledger-metric-card--center">
                  <div className="ledger-metric-card__label">شهري</div>
                  <div className="ledger-metric-card__value">
                    <Currency value={brain.burn.monthly || 0} />
                  </div>
                </div>
                <div className="ledger-metric-card ledger-metric-card--center">
                  <div className="ledger-metric-card__label">90 يوم</div>
                  <div className="ledger-metric-card__value">
                    <Currency value={brain.burn.d90 || 0} />
                  </div>
                </div>
                <div className="ledger-metric-card ledger-metric-card--center">
                  <div className="ledger-metric-card__label">سنوي</div>
                  <div className="ledger-metric-card__value">
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
