import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, eq } from 'drizzle-orm';
import {
  FOREIGN_KEY_VIOLATION,
  hasPostgresCode,
  UNIQUE_VIOLATION,
} from '../common/database/postgres-errors.js';
import { DATABASE } from '../database/database.tokens.js';
import type { Database } from '../database/database.tokens.js';
import { categories, type Category } from '../database/schema.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';

@Injectable()
export class CategoriesService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async create(userId: string, dto: CreateCategoryDto): Promise<Category> {
    try {
      const [category] = await this.db
        .insert(categories)
        .values({ userId, name: dto.name })
        .returning();
      return category;
    } catch (error) {
      throw this.translateNameError(error);
    }
  }

  findAll(userId: string): Promise<Category[]> {
    return this.db
      .select()
      .from(categories)
      .where(eq(categories.userId, userId))
      .orderBy(asc(categories.name));
  }

  async findOne(userId: string, id: string): Promise<Category> {
    const [category] = await this.db
      .select()
      .from(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
      .limit(1);
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateCategoryDto,
  ): Promise<Category> {
    const current = await this.findOne(userId, id);
    if (dto.name === undefined) {
      return current;
    }
    try {
      const [category] = await this.db
        .update(categories)
        .set({ name: dto.name })
        .where(eq(categories.id, id))
        .returning();
      return category;
    } catch (error) {
      throw this.translateNameError(error);
    }
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.findOne(userId, id);
    try {
      await this.db.delete(categories).where(eq(categories.id, id));
    } catch (error) {
      // Expenses reference categories with ON DELETE RESTRICT, so Postgres refuses the delete.
      if (hasPostgresCode(error, FOREIGN_KEY_VIOLATION)) {
        throw new ConflictException('Category still has expenses');
      }
      throw error;
    }
  }

  private translateNameError(error: unknown): unknown {
    if (hasPostgresCode(error, UNIQUE_VIOLATION)) {
      return new ConflictException('Category name already exists');
    }
    return error;
  }
}
