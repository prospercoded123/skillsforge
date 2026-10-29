import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import {
  hasPostgresCode,
  UNIQUE_VIOLATION,
} from '../common/database/postgres-errors.js';
import { DATABASE } from '../database/database.tokens.js';
import type { Database } from '../database/database.tokens.js';
import { users, type User } from '../database/schema.js';

@Injectable()
export class UsersService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async create(email: string, passwordHash: string): Promise<User> {
    try {
      const [user] = await this.db
        .insert(users)
        .values({ email, passwordHash })
        .returning();
      return user;
    } catch (error) {
      if (hasPostgresCode(error, UNIQUE_VIOLATION)) {
        throw new ConflictException('Email is already registered');
      }
      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return user;
  }

  async findById(id: string): Promise<User | undefined> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return user;
  }
}
