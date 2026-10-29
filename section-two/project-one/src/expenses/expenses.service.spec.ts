import { NotFoundException } from '@nestjs/common';
import { CategoriesService } from '../categories/categories.service.js';
import { ExpenseQueryDto } from './dto/expense-query.dto.js';
import { PaymentMethod } from './enums/payment-method.enum.js';
import { SortField, SortOrder } from './enums/sort.enum.js';
import { ExpensesService } from './expenses.service.js';

describe('ExpensesService', () => {
  let categories: CategoriesService;
  let service: ExpensesService;
  let foodId: string;
  let transportId: string;

  const query = (overrides: Partial<ExpenseQueryDto> = {}): ExpenseQueryDto =>
    Object.assign(new ExpenseQueryDto(), overrides);

  const add = (
    overrides: Partial<{
      title: string;
      amount: number;
      categoryId: string;
      date: string;
      paymentMethod: PaymentMethod;
    }>,
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
    const expense = add({});

    expect(() => service.findOne('user-2', expense.id)).toThrow(NotFoundException);
    expect(service.findAll('user-2', query())).toEqual([]);
  });

  it('updates and removes an expense', () => {
    const expense = add({});

    service.update('user-1', expense.id, { amount: 20 });
    expect(service.findOne('user-1', expense.id).amount).toBe(20);

    service.remove('user-1', expense.id);
    expect(service.findAll('user-1', query())).toEqual([]);
  });

  it('filters by category', () => {
    add({ title: 'Lunch', categoryId: foodId });
    add({ title: 'Bus', categoryId: transportId });

    const found = service.findAll('user-1', query({ categoryId: transportId }));

    expect(found.map((e) => e.title)).toEqual(['Bus']);
  });

  it('filters by payment method', () => {
    add({ title: 'Lunch', paymentMethod: PaymentMethod.CASH });
    add({ title: 'Dinner', paymentMethod: PaymentMethod.CARD });

    const found = service.findAll('user-1', query({ paymentMethod: PaymentMethod.CASH }));

    expect(found.map((e) => e.title)).toEqual(['Lunch']);
  });

  it('filters by an inclusive date range', () => {
    add({ title: 'Early', date: '2026-09-30' });
    add({ title: 'Start', date: '2026-10-01' });
    add({ title: 'End', date: '2026-10-31' });
    add({ title: 'Late', date: '2026-11-01' });

    const found = service.findAll(
      'user-1',
      query({ from: '2026-10-01', to: '2026-10-31', sortBy: SortField.DATE, order: SortOrder.ASC }),
    );

    expect(found.map((e) => e.title)).toEqual(['Start', 'End']);
  });

  it('sorts by amount in both directions', () => {
    add({ title: 'Mid', amount: 20 });
    add({ title: 'Small', amount: 5 });
    add({ title: 'Big', amount: 50 });

    const asc = service.findAll('user-1', query({ sortBy: SortField.AMOUNT, order: SortOrder.ASC }));
    const desc = service.findAll('user-1', query({ sortBy: SortField.AMOUNT, order: SortOrder.DESC }));

    expect(asc.map((e) => e.title)).toEqual(['Small', 'Mid', 'Big']);
    expect(desc.map((e) => e.title)).toEqual(['Big', 'Mid', 'Small']);
  });

  it('sorts by date newest first by default', () => {
    add({ title: 'Old', date: '2026-01-01' });
    add({ title: 'New', date: '2026-06-01' });

    const found = service.findAll('user-1', query());

    expect(found.map((e) => e.title)).toEqual(['New', 'Old']);
  });
});
