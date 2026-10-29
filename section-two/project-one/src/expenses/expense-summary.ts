import type { SpendingAnalysis } from '../analysis/analysis.types.js';

export interface CategorySpending {
  categoryId: string;
  categoryName: string;
  total: number;
}

export interface ExpenseSummary {
  total: number;
  byCategory: CategorySpending[];
  analysis: SpendingAnalysis;
}
