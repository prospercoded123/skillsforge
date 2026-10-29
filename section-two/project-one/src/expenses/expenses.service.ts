import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  lte,
  sql,
  type SQL,
} from 'drizzle-orm';
import { analyzeSpending } from '../analysis/analyze-spending.js';
import { SpendingRecord } from '../analysis/analysis.types.js';
import { BudgetsService } from '../budgets/budgets.service.js';
import { CategoriesService } from '../categories/categories.service.js';
import {
  DateRange,
  monthRange,
  previousMonth,
  todayString,
} from '../common/dates.js';
import { roundMoney } from '../common/money.js';
import { PaginatedResult } from '../common/paginated-result.js';
import { DATABASE } from '../database/database.tokens.js';
import type { Database } from '../database/database.tokens.js';
import { categories, expenses, type Expense } from '../database/schema.js';
import { CreateExpenseDto } from './dto/create-expense.dto.js';
import { ExpenseListQueryDto } from './dto/expense-list-query.dto.js';
import { ExpenseQueryDto } from './dto/expense-query.dto.js';
import { UpdateExpenseDto } from './dto/update-expense.dto.js';
import { SortField, SortOrder } from './enums/sort.enum.js';
import { ExpenseSummary } from './expense-summary.js';

export type ExpenseWithCategory = Expense & { categoryName: string };

@Injectable()
export class ExpensesService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly categoriesService: CategoriesService,
    private readonly budgetsService: BudgetsService,
  ) {}

  async create(userId: string, dto: CreateExpenseDto): Promise<Expense> {
    // Throws 404 when the category is missing or belongs to another user.
    await this.categoriesService.findOne(userId, dto.categoryId);

    const [expense] = await this.db
      .insert(expenses)
      .values({
        userId,
        title: dto.title,
        amount: dto.amount,
        categoryId: dto.categoryId,
        date: dto.date,
        paymentMethod: dto.paymentMethod,
      })
      .returning();
    return expense;
  }

  async findAll(
    userId: string,
    query: ExpenseListQueryDto,
  ): Promise<PaginatedResult<Expense>> {
    const where = and(...this.conditions(userId, query));
    const [data, [{ total }]] = await Promise.all([
      this.db
        .select()
        .from(expenses)
        .where(where)
        .orderBy(...this.ordering(query))
        .limit(query.limit)
        .offset((query.page - 1) * query.limit),
      this.db.select({ total: count() }).from(expenses).where(where),
    ]);
    return { data, total: Number(total), page: query.page, limit: query.limit };
  }

  // All matching expenses with their category name, without pagination.
  list(userId: string, query: ExpenseQueryDto): Promise<ExpenseWithCategory[]> {
    return this.db
      .select({ ...expenseColumns, categoryName: categories.name })
      .from(expenses)
      .innerJoin(categories, eq(categories.id, expenses.categoryId))
      .where(and(...this.conditions(userId, query)))
      .orderBy(...this.ordering(query));
  }

  async findOne(userId: string, id: string): Promise<Expense> {
    const [expense] = await this.db
      .select()
      .from(expenses)
      .where(and(eq(expenses.id, id), eq(expenses.userId, userId)))
      .limit(1);
    if (!expense) {
      throw new NotFoundException('Expense not found');
    }
    return expense;
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateExpenseDto,
  ): Promise<Expense> {
    const current = await this.findOne(userId, id);
    if (dto.categoryId !== undefined) {
      await this.categoriesService.findOne(userId, dto.categoryId);
    }

    const changes: Partial<typeof expenses.$inferInsert> = {};
    if (dto.categoryId !== undefined) changes.categoryId = dto.categoryId;
    if (dto.title !== undefined) changes.title = dto.title;
    if (dto.amount !== undefined) changes.amount = dto.amount;
    if (dto.date !== undefined) changes.date = dto.date;
    if (dto.paymentMethod !== undefined)
      changes.paymentMethod = dto.paymentMethod;
    if (Object.keys(changes).length === 0) {
      return current;
    }

    const [expense] = await this.db
      .update(expenses)
      .set(changes)
      .where(eq(expenses.id, id))
      .returning();
    return expense;
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.findOne(userId, id);
    await this.db.delete(expenses).where(eq(expenses.id, id));
  }

  async summary(
    userId: string,
    query: ExpenseQueryDto,
  ): Promise<ExpenseSummary> {
    const rows = await this.db
      .select({
        categoryId: expenses.categoryId,
        categoryName: categories.name,
        total: sql<number>`coalesce(sum(${expenses.amount}), 0)::float8`,
      })
      .from(expenses)
      .innerJoin(categories, eq(categories.id, expenses.categoryId))
      .where(and(...this.conditions(userId, query)))
      .groupBy(expenses.categoryId, categories.name);

    const byCategory = rows.map((row) => ({
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      total: roundMoney(row.total),
    }));
    return {
      total: roundMoney(byCategory.reduce((sum, row) => sum + row.total, 0)),
      byCategory,
      analysis: await this.analyse(userId, query),
    };
  }

  // Analysis covers every expense in the period, ignoring category and payment filters,
  // so budgets always compare against the full spending for that month.
  private async analyse(userId: string, query: ExpenseQueryDto) {
    const period = this.rangeOf(query);
    const current = period ? await this.list(userId, rangeQuery(period)) : [];
    const previous = query.month
      ? await this.list(
          userId,
          rangeQuery(monthRange(previousMonth(query.month))),
        )
      : [];
    const budgets = query.month
      ? await this.budgetsService.findForMonth(userId, query.month)
      : null;

    return analyzeSpending({
      current: current.map(toSpendingRecord),
      previous: previous.map(toSpendingRecord),
      period,
      today: todayString(),
      budgets,
    });
  }

  private rangeOf(query: ExpenseQueryDto): DateRange | null {
    if (query.month) {
      return monthRange(query.month);
    }
    return query.from && query.to ? { from: query.from, to: query.to } : null;
  }

  private conditions(userId: string, query: ExpenseQueryDto): SQL[] {
    const conditions: SQL[] = [eq(expenses.userId, userId)];
    if (query.categoryId) {
      conditions.push(eq(expenses.categoryId, query.categoryId));
    }
    if (query.paymentMethod) {
      conditions.push(eq(expenses.paymentMethod, query.paymentMethod));
    }
    const { from, to } = query.month ? monthRange(query.month) : query;
    if (from) {
      conditions.push(gte(expenses.date, from));
    }
    if (to) {
      conditions.push(lte(expenses.date, to));
    }
    return conditions;
  }

  // The id tie-breaker keeps pages stable when two expenses share a date or amount.
  private ordering(query: ExpenseQueryDto): SQL[] {
    const column =
      query.sortBy === SortField.AMOUNT ? expenses.amount : expenses.date;
    const direction = query.order === SortOrder.ASC ? asc : desc;
    return [direction(column), asc(expenses.id)];
  }
}

const expenseColumns = {
  id: expenses.id,
  userId: expenses.userId,
  categoryId: expenses.categoryId,
  title: expenses.title,
  amount: expenses.amount,
  date: expenses.date,
  paymentMethod: expenses.paymentMethod,
  createdAt: expenses.createdAt,
};

function rangeQuery(range: DateRange): ExpenseQueryDto {
  return Object.assign(new ExpenseQueryDto(), range);
}

function toSpendingRecord(expense: ExpenseWithCategory): SpendingRecord {
  return {
    id: expense.id,
    title: expense.title,
    amount: expense.amount,
    date: expense.date,
    categoryId: expense.categoryId,
    categoryName: expense.categoryName,
  };
}
