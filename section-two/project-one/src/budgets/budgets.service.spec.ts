import { NotFoundException } from '@nestjs/common';
import { CategoriesService } from '../categories/categories.service.js';
import { ExpensesService } from '../expenses/expenses.service.js';
import { PaymentMethod } from '../expenses/enums/payment-method.enum.js';
import { BudgetsService } from './budgets.service.js';

describe('BudgetsService', () => {
  let expenses: ExpensesService;
  let budgets: BudgetsService;
  let foodId: string;

  const spend = (amount: number, date: string) =>
    expenses.create('user-1', {
      title: 'Item',
      amount,
      categoryId: foodId,
      date,
      paymentMethod: PaymentMethod.CARD,
    });

  beforeEach(() => {
    const categories = new CategoriesService({} as ExpensesService);
    expenses = new ExpensesService(categories);
    foodId = categories.create('user-1', { name: 'Food' }).id;
    budgets = new BudgetsService(expenses);
  });

  it('reports spending only for the requested month', () => {
    budgets.set('user-1', '2026-10', 100);
    spend(60, '2026-10-01');
    spend(50, '2026-10-31');
    spend(999, '2026-11-01');
    spend(999, '2026-09-30');

    const status = budgets.status('user-1', '2026-10');

    expect(status).toEqual({
      month: '2026-10',
      limit: 100,
      spent: 110,
      remaining: -10,
      exceeded: true,
    });
  });

  it('is not exceeded while spending stays within the limit', () => {
    budgets.set('user-1', '2026-10', 100);
    spend(40, '2026-10-15');

    const status = budgets.status('user-1', '2026-10');

    expect(status.exceeded).toBe(false);
    expect(status.remaining).toBe(60);
  });

  it('updates an existing budget instead of adding another', () => {
    budgets.set('user-1', '2026-10', 100);
    budgets.set('user-1', '2026-10', 250);

    expect(budgets.status('user-1', '2026-10').limit).toBe(250);
  });

  it('throws when no budget is set for the month', () => {
    expect(() => budgets.status('user-1', '2026-10')).toThrow(NotFoundException);
  });

  it('keeps budgets private to each user', () => {
    budgets.set('user-1', '2026-10', 100);

    expect(() => budgets.status('user-2', '2026-10')).toThrow(NotFoundException);
  });
});
