import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { roundMoney } from '../common/money.js';
import { ExpenseQueryDto } from '../expenses/dto/expense-query.dto.js';
import { ExpensesService } from '../expenses/expenses.service.js';
import { Budget } from './entities/budget.entity.js';
import type { BudgetStatus } from './budget-status.js';

@Injectable()
export class BudgetsService {
  private readonly budgets = new Map<string, Budget>();

  constructor(private readonly expensesService: ExpensesService) {}

  set(userId: string, month: string, limit: number): Budget {
    const existing = this.findBudget(userId, month);
    if (existing) {
      existing.limit = limit;
      return existing;
    }

    const budget: Budget = { id: randomUUID(), userId, month, limit };
    this.budgets.set(budget.id, budget);
    return budget;
  }

  remove(userId: string, month: string): void {
    const budget = this.requireBudget(userId, month);
    this.budgets.delete(budget.id);
  }

  status(userId: string, month: string): BudgetStatus {
    const budget = this.requireBudget(userId, month);
    const query = Object.assign(new ExpenseQueryDto(), monthRange(month));
    const { total: spent } = this.expensesService.summary(userId, query);

    return {
      month,
      limit: budget.limit,
      spent,
      remaining: roundMoney(budget.limit - spent),
      exceeded: spent > budget.limit,
    };
  }

  private requireBudget(userId: string, month: string): Budget {
    const budget = this.findBudget(userId, month);
    if (!budget) {
      throw new NotFoundException('No budget set for this month');
    }
    return budget;
  }

  private findBudget(userId: string, month: string): Budget | undefined {
    return [...this.budgets.values()].find(
      (b) => b.userId === userId && b.month === month,
    );
  }
}

// First and last day of a YYYY-MM month, as YYYY-MM-DD strings.
function monthRange(month: string): { from: string; to: string } {
  const [year, monthNumber] = month.split('-').map(Number);
  // Day 0 of the next month is the last day of this one.
  const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  return {
    from: `${month}-01`,
    to: `${month}-${String(lastDay).padStart(2, '0')}`,
  };
}
