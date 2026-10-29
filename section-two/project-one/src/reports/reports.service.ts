import { Injectable } from '@nestjs/common';
import { ExpenseQueryDto } from '../expenses/dto/expense-query.dto.js';
import { Expense } from '../expenses/entities/expense.entity.js';
import { ExpenseSummary } from '../expenses/expense-summary.js';
import { ExpensesService } from '../expenses/expenses.service.js';
import { renderExpenseReportPdf } from './expense-report-pdf.js';

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

const CSV_HEADERS = ['id', 'title', 'amount', 'category', 'date', 'payment_method'];

@Injectable()
export class ReportsService {
  constructor(private readonly expensesService: ExpensesService) {}

  async toJson(userId: string, query: ExpenseQueryDto): Promise<ExpenseReport> {
    const [summary, expenses] = await Promise.all([
      this.expensesService.summary(userId, query),
      this.expensesService.list(userId, query),
    ]);
    return {
      generatedAt: new Date().toISOString(),
      summary,
      expenses: expenses.map(toRow),
    };
  }

  async toCsv(userId: string, query: ExpenseQueryDto): Promise<string> {
    const expenses = await this.expensesService.list(userId, query);
    const lines = expenses.map((expense) => {
      const row = toRow(expense);
      return [row.id, row.title, row.amount, row.category, row.date, row.paymentMethod]
        .map(csvCell)
        .join(',');
    });
    return [CSV_HEADERS.join(','), ...lines].join('\n');
  }

  async toPdf(userId: string, query: ExpenseQueryDto): Promise<Buffer> {
    const report = await this.toJson(userId, query);
    return renderExpenseReportPdf(report, periodLabel(query));
  }
}

function toRow(expense: Expense): ExpenseReportRow {
  return {
    id: expense.id,
    title: expense.title,
    amount: expense.amount,
    category: expense.category.name,
    date: expense.date,
    paymentMethod: expense.paymentMethod,
  };
}

function periodLabel(query: ExpenseQueryDto): string {
  if (query.month) return query.month;
  if (query.from || query.to) return `${query.from ?? 'start'} to ${query.to ?? 'today'}`;
  return 'All dates';
}

// Quotes every cell and doubles inner quotes so commas and quotes in titles stay safe.
function csvCell(value: string | number): string {
  return `"${String(value).replace(/"/g, '""')}"`;
}
