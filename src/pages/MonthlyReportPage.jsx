/**
 * صفحة التقرير الشهري — تقرأ معاملات الرابط وتُعرض MonthlyReportView (برومبت 5.2)
 * إذا لم يُمرَّر ledgerId في الرابط → يستخدم الدفتر النشط من DataContext.
 */
import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MonthlyReportView } from '../ui/reports/MonthlyReportView.jsx';
import { useData } from '../contexts/DataContext.jsx';

function MonthlyReportPage({ setPage }) {
  const [searchParams] = useSearchParams();
  const { transactions, recurringItems, ledgers, activeLedgerId } = useData();
  // أولوية: الرابط → الدفتر النشط
  const ledgerId = searchParams.get('ledgerId') || activeLedgerId || '';
  const month = searchParams.get('month') || '';
  const year = searchParams.get('year') || '';

  const dataOptions = useMemo(
    () => ({
      transactions,
      recurringItems,
      ledgers,
    }),
    [transactions, recurringItems, ledgers]
  );

  const handleBack = () => setPage?.('ledgers');

  return (
    <div className="px-4 md:px-6 py-4">
      <MonthlyReportView
        ledgerId={ledgerId}
        month={month || undefined}
        year={year || undefined}
        onBack={handleBack}
        setPage={setPage}
        dataOptions={dataOptions}
      />
    </div>
  );
}

export default MonthlyReportPage;
