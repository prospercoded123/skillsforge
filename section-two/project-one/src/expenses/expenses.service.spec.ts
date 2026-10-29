import { NotFoundException } from '@nestjs/common';
import { CategoriesService } from '../categories/categories.service.js';
import { PaymentMethod } from './enums/payment-method.enum.js';
import { ExpensesService } from './expenses.service.js';

describe('ExpensesService', () => {
  let categories: CategoriesService;
  let service: ExpensesService;
  let foodId: string;

  beforeEach(() => {
    categories = new CategoriesService();
    service = new ExpensesService(categories);
    foodId = categories.create('user-1', { name: 'Food' }).id;
  });

  const dto = (categoryId: string) => ({
    title: 'Lunch',
    amount: 12.5,
    categoryId,
    date: '2026-10-01',
    paymentMethod: PaymentMethod.CARD,
  });

  it('creates an expense in one of the user’s categories', () => {
    const expense = service.create('user-1', dto(foodId));

    expect(service.findOne('user-1', expense.id).amount).toBe(12.5);
  });

  it('rejects a category that belongs to another user', () => {
    expect(() => service.create('user-2', dto(foodId))).toThrow(NotFoundException);
  });

  it('hides expenses from other users', () => {
    const expense = service.create('user-1', dto(foodId));

    expect(() => service.findOne('user-2', expense.id)).toThrow(NotFoundException);
    expect(service.findAll('user-2')).toEqual([]);
  });

  it('updates and removes an expense', () => {
    const expense = service.create('user-1', dto(foodId));

    service.update('user-1', expense.id, { amount: 20 });
    expect(service.findOne('user-1', expense.id).amount).toBe(20);

    service.remove('user-1', expense.id);
    expect(service.findAll('user-1')).toEqual([]);
  });
});
