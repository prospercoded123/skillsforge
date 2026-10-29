import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoriesService } from '../categories/categories.service.js';
import { CategoryBudget } from './entities/category-budget.entity.js';
import { MonthlyBudget } from './entities/monthly-budget.entity.js';

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
    @InjectRepository(MonthlyBudget)
    private readonly monthlyBudgets: Repository<MonthlyBudget>,
    @InjectRepository(CategoryBudget)
    private readonly categoryBudgets: Repository<CategoryBudget>,
    private readonly categoriesService: CategoriesService,
  ) {}

  async setOverall(
    userId: string,
    month: string,
    limit: number,
  ): Promise<MonthlyBudget> {
    const budget =
      (await this.monthlyBudgets.findOneBy({ userId, month })) ??
      this.monthlyBudgets.create({ userId, month });
    budget.limitAmount = limit;
    return this.monthlyBudgets.save(budget);
  }

  async removeOverall(userId: string, month: string): Promise<void> {
    const result = await this.monthlyBudgets.delete({ userId, month });
    if (!result.affected) {
      throw new NotFoundException('No budget set for this month');
    }
  }

  async setForCategory(
    userId: string,
    categoryId: string,
    month: string,
    limit: number,
  ): Promise<CategoryBudget> {
    // Throws 404 when the category is missing or belongs to another user.
    await this.categoriesService.findOne(userId, categoryId);

    const budget =
      (await this.categoryBudgets.findOneBy({ userId, categoryId, month })) ??
      this.categoryBudgets.create({ userId, categoryId, month });
    budget.limitAmount = limit;
    return this.categoryBudgets.save(budget);
  }

  async removeForCategory(
    userId: string,
    categoryId: string,
    month: string,
  ): Promise<void> {
    const result = await this.categoryBudgets.delete({
      userId,
      categoryId,
      month,
    });
    if (!result.affected) {
      throw new NotFoundException('No budget set for this category and month');
    }
  }

  async findForMonth(userId: string, month: string): Promise<MonthBudgets> {
    const [overall, categories] = await Promise.all([
      this.monthlyBudgets.findOneBy({ userId, month }),
      this.categoryBudgets.find({
        where: { userId, month },
        relations: { category: true },
        order: { category: { name: 'ASC' } },
      }),
    ]);

    return {
      month,
      overall: overall?.limitAmount ?? null,
      categories: categories.map((budget) => ({
        categoryId: budget.categoryId,
        categoryName: budget.category.name,
        limit: budget.limitAmount,
      })),
    };
  }
}
