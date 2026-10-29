import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { resetDatabase } from './helpers/reset-database.js';
import {
  createCategory,
  createExpense,
  createTestApp,
  registerUser,
  TestUser,
} from './helpers/test-app.js';

// A past month, so projections do not depend on the day the tests run.
const MONTH = '2026-08';

describe('Spending analysis (e2e)', () => {
  let app: INestApplication;
  let user: TestUser;
  let food: { id: string };
  let transport: { id: string };

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase(app);
    user = await registerUser(app, 'ana@example.com');
    food = await createCategory(app, user, 'Food');
    transport = await createCategory(app, user, 'Transport');
    await createExpense(app, user, {
      amount: 60,
      categoryId: food.id,
      date: '2026-07-10',
    });
    await createExpense(app, user, {
      title: 'Groceries',
      amount: 80,
      categoryId: food.id,
      date: '2026-08-03',
    });
    await createExpense(app, user, {
      title: 'Dinner',
      amount: 40,
      categoryId: food.id,
      date: '2026-08-15',
    });
    await createExpense(app, user, {
      title: 'Bus',
      amount: 30,
      categoryId: transport.id,
      date: '2026-08-10',
    });
    await request(app.getHttpServer())
      .put(`/budgets/${MONTH}`)
      .set(user.headers)
      .send({ limit: 500 })
      .expect(200);
    await request(app.getHttpServer())
      .put(`/budgets/${MONTH}/categories/${food.id}`)
      .set(user.headers)
      .send({ limit: 100 })
      .expect(200);
  });

  afterAll(async () => {
    await app.close();
  });

  it('flags the exceeded category, compares it with last month and names the biggest expense', async () => {
    const res = await request(app.getHttpServer())
      .get(`/expenses/summary?month=${MONTH}`)
      .set(user.headers)
      .expect(200);

    const foodAlert = res.body.analysis.budgetAlerts.find(
      (alert: { categoryId: string }) => alert.categoryId === food.id,
    );
    expect(foodAlert).toMatchObject({
      status: 'exceeded',
      spent: 120,
      previousSpent: 60,
      increase: 60,
      percentUsed: 120,
    });
    expect(foodAlert.largestExpenses[0]).toMatchObject({
      title: 'Groceries',
      date: '2026-08-03',
    });
    expect(res.body.analysis.suggestions).toContain(
      'Food is 20.00 over its budget of 100.00 (120% used).',
    );
  });

  it('reports the overall budget alongside category budgets', async () => {
    const res = await request(app.getHttpServer())
      .get(`/expenses/summary?month=${MONTH}`)
      .set(user.headers)
      .expect(200);

    const overall = res.body.analysis.budgetAlerts.find(
      (alert: { scope: string }) => alert.scope === 'overall',
    );
    expect(overall).toMatchObject({
      spent: 150,
      limit: 500,
      status: 'on_track',
    });
  });

  it('reports trends for a date range but no budget flags without a month', async () => {
    const res = await request(app.getHttpServer())
      .get('/expenses/summary?from=2026-08-01&to=2026-08-31')
      .set(user.headers)
      .expect(200);

    expect(res.body.analysis.budgetAlerts).toEqual([]);
    expect(res.body.analysis.categoryTrends).toHaveLength(2);
  });

  it('returns no trends when no range is given', async () => {
    const res = await request(app.getHttpServer())
      .get('/expenses/summary')
      .set(user.headers)
      .expect(200);

    expect(res.body.analysis.categoryTrends).toEqual([]);
  });

  it('rejects a month that is not YYYY-MM', async () => {
    await request(app.getHttpServer())
      .get('/expenses/summary?month=2026-8')
      .set(user.headers)
      .expect(400);
  });
});
