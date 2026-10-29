import type { DateRange } from '../common/dates.js';

export interface SpendingRecord {
  id: string;
  title: string;
  amount: number;
  date: string;
  categoryId: string;
  categoryName: string;
}

export interface CategoryLimit {
  categoryId: string;
  categoryName: string;
  limit: number;
}

export interface MonthBudgetPlan {
  overall: number | null;
  categories: CategoryLimit[];
}

export interface AnalysisInput {
  current: SpendingRecord[];
  previous: SpendingRecord[];
  period: DateRange | null;
  today: string;
  budgets: MonthBudgetPlan | null;
}

export type BudgetStatus =
  'exceeded' | 'projected_to_exceed' | 'near_limit' | 'on_track';

export interface ExpenseHighlight {
  expenseId: string;
  title: string;
  date: string;
  amount: number;
}

export interface BudgetAlert {
  scope: 'overall' | 'category';
  categoryId: string | null;
  name: string;
  limit: number;
  spent: number;
  previousSpent: number;
  increase: number;
  percentUsed: number;
  projectedTotal: number;
  safeDailySpend: number;
  status: BudgetStatus;
  largestExpenses: ExpenseHighlight[];
}

export type TrendDirection = 'rising' | 'falling' | 'stable';

export interface CategoryTrend {
  categoryId: string;
  categoryName: string;
  total: number;
  weeklyAverage: number;
  direction: TrendDirection;
}

export interface SpendingAnalysis {
  budgetAlerts: BudgetAlert[];
  categoryTrends: CategoryTrend[];
  suggestions: string[];
}
