import { CategoriesService } from '../categories/categories.service.js';
import { ExpenseQueryDto } from '../expenses/dto/expense-query.dto.js';
import { PaymentMethod } from '../expenses/enums/payment-method.enum.js';
import { ExpensesService } from '../expenses/expenses.service.js';
import { ReportsService } from './reports.service.js';

describe('ReportsService', () => {
  let reports: ReportsService;
  let foodId: string;

  beforeEach(() => {
    const categories = new CategoriesService();
    const expenses = new ExpensesService(categories);
    foodId = categories.create('user-1', { name: 'Food' }).id;
    expenses.create('user-1', {
      title: 'Lunch, with "friends"',
      amount: 12.5,
      categoryId: foodId,
      date: '2026-10-01',
      paymentMethod: PaymentMethod.CARD,
    });
    reports = new ReportsService(expenses, categories);
  });

  it('writes a CSV with a header and escaped cells', () => {
    const csv = reports.toCsv('user-1', new ExpenseQueryDto());
    const [header, row] = csv.split('\n');

    expect(header).toBe('id,title,amount,category,date,payment_method');
    expect(row).toContain('"Lunch, with ""friends"""');
    expect(row).toMatch(/"12.5","Food","2026-10-01","card"$/);
  });

  it('builds a JSON report with the summary and expense rows', () => {
    const report = reports.toJson('user-1', new ExpenseQueryDto());

    expect(report.summary.total).toBe(12.5);
    expect(report.expenses).toHaveLength(1);
    expect(report.expenses[0]).toMatchObject({
      title: 'Lunch, with "friends"',
      category: 'Food',
      date: '2026-10-01',
    });
    expect(report.generatedAt).toBeDefined();
  });
});
