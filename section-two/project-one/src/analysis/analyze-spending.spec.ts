import { describe, expect, it } from 'vitest';
import { analyzeSpending } from './analyze-spending.js';
import { SpendingRecord } from './analysis.types.js';

const period = { from: '2026-10-01', to: '2026-10-31' };

function record(
  id: string,
  amount: number,
  date: string,
  categoryId = 'food',
  categoryName = 'Food',
  title = id,
): SpendingRecord {
  return { id, title, amount, date, categoryId, categoryName };
}

describe('analyzeSpending', () => {
  it('flags a category that exceeded its budget and points at the expense behind it', () => {
    const analysis = analyzeSpending({
      current: [
        record('groceries', 80, '2026-10-03', 'food', 'Food', 'Groceries'),
        record('dinner', 40, '2026-10-15', 'food', 'Food', 'Dinner'),
      ],
      previous: [record('sept', 60, '2026-09-10')],
      period,
      today: '2026-10-20',
      budgets: {
        overall: null,
        categories: [{ categoryId: 'food', categoryName: 'Food', limit: 100 }],
      },
    });

    const [alert] = analysis.budgetAlerts;
    expect(alert).toMatchObject({
      status: 'exceeded',
      spent: 120,
      previousSpent: 60,
      increase: 60,
      percentUsed: 120,
    });
    expect(alert.largestExpenses[0]).toMatchObject({
      title: 'Groceries',
      date: '2026-10-03',
    });
    expect(analysis.suggestions).toContain(
      'Food is 20.00 over its budget of 100.00 (120% used).',
    );
  });

  it('warns when spending is close to the limit and shows the safe daily amount', () => {
    const [alert] = analyzeSpending({
      current: [record('rent', 85, '2026-10-05')],
      previous: [],
      period,
      today: '2026-10-28',
      budgets: {
        overall: null,
        categories: [{ categoryId: 'food', categoryName: 'Food', limit: 100 }],
      },
    }).budgetAlerts;

    expect(alert.status).toBe('near_limit');
    expect(alert.safeDailySpend).toBe(5);
  });

  it('warns when the current pace would exceed the limit before month end', () => {
    const [alert] = analyzeSpending({
      current: [record('a', 70, '2026-10-10')],
      previous: [],
      period,
      today: '2026-10-20',
      budgets: {
        overall: null,
        categories: [{ categoryId: 'food', categoryName: 'Food', limit: 100 }],
      },
    }).budgetAlerts;

    expect(alert.status).toBe('projected_to_exceed');
    expect(alert.projectedTotal).toBe(108.5);
  });

  it('marks a budget on track when spending and pace stay under the limit', () => {
    const [alert] = analyzeSpending({
      current: [record('a', 50, '2026-10-10')],
      previous: [],
      period,
      today: '2026-10-20',
      budgets: {
        overall: null,
        categories: [{ categoryId: 'food', categoryName: 'Food', limit: 100 }],
      },
    }).budgetAlerts;

    expect(alert.status).toBe('on_track');
  });

  it('produces no budget alerts when no month was requested', () => {
    const analysis = analyzeSpending({
      current: [record('a', 500, '2026-10-10')],
      previous: [],
      period,
      today: '2026-10-20',
      budgets: null,
    });

    expect(analysis.budgetAlerts).toEqual([]);
  });

  it('reports a rising trend with its weekly average', () => {
    const [food] = analyzeSpending({
      current: [
        record('early', 10, '2026-10-02'),
        record('late', 40, '2026-10-20'),
      ],
      previous: [],
      period,
      today: '2026-10-31',
      budgets: null,
    }).categoryTrends;

    expect(food).toMatchObject({
      direction: 'rising',
      total: 50,
      weeklyAverage: 11.29,
    });
  });

  it('treats small changes between halves as stable and large drops as falling', () => {
    const trends = analyzeSpending({
      current: [
        record('t1', 30, '2026-10-05', 'transport', 'Transport'),
        record('t2', 30, '2026-10-25', 'transport', 'Transport'),
        record('e1', 60, '2026-10-05', 'fun', 'Entertainment'),
        record('e2', 10, '2026-10-25', 'fun', 'Entertainment'),
      ],
      previous: [],
      period,
      today: '2026-10-31',
      budgets: null,
    }).categoryTrends;

    expect(trends.find((t) => t.categoryName === 'Transport')?.direction).toBe(
      'stable',
    );
    expect(
      trends.find((t) => t.categoryName === 'Entertainment')?.direction,
    ).toBe('falling');
  });

  it('suggests reviewing a category when one expense dominates it', () => {
    const analysis = analyzeSpending({
      current: [
        record('big', 80, '2026-10-03', 'food', 'Food', 'Groceries'),
        record('small', 20, '2026-10-04'),
      ],
      previous: [],
      period,
      today: '2026-10-31',
      budgets: null,
    });

    expect(analysis.suggestions).toContain(
      '"Groceries" on 2026-10-03 made up 80% of Food spending.',
    );
  });

  it('has no trends when there is no period', () => {
    const analysis = analyzeSpending({
      current: [record('a', 10, '2026-10-01')],
      previous: [],
      period: null,
      today: '2026-10-20',
      budgets: null,
    });

    expect(analysis.categoryTrends).toEqual([]);
  });
});
