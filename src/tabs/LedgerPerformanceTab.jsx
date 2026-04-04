import React from 'react';

/**
 * @param {object} props — مُجمّعة في 5 مجالات
 * @param {object} props.income — نموذج الدخل (ثابت/موسمي/يدوي)
 * @param {object} props.targets — أهداف المصروفات الشهرية
 * @param {object} props.analytics — بيانات التوقعات والحسابات
 * @param {object} props.ledgerData — بيانات الدفتر الأساسية
 * @param {object} props.ui — مكونات مشتركة وأدوات مساعدة
 */
function LedgerPerformanceTab({ income, targets, analytics, ledgerData, ui }) {
  const {
    incomeMode,
    setIncomeMode,
    incomeFixed,
    setIncomeFixed,
    incomePeak,
    setIncomePeak,
    incomeBase,
    setIncomeBase,
    incomeManual,
    setIncomeManual,
    incomeSave,
    setIncomeSave,
  } = income;

  const {
    tOperational,
    setTOperational,
    tMaintenance,
    setTMaintenance,
    tMarketing,
    setTMarketing,
  } = targets;

  const { forecast, dataStore, getLast4MonthsTable, targetsEvaluation, parseRecurringAmount } =
    analytics;

  const { activeId, activeLedger, ledgers, setLedgers } = ledgerData;

  const { Badge, EmptyState, Currency, toast, refresh } = ui;

  // --- بناء نموذج الدخل والبيانات المشتقة ---
  const buildPeakMonthKeys = () => {
    const d = new Date();
    d.setDate(1);
    const keys = [];
    for (let i = 0; i < 3; i++) {
      const x = new Date(d.getTime());
      x.setMonth(d.getMonth() + i);
      keys.push(`${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}`);
    }
    return keys;
  };

  const incomeModel = activeId
    ? {
        mode: incomeMode,
        fixedMonthly: Number(parseRecurringAmount(incomeFixed)) || 0,
        peakMonthly: Number(parseRecurringAmount(incomePeak)) || 0,
        baseMonthly: Number(parseRecurringAmount(incomeBase)) || 0,
        peakMonths: buildPeakMonthKeys(),
        manualByMonth: incomeManual,
      }
    : null;

  const table = activeId
    ? getLast4MonthsTable({
        forecast6mOutput: forecast,
        transactions: dataStore.transactions.list(),
        ledgerId: activeId,
        incomeModel,
      })
    : null;

  const latestRow = table?.rows[table.rows.length - 1] || null;
  const latestVariance = latestRow?.variance?.varianceNet || 0;
  const expectedThisMonth = latestRow?.expected;
  const expenseTargets = {
    operationalMax: Number(parseRecurringAmount(tOperational)) || 0,
    maintenanceMax: Number(parseRecurringAmount(tMaintenance)) || 0,
    marketingMax: Number(parseRecurringAmount(tMarketing)) || 0,
  };
  const targetStatus = activeId
    ? targetsEvaluation(expectedThisMonth?.byCategory || {}, expenseTargets)
    : {};

  const saveIncomeModelToLedger = () => {
    const nextLedgers = (Array.isArray(ledgers) ? ledgers : []).map((l) => {
      if (l.id !== activeId) return l;
      const copy = { ...l, updatedAt: new Date().toISOString() };
      if (incomeSave) copy.incomeModel = incomeModel;
      else {
        try {
          delete copy.incomeModel;
        } catch {}
      }
      return copy;
    });
    try {
      setLedgers(nextLedgers);
    } catch {
      toast.error('تعذر حفظ نموذج الدخل');
      return;
    }
    toast.success(incomeSave ? 'تم حفظ نموذج الدخل' : 'تم إلغاء حفظ نموذج الدخل');
    refresh();
  };

  return (
    <>
      <section className="ledger-layer ledger-layer--summary">
        <div className="ledger-layer__header">
          <span className="ledger-layer__label">أداء الدفتر</span>
          <p className="ledger-layer__hint">
            دفتر نشط: <strong>{activeLedger?.name || '—'}</strong>
            {' — '}
            إن لم توجد بيانات كافية: جرّب "سجّل كدفعة الآن" من الالتزامات، ثم عد هنا لمشاهدة
            التباين.
          </p>
          {!activeId && <Badge color="yellow">اختر دفترًا نشطًا</Badge>}
        </div>
      </section>

      {!activeId ? (
        <div className="ledger-empty-wrap">
          <EmptyState message="اختر دفترًا نشطًا لعرض الأداء" />
        </div>
      ) : (
        <div className="ledger-view">
          <section className="ledger-layer ledger-layer--summary">
            <div className="ledger-layer__header">
              <span className="ledger-layer__label">الملخص</span>
              <p className="ledger-layer__hint">
                القراءة العليا للأداء تبدأ من آخر شهر مقارن قبل النزول إلى النماذج والجداول
                التفصيلية.
              </p>
            </div>
            <div className="ledger-metric-grid">
              <div className="ledger-metric-card">
                <span className="ledger-metric-card__label">دخل متوقع هذا الشهر</span>
                <strong className="ledger-metric-card__value ledger-metric-card__value--lg">
                  <Currency value={latestRow?.expected?.income || 0} />
                </strong>
              </div>
              <div className="ledger-metric-card">
                <span className="ledger-metric-card__label">دخل فعلي هذا الشهر</span>
                <strong className="ledger-metric-card__value ledger-metric-card__value--lg">
                  <Currency value={latestRow?.actual?.income || 0} />
                </strong>
              </div>
              <div className="ledger-metric-card">
                <span className="ledger-metric-card__label">صافي متوقع</span>
                <strong className="ledger-metric-card__value ledger-metric-card__value--lg">
                  <Currency value={latestRow?.expected?.net || 0} />
                </strong>
              </div>
              <div className="ledger-metric-card">
                <span className="ledger-metric-card__label">فرق الصافي</span>
                <strong
                  className={`ledger-metric-card__value ledger-metric-card__value--lg ${latestVariance < 0 ? 'ledger-metric-card__value--danger' : 'ledger-metric-card__value--success'}`}
                >
                  <Currency value={latestVariance} />
                </strong>
              </div>
            </div>
          </section>

          <section className="ledger-layer ledger-layer--controls">
            <div className="ledger-layer__header">
              <span className="ledger-layer__label">الإجراءات</span>
              <p className="ledger-layer__hint">
                اضبط نموذج الدخل وحدود المصروفات هنا قبل قراءة النتائج والمقارنات أدناه.
              </p>
            </div>
            {/* Income Model */}
            <div className="panel-card ledger-panel ledger-control-panel">
              <div className="ledger-panel__header">
                <div>
                  <span className="ledger-panel__eyebrow">نموذج التشغيل</span>
                  <h4 className="ledger-panel__title">نموذج الدخل</h4>
                  <p className="ledger-panel__subtitle">
                    يمكن حفظ النموذج داخل الدفتر لاستخدامه في التحليلات.
                  </p>
                </div>
                <label className="ledger-checkbox-label">
                  <input
                    type="checkbox"
                    checked={incomeSave}
                    onChange={(e) => {
                      setIncomeSave(e.target.checked);
                    }}
                  />
                  احفظ النموذج لهذا الدفتر
                </label>
              </div>

              <div className="ledger-form-grid">
                <div>
                  <label className="ledger-form-label">نوع النموذج</label>
                  <select
                    value={incomeMode}
                    onChange={(e) => setIncomeMode(e.target.value)}
                    className="ledger-form-input ledger-form-select"
                    aria-label="نوع نموذج الدخل"
                  >
                    <option value="fixed">ثابت شهري</option>
                    <option value="seasonal">موسمي</option>
                    <option value="manual">يدوي (6 أشهر)</option>
                  </select>
                </div>

                {incomeMode === 'fixed' ? (
                  <div>
                    <label className="ledger-form-label">دخل شهري ثابت</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={incomeFixed}
                      onChange={(e) => setIncomeFixed(e.target.value)}
                      className="ledger-form-input"
                      aria-label="دخل شهري ثابت"
                      placeholder="0"
                    />
                  </div>
                ) : null}

                {incomeMode === 'seasonal' ? (
                  <>
                    <div>
                      <label className="ledger-form-label">دخل الذروة (3 أشهر)</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={incomePeak}
                        onChange={(e) => setIncomePeak(e.target.value)}
                        className="ledger-form-input"
                        aria-label="دخل الذروة"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="ledger-form-label">دخل باقي السنة</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={incomeBase}
                        onChange={(e) => setIncomeBase(e.target.value)}
                        className="ledger-form-input"
                        aria-label="دخل باقي السنة"
                        placeholder="0"
                      />
                    </div>
                  </>
                ) : null}

                {incomeMode === 'manual' ? (
                  <div className="ledger-form-grid--span-rest">
                    <div className="ledger-form-hint">أدخل دخل 6 أشهر القادمة:</div>
                    <div className="ledger-form-grid--manual">
                      {forecast
                        .map((r) => r.monthKey)
                        .slice(0, 6)
                        .map((k) => (
                          <div key={k}>
                            <label className="ledger-form-label--xs">{k}</label>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={String(incomeManual?.[k] ?? '0')}
                              onChange={(e) =>
                                setIncomeManual((p) => ({ ...(p || {}), [k]: e.target.value }))
                              }
                              className="ledger-form-input"
                              aria-label={`دخل ${k}`}
                            />
                          </div>
                        ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="ledger-panel__toolbar">
                <p className="ledger-muted-note">
                  احفظ النموذج عندما تصبح الافتراضات مناسبة لقراءة الأداء.
                </p>
                <button
                  type="button"
                  onClick={saveIncomeModelToLedger}
                  className="btn-primary"
                  aria-label="حفظ نموذج الدخل"
                >
                  حفظ
                </button>
              </div>
            </div>
            <div className="panel-card ledger-panel ledger-control-panel">
              <div className="ledger-panel__header">
                <div>
                  <span className="ledger-panel__eyebrow">حدود مرجعية</span>
                  <h4 className="ledger-panel__title">الأهداف الشهرية</h4>
                  <p className="ledger-panel__subtitle">
                    ضع حدودًا بسيطة للتشغيلي/الصيانة/التسويق (اختياري).
                  </p>
                </div>
              </div>

              <div className="ledger-form-grid">
                <div>
                  <label className="ledger-form-label">حد التشغيلي</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={tOperational}
                    onChange={(e) => setTOperational(e.target.value)}
                    className="ledger-form-input"
                    aria-label="حد التشغيلي"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="ledger-form-label">حد الصيانة</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={tMaintenance}
                    onChange={(e) => setTMaintenance(e.target.value)}
                    className="ledger-form-input"
                    aria-label="حد الصيانة"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="ledger-form-label">حد التسويق</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={tMarketing}
                    onChange={(e) => setTMarketing(e.target.value)}
                    className="ledger-form-input"
                    aria-label="حد التسويق"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="ledger-form-grid">
                {['operational', 'maintenance', 'marketing'].map((k) => {
                  const s = targetStatus[k];
                  const label =
                    k === 'operational' ? 'تشغيلي' : k === 'maintenance' ? 'صيانة' : 'تسويق';
                  const statusLabel =
                    s.status === 'ok'
                      ? 'ضمن الهدف'
                      : s.status === 'warn'
                        ? 'تجاوز بسيط'
                        : s.status === 'bad'
                          ? 'تجاوز'
                          : 'بدون هدف';
                  return (
                    <div
                      key={k}
                      className={`ledger-status-card ${s.status === 'ok' ? 'ledger-status-card--success' : s.status === 'warn' ? 'ledger-status-card--warning' : s.status === 'bad' ? 'ledger-status-card--danger' : ''}`}
                    >
                      <div className="ledger-status-card__title">
                        {label}: {statusLabel}
                      </div>
                      {s.status !== 'none' ? (
                        <div className="ledger-status-card__meta">
                          تجاوز:{' '}
                          <strong>
                            <Currency value={s.amountOver || 0} />
                          </strong>
                        </div>
                      ) : (
                        <div className="ledger-status-card__meta">ضع هدفًا لتظهر الحالة</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="ledger-layer">
            <div className="ledger-layer__header">
              <span className="ledger-layer__label">المحتوى</span>
              <p className="ledger-layer__hint">
                الجداول والشرح المباشر هنا مرتّبة لقراءة النتائج بعد ضبط النموذج والحدود.
              </p>
            </div>
            {/* Expected vs Actual */}
            <div className="panel-card ledger-panel ledger-content-panel">
              <div className="ledger-panel__header">
                <div>
                  <span className="ledger-panel__eyebrow">النتيجة الرئيسية</span>
                  <h4 className="ledger-panel__title">
                    المتوقع مقابل الفعلي (آخر 3 أشهر + هذا الشهر)
                  </h4>
                  <p className="ledger-panel__subtitle">
                    مقارنة بين المصروفات والإيرادات المتوقعة والفعلية.
                  </p>
                </div>
              </div>

              <div className="ledger-table-wrap">
                <table className="ledger-data-table">
                  <thead>
                    <tr>
                      <th>الشهر</th>
                      <th>دخل متوقع</th>
                      <th>دخل فعلي</th>
                      <th>مصروف متوقع</th>
                      <th>مصروف فعلي</th>
                      <th>فرق الصافي</th>
                    </tr>
                  </thead>
                  <tbody>
                    {table.rows.map((r) => {
                      const v = r.variance.varianceNet;
                      const status =
                        v >= 0
                          ? ''
                          : Math.abs(v) < (Number(r.expected.net) || 0) * 0.05
                            ? 'انتباه '
                            : 'تجاوز ';
                      return (
                        <tr key={r.monthKey}>
                          <td>{r.monthKey}</td>
                          <td>
                            <Currency value={r.expected.income} />
                          </td>
                          <td>
                            <Currency value={r.actual.income} />
                          </td>
                          <td>
                            <Currency value={r.expected.expense} />
                          </td>
                          <td>
                            <Currency value={r.actual.expense} />
                          </td>
                          <td
                            className={
                              v < 0
                                ? 'ledger-data-table__cell--danger'
                                : 'ledger-data-table__cell--success'
                            }
                          >
                            {status}
                            <Currency value={v} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {dataStore.transactions
                .list()
                .filter((t) => String(t?.meta?.ledgerId || '') === String(activeId)).length ===
              0 ? (
                <p className="ledger-form-hint">
                  لا توجد حركات كافية بعد — جرّب “سجّل كدفعة الآن” من الالتزامات.
                </p>
              ) : null}
            </div>

            {/* Variance Explainer */}
            <div className="panel-card ledger-panel ledger-content-panel">
              <div className="ledger-panel__header">
                <div>
                  <span className="ledger-panel__eyebrow">قراءة مساعدة</span>
                  <h4 className="ledger-panel__title">شرح التباين</h4>
                  <p className="ledger-panel__subtitle">أسباب محتملة (مبسطة):</p>
                </div>
              </div>
              <div className="ledger-reason-list">
                {(latestRow?.variance?.reasons || []).slice(0, 3).map((x, idx) => (
                  <div key={idx}>• {x}</div>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

export default React.memo(LedgerPerformanceTab);
