import { addDays, daysBetween, DateRange } from '../common/dates.js';
import { roundMoney } from '../common/money.js';
import { groupByCategory, sumAmounts } from './analysis-math.js';
import { DAYS_PER_WEEK, TREND_CHANGE_RATIO } from './analysis.constants.js';
import {
  CategoryTrend,
  SpendingRecord,
  TrendDirection,
} from './analysis.types.js';

// Compares the first and second half of the period, using spend per day so that
// halves of different lengths stay comparable.
export function buildCategoryTrends(
  records: SpendingRecord[],
  period: DateRange | null,
): CategoryTrend[] {
  if (!period) {
    return [];
  }

  const days = daysBetween(period.from, period.to);
  const firstHalfDays = Math.floor(days / 2);
  const secondHalfStart = addDays(period.from, firstHalfDays);
  const weeks = days / DAYS_PER_WEEK;

  return [...groupByCategory(records)]
    .map(([categoryId, categoryRecords]) => {
      const firstHalf = categoryRecords.filter((r) => r.date < secondHalfStart);
      const secondHalf = categoryRecords.filter(
        (r) => r.date >= secondHalfStart,
      );
      const total = sumAmounts(categoryRecords);

      return {
        categoryId,
        categoryName: categoryRecords[0].categoryName,
        total,
        weeklyAverage: roundMoney(total / weeks),
        direction: trendDirection(
          { spent: sumAmounts(firstHalf), days: firstHalfDays },
          { spent: sumAmounts(secondHalf), days: days - firstHalfDays },
        ),
      };
    })
    .sort((a, b) => b.total - a.total);
}

function trendDirection(
  first: { spent: number; days: number },
  second: { spent: number; days: number },
): TrendDirection {
  if (first.days === 0) {
    return 'stable';
  }
  const firstRate = first.spent / first.days;
  const secondRate = second.spent / second.days;
  if (firstRate === 0) {
    return secondRate > 0 ? 'rising' : 'stable';
  }
  const change = (secondRate - firstRate) / firstRate;
  if (change > TREND_CHANGE_RATIO) return 'rising';
  if (change < -TREND_CHANGE_RATIO) return 'falling';
  return 'stable';
}
