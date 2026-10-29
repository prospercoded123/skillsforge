import { daysBetween, DateRange } from '../common/dates.js';
import { roundMoney } from '../common/money.js';
import { percentOf, sumAmounts } from './analysis-math.js';
import { NEAR_LIMIT_RATIO, TOP_EXPENSE_COUNT } from './analysis.constants.js';
import {
  AnalysisInput,
  BudgetAlert,
  BudgetStatus,
  ExpenseHighlight,
  SpendingRecord,
} from './analysis.types.js';

interface AlertScope {
  scope: BudgetAlert['scope'];
  categoryId: string | null;
  name: string;
  limit: number;
  current: SpendingRecord[];
  previous: SpendingRecord[];
}

export function buildBudgetAlerts(input: AnalysisInput): BudgetAlert[] {
  const { budgets, period } = input;
  if (!budgets || !period) {
    return [];
  }

  const alerts: BudgetAlert[] = [];
  if (budgets.overall !== null) {
    alerts.push(
      buildAlert(period, input.today, {
        scope: 'overall',
        categoryId: null,
        name: 'All categories',
        limit: budgets.overall,
        current: input.current,
        previous: input.previous,
      }),
    );
  }
  for (const category of budgets.categories) {
    const inCategory = (record: SpendingRecord) => record.categoryId === category.categoryId;
    alerts.push(
      buildAlert(period, input.today, {
        scope: 'category',
        categoryId: category.categoryId,
        name: category.categoryName,
        limit: category.limit,
        current: input.current.filter(inCategory),
        previous: input.previous.filter(inCategory),
      }),
    );
  }
  return alerts;
}

function buildAlert(period: DateRange, today: string, scope: AlertScope): BudgetAlert {
  const spent = sumAmounts(scope.current);
  const previousSpent = sumAmounts(scope.previous);
  const projectedTotal = projectMonthEnd(spent, period, today);

  return {
    scope: scope.scope,
    categoryId: scope.categoryId,
    name: scope.name,
    limit: scope.limit,
    spent,
    previousSpent,
    increase: roundMoney(spent - previousSpent),
    percentUsed: percentOf(spent, scope.limit),
    projectedTotal,
    safeDailySpend: safeDailySpend(spent, scope.limit, period, today),
    status: statusOf(spent, projectedTotal, scope.limit),
    largestExpenses: largestExpenses(scope.current),
  };
}

// Spending pace: what the period will total if it keeps going at the rate so far.
function projectMonthEnd(spent: number, period: DateRange, today: string): number {
  const days = daysBetween(period.from, period.to);
  const elapsed = elapsedDays(period, today);
  if (elapsed === 0 || elapsed >= days) {
    return spent;
  }
  return roundMoney((spent / elapsed) * days);
}

function safeDailySpend(spent: number, limit: number, period: DateRange, today: string): number {
  const remainingDays = daysBetween(period.from, period.to) - elapsedDays(period, today);
  const remaining = limit - spent;
  if (remainingDays <= 0 || remaining <= 0) {
    return 0;
  }
  return roundMoney(remaining / remainingDays);
}

function elapsedDays(period: DateRange, today: string): number {
  const days = daysBetween(period.from, period.to);
  const elapsed = daysBetween(period.from, today);
  return Math.min(Math.max(elapsed, 0), days);
}

function statusOf(spent: number, projectedTotal: number, limit: number): BudgetStatus {
  if (spent > limit) return 'exceeded';
  if (projectedTotal > limit) return 'projected_to_exceed';
  if (spent >= limit * NEAR_LIMIT_RATIO) return 'near_limit';
  return 'on_track';
}

function largestExpenses(records: SpendingRecord[]): ExpenseHighlight[] {
  return [...records]
    .sort((a, b) => b.amount - a.amount || a.date.localeCompare(b.date))
    .slice(0, TOP_EXPENSE_COUNT)
    .map((record) => ({
      expenseId: record.id,
      title: record.title,
      date: record.date,
      amount: record.amount,
    }));
}
