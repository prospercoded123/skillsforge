export interface CategorySpending {
  categoryId: string;
  categoryName: string;
  total: number;
}

export interface ExpenseSummary {
  total: number;
  byCategory: CategorySpending[];
}
