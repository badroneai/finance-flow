/*
  نظرة الأسبوع — برومبت 1.3
  رسم أعمدة (SVG) + ملخص رقمي + شارة الحالة (safe/tight/danger)
*/
import React, { useMemo } from 'react';

const DAY_NAMES = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const DAY_MS = 24 * 60 * 60 * 1000;

function toDateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatMoney(n) {
  if (n == null || !Number.isFinite(n)) return '0';
  const abs = Math.abs(n);
  if (abs >= 1000) return `${(n / 1000).toLocaleString('ar-SA', { maximumFractionDigits: 1 })}k`;
  return n.toLocaleString('ar-SA', { maximumFractionDigits: 0 });
}

function formatFull(n) {
  if (n == null || !Number.isFinite(n)) return '0';
  return n.toLocaleString('ar-SA', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export default function WeekForecast({ weekForecast, upcomingDues = [] }) {
  const { expectedIncome = 0, expectedExpenses = 0, netCashflow = 0, riskLevel = 'safe' } = weekForecast || {};

  const dayData = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const weekStart = new Date(now);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - dayOfWeek);

    const duesByDate = {};
    for (const due of upcomingDues) {
      const key = (due.dueDate || '').slice(0, 10);
      if (!key) continue;
      if (!duesByDate[key]) duesByDate[key] = { income: 0, expense: 0 };
      const amt = Number(due.amount) || 0;
      if (due.type === 'income') duesByDate[key].income += amt;
      else duesByDate[key].expense += amt;
    }

    return DAY_NAMES.map((label, i) => {
      const d = new Date(weekStart.getTime() + i * DAY_MS);
      const dateKey = toDateKey(d);
      const { income = 0, expense = 0 } = duesByDate[dateKey] || {};
      const net = income - expense;
      return { label, dateKey, income, expense, net, isWeekend: i >= 5 };
    });
  }, [upcomingDues]);

  const maxAbs = useMemo(() => {
    let m = 0;
    for (const row of dayData) {
      m = Math.max(m, row.income, row.expense, Math.abs(row.net));
    }
    return m || 1;
  }, [dayData]);

  const chartHeight = 80;
  const zeroY = chartHeight / 2;
  const scale = zeroY / maxAbs;
  const svgWidth = Math.max(280, dayData.length * 48);

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden p-4" dir="rtl">
      <h2 className="font-semibold text-gray-900 mb-4">
        نظرة الأسبوع
      </h2>

      {/* رسم الأعمدة */}
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${chartHeight + 44}`}
          className="w-full min-h-[124px]"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* خط الصفر */}
          <line
            x1="0"
            y1={zeroY + 22}
            x2={svgWidth}
            y2={zeroY + 22}
            stroke="#e5e7eb"
            strokeWidth="1"
            strokeDasharray="4 2"
          />
          {/* الأعمدة والأيام */}
          {dayData.map((row, i) => {
            const groupX = 24 + i * 40;
            const incomeH = Math.max(0, row.income * scale);
            const expenseH = Math.max(0, row.expense * scale);
            const isWeekend = row.isWeekend;
            const opacity = isWeekend ? 0.5 : 1;
            const groupZero = 40;
            return (
              <g key={row.dateKey} transform={`translate(${groupX}, 22)`}>
                {/* دخل (أعلى، أخضر) */}
                {row.income > 0 && (
                  <rect
                    x={-8}
                    y={groupZero - incomeH}
                    width="10"
                    height={incomeH}
                    fill="#10B981"
                    opacity={opacity}
                    rx="2"
                  />
                )}
                {/* مصروف (أسفل، أحمر) */}
                {row.expense > 0 && (
                  <rect
                    x={2}
                    y={groupZero}
                    width="10"
                    height={expenseH}
                    fill="#EF4444"
                    opacity={opacity}
                    rx="2"
                  />
                )}
                {/* نص المبلغ */}
                <text
                  x={0}
                  y={row.net >= 0 ? groupZero - incomeH - 6 : groupZero + expenseH + 14}
                  textAnchor="middle"
                  className="fill-gray-600"
                  style={{ fontSize: 10 }}
                >
                  {row.net !== 0 ? (row.net >= 0 ? '+' : '') + formatMoney(row.net) : ''}
                </text>
                {/* اسم اليوم */}
                <text
                  x={0}
                  y={chartHeight + 14}
                  textAnchor="middle"
                  className={isWeekend ? 'fill-gray-400' : 'fill-gray-700'}
                  style={{ fontSize: 10 }}
                >
                  {row.label.slice(0, 3)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* ملخص رقمي */}
      <div className="mt-4 pt-4 border-t border-gray-100 space-y-1 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">متوقع الدخل:</span>
          <span className="font-medium text-emerald-600">{formatFull(expectedIncome)} ر.س</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">متوقع المصروف:</span>
          <span className="font-medium text-rose-600">{formatFull(expectedExpenses)} ر.س</span>
        </div>
        <div className="flex justify-between items-center pt-1 border-t border-gray-100">
          <span className="text-gray-700 font-medium">صافي:</span>
          <span className={`font-bold ${netCashflow >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {netCashflow >= 0 ? '' : '-'}{formatFull(Math.abs(netCashflow))} ر.س
          </span>
        </div>
      </div>

      {/* شارة الحالة */}
      <style>{`
        @keyframes weekDangerShake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-2px); }
          75% { transform: translateX(2px); }
        }
        .week-forecast-danger { animation: weekDangerShake 2s ease-in-out infinite; }
      `}</style>
      <div className="mt-3 flex justify-center">
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            riskLevel === 'safe'
              ? 'bg-emerald-100 text-emerald-800'
              : riskLevel === 'tight'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-rose-100 text-rose-800'
          } ${riskLevel === 'danger' ? 'week-forecast-danger' : ''}`}
        >
          {riskLevel === 'safe' && 'الحالة: سيولة مريحة'}
          {riskLevel === 'tight' && 'الحالة: سيولة ضيقة'}
          {riskLevel === 'danger' && 'خطر عجز'}
        </span>
      </div>
    </div>
  );
}
