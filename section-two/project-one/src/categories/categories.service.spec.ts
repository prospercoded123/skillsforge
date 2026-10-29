import { ConflictException, NotFoundException } from '@nestjs/common';
import type { ExpensesService } from '../expenses/expenses.service.js';
import { CategoriesService } from './categories.service.js';

describe('CategoriesService', () => {
  let service: CategoriesService;

  beforeEach(() => {
    const noExpenses = { countInCategory: () => 0 } as unknown as ExpensesService;
    service = new CategoriesService(noExpenses);
  });

  it('rejects a duplicate name for the same user', () => {
    service.create('user-1', { name: 'Food' });

    expect(() => service.create('user-1', { name: 'Food' })).toThrow(ConflictException);
  });

  it('allows the same name for a different user', () => {
    service.create('user-1', { name: 'Food' });

    expect(() => service.create('user-2', { name: 'Food' })).not.toThrow();
  });

  it('hides categories that belong to another user', () => {
    const category = service.create('user-1', { name: 'Food' });

    expect(() => service.findOne('user-2', category.id)).toThrow(NotFoundException);
    expect(service.findAll('user-2')).toEqual([]);
  });

  it('renames a category', () => {
    const category = service.create('user-1', { name: 'Food' });

    service.update('user-1', category.id, { name: 'Groceries' });

    expect(service.findOne('user-1', category.id).name).toBe('Groceries');
  });
});
