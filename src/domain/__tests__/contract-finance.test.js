import { describe, expect, it } from 'vitest';
import { buildContractFinancials, buildContractSchedule } from '../contract-finance.js';

describe('contract finance domain', () => {
  it('يولد جدول شهري صحيح بعدد دفعات العقد', () => {
    const schedule = buildContractSchedule({
      id: 'contract-1',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      durationMonths: 12,
      totalAmount: 12000,
      paymentCycle: 'monthly',
      installmentCount: 12,
    });

    expect(schedule).toHaveLength(12);
    expect(schedule[0].dueDate).toBe('2026-01-01');
    expect(schedule[1].dueDate).toBe('2026-02-01');
    expect(schedule[11].amount).toBe(1000);
  });

  it('يحسب الحالات المالية مع دفعات جزئية ومتأخرة', () => {
    const finance = buildContractFinancials(
      {
        id: 'contract-2',
        startDate: '2026-01-01',
        endDate: '2026-03-31',
        durationMonths: 3,
        totalAmount: 9000,
        paymentCycle: 'monthly',
        installmentCount: 3,
      },
      [
        {
          id: 'p1',
          contractId: 'contract-2',
          amount: 3000,
          date: '2026-01-01',
          dueId: 'contract-2-due-1',
        },
        {
          id: 'p2',
          contractId: 'contract-2',
          amount: 1000,
          date: '2026-02-10',
          dueId: 'contract-2-due-2',
        },
      ],
      new Date('2026-03-20T00:00:00')
    );

    expect(finance.paid).toBe(4000);
    expect(finance.remaining).toBe(5000);
    expect(finance.overdue).toBe(5000);
    expect(finance.schedule[0].status).toBe('paid');
    expect(finance.schedule[1].status).toBe('partial');
    expect(finance.schedule[2].status).toBe('overdue');
  });

  it('يدعم العقود المخصصة بعدد دفعات محدد', () => {
    const schedule = buildContractSchedule({
      id: 'contract-3',
      startDate: '2026-02-10',
      endDate: '2026-04-10',
      durationMonths: 2,
      totalAmount: 1850000,
      paymentCycle: 'custom',
      installmentCount: 2,
    });

    expect(schedule).toHaveLength(2);
    expect(schedule[0].dueDate).toBe('2026-02-10');
    expect(schedule[1].dueDate).toBe('2026-04-10');
    expect(schedule[0].amount + schedule[1].amount).toBe(1850000);
  });
});
