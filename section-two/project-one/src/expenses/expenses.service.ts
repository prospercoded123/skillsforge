import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { analyzeSpending } from '../analysis/analyze-spending.js';
import { SpendingRecord } from '../analysis/analysis.types.js';
import { BudgetsService } from '../budgets/budgets.service.js';
import { CategoriesService } from '../categories/categories.service.js';
import { DateRange, monthRange, previousMonth, todayString } from '../common/dates.js';
import { roundMoney } from '../common/money.js';
import { PaginatedResult } from '../common/paginated-result.js';
import { CreateExpenseDto } from './dto/create-expense.dto.js';
import { ExpenseListQueryDto } from './dto/expense-list-query.dto.js';
import { ExpenseQueryDto } from './dto/expense-query.dto.js';
import { UpdateExpenseDto } from './dto/update-expense.dto.js';
import { Expense } from './entities/expense.entity.js';
import { SortField, SortOrder } from './enums/sort.enum.js';
import { ExpenseSummary } from './expense-summary.js';

const SORT_COLUMNS: Record<SortField, string> = {
  [SortField.DATE]: 'expense.date',
  [SortField.AMOUNT]: 'expense.amount',
};

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private readonly expenses: Repository<Expense>,
    private readonly categoriesService: CategoriesService,
    private readonly budgetsService: BudgetsService,
  ) {}

  async create(userId: string, dto: CreateExpenseDto): Promise<Expense> {
    // Throws 404 when the category is missing or belongs to another user.
    await this.categoriesService.findOne(userId, dto.categoryId);

    return this.expenses.save(
      this.expenses.create({
        userId,
        title: dto.title,
        amount: dto.amount,
        categoryId: dto.categoryId,
        date: dto.date,
        paymentMethod: dto.paymentMethod,
      }),
    );
  }

  async findAll(userId: string, query: ExpenseListQueryDto): Promise<PaginatedResult<Expense>> {
    const [data, total] = await this.sorted(this.filtered(userId, query), query)
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();
    return { data, total, page: query.page, limit: query.limit };
  }

  // All matching expenses with their category, without pagination.
  list(userId: string, query: ExpenseQueryDto): Promise<Expense[]> {
    const qb = this.filtered(userId, query).innerJoinAndSelect('expense.category', 'category');
    return this.sorted(qb, query).getMany();
  }

  async findOne(userId: string, id: string): Promise<Expense> {
    const expense = await this.expenses.findOneBy({ id, userId });
    if (!expense) {
      throw new NotFoundException('Expense not found');
    }
    return expense;
  }

  async update(userId: string, id: string, dto: UpdateExpenseDto): Promise<Expense> {
    const expense = await this.findOne(userId, id);
    if (dto.categoryId !== undefined) {
      await this.categoriesService.findOne(userId, dto.categoryId);
      expense.categoryId = dto.categoryId;
    }
    if (dto.title !== undefined) expense.title = dto.title;
    if (dto.amount !== undefined) expense.amount = dto.amount;
    if (dto.date !== undefined) expense.date = dto.date;
    if (dto.paymentMethod !== undefined) expense.paymentMethod = dto.paymentMethod;
    return this.expenses.save(expense);
  }

  async remove(userId: string, id: string): Promise<void> {
    const expense = await this.findOne(userId, id);
    await this.expenses.remove(expense);
  }

  async summary(userId: string, query: ExpenseQueryDto): Promise<ExpenseSummary> {
    const rows = await this.filtered(userId, query)
      .innerJoin('expense.category', 'category')
      .select('expense.categoryId', 'categoryId')
      .addSelect('category.name', 'categoryName')
      .addSelect('SUM(expense.amount)', 'total')
      .groupBy('expense.categoryId')
      .addGroupBy('category.name')
      .getRawMany<{ categoryId: string; categoryName: string; total: string }>();

    const byCategory = rows.map((row) => ({
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      total: roundMoney(Number(row.total)),
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
      ? await this.list(userId, rangeQuery(monthRange(previousMonth(query.month))))
      : [];
    const budgets = query.month ? await this.budgetsService.findForMonth(userId, query.month) : null;

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

  private filtered(userId: string, query: ExpenseQueryDto): SelectQueryBuilder<Expense> {
    const qb = this.expenses
      .createQueryBuilder('expense')
      .where('expense.userId = :userId', { userId });

    if (query.categoryId) {
      qb.andWhere('expense.categoryId = :categoryId', { categoryId: query.categoryId });
    }
    if (query.paymentMethod) {
      qb.andWhere('expense.paymentMethod = :paymentMethod', {
        paymentMethod: query.paymentMethod,
      });
    }

    const { from, to } = query.month ? monthRange(query.month) : query;
    if (from) {
      qb.andWhere('expense.date >= :from', { from });
    }
    if (to) {
      qb.andWhere('expense.date <= :to', { to });
    }
    return qb;
  }

  // The id tie-breaker keeps pages stable when two expenses share a date or amount.
  private sorted(qb: SelectQueryBuilder<Expense>, query: ExpenseQueryDto): SelectQueryBuilder<Expense> {
    const direction = query.order === SortOrder.ASC ? 'ASC' : 'DESC';
    return qb.orderBy(SORT_COLUMNS[query.sortBy], direction).addOrderBy('expense.id', 'ASC');
  }
}

function rangeQuery(range: DateRange): ExpenseQueryDto {
  return Object.assign(new ExpenseQueryDto(), range);
}

function toSpendingRecord(expense: Expense): SpendingRecord {
  return {
    id: expense.id,
    title: expense.title,
    amount: expense.amount,
    date: expense.date,
    categoryId: expense.categoryId,
    categoryName: expense.category.name,
  };
}
