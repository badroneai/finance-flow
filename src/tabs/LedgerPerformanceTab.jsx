import React from 'react';

export default function LedgerPerformanceTab(props) {
  const {
    toast,
    refresh,

    activeId,
    activeLedger,
    Badge,
    EmptyState,
    Currency,

    incomeMode,
    setIncomeMode,
    incomeFixed,
    setIncomeFixed,
    incomePeak,
    setIncomePeak,
    incomeBase,
    setIncomeBase,
    incomeSave,
    setIncomeSave,
    incomeManual,
    setIncomeManual,

    tOperational,
    setTOperational,
    tMaintenance,
    setTMaintenance,
    tMarketing,
    setTMarketing,

    parseRecurringAmount,
    forecast,
    dataStore,
    getLast4MonthsTable,
    activeIdState,
    ledgers,
    setLedgers,
    targetsEvaluation,
  } = props;

  return (
<>
  <div className="bg-white rounded-xl border border-gray-100 p-4 md:p-5 shadow-sm mb-4">
    <div className="flex items-start justify-between gap-3">
      <div>
        <h4 className="font-bold text-gray-900">📈 أداء الدفتر</h4>
        <p className="text-sm text-gray-500 mt-1">دفتر نشط: <span className="font-medium text-gray-700">{activeLedger?.name || '—'}</span></p>
        <p className="text-xs text-gray-500 mt-1">إن لم توجد بيانات كافية: جرّب "سجّل كدفعة الآن" من الالتزامات، ثم عد هنا لمشاهدة التباين.</p>
      </div>
      {!activeId && <Badge color="yellow">اختر دفترًا نشطًا</Badge>}
    </div>
  </div>

  {(!activeId) ? (
    <EmptyState message="اختر دفترًا نشطًا لعرض الأداء" />
  ) : (
    (() => {
      const incomeModel = {
        mode: incomeMode,
        fixedMonthly: Number(parseRecurringAmount(incomeFixed)) || 0,
        peakMonthly: Number(parseRecurringAmount(incomePeak)) || 0,
        baseMonthly: Number(parseRecurringAmount(incomeBase)) || 0,
        peakMonths: (() => {
          // 3 peak months: current + next 2
          const d = new Date(); d.setDate(1);
          const keys=[];
          for (let i=0;i<3;i++){ const x=new Date(d.getTime()); x.setMonth(d.getMonth()+i); keys.push(`${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}`);} 
          return keys;
        })(),
        manualByMonth: incomeManual,
      };

      const table = getLast4MonthsTable({ forecast6mOutput: forecast, transactions: dataStore.transactions.list(), ledgerId: activeId, incomeModel });

      const thisMonthKey = table.rows[table.rows.length - 1]?.monthKey;
      const expectedThisMonth = table.rows[table.rows.length - 1]?.expected;
      const targets = {
        operationalMax: Number(parseRecurringAmount(tOperational)) || 0,
        maintenanceMax: Number(parseRecurringAmount(tMaintenance)) || 0,
        marketingMax: Number(parseRecurringAmount(tMarketing)) || 0,
      };
      const targetStatus = targetsEvaluation(expectedThisMonth?.byCategory || {}, targets);

      const saveIncomeModelToLedger = () => {
        const nextLedgers = (Array.isArray(ledgers) ? ledgers : []).map(l => {
          if (l.id !== activeId) return l;
          const copy = { ...l, updatedAt: new Date().toISOString() };
          if (incomeSave) copy.incomeModel = incomeModel;
          else { try { delete copy.incomeModel; } catch {} }
          return copy;
        });
        try { setLedgers(nextLedgers); } catch { toast('تعذر حفظ نموذج الدخل', 'error'); return; }
        toast(incomeSave ? 'تم حفظ نموذج الدخل' : 'تم إلغاء حفظ نموذج الدخل');
        refresh();
      };

      return (
        <div className="flex flex-col gap-4">
          {/* Income Model */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 md:p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="font-bold text-gray-900">نموذج الدخل</h4>
                <p className="text-xs text-gray-500 mt-1">افتراضيًا Runtime فقط — ويمكن حفظه داخل نفس الدفتر (بدون مفاتيح جديدة).</p>
              </div>
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={incomeSave} onChange={(e) => { setIncomeSave(e.target.checked); }} />
                احفظ النموذج لهذا الدفتر
              </label>
            </div>

            <div className="mt-3 grid md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">نوع النموذج</label>
                <select value={incomeMode} onChange={(e) => setIncomeMode(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" aria-label="نوع نموذج الدخل">
                  <option value="fixed">ثابت شهري</option>
                  <option value="seasonal">موسمي</option>
                  <option value="manual">يدوي (6 أشهر)</option>
                </select>
              </div>

              {incomeMode === 'fixed' ? (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">دخل شهري ثابت</label>
                  <input type="text" inputMode="decimal" value={incomeFixed} onChange={(e) => setIncomeFixed(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" aria-label="دخل شهري ثابت" placeholder="0" />
                </div>
              ) : null}

              {incomeMode === 'seasonal' ? (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">دخل الذروة (3 أشهر)</label>
                    <input type="text" inputMode="decimal" value={incomePeak} onChange={(e) => setIncomePeak(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" aria-label="دخل الذروة" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">دخل باقي السنة</label>
                    <input type="text" inputMode="decimal" value={incomeBase} onChange={(e) => setIncomeBase(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" aria-label="دخل باقي السنة" placeholder="0" />
                  </div>
                </>
              ) : null}

              {incomeMode === 'manual' ? (
                <div className="md:col-span-3">
                  <div className="text-xs text-gray-500">أدخل دخل 6 أشهر القادمة:</div>
                  <div className="mt-2 grid grid-cols-2 md:grid-cols-6 gap-2">
                    {forecast.map(r => r.monthKey).slice(0,6).map(k => (
                      <div key={k}>
                        <label className="block text-[11px] text-gray-600 mb-1">{k}</label>
                        <input type="text" inputMode="decimal" value={String(incomeManual?.[k] ?? '0')} onChange={(e) => setIncomeManual(p => ({ ...(p||{}), [k]: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm" aria-label={`دخل ${k}`} />
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="mt-3 flex justify-end">
              <button type="button" onClick={saveIncomeModelToLedger} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700" aria-label="حفظ نموذج الدخل">حفظ</button>
            </div>
          </div>

          {/* Expected vs Actual */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 md:p-5 shadow-sm">
            <h4 className="font-bold text-gray-900">Expected vs Actual (آخر 3 أشهر + هذا الشهر)</h4>
            <p className="text-xs text-gray-500 mt-1">التتبع يعتمد على tx.meta.ledgerId + type (income/expense).</p>

            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="text-gray-500">
                    <th className="text-start py-2">Month</th>
                    <th className="text-start py-2">Exp Inc</th>
                    <th className="text-start py-2">Act Inc</th>
                    <th className="text-start py-2">Exp Exp</th>
                    <th className="text-start py-2">Act Exp</th>
                    <th className="text-start py-2">Net Var</th>
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map((r) => {
                    const v = r.variance.varianceNet;
                    const badge = v >= 0 ? '✅' : (Math.abs(v) < (Number(r.expected.net)||0)*0.05 ? '⚠️' : '🔴');
                    return (
                      <tr key={r.monthKey} className="border-t border-gray-100">
                        <td className="py-2">{r.monthKey}</td>
                        <td className="py-2"><Currency value={r.expected.income} /></td>
                        <td className="py-2"><Currency value={r.actual.income} /></td>
                        <td className="py-2"><Currency value={r.expected.expense} /></td>
                        <td className="py-2"><Currency value={r.actual.expense} /></td>
                        <td className={`py-2 ${v < 0 ? 'text-red-700' : 'text-green-700'}`}>{badge} <Currency value={v} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {dataStore.transactions.list().filter(t => String(t?.meta?.ledgerId||'')===String(activeId)).length === 0 ? (
              <p className="text-sm text-gray-500 mt-3">لا توجد حركات كافية بعد — جرّب “سجّل كدفعة الآن” من الالتزامات.</p>
            ) : null}
          </div>

          {/* Variance Explainer */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 md:p-5 shadow-sm">
            <h4 className="font-bold text-gray-900">شرح التباين</h4>
            <p className="text-xs text-gray-500 mt-1">أسباب محتملة (مبسطة):</p>
            <div className="mt-3 text-sm text-gray-700 flex flex-col gap-2">
              {(() => {
                const latest = table.rows[table.rows.length - 1];
                const reasons = latest?.variance?.reasons || [];
                return reasons.slice(0,3).map((x, idx) => (
                  <div key={idx}>• {x}</div>
                ));
              })()}
            </div>
          </div>

          {/* Targets */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 md:p-5 shadow-sm">
            <h4 className="font-bold text-gray-900">Targets (شهري)</h4>
            <p className="text-xs text-gray-500 mt-1">ضع حدودًا بسيطة للتشغيلي/الصيانة/التسويق (اختياري).</p>

            <div className="mt-3 grid md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">حد التشغيلي</label>
                <input type="text" inputMode="decimal" value={tOperational} onChange={(e) => setTOperational(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" aria-label="حد التشغيلي" placeholder="0" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">حد الصيانة</label>
                <input type="text" inputMode="decimal" value={tMaintenance} onChange={(e) => setTMaintenance(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" aria-label="حد الصيانة" placeholder="0" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">حد التسويق</label>
                <input type="text" inputMode="decimal" value={tMarketing} onChange={(e) => setTMarketing(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" aria-label="حد التسويق" placeholder="0" />
              </div>
            </div>

            <div className="mt-3 grid md:grid-cols-3 gap-3 text-sm">
              {(['operational','maintenance','marketing']).map((k) => {
                const s = targetStatus[k];
                const label = k === 'operational' ? 'تشغيلي' : k === 'maintenance' ? 'صيانة' : 'تسويق';
                const statusLabel = s.status === 'ok' ? 'ضمن الهدف' : s.status === 'warn' ? 'تجاوز بسيط' : s.status === 'bad' ? 'تجاوز' : 'بدون هدف';
                const cls = s.status === 'ok' ? 'bg-green-50 border-green-100 text-green-700' : s.status === 'warn' ? 'bg-amber-50 border-amber-100 text-amber-800' : s.status === 'bad' ? 'bg-red-50 border-red-100 text-red-700' : 'bg-gray-50 border-gray-100 text-gray-700';
                return (
                  <div key={k} className={`p-3 rounded-xl border ${cls}`}>
                    <div className="font-semibold">{label}: {statusLabel}</div>
                    {s.status !== 'none' ? <div className="text-xs mt-1">تجاوز: <strong><Currency value={s.amountOver || 0} /></strong></div> : <div className="text-xs mt-1">ضع هدفًا لتظهر الحالة</div>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    })()
  )}
</>
  );
}
