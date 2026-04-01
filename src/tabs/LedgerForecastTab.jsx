import React from 'react';

function LedgerForecastTab({
  forecastRunRate,
  cashGap,
  assumedInflow,
  setAssumedInflow,
  Currency,
  forecastPreset,
  setForecastPreset,
  scRent,
  setScRent,
  scUtilities,
  setScUtilities,
  scMaintenance,
  setScMaintenance,
  scMarketing,
  setScMarketing,
  scOther,
  setScOther,
  forecastInsights,
  toast,
}) {
  return (
    <>
      {/* Predictive Ledger v4: 6M Forecast */}
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 md:p-5 shadow-sm mb-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h4 className="font-bold text-[var(--color-text)]">🔮 توقعات 6 أشهر</h4>
            <p className="text-xs text-[var(--color-muted)] mt-1">
              هذا المتوقع • هنا الخطر • وهذا اللي تسويه اليوم
            </p>
          </div>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-4">
          {/* Expected Monthly Burn */}
          <div className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]">
            <div className="text-xs text-[var(--color-muted)]">
              الإنفاق الشهري المتوقع (حسب السيناريو)
            </div>
            <div className="mt-1 text-sm font-semibold text-[var(--color-text)]">
              <Currency value={forecastRunRate.monthlyTotal} /> / شهر
            </div>
            <div className="mt-2 text-xs text-[var(--color-text)] flex flex-col gap-1">
              {['system', 'operational', 'maintenance', 'marketing', 'other'].map((k) => (
                <div key={k} className="flex items-center justify-between">
                  <span className="text-[var(--color-muted)]">
                    {k === 'system'
                      ? 'نظامي'
                      : k === 'operational'
                        ? 'تشغيلي'
                        : k === 'maintenance'
                          ? 'صيانة'
                          : k === 'marketing'
                            ? 'تسويق'
                            : 'أخرى'}
                  </span>
                  <span className="font-semibold text-[var(--color-text)]">
                    <Currency value={forecastRunRate.byCategory[k] || 0} />
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Cash Gap */}
          <div className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] md:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-xs text-[var(--color-muted)]">فجوة السيولة</div>
                <div className="mt-1 text-sm font-semibold text-[var(--color-text)]">
                  {cashGap.firstGapMonth
                    ? `يبدأ العجز: ${cashGap.firstGapMonth}`
                    : 'لا يوجد عجز (وفق الدخل المفترض)'}
                </div>
                <div className="text-xs text-[var(--color-muted)] mt-1">
                  أسوأ عجز:{' '}
                  <strong className="text-[var(--color-text)]">
                    <Currency value={cashGap.worstGap} />
                  </strong>
                </div>
              </div>
              <div className="min-w-[220px]">
                <label className="block text-xs font-medium text-[var(--color-text)] mb-1">
                  دخل شهري مفترض (اختياري)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={assumedInflow}
                  onChange={(e) => setAssumedInflow(e.target.value)}
                  className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
                  aria-label="دخل شهري مفترض"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="text-[var(--color-muted)]">
                    <th className="text-start py-2">شهر</th>
                    <th className="text-start py-2">المصروفات</th>
                    <th className="text-start py-2">الإيرادات</th>
                    <th className="text-start py-2">الصافي</th>
                    <th className="text-start py-2">التراكمي</th>
                  </tr>
                </thead>
                <tbody>
                  {cashGap.series.map((r) => (
                    <tr key={r.monthKey} className="border-t border-[var(--color-border)]">
                      <td className="py-2">{r.monthKey}</td>
                      <td className="py-2">
                        <Currency value={r.outflow} />
                      </td>
                      <td className="py-2">
                        <Currency value={r.inflow} />
                      </td>
                      <td className={`py-2 ${r.net < 0 ? 'text-[var(--color-danger)]' : 'text-[var(--color-success)]'}`}>
                        <Currency value={r.net} />
                      </td>
                      <td
                        className={`py-2 ${r.cumulative < 0 ? 'text-[var(--color-danger)]' : 'text-[var(--color-text)]'}`}
                      >
                        <Currency value={r.cumulative} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Scenarios + actions */}
          <div className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]">
            <div className="text-xs text-[var(--color-muted)]">السيناريوهات</div>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setForecastPreset('optimistic')}
                className={`px-3 py-2 rounded-lg border text-sm font-medium ${forecastPreset === 'optimistic' ? 'bg-[var(--color-primary)] text-[var(--color-text-inverse)] border-[var(--color-primary)]' : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-bg)]'}`}
                aria-label="متفائل"
              >
                متفائل
              </button>
              <button
                type="button"
                onClick={() => setForecastPreset('realistic')}
                className={`px-3 py-2 rounded-lg border text-sm font-medium ${forecastPreset === 'realistic' ? 'bg-[var(--color-primary)] text-[var(--color-text-inverse)] border-[var(--color-primary)]' : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-bg)]'}`}
                aria-label="واقعي"
              >
                واقعي
              </button>
              <button
                type="button"
                onClick={() => setForecastPreset('stressed')}
                className={`px-3 py-2 rounded-lg border text-sm font-medium ${forecastPreset === 'stressed' ? 'bg-[var(--color-primary)] text-[var(--color-text-inverse)] border-[var(--color-primary)]' : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-bg)]'}`}
                aria-label="ضاغط"
              >
                ضاغط
              </button>
              <button
                type="button"
                onClick={() => setForecastPreset('custom')}
                className={`px-3 py-2 rounded-lg border text-sm font-medium ${forecastPreset === 'custom' ? 'bg-[var(--color-primary)] text-[var(--color-text-inverse)] border-[var(--color-primary)]' : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-bg)]'}`}
                aria-label="مخصص"
              >
                مخصص
              </button>
            </div>

            {forecastPreset === 'custom' ? (
              <div className="mt-3 text-xs text-[var(--color-text)] flex flex-col gap-2">
                {[
                  ['rent', 'زيادة الإيجارات', scRent, setScRent],
                  ['utilities', 'زيادة المرافق', scUtilities, setScUtilities],
                  ['maintenance', 'ضغط الصيانة', scMaintenance, setScMaintenance],
                  ['marketing', 'زيادة التسويق', scMarketing, setScMarketing],
                  ['other', 'أخرى', scOther, setScOther],
                ].map(([k, label, val, setter]) => (
                  <div key={k}>
                    <div className="flex items-center justify-between">
                      <span>{label}</span>
                      <strong>{Number(val).toFixed(2)}x</strong>
                    </div>
                    <input
                      type="range"
                      min="0.8"
                      max="1.4"
                      step="0.05"
                      value={val}
                      onChange={(e) => setter(Number(e.target.value))}
                      className="w-full"
                      aria-label={label}
                    />
                  </div>
                ))}
              </div>
            ) : null}

            <div className="mt-3">
              <div className="text-xs text-[var(--color-muted)]">ماذا أفعل بعد ذلك؟</div>
              <div className="mt-2 flex flex-col gap-2">
                {forecastInsights.map((t, idx) => (
                  <div key={idx} className="text-xs text-[var(--color-text)]">
                    • {t}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  // Pick biggest category from runrate and scroll to first matching section
                  const by = forecastRunRate.byCategory || {};
                  const top =
                    Object.entries(by).sort((a, b) => (b[1] || 0) - (a[1] || 0))[0]?.[0] || 'other';
                  // map to data attribute in list cards (category badges are based on r.category)
                  const el = document.querySelector(
                    `[data-overdue="1"], [data-highrisk="1"], [id^="rec-"]`
                  );
                  if (el && el.scrollIntoView)
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  toast.success(`ركز على: ${top}`);
                }}
                className="mt-3 px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] text-sm font-medium hover:bg-[var(--color-bg)]"
                aria-label="اذهب للبنود المؤثرة"
              >
                اذهب للبنود المؤثرة
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default React.memo(LedgerForecastTab);
