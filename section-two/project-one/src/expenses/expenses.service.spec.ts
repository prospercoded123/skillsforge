import { NotFoundException } from '@nestjs/common';
import { CategoriesService } from '../categories/categories.service.js';
import { ExpenseListQueryDto } from './dto/expense-list-query.dto.js';
import { ExpenseQueryDto } from './dto/expense-query.dto.js';
import { PaymentMethod } from './enums/payment-method.enum.js';
import { SortField, SortOrder } from './enums/sort.enum.js';
import { ExpensesService } from './expenses.service.js';

describe('ExpensesService', () => {
  let categories: CategoriesService;
  let service: ExpensesService;
  let foodId: string;
  let transportId: string;

  const listQuery = (overrides: Partial<ExpenseListQueryDto> = {}) =>
    Object.assign(new ExpenseListQueryDto(), overrides);

  const titles = (overrides: Partial<ExpenseListQueryDto> = {}) =>
    service.findAll('user-1', listQuery(overrides)).data.map((e) => e.title);

  const add = (
    overrides: Partial<{
      title: string;
      amount: number;
      categoryId: string;
      date: string;
      paymentMethod: PaymentMethod;
    }> = {},
  ) =>
    service.create('user-1', {
      title: 'Item',
      amount: 10,
      categoryId: foodId,
      date: '2026-10-01',
      paymentMethod: PaymentMethod.CARD,
      ...overrides,
    });

  beforeEach(() => {
    categories = new CategoriesService({} as ExpensesService);
    service = new ExpensesService(categories);
    foodId = categories.create('user-1', { name: 'Food' }).id;
    transportId = categories.create('user-1', { name: 'Transport' }).id;
  });

  it('creates an expense in one of the user’s categories', () => {
    const expense = add({ amount: 12.5 });

    expect(service.findOne('user-1', expense.id).amount).toBe(12.5);
  });

  it('rejects a category that belongs to another user', () => {
    expect(() => service.create('user-2', {
      title: 'Lunch',
      amount: 12.5,
      categoryId: foodId,
      date: '2026-10-01',
      paymentMethod: PaymentMethod.CARD,
    })).toThrow(NotFoundException);
  });

  it('hides expenses from other users', () => {
    const expense = add();

    expect(() => service.findOne('user-2', expense.id)).toThrow(NotFoundException);
    expect(service.findAll('user-2', listQuery()).data).toEqual([]);
  });

  it('updates and removes an expense', () => {
    const expense = add();

    service.update('user-1', expense.id, { amount: 20 });
    expect(service.findOne('user-1', expense.id).amount).toBe(20);

    service.remove('user-1', expense.id);
    expect(service.findAll('user-1', listQuery()).data).toEqual([]);
  });

  it('filters by category', () => {
    add({ title: 'Lunch', categoryId: foodId });
    add({ title: 'Bus', categoryId: transportId });

    expect(titles({ categoryId: transportId })).toEqual(['Bus']);
  });

  it('filters by payment method', () => {
    add({ title: 'Lunch', paymentMethod: PaymentMethod.CASH });
    add({ title: 'Dinner', paymentMethod: PaymentMethod.CARD });

    expect(titles({ paymentMethod: PaymentMethod.CASH })).toEqual(['Lunch']);
  });

  it('filters by an inclusive date range', () => {
    add({ title: 'Early', date: '2026-09-30' });
    add({ title: 'Start', date: '2026-10-01' });
    add({ title: 'End', date: '2026-10-31' });
    add({ title: 'Late', date: '2026-11-01' });

    expect(
      titles({ from: '2026-10-01', to: '2026-10-31', sortBy: SortField.DATE, order: SortOrder.ASC }),
    ).toEqual(['Start', 'End']);
  });

  it('sorts by amount in both directions', () => {
    add({ title: 'Mid', amount: 20 });
    add({ title: 'Small', amount: 5 });
    add({ title: 'Big', amount: 50 });

    expect(titles({ sortBy: SortField.AMOUNT, order: SortOrder.ASC })).toEqual(['Small', 'Mid', 'Big']);
    expect(titles({ sortBy: SortField.AMOUNT, order: SortOrder.DESC })).toEqual(['Big', 'Mid', 'Small']);
  });

  it('sorts by date newest first by default', () => {
    add({ title: 'Old', date: '2026-01-01' });
    add({ title: 'New', date: '2026-06-01' });

    expect(titles()).toEqual(['New', 'Old']);
  });

  it('paginates the list and reports the total', () => {
    add({ title: 'A', date: '2026-01-01' });
    add({ title: 'B', date: '2026-02-01' });
    add({ title: 'C', date: '2026-03-01' });

    const page2 = service.findAll(
      'user-1',
      listQuery({ page: 2, limit: 2, sortBy: SortField.DATE, order: SortOrder.ASC }),
    );

    expect(page2.total).toBe(3);
    expect(page2.page).toBe(2);
    expect(page2.data.map((e) => e.title)).toEqual(['C']);
  });

  describe('summary', () => {
    it('totals spending overall and per category', () => {
      add({ amount: 10.1, categoryId: foodId });
      add({ amount: 5.2, categoryId: foodId });
      add({ amount: 3, categoryId: transportId });

      const summary = service.summary('user-1', new ExpenseQueryDto());

      expect(summary.total).toBe(18.3);
      expect(summary.byCategory).toEqual(
        expect.arrayContaining([
          { categoryId: foodId, categoryName: 'Food', total: 15.3 },
          { categoryId: transportId, categoryName: 'Transport', total: 3 },
        ]),
      );
    });
  });
});
