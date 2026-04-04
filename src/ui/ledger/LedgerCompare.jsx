/*
  مقارنة الدفاتر — برومبت 4.2
  بطاقات متجاورة (horizontal scroll)، أشرطة صحة ديناميكية، ROI ملون، توصيات، multi-select.
*/
import { useState, useEffect, useMemo, useRef } from 'react';
import { getLedgers } from '../../core/ledger-store.js';
import { compareLedgers } from '../../core/ledger-compare.js';
import { formatNumber } from '../../utils/format.jsx';

function formatShort(value) {
  const n = Number(value) || 0;
  if (n >= 1000000) return `${formatNumber(n / 1000000, { maximumFractionDigits: 1 })} م`;
  if (n >= 1000) return `${formatNumber(Math.round(n / 1000))} ألف`;
  return formatNumber(n, { maximumFractionDigits: 0 });
}

function healthBarColor(score) {
  if (score >= 80) return 'var(--color-success)';
  if (score >= 60) return 'var(--color-info)';
  if (score >= 40) return 'var(--color-warning)';
  return 'var(--color-danger)';
}

export default function LedgerCompare() {
  const [selectedIds, setSelectedIds] = useState([]);
  const [compareResult, setCompareResult] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const selectedIdsKey = useMemo(() => selectedIds.join(','), [selectedIds]);

  const allLedgers = (getLedgers && getLedgers()) || [];

  useEffect(() => {
    if (selectedIds.length >= 2) {
      setCompareResult(compareLedgers(selectedIds));
    } else {
      setCompareResult(null);
    }
  }, [selectedIds, selectedIdsKey]);

  useEffect(() => {
    if (!dropdownOpen) return;
    const close = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [dropdownOpen]);

  const toggleLedger = (id) => {
    setSelectedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id].slice(0, 5);
      return next;
    });
  };

  const selectedNames =
    selectedIds.map((id) => (allLedgers.find((l) => l.id === id) || {}).name || id).join('، ') ||
    'اختر الدفاتر';

  return (
    <div
      className="panel-card ledger-panel ledger-content-panel ledger-compare ledger-compare-shell"
      dir="rtl"
    >
      <div className="ledger-view">
        <section className="ledger-layer ledger-layer--controls">
          <div className="ledger-layer__header">
            <span className="ledger-layer__label">الإجراءات</span>
            <p className="ledger-layer__hint">
              اختر الدفاتر المراد مقارنتها أولاً، ثم اقرأ البطاقات والملاحظات في الأسفل.
            </p>
          </div>
          <div className="ledger-panel__header">
            <div>
              <span className="ledger-panel__eyebrow">اختيار ومقارنة</span>
              <h3 className="ledger-panel__title">مقارنة الدفاتر</h3>
              <p className="ledger-panel__subtitle">
                قارن بين أكثر من دفتر لمعرفة الصحة التشغيلية والصافي والدفاتر التي تحتاج مراجعة.
              </p>
            </div>
            <div className="ledger-compare__dropdown-anchor" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen((v) => !v)}
                className="btn-secondary ledger-compare__trigger u-text-start"
                aria-haspopup="listbox"
                aria-expanded={dropdownOpen}
              >
                {selectedNames}
                <span className="ledger-compare__trigger-icon">
                  {dropdownOpen ? '\u25B2' : '\u25BC'}
                </span>
              </button>
              {dropdownOpen && (
                <div role="listbox" className="ledger-compare__menu">
                  {allLedgers.map((l) => {
                    const checked = selectedIds.includes(l.id);
                    const disabled = !checked && selectedIds.length >= 5;
                    return (
                      <label
                        key={l.id}
                        className={`ledger-compare__menu-item ${disabled ? 'ledger-compare__menu-item--disabled' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={disabled}
                          onChange={() => toggleLedger(l.id)}
                        />
                        <span>{l.name || l.id}</span>
                      </label>
                    );
                  })}
                  {allLedgers.length === 0 && (
                    <p className="ledger-compare__menu-empty">لا توجد دفاتر</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="ledger-layer">
          <div className="ledger-layer__header">
            <span className="ledger-layer__label">المحتوى</span>
            <p className="ledger-layer__hint">
              هنا تظهر القراءة المقارنة نفسها عند اختيار دفترين أو أكثر.
            </p>
          </div>
          {!compareResult && (
            <div className="ledger-empty-wrap">
              <div className="ledger-empty-wrap__note">
                <p className="ledger-empty-wrap__title">ابدأ باختيار دفترين على الأقل</p>
                <p className="ledger-empty-wrap__description">
                  يمكنك مقارنة حتى 5 دفاتر لرؤية الصحة التشغيلية والصافي والتوصيات في عرض واحد.
                </p>
              </div>
            </div>
          )}

          {compareResult && compareResult.ledgers.length > 0 && (
            <div className="ledger-compare__scroll-wrap">
              <div className="ledger-compare__cards">
                {compareResult.ledgers.map((l) => {
                  const isBest = compareResult.bestPerformer?.ledgerId === l.id;
                  const isWorst =
                    compareResult.worstPerformer?.ledgerId === l.id &&
                    (l.roi < 1 || l.overdueCount > 0);
                  return (
                    <div key={l.id} className="ledger-compare__card">
                      <p
                        className="ledger-item-card__title ledger-compare__card-title"
                        title={l.name}
                      >
                        {l.name}
                      </p>
                      <div className="ledger-compare__score">
                        <span>الصحة التشغيلية</span>
                        <strong>{l.healthScore}</strong>
                      </div>
                      <div className="ledger-compare__health">
                        <div
                          className="ledger-compare__health-bar"
                          style={{
                            width: `${Math.min(100, Math.max(0, l.healthScore))}%`,
                            background: healthBarColor(l.healthScore),
                          }}
                        />
                      </div>
                      <div className="ledger-compare__metrics">
                        <div className="ledger-compare__metric">
                          <span className="ledger-compare__metric-label">دخل</span>
                          <span className="ledger-compare__metric-value">
                            {formatShort(l.totalIncome30d)}
                          </span>
                        </div>
                        <div className="ledger-compare__metric">
                          <span className="ledger-compare__metric-label">صرف</span>
                          <span className="ledger-compare__metric-value">
                            {formatShort(l.totalExpense30d)}
                          </span>
                        </div>
                        <div className="ledger-compare__metric">
                          <span className="ledger-compare__metric-label">صافي</span>
                          <span
                            className={`ledger-compare__metric-value ${l.netCashflow30d >= 0 ? 'is-positive' : 'is-negative'}`}
                          >
                            {l.netCashflow30d >= 0 ? '+' : ''}
                            {formatShort(l.netCashflow30d)}
                          </span>
                        </div>
                        <div className="ledger-compare__metric">
                          <span className="ledger-compare__metric-label">ROI</span>
                          <span
                            className={`ledger-compare__metric-value ${l.roi >= 1 ? 'is-positive' : 'is-negative'}`}
                          >
                            {l.roi.toFixed(1)}x
                          </span>
                        </div>
                      </div>
                      <div className="ledger-compare__badge-row">
                        {isBest && <span className="ledger-item-card__badge">الأفضل</span>}
                        {isWorst && !isBest && (
                          <span className="ledger-item-card__badge">يحتاج مراجعة</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {compareResult?.recommendations && compareResult.recommendations.length > 0 && (
          <section className="ledger-layer ledger-layer--secondary">
            <div className="ledger-layer__header">
              <span className="ledger-layer__label">الثانوي</span>
              <p className="ledger-layer__hint">
                التوصيات تأتي بعد قراءة المقارنة الأساسية حتى لا تنافس النتائج نفسها بصرياً.
              </p>
            </div>
            <div className="ledger-compare__notice ledger-callout ledger-callout--warning">
              <p className="ledger-compare__notice-title">توصية</p>
              <ul className="ledger-compare__notice-list">
                {compareResult.recommendations.map((r, i) => (
                  <li key={i}>{r.message}</li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
