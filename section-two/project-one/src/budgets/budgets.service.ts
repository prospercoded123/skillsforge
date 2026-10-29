import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, eq } from 'drizzle-orm';
import { DATABASE } from '../database/database.tokens.js';
import type { Database } from '../database/database.tokens.js';
import {
  categories,
  categoryBudgets,
  monthlyBudgets,
} from '../database/schema.js';
import { CategoriesService } from '../categories/categories.service.js';

export interface CategoryLimit {
  categoryId: string;
  categoryName: string;
  limit: number;
}

export interface MonthBudgets {
  month: string;
  overall: number | null;
  categories: CategoryLimit[];
}

@Injectable()
export class BudgetsService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly categoriesService: CategoriesService,
  ) {}

  async setOverall(
    userId: string,
    month: string,
    limit: number,
  ): Promise<void> {
    await this.db
      .insert(monthlyBudgets)
      .values({ userId, month, limitAmount: limit })
      .onConflictDoUpdate({
        target: [monthlyBudgets.userId, monthlyBudgets.month],
        set: { limitAmount: limit },
      });
  }

  async removeOverall(userId: string, month: string): Promise<void> {
    const removed = await this.db
      .delete(monthlyBudgets)
      .where(
        and(eq(monthlyBudgets.userId, userId), eq(monthlyBudgets.month, month)),
      )
      .returning({ id: monthlyBudgets.id });
    if (removed.length === 0) {
      throw new NotFoundException('No budget set for this month');
    }
  }

  async setForCategory(
    userId: string,
    categoryId: string,
    month: string,
    limit: number,
  ): Promise<void> {
    await this.categoriesService.findOne(userId, categoryId);

    await this.db
      .insert(categoryBudgets)
      .values({ userId, categoryId, month, limitAmount: limit })
      .onConflictDoUpdate({
        target: [
          categoryBudgets.userId,
          categoryBudgets.categoryId,
          categoryBudgets.month,
        ],
        set: { limitAmount: limit },
      });
  }

  async removeForCategory(
    userId: string,
    categoryId: string,
    month: string,
  ): Promise<void> {
    const removed = await this.db
      .delete(categoryBudgets)
      .where(
        and(
          eq(categoryBudgets.userId, userId),
          eq(categoryBudgets.categoryId, categoryId),
          eq(categoryBudgets.month, month),
        ),
      )
      .returning({ id: categoryBudgets.id });
    if (removed.length === 0) {
      throw new NotFoundException('No budget set for this category and month');
    }
  }

  async findForMonth(userId: string, month: string): Promise<MonthBudgets> {
    const [overall, categoryRows] = await Promise.all([
      this.db
        .select()
        .from(monthlyBudgets)
        .where(
          and(
            eq(monthlyBudgets.userId, userId),
            eq(monthlyBudgets.month, month),
          ),
        )
        .limit(1),
      this.db
        .select({
          categoryId: categoryBudgets.categoryId,
          categoryName: categories.name,
          limit: categoryBudgets.limitAmount,
        })
        .from(categoryBudgets)
        .innerJoin(categories, eq(categories.id, categoryBudgets.categoryId))
        .where(
          and(
            eq(categoryBudgets.userId, userId),
            eq(categoryBudgets.month, month),
          ),
        )
        .orderBy(asc(categories.name)),
    ]);

    return {
      month,
      overall: overall[0]?.limitAmount ?? null,
      categories: categoryRows,
    };
  }
}
