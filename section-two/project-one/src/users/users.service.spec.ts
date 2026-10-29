import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service.js';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(() => {
    service = new UsersService();
  });

  it('creates a user with an id', () => {
    const user = service.create('ana@example.com', 'hash');

    expect(user.id).toBeDefined();
    expect(service.findById(user.id)).toEqual(user);
  });

  it('rejects a duplicate email', () => {
    service.create('ana@example.com', 'hash');

    expect(() => service.create('ana@example.com', 'other')).toThrow(
      ConflictException,
    );
  });

  it('throws when the user does not exist', () => {
    expect(() => service.findById('missing')).toThrow(NotFoundException);
  });
});
