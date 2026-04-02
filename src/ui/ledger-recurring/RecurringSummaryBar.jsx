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
    <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 md:p-5 shadow-sm mb-4">
      <h4 className="font-bold text-[var(--color-text)] mb-3">الملخص المالي</h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]">
          <div className="text-xs text-[var(--color-muted)]">إجمالي شهري</div>
          <div className="mt-1 text-lg font-bold text-[var(--color-text)]">
            <Currency value={monthlyTotal} />
          </div>
        </div>
        {overdueTotal > 0 && (
          <div className="p-3 rounded-xl border border-[var(--color-danger)] bg-[var(--color-danger-bg)]">
            <div className="text-xs text-[var(--color-danger)]">متأخر</div>
            <div className="mt-1 text-lg font-bold text-[var(--color-danger)]">
              <Currency value={overdueTotal} />
            </div>
          </div>
        )}
        <div className="p-3 rounded-xl border border-[var(--color-warning)] bg-[var(--color-warning-bg)]">
          <div className="text-xs text-[var(--color-warning)]">مستحق هذا الشهر</div>
          <div className="mt-1 text-lg font-bold text-[var(--color-warning)]">
            <Currency value={thisMonthDue} />
          </div>
        </div>
        <div className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]">
          <div className="text-xs text-[var(--color-muted)]">تقدير سنوي</div>
          <div className="mt-1 text-lg font-bold text-[var(--color-text)]">
            <Currency value={yearlyEstimate} />
          </div>
        </div>
        <div className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]">
          <div className="text-xs text-[var(--color-muted)]">عدد الالتزامات</div>
          <div className="mt-1 text-lg font-bold text-[var(--color-text)]">{itemCount}</div>
        </div>
      </div>

      {/* تنبيهات بسيطة */}
      {ledgerAlerts && ledgerAlerts.length > 0 && (
        <div className="mt-3 flex flex-col gap-2">
          {ledgerAlerts.map((a) => (
            <div
              key={a.id}
              className="p-3 rounded-xl border border-[var(--color-warning)] bg-[var(--color-warning-bg)] text-sm text-[var(--color-warning)]"
            >
              <span className="font-semibold">{a.title}</span>: {a.reason}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default RecurringSummaryBar;
