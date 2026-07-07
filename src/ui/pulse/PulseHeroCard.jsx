/*
  بطاقة النبض الرئيسية (Hero Card) — برومبت 1.1
  دائرة الصحة + الأرقام الثلاثة + حالة فارغة + جاهز للسحب للتحديث
*/
import { useState, useEffect, useRef } from 'react';
import { formatCurrency } from '../../utils/format.jsx';

const STATUS_LABELS = {
  excellent: 'ممتاز',
  good: 'جيد',
  warning: 'انتباه',
  critical: 'حرج',
  unknown: '—',
};

const HEALTH_COLORS = {
  high: 'var(--color-success)', // 80-100
  good: 'var(--color-info)', // 60-79
  warn: 'var(--color-warning)', // 40-59
  low: 'var(--color-danger)', // 0-39
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
        className="panel-card pulse-hero pulse-hero--empty"
        style={{
          background:
            'linear-gradient(135deg, var(--color-warning-bg) 0%, color-mix(in srgb, var(--color-warning-bg) 60%, var(--color-surface) 40%) 100%)',
        }}
        dir="rtl"
      >
        <p className="pulse-hero__empty-title" style={{ color: 'var(--color-warning)' }}>
          أضف أول حركة مالية لتفعيل النبض
        </p>
        <p className="pulse-hero__empty-desc" style={{ color: 'var(--color-warning)' }}>
          سجّل حركة أو اختر دفتراً نشطاً لرؤية صحة مكتبك المالية هنا.
        </p>
        {onAddTransaction && (
          <button
            type="button"
            onClick={onAddTransaction}
            className="pulse-hero__empty-btn no-print"
            style={{ background: 'var(--color-warning)' }}
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
      className="pulse-hero"
      style={{
        background: `linear-gradient(135deg, color-mix(in srgb, ${circleColor} 12%, var(--color-surface) 88%) 0%, color-mix(in srgb, ${circleColor} 6%, transparent) 50%, transparent 100%)`,
        border: `1px solid color-mix(in srgb, ${circleColor} 18%, transparent)`,
        boxShadow: 'var(--shadow)',
      }}
      dir="rtl"
    >
      <h2 className="pulse-hero__title">صحة مكتبك المالية</h2>

      {/* دائرة الصحة */}
      <div className="pulse-hero__ring-wrap">
        <div className="pulse-hero__ring-container">
          <svg className="pulse-hero__ring-svg" width={140} height={140} aria-hidden="true">
            <circle
              cx="70"
              cy="70"
              r="52"
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              className="pulse-hero__ring-bg"
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
          <div className="pulse-hero__score-overlay">
            <span className="pulse-hero__score-number" style={{ color: circleColor }}>
              {displayScore}
            </span>
            <span className="pulse-hero__score-suffix">/100</span>
          </div>
        </div>
      </div>

      {/* نقاط الحالة */}
      <div className="pulse-hero__dots" aria-hidden="true">
        {Array.from({ length: 10 }, (_, i) => (
          <span
            key={i}
            className="pulse-hero__dot"
            style={{
              backgroundColor:
                i < Math.round(displayScore / 10) ? circleColor : 'var(--color-border)',
            }}
          />
        ))}
      </div>
      <p className="pulse-hero__status-label">
        {STATUS_LABELS[pulse.healthStatus] || pulse.healthStatus}
      </p>

      {/* البطاقات الثلاث */}
      <div className="pulse-hero__metrics">
        <div className="pulse-hero__metric">
          <p className="pulse-hero__metric-label">دخل اليوم</p>
          <p
            className="pulse-hero__metric-value"
            style={{ color: 'var(--color-success)' }}
            title={formatAmount(pulse.todayIncome)}
          >
            {formatAmount(pulse.todayIncome)}
          </p>
        </div>
        <div className="pulse-hero__metric">
          <p className="pulse-hero__metric-label">مصروف الأسبوع</p>
          <p
            className="pulse-hero__metric-value"
            style={{ color: 'var(--color-danger)' }}
            title={formatAmount(pulse.weekExpenses)}
          >
            {formatAmount(pulse.weekExpenses)}
          </p>
        </div>
        <div className="pulse-hero__metric">
          <p className="pulse-hero__metric-label">الرصيد الحالي</p>
          <p
            className="pulse-hero__metric-value--balance"
            title={formatAmount(pulse.currentBalance)}
          >
            {formatAmount(pulse.currentBalance)}
            {trendUp && (
              <span className="pulse-hero__trend-icon" style={{ color: 'var(--color-success)' }} aria-hidden="true">
                ↑
              </span>
            )}
            {trendDown && (
              <span className="pulse-hero__trend-icon" style={{ color: 'var(--color-danger)' }} aria-hidden="true">
                ↓
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="pulse-hero__footer">
        <p className="pulse-hero__footer-time">
          آخر تحديث: {formatCalculatedAt(pulse.calculatedAt) || '—'}
        </p>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="pulse-hero__refresh-btn no-print"
            aria-label="تحديث النبض"
          >
            تحديث
          </button>
        )}
      </div>
    </div>
  );
}
