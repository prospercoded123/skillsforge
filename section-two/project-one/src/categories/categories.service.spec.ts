import { ConflictException, NotFoundException } from '@nestjs/common';
import { CategoriesService } from './categories.service.js';

describe('CategoriesService', () => {
  let service: CategoriesService;

  beforeEach(() => {
    service = new CategoriesService();
  });

  it('rejects a duplicate name for the same user', () => {
    service.create('user-1', { name: 'Food' });

    expect(() => service.create('user-1', { name: 'Food' })).toThrow(
      ConflictException,
    );
  });

  it('allows the same name for a different user', () => {
    service.create('user-1', { name: 'Food' });

    expect(() => service.create('user-2', { name: 'Food' })).not.toThrow();
  });

  it('hides categories that belong to another user', () => {
    const category = service.create('user-1', { name: 'Food' });

    expect(() => service.findOne('user-2', category.id)).toThrow(
      NotFoundException,
    );
    expect(service.findAll('user-2')).toEqual([]);
  });

  it('renames a category', () => {
    const category = service.create('user-1', { name: 'Food' });

    service.update('user-1', category.id, { name: 'Groceries' });

    expect(service.findOne('user-1', category.id).name).toBe('Groceries');
  });

  it('refuses to delete a category while expenses use it', () => {
    const category = service.create('user-1', { name: 'Food' });
    service.adjustUsage(category.id, 1);

    expect(() => service.remove('user-1', category.id)).toThrow(
      ConflictException,
    );

    service.adjustUsage(category.id, -1);
    service.remove('user-1', category.id);
    expect(service.findAll('user-1')).toEqual([]);
  });
});
