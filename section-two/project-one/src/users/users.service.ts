import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  hasPostgresCode,
  UNIQUE_VIOLATION,
} from '../common/database/postgres-errors.js';
import { User } from './entities/user.entity.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  async create(email: string, passwordHash: string): Promise<User> {
    try {
      return await this.users.save(this.users.create({ email, passwordHash }));
    } catch (error) {
      if (hasPostgresCode(error, UNIQUE_VIOLATION)) {
        throw new ConflictException('Email is already registered');
      }
      throw error;
    }
  }

  findByEmail(email: string): Promise<User | null> {
    return this.users.findOneBy({ email });
  }
}
