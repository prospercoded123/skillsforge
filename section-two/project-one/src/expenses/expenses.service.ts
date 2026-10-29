import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { CategoriesService } from '../categories/categories.service.js';
import { CreateExpenseDto } from './dto/create-expense.dto.js';
import { ExpenseQueryDto } from './dto/expense-query.dto.js';
import { UpdateExpenseDto } from './dto/update-expense.dto.js';
import { Expense } from './entities/expense.entity.js';
import type { ExpenseSummary } from './expense-summary.js';
import { SortField, SortOrder } from './enums/sort.enum.js';

@Injectable()
export class ExpensesService {
  private readonly expenses = new Map<string, Expense>();

  constructor(
    @Inject(forwardRef(() => CategoriesService))
    private readonly categoriesService: CategoriesService,
  ) {}

  create(userId: string, dto: CreateExpenseDto): Expense {
    // Throws 404 when the category is missing or belongs to another user.
    this.categoriesService.findOne(userId, dto.categoryId);

    const expense: Expense = {
      id: randomUUID(),
      userId,
      title: dto.title,
      amount: dto.amount,
      categoryId: dto.categoryId,
      date: new Date(dto.date),
      paymentMethod: dto.paymentMethod,
      createdAt: new Date(),
    };
    this.expenses.set(expense.id, expense);
    return expense;
  }

  findAll(userId: string, query: ExpenseQueryDto): Expense[] {
    const matching = this.ownedBy(userId).filter((e) => this.matches(e, query));
    return this.sort(matching, query.sortBy, query.order);
  }

  findOne(userId: string, id: string): Expense {
    const expense = this.expenses.get(id);
    if (!expense || expense.userId !== userId) {
      throw new NotFoundException('Expense not found');
    }
    return expense;
  }

  update(userId: string, id: string, dto: UpdateExpenseDto): Expense {
    const expense = this.findOne(userId, id);
    if (dto.categoryId !== undefined) {
      this.categoriesService.findOne(userId, dto.categoryId);
      expense.categoryId = dto.categoryId;
    }
    if (dto.title !== undefined) expense.title = dto.title;
    if (dto.amount !== undefined) expense.amount = dto.amount;
    if (dto.date !== undefined) expense.date = new Date(dto.date);
    if (dto.paymentMethod !== undefined) expense.paymentMethod = dto.paymentMethod;
    return expense;
  }

  summary(userId: string, query: ExpenseQueryDto): ExpenseSummary {
    const matching = this.ownedBy(userId).filter((e) => this.matches(e, query));
    const totals = new Map<string, number>();
    for (const expense of matching) {
      totals.set(expense.categoryId, (totals.get(expense.categoryId) ?? 0) + expense.amount);
    }

    return {
      total: roundMoney(matching.reduce((sum, e) => sum + e.amount, 0)),
      byCategory: [...totals].map(([categoryId, total]) => ({
        categoryId,
        categoryName: this.categoriesService.findOne(userId, categoryId).name,
        total: roundMoney(total),
      })),
    };
  }

  countInCategory(userId: string, categoryId: string): number {
    return this.ownedBy(userId).filter((e) => e.categoryId === categoryId).length;
  }

  remove(userId: string, id: string): void {
    this.findOne(userId, id);
    this.expenses.delete(id);
  }

  private ownedBy(userId: string): Expense[] {
    return [...this.expenses.values()].filter((e) => e.userId === userId);
  }

  private matches(expense: Expense, query: ExpenseQueryDto): boolean {
    if (query.categoryId && expense.categoryId !== query.categoryId) return false;
    if (query.paymentMethod && expense.paymentMethod !== query.paymentMethod) return false;
    if (query.from && expense.date < new Date(query.from)) return false;
    if (query.to && expense.date > new Date(query.to)) return false;
    return true;
  }

  private sort(expenses: Expense[], sortBy: SortField, order: SortOrder): Expense[] {
    const direction = order === SortOrder.ASC ? 1 : -1;
    return [...expenses].sort((a, b) => {
      const diff =
        sortBy === SortField.AMOUNT
          ? a.amount - b.amount
          : a.date.getTime() - b.date.getTime();
      return diff * direction;
    });
  }
}

function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}
