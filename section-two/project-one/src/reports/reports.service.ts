import { Injectable } from '@nestjs/common';
import { CategoriesService } from '../categories/categories.service.js';
import { ExpenseQueryDto } from '../expenses/dto/expense-query.dto.js';
import { Expense } from '../expenses/entities/expense.entity.js';
import { ExpenseSummary } from '../expenses/expense-summary.js';
import { ExpensesService } from '../expenses/expenses.service.js';

export interface ExpenseReportRow {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  paymentMethod: string;
}

export interface ExpenseReport {
  generatedAt: string;
  summary: ExpenseSummary;
  expenses: ExpenseReportRow[];
}

const CSV_HEADERS = [
  'id',
  'title',
  'amount',
  'category',
  'date',
  'payment_method',
];

@Injectable()
export class ReportsService {
  constructor(
    private readonly expensesService: ExpensesService,
    private readonly categoriesService: CategoriesService,
  ) {}

  toJson(userId: string, query: ExpenseQueryDto): ExpenseReport {
    return {
      generatedAt: new Date().toISOString(),
      summary: this.expensesService.summary(userId, query),
      expenses: this.rows(userId, query),
    };
  }

  toCsv(userId: string, query: ExpenseQueryDto): string {
    const lines = this.rows(userId, query).map((row) =>
      [row.id, row.title, row.amount, row.category, row.date, row.paymentMethod]
        .map(csvCell)
        .join(','),
    );
    return [CSV_HEADERS.join(','), ...lines].join('\n');
  }

  private rows(userId: string, query: ExpenseQueryDto): ExpenseReportRow[] {
    return this.expensesService
      .list(userId, query)
      .map((expense) => this.toRow(userId, expense));
  }

  private toRow(userId: string, expense: Expense): ExpenseReportRow {
    return {
      id: expense.id,
      title: expense.title,
      amount: expense.amount,
      category: this.categoriesService.findOne(userId, expense.categoryId).name,
      date: expense.date.toISOString().slice(0, 10),
      paymentMethod: expense.paymentMethod,
    };
  }
}

// Quotes every cell and doubles inner quotes so commas and quotes in titles stay safe.
function csvCell(value: string | number): string {
  return `"${String(value).replace(/"/g, '""')}"`;
}
