/*
  مقارنة الدفاتر — برومبت 4.2
  بطاقات متجاورة (horizontal scroll)، أشرطة صحة ديناميكية، ROI ملون، توصيات، multi-select.
*/
import React, { useState, useEffect, useRef } from 'react';
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
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-blue-500';
  if (score >= 40) return 'bg-amber-500';
  return 'bg-rose-500';
}

export default function LedgerCompare() {
  const [selectedIds, setSelectedIds] = useState([]);
  const [compareResult, setCompareResult] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const allLedgers = (getLedgers && getLedgers()) || [];

  useEffect(() => {
    if (selectedIds.length >= 2) {
      setCompareResult(compareLedgers(selectedIds));
    } else {
      setCompareResult(null);
    }
  }, [selectedIds.join(',')]);

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

  const selectedNames = selectedIds
    .map((id) => (allLedgers.find((l) => l.id === id) || {}).name || id)
    .join('، ') || 'اختر الدفاتر';

  return (
    <div className="ledger-compare rounded-xl border border-gray-200 bg-white shadow-sm p-4 md:p-5" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className="text-lg font-bold text-gray-900">مقارنة الدفاتر</h3>
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((v) => !v)}
            className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 min-w-[160px] text-right"
            aria-haspopup="listbox"
            aria-expanded={dropdownOpen}
          >
            {selectedNames}
            <span className="inline-block ms-2 text-gray-400">{dropdownOpen ? '\u25B2' : '\u25BC'}</span>
          </button>
          {dropdownOpen && (
            <div
              role="listbox"
              className="absolute top-full end-0 mt-1 w-56 max-h-64 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg py-2 z-10"
            >
              {allLedgers.map((l) => {
                const checked = selectedIds.includes(l.id);
                const disabled = !checked && selectedIds.length >= 5;
                return (
                  <label
                    key={l.id}
                    className={`flex items-center gap-2 px-3 py-2 text-sm cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => toggleLedger(l.id)}
                      className="rounded border-gray-300"
                    />
                    <span className="truncate">{l.name || l.id}</span>
                  </label>
                );
              })}
              {allLedgers.length === 0 && (
                <p className="px-3 py-2 text-sm text-gray-500">لا توجد دفاتر</p>
              )}
            </div>
          )}
        </div>
      </div>

      {!compareResult && (
        <p className="text-sm text-gray-500 py-6 text-center">اختر دفترين على الأقل (وحتى 5) للمقارنة.</p>
      )}

      {compareResult && compareResult.ledgers.length > 0 && (
        <>
          <div className="overflow-x-auto -mx-1 pb-2">
            <div className="flex gap-4 min-w-max px-1">
              {compareResult.ledgers.map((l) => {
                const isBest = compareResult.bestPerformer?.ledgerId === l.id;
                const isWorst = compareResult.worstPerformer?.ledgerId === l.id && (l.roi < 1 || l.overdueCount > 0);
                return (
                  <div
                    key={l.id}
                    className="w-44 flex-shrink-0 rounded-xl border border-gray-200 bg-gray-50/50 p-4"
                  >
                    <p className="font-bold text-gray-900 truncate mb-3" title={l.name}>{l.name}</p>
                    <p className="text-sm text-gray-600 mb-1">صحة: {l.healthScore}</p>
                    <div className="h-2 rounded-full bg-gray-200 overflow-hidden mb-3">
                      <div
                        className={`h-full rounded-full transition-all ${healthBarColor(l.healthScore)}`}
                        style={{ width: `${Math.min(100, Math.max(0, l.healthScore))}%` }}
                      />
                    </div>
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-700">دخل: {formatShort(l.totalIncome30d)}</p>
                      <p className="text-gray-700">صرف: {formatShort(l.totalExpense30d)}</p>
                      <p className={l.netCashflow30d >= 0 ? 'text-emerald-600 font-medium' : 'text-rose-600 font-medium'}>
                        صافي: {l.netCashflow30d >= 0 ? '+' : ''}{formatShort(l.netCashflow30d)}
                      </p>
                    </div>
                    <p className={`mt-2 text-sm font-medium ${l.roi >= 1 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      ROI: {l.roi.toFixed(1)}x
                    </p>
                    <div className="mt-3">
                      {isBest && (
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                          الأفضل
                        </span>
                      )}
                      {isWorst && !isBest && (
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                          يحتاج مراجعة
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {compareResult.recommendations && compareResult.recommendations.length > 0 && (
            <div className="mt-4 p-4 rounded-xl bg-amber-50/80 border border-amber-100">
              <p className="text-sm font-medium text-amber-900 mb-1">توصية</p>
              <ul className="text-sm text-amber-800 space-y-1">
                {compareResult.recommendations.map((r, i) => (
                  <li key={i}>{r.message}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
