/*
  بطاقة النبض الرئيسية (Hero Card) — برومبت 1.1
  دائرة الصحة + الأرقام الثلاثة + حالة فارغة + جاهز للسحب للتحديث
*/
import React, { useState, useEffect, useRef } from 'react';
import { formatCurrency } from '../../utils/format.jsx';

const STATUS_LABELS = {
  excellent: 'ممتاز',
  good: 'جيد',
  warning: 'انتباه',
  critical: 'حرج',
  unknown: '—',
};

const HEALTH_COLORS = {
  high: '#10B981',   // 80-100
  good: '#3B82F6',   // 60-79
  warn: '#F59E0B',   // 40-59
  low: '#EF4444',    // 0-39
};

function getHealthColor(score) {
  if (score >= 80) return HEALTH_COLORS.high;
  if (score >= 60) return HEALTH_COLORS.good;
  if (score >= 40) return HEALTH_COLORS.warn;
  return HEALTH_COLORS.low;
}

function formatCalculatedAt(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const now = new Date();
    const diffMs = now - d;
    if (diffMs < 60000) return 'الآن';
    if (diffMs < 3600000) return `منذ ${Math.floor(diffMs / 60000)} د`;
    return d.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

/** حركة عدّ تصاعدي من 0 إلى الهدف */
function useCountUp(target, duration = 700, enabled = true) {
  const [value, setValue] = useState(0);
  const startRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!enabled || target == null) {
      setValue(target ?? 0);
      return;
    }
    const start = (timestamp) => {
      if (startRef.current == null) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const t = Math.min(1, elapsed / duration);
      const easeOut = 1 - (1 - t) * (1 - t);
      setValue(Math.round(easeOut * target));
      if (t < 1) rafRef.current = requestAnimationFrame(start);
    };
    startRef.current = null;
    setValue(0);
    rafRef.current = requestAnimationFrame(start);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration, enabled]);

  return value;
}

export default function PulseHeroCard({ pulse, onRefresh, onAddTransaction }) {
  const score = pulse?.healthScore ?? 0;
  const displayScore = useCountUp(score, 700, pulse?.healthStatus !== 'unknown');

  const isUnknown = pulse?.healthStatus === 'unknown';
  const circleColor = getHealthColor(score);
  const circumference = 2 * Math.PI * 52;
  const strokeDashoffset = circumference - (displayScore / 100) * circumference;

  const formatAmount = (val) => {
    const n = Number(val);
    if (val == null || !Number.isFinite(n)) return '—';
    if (n === 0) return '—';
    return formatCurrency(val);
  };

  if (!pulse) return null;

  if (isUnknown) {
    return (
      <div
        className="rounded-2xl shadow-lg p-6 md:p-8 text-center min-h-[200px] flex flex-col justify-center"
        style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' }}
        dir="rtl"
      >
        <p className="text-amber-900 font-medium text-lg mb-2">أضف أول حركة مالية لتفعيل النبض</p>
        <p className="text-amber-800 text-sm mb-4">سجّل حركة أو اختر دفتراً نشطاً لرؤية صحة مكتبك المالية هنا.</p>
        {onAddTransaction && (
          <button
            type="button"
            onClick={onAddTransaction}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-amber-600 text-white font-medium text-sm hover:bg-amber-700 transition-colors no-print"
          >
            إضافة حركة
          </button>
        )}
      </div>
    );
  }

  const trendUp = pulse.balanceTrend === 'up';
  const trendDown = pulse.balanceTrend === 'down';

  return (
    <div
      className="rounded-2xl shadow-lg p-4 md:p-6 transition-colors"
      style={{
        background: `linear-gradient(135deg, ${circleColor}08 0%, ${circleColor}14 50%, transparent 100%)`,
        border: `1px solid ${circleColor}20`,
      }}
      dir="rtl"
    >
      <h2 className="text-center text-gray-700 font-medium mb-4">صحة مكتبك المالية</h2>

      {/* دائرة الصحة */}
      <div className="flex justify-center mb-3">
        <div className="relative inline-flex items-center justify-center" style={{ width: 140, height: 140 }}>
          <svg className="transform -rotate-90" width={140} height={140} aria-hidden="true">
            <circle
              cx="70"
              cy="70"
              r="52"
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              className="text-gray-100"
            />
            <circle
              cx="70"
              cy="70"
              r="52"
              fill="none"
              stroke={circleColor}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: 'stroke-dashoffset 0.3s ease-out' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl md:text-5xl font-bold tabular-nums" style={{ color: circleColor }}>
              {displayScore}
            </span>
            <span className="text-sm text-gray-500">/100</span>
          </div>
        </div>
      </div>

      {/* نقاط الحالة */}
      <div className="flex justify-center gap-1 mb-1" aria-hidden="true">
        {Array.from({ length: 10 }, (_, i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: i < Math.round(displayScore / 10) ? circleColor : '#e5e7eb' }}
          />
        ))}
      </div>
      <p className="text-center text-sm text-gray-600 mb-6">
        {STATUS_LABELS[pulse.healthStatus] || pulse.healthStatus}
      </p>

      {/* البطاقات الثلاث */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white/80 rounded-xl p-3 border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 mb-0.5">دخل اليوم</p>
          <p className="text-base font-bold text-emerald-700 truncate" title={formatAmount(pulse.todayIncome)}>
            {formatAmount(pulse.todayIncome)}
          </p>
        </div>
        <div className="bg-white/80 rounded-xl p-3 border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 mb-0.5">مصروف الأسبوع</p>
          <p className="text-base font-bold text-rose-700 truncate" title={formatAmount(pulse.weekExpenses)}>
            {formatAmount(pulse.weekExpenses)}
          </p>
        </div>
        <div className="bg-white/80 rounded-xl p-3 border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 mb-0.5">الرصيد الحالي</p>
          <p className="text-base font-bold text-gray-900 truncate flex items-center justify-end gap-1" title={formatAmount(pulse.currentBalance)}>
            {formatAmount(pulse.currentBalance)}
            {trendUp && <span className="text-emerald-600 text-lg" aria-hidden="true">↑</span>}
            {trendDown && <span className="text-rose-600 text-lg" aria-hidden="true">↓</span>}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-xs text-gray-500">
          آخر تحديث: {formatCalculatedAt(pulse.calculatedAt) || '—'}
        </p>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium no-print"
            aria-label="تحديث النبض"
          >
            تحديث
          </button>
        )}
      </div>
    </div>
  );
}
