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
<div className="bg-white rounded-xl border border-gray-100 p-4 md:p-5 shadow-sm mb-4">
  <div className="flex flex-wrap items-start justify-between gap-2">
    <div>
      <h4 className="font-bold text-gray-900">🔮 توقعات 6 أشهر</h4>
      <p className="text-xs text-gray-500 mt-1">هذا المتوقع • هنا الخطر • وهذا اللي تسويه اليوم</p>
    </div>
  </div>

  <div className="mt-3 grid gap-3 md:grid-cols-4">
    {/* Expected Monthly Burn */}
    <div className="p-3 rounded-xl border border-gray-100 bg-gray-50">
      <div className="text-xs text-gray-500">Expected Monthly Burn (Scenario)</div>
      <div className="mt-1 text-sm font-semibold text-gray-900"><Currency value={forecastRunRate.monthlyTotal} /> / شهر</div>
      <div className="mt-2 text-xs text-gray-700 flex flex-col gap-1">
        {(['system','operational','maintenance','marketing','other']).map(k => (
          <div key={k} className="flex items-center justify-between">
            <span className="text-gray-600">{k === 'system' ? 'نظامي' : k === 'operational' ? 'تشغيلي' : k === 'maintenance' ? 'صيانة' : k === 'marketing' ? 'تسويق' : 'أخرى'}</span>
            <span className="font-semibold text-gray-900"><Currency value={forecastRunRate.byCategory[k] || 0} /></span>
          </div>
        ))}
      </div>
    </div>

    {/* Cash Gap */}
    <div className="p-3 rounded-xl border border-gray-100 bg-gray-50 md:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-xs text-gray-500">Cash Gap</div>
          <div className="mt-1 text-sm font-semibold text-gray-900">{cashGap.firstGapMonth ? `يبدأ العجز: ${cashGap.firstGapMonth}` : 'لا يوجد عجز (وفق الدخل المفترض)'}</div>
          <div className="text-xs text-gray-600 mt-1">أسوأ عجز: <strong className="text-gray-900"><Currency value={cashGap.worstGap} /></strong></div>
        </div>
        <div className="min-w-[220px]">
          <label className="block text-xs font-medium text-gray-700 mb-1">دخل شهري مفترض (اختياري)</label>
          <input type="text" inputMode="decimal" value={assumedInflow} onChange={(e) => setAssumedInflow(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" aria-label="دخل شهري مفترض" placeholder="0" />
        </div>
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="text-gray-500">
              <th className="text-start py-2">شهر</th>
              <th className="text-start py-2">Outflow</th>
              <th className="text-start py-2">Inflow</th>
              <th className="text-start py-2">Net</th>
              <th className="text-start py-2">Cumulative</th>
            </tr>
          </thead>
          <tbody>
            {cashGap.series.map((r) => (
              <tr key={r.monthKey} className="border-t border-gray-100">
                <td className="py-2">{r.monthKey}</td>
                <td className="py-2"><Currency value={r.outflow} /></td>
                <td className="py-2"><Currency value={r.inflow} /></td>
                <td className={`py-2 ${r.net < 0 ? 'text-red-700' : 'text-green-700'}`}><Currency value={r.net} /></td>
                <td className={`py-2 ${r.cumulative < 0 ? 'text-red-700' : 'text-gray-900'}`}><Currency value={r.cumulative} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    {/* Scenarios + actions */}
    <div className="p-3 rounded-xl border border-gray-100 bg-gray-50">
      <div className="text-xs text-gray-500">Scenarios</div>
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" onClick={() => setForecastPreset('optimistic')} className={`px-3 py-2 rounded-lg border text-sm font-medium ${forecastPreset==='optimistic' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`} aria-label="متفائل">متفائل</button>
        <button type="button" onClick={() => setForecastPreset('realistic')} className={`px-3 py-2 rounded-lg border text-sm font-medium ${forecastPreset==='realistic' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`} aria-label="واقعي">واقعي</button>
        <button type="button" onClick={() => setForecastPreset('stressed')} className={`px-3 py-2 rounded-lg border text-sm font-medium ${forecastPreset==='stressed' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`} aria-label="ضاغط">ضاغط</button>
        <button type="button" onClick={() => setForecastPreset('custom')} className={`px-3 py-2 rounded-lg border text-sm font-medium ${forecastPreset==='custom' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`} aria-label="مخصص">مخصص</button>
      </div>

      {forecastPreset === 'custom' ? (
        <div className="mt-3 text-xs text-gray-700 flex flex-col gap-2">
          {([
            ['rent','زيادة الإيجارات', scRent, setScRent],
            ['utilities','زيادة المرافق', scUtilities, setScUtilities],
            ['maintenance','ضغط الصيانة', scMaintenance, setScMaintenance],
            ['marketing','زيادة التسويق', scMarketing, setScMarketing],
            ['other','أخرى', scOther, setScOther],
          ]).map(([k,label,val,setter]) => (
            <div key={k}>
              <div className="flex items-center justify-between"><span>{label}</span><strong>{Number(val).toFixed(2)}x</strong></div>
              <input type="range" min="0.8" max="1.4" step="0.05" value={val} onChange={(e) => setter(Number(e.target.value))} className="w-full" aria-label={label} />
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-3">
        <div className="text-xs text-gray-500">What should I do next</div>
        <div className="mt-2 flex flex-col gap-2">
          {forecastInsights.map((t, idx) => (
            <div key={idx} className="text-xs text-gray-700">• {t}</div>
          ))}
        </div>

        <button type="button" onClick={() => {
          // Pick biggest category from runrate and scroll to first matching section
          const by = forecastRunRate.byCategory || {};
          const top = Object.entries(by).sort((a,b)=> (b[1]||0)-(a[1]||0))[0]?.[0] || 'other';
          // map to data attribute in list cards (category badges are based on r.category)
          const el = document.querySelector(`[data-overdue="1"], [data-highrisk="1"], [id^="rec-"]`);
          if (el && el.scrollIntoView) el.scrollIntoView({ behavior:'smooth', block:'start' });
          toast(`ركز على: ${top}`);
        }} className="mt-3 px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50" aria-label="اذهب للبنود المؤثرة">اذهب للبنود المؤثرة</button>
      </div>
    </div>
  </div>
</div>

    </>
  );
}

export default React.memo(LedgerForecastTab);
