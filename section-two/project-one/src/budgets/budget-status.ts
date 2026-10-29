export interface BudgetStatus {
  month: string;
  limit: number;
  spent: number;
  remaining: number;
  exceeded: boolean;
}
