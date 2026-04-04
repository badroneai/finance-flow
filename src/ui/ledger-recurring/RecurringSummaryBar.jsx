// ملخص شهري — بطاقات الإجمالي + المتأخر + المستحق + التقدير السنوي + التنبيهات
function RecurringSummaryBar({
  monthlyTotal,
  overdueTotal,
  thisMonthDue,
  yearlyEstimate,
  itemCount,
  ledgerAlerts,
  Currency,
}) {
  return (
    <div className="panel-card ledger-panel ledger-summary-panel">
      <div className="ledger-panel__header">
        <div>
          <span className="ledger-panel__eyebrow">نظرة سريعة</span>
          <h4 className="ledger-panel__title">الملخص المالي</h4>
          <p className="ledger-panel__subtitle">
            لقطة سريعة توضح العبء الحالي، الالتزامات القادمة، والتنبيهات التي تحتاج متابعة.
          </p>
        </div>
      </div>
      <div className="ledger-metric-grid">
        <div className="ledger-metric-card">
          <span className="ledger-metric-card__label">إجمالي شهري</span>
          <strong className="ledger-metric-card__value ledger-metric-card__value--lg">
            <Currency value={monthlyTotal} />
          </strong>
        </div>
        {overdueTotal > 0 && (
          <div className="ledger-metric-card ledger-metric-card--danger">
            <span className="ledger-metric-card__label">متأخر</span>
            <strong className="ledger-metric-card__value ledger-metric-card__value--lg">
              <Currency value={overdueTotal} />
            </strong>
          </div>
        )}
        <div className="ledger-metric-card ledger-metric-card--warning">
          <span className="ledger-metric-card__label">مستحق هذا الشهر</span>
          <strong className="ledger-metric-card__value ledger-metric-card__value--lg">
            <Currency value={thisMonthDue} />
          </strong>
        </div>
        <div className="ledger-metric-card">
          <span className="ledger-metric-card__label">تقدير سنوي</span>
          <strong className="ledger-metric-card__value ledger-metric-card__value--lg">
            <Currency value={yearlyEstimate} />
          </strong>
        </div>
        <div className="ledger-metric-card">
          <span className="ledger-metric-card__label">عدد الالتزامات</span>
          <strong className="ledger-metric-card__value ledger-metric-card__value--lg">
            {itemCount}
          </strong>
        </div>
      </div>

      {/* تنبيهات بسيطة */}
      {ledgerAlerts && ledgerAlerts.length > 0 && (
        <div className="ledger-stack ledger-stack--sm ledger-panel__alerts">
          {ledgerAlerts.map((a) => (
            <div key={a.id} className="ledger-callout ledger-callout--warning">
              <span className="ledger-callout__text">
                <strong>{a.title}</strong>: {a.reason}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default RecurringSummaryBar;
