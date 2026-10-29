import { roundMoney } from '../common/money.js';
import { groupByCategory, percentOf, sumAmounts } from './analysis-math.js';
import { DOMINANT_EXPENSE_RATIO } from './analysis.constants.js';
import {
  BudgetAlert,
  CategoryTrend,
  SpendingRecord,
} from './analysis.types.js';

export function buildSuggestions(
  alerts: BudgetAlert[],
  trends: CategoryTrend[],
  records: SpendingRecord[],
): string[] {
  const suggestions = alerts.flatMap(alertSuggestions);

  for (const trend of trends) {
    if (trend.direction === 'rising') {
      suggestions.push(
        `${trend.categoryName} spending is rising. It averages ${money(trend.weeklyAverage)} per week.`,
      );
    }
  }

  for (const [, group] of groupByCategory(records)) {
    const dominant = dominantExpense(group);
    if (dominant) {
      const share = percentOf(dominant.amount, sumAmounts(group));
      suggestions.push(
        `"${dominant.title}" on ${dominant.date} made up ${share}% of ${group[0].categoryName} spending.`,
      );
    }
  }

  if (suggestions.length === 0 && alerts.length > 0) {
    suggestions.push('Spending is within every budget for this month.');
  }
  return suggestions;
}

function alertSuggestions(alert: BudgetAlert): string[] {
  const largest = alert.largestExpenses[0];
  const lines: string[] = [];

  if (alert.status === 'exceeded') {
    lines.push(
      `${alert.name} is ${money(roundMoney(alert.spent - alert.limit))} over its budget of ${money(alert.limit)} (${alert.percentUsed}% used).`,
    );
  } else if (alert.status === 'projected_to_exceed') {
    lines.push(
      `${alert.name} is on pace to reach ${money(alert.projectedTotal)} against a limit of ${money(alert.limit)}. Slow spending or raise the limit.`,
    );
  } else if (alert.status === 'near_limit') {
    lines.push(
      `${alert.name} has used ${alert.percentUsed}% of its ${money(alert.limit)} budget. About ${money(alert.safeDailySpend)} per day is left to spend.`,
    );
  }

  if (alert.status !== 'on_track' && alert.increase > 0 && largest) {
    lines.push(
      `${alert.name} is ${money(alert.increase)} higher than the previous month. The largest expense was "${largest.title}" on ${largest.date} (${money(largest.amount)}).`,
    );
  }
  return lines;
}

function dominantExpense(group: SpendingRecord[]): SpendingRecord | undefined {
  if (group.length < 2) {
    return undefined;
  }
  const largest = group.reduce((a, b) => (b.amount > a.amount ? b : a));
  return largest.amount >= sumAmounts(group) * DOMINANT_EXPENSE_RATIO
    ? largest
    : undefined;
}

function money(amount: number): string {
  return amount.toFixed(2);
}
