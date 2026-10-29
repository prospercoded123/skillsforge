import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { CategoriesService } from '../categories/categories.service.js';
import { CreateExpenseDto } from './dto/create-expense.dto.js';
import { UpdateExpenseDto } from './dto/update-expense.dto.js';
import { Expense } from './entities/expense.entity.js';

@Injectable()
export class ExpensesService {
  private readonly expenses = new Map<string, Expense>();

  constructor(private readonly categoriesService: CategoriesService) {}

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

  findAll(userId: string): Expense[] {
    return [...this.expenses.values()].filter((e) => e.userId === userId);
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

  remove(userId: string, id: string): void {
    this.findOne(userId, id);
    this.expenses.delete(id);
  }
}
