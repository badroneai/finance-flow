/**
 * صفحة التقرير الشهري — تقرأ معاملات الرابط وتُعرض MonthlyReportView (برومبت 5.2)
 */
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { MonthlyReportView } from '../ui/reports/MonthlyReportView.jsx';

function MonthlyReportPage({ setPage }) {
  const [searchParams] = useSearchParams();
  const ledgerId = searchParams.get('ledgerId') || '';
  const month = searchParams.get('month') || '';
  const year = searchParams.get('year') || '';

  const handleBack = () => setPage?.('ledgers');

  return (
    <div className="px-4 md:px-6 py-4">
      <MonthlyReportView
        ledgerId={ledgerId}
        month={month || undefined}
        year={year || undefined}
        onBack={handleBack}
        setPage={setPage}
      />
    </div>
  );
}

export default MonthlyReportPage;
