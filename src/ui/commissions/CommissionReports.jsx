/**
 * تقارير العمولات — SPR-012
 * مُستخرج من CommissionsPage.jsx — نفس الـ behavior تمامًا.
 * تقارير حسب الوكيل / الدفتر / شهري + رسم بياني أفقي بسيط.
 */
import { useState, useMemo } from 'react';
import { SummaryCard, Icons } from '../ui-common.jsx';
import { Currency, formatCurrency } from '../../utils/format.jsx';
import { safeNum } from '../../utils/helpers.js';

// ─── دوال مساعدة نقية ───

/** الحصول على قيمة الحقل بدعم camelCase و snake_case */
function f(c, camel, snake) {
  return c[camel] ?? c[snake] ?? null;
}

/** حساب مبلغ العمولة */
function calcCommissionAmount(dealValue, officePercent) {
  return (safeNum(dealValue, 0) * safeNum(officePercent, 0)) / 100;
}

// ─── تبويبات التقارير ───

const REPORT_TABS = [
  { id: 'by_agent', label: 'حسب الوكيل' },
  { id: 'by_ledger', label: 'حسب الدفتر' },
  { id: 'monthly', label: 'شهري' },
];

export function CommissionReports({ commissions, ledgerName }) {
  const [reportTab, setReportTab] = useState('by_agent');

  // ─── تقرير حسب الوكيل ───
  const byAgent = useMemo(() => {
    const map = {};
    (commissions || []).forEach((c) => {
      const agent = f(c, 'agentName', 'agent_name') || 'بدون وكيل';
      if (!map[agent])
        map[agent] = {
          agent,
          count: 0,
          totalDeal: 0,
          totalCommission: 0,
          totalPaid: 0,
          totalRemaining: 0,
        };
      const amount = calcCommissionAmount(
        f(c, 'dealValue', 'deal_value'),
        f(c, 'officePercent', 'office_percent')
      );
      const paid = safeNum(f(c, 'paidAmount', 'paid_amount'), 0);
      map[agent].count++;
      map[agent].totalDeal += safeNum(f(c, 'dealValue', 'deal_value'), 0);
      map[agent].totalCommission += amount;
      map[agent].totalPaid += paid;
      map[agent].totalRemaining += Math.max(0, amount - paid);
    });
    return Object.values(map).sort((a, b) => b.totalCommission - a.totalCommission);
  }, [commissions]);

  // ─── تقرير حسب الدفتر ───
  const byLedger = useMemo(() => {
    const map = {};
    (commissions || []).forEach((c) => {
      const lid = f(c, 'ledgerId', 'ledger_id') || '__none__';
      const lname = ledgerName(lid);
      if (!map[lid])
        map[lid] = {
          ledger: lname,
          count: 0,
          totalDeal: 0,
          totalCommission: 0,
          totalPaid: 0,
          totalRemaining: 0,
        };
      const amount = calcCommissionAmount(
        f(c, 'dealValue', 'deal_value'),
        f(c, 'officePercent', 'office_percent')
      );
      const paid = safeNum(f(c, 'paidAmount', 'paid_amount'), 0);
      map[lid].count++;
      map[lid].totalDeal += safeNum(f(c, 'dealValue', 'deal_value'), 0);
      map[lid].totalCommission += amount;
      map[lid].totalPaid += paid;
      map[lid].totalRemaining += Math.max(0, amount - paid);
    });
    return Object.values(map).sort((a, b) => b.totalCommission - a.totalCommission);
  }, [commissions, ledgerName]);

  // ─── تقرير شهري ───
  const monthly = useMemo(() => {
    const map = {};
    (commissions || []).forEach((c) => {
      const dateStr = f(c, 'dueDate', 'due_date') || f(c, 'createdAt', 'created_at') || '';
      const month = dateStr ? dateStr.substring(0, 7) : 'بدون تاريخ'; // YYYY-MM
      if (!map[month])
        map[month] = {
          month,
          count: 0,
          totalDeal: 0,
          totalCommission: 0,
          totalPaid: 0,
          totalRemaining: 0,
        };
      const amount = calcCommissionAmount(
        f(c, 'dealValue', 'deal_value'),
        f(c, 'officePercent', 'office_percent')
      );
      const paid = safeNum(f(c, 'paidAmount', 'paid_amount'), 0);
      map[month].count++;
      map[month].totalDeal += safeNum(f(c, 'dealValue', 'deal_value'), 0);
      map[month].totalCommission += amount;
      map[month].totalPaid += paid;
      map[month].totalRemaining += Math.max(0, amount - paid);
    });
    return Object.values(map).sort((a, b) => (b.month > a.month ? 1 : -1));
  }, [commissions]);

  // أكبر عمولة (للرسم البياني البسيط)
  const maxCommission = useMemo(() => {
    const data =
      reportTab === 'by_agent' ? byAgent : reportTab === 'by_ledger' ? byLedger : monthly;
    return Math.max(1, ...data.map((r) => r.totalCommission));
  }, [reportTab, byAgent, byLedger, monthly]);

  const reportData =
    reportTab === 'by_agent' ? byAgent : reportTab === 'by_ledger' ? byLedger : monthly;
  const labelKey =
    reportTab === 'by_agent' ? 'agent' : reportTab === 'by_ledger' ? 'ledger' : 'month';

  if ((commissions || []).length === 0) {
    return (
      <div className="commissions-page__report-empty">
        <Icons.empty size={64} aria-hidden="true" />
        <p className="commissions-page__report-empty-title">لا توجد بيانات لعرض التقارير</p>
        <p className="commissions-page__report-empty-hint">أضف عمولات أولاً لتظهر هنا</p>
      </div>
    );
  }

  // تنسيق اسم الشهر
  const formatMonth = (m) => {
    if (!m || m === 'بدون تاريخ') return m;
    try {
      const [y, mo] = m.split('-');
      const d = new Date(Number(y), Number(mo) - 1);
      return d.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long' });
    } catch {
      return m;
    }
  };

  return (
    <div>
      {/* تبويبات التقارير الفرعية */}
      <div className="control-toolbar control-toolbar--segmented commissions-page__report-tabs commissions-page__report-tabs-shell">
        {REPORT_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setReportTab(tab.id)}
            className={`commissions-page__tab${reportTab === tab.id ? ' is-active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* إجمالي التقرير */}
      <div className="route-summary-grid route-summary-grid--triple commissions-page__report-summary">
        <SummaryCard
          label="عدد الصفقات"
          value={
            <span className="commissions-page__summary-value">
              {reportData.reduce((s, r) => s + r.count, 0)}
            </span>
          }
          color="blue"
        />
        <SummaryCard
          label="إجمالي العمولات"
          value={
            <Currency
              value={reportData.reduce((s, r) => s + r.totalCommission, 0)}
              className="commissions-page__summary-value"
            />
          }
          color="green"
        />
        <SummaryCard
          label="المتبقي"
          value={
            <Currency
              value={reportData.reduce((s, r) => s + r.totalRemaining, 0)}
              className="commissions-page__summary-value"
            />
          }
          color="red"
        />
      </div>

      {/* الجدول + رسم بياني أفقي بسيط */}
      <div className="panel-card commissions-page__report-shell">
        <div className="commissions-page__table-scroll">
          <table className="commissions-page__report-table">
            <thead>
              <tr className="commissions-page__report-table-head-row">
                <th className="commissions-page__report-th" scope="col">
                  {reportTab === 'by_agent'
                    ? 'الوكيل'
                    : reportTab === 'by_ledger'
                      ? 'الدفتر'
                      : 'الشهر'}
                </th>
                <th className="commissions-page__report-th" scope="col">
                  الصفقات
                </th>
                <th className="commissions-page__report-th" scope="col">
                  قيمة الصفقات
                </th>
                <th className="commissions-page__report-th" scope="col">
                  العمولة
                </th>
                <th className="commissions-page__report-th" scope="col">
                  المدفوع
                </th>
                <th className="commissions-page__report-th" scope="col">
                  المتبقي
                </th>
                <th className="commissions-page__report-th commissions-page__report-th--chart" scope="col">
                  &nbsp;
                </th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((row, i) => {
                const label = reportTab === 'monthly' ? formatMonth(row[labelKey]) : row[labelKey];
                const barWidth = Math.max(2, (row.totalCommission / maxCommission) * 100);
                const paidWidth =
                  row.totalCommission > 0 ? (row.totalPaid / row.totalCommission) * 100 : 0;
                const paidBarWidth = Math.min(barWidth, (paidWidth / 100) * barWidth);
                return (
                  <tr key={i} className="commissions-page__table-body-row">
                    <td className="commissions-page__table-td commissions-page__table-td--strong">
                      {label}
                    </td>
                    <td className="commissions-page__table-td commissions-page__table-td--muted">
                      {row.count}
                    </td>
                    <td className="commissions-page__table-td">
                      <Currency value={row.totalDeal} symbolClassName="commissions-page__currency-symbol" />
                    </td>
                    <td className="commissions-page__table-td commissions-page__table-td--commission">
                      <Currency value={row.totalCommission} symbolClassName="commissions-page__currency-symbol" />
                    </td>
                    <td className="commissions-page__table-td commissions-page__money commissions-page__money--paid">
                      <Currency value={row.totalPaid} symbolClassName="commissions-page__currency-symbol" />
                    </td>
                    <td className="commissions-page__table-td commissions-page__money commissions-page__money--remaining">
                      <Currency value={row.totalRemaining} symbolClassName="commissions-page__currency-symbol" />
                    </td>
                    <td className="commissions-page__table-td commissions-page__report-td--chart">
                      <div
                        className="commissions-page__report-bar-track"
                        title={`العمولة: ${formatCurrency(row.totalCommission)}`}
                      >
                        <div
                          className="commissions-page__report-bar-total"
                          style={{ width: `${barWidth}%` }}
                        />
                        <div
                          className="commissions-page__report-bar-paid"
                          style={{ width: `${paidBarWidth}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* مفتاح الرسم */}
      <div className="commissions-page__report-legend">
        <span className="commissions-page__report-legend-item">
          <span className="commissions-page__report-legend-swatch commissions-page__report-legend-swatch--success" />{' '}
          المدفوع
        </span>
        <span className="commissions-page__report-legend-item">
          <span className="commissions-page__report-legend-swatch commissions-page__report-legend-swatch--info" />{' '}
          إجمالي العمولة
        </span>
      </div>
    </div>
  );
}
