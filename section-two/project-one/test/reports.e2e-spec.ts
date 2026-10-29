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

describe('Reports (e2e)', () => {
  let app: INestApplication;
  let user: TestUser;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase(app);
    user = await registerUser(app, 'ana@example.com');
    const food = await createCategory(app, user, 'Food');
    await createExpense(app, user, {
      title: 'Lunch, with "friends"',
      amount: 12.5,
      categoryId: food.id,
      date: '2026-10-01',
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('exports expenses as JSON by default', async () => {
    const res = await request(app.getHttpServer())
      .get('/reports/expenses')
      .set(user.headers)
      .expect(200);

    expect(res.body.summary.total).toBe(12.5);
    expect(res.body.expenses[0]).toMatchObject({
      title: 'Lunch, with "friends"',
      category: 'Food',
      date: '2026-10-01',
    });
  });

  it('exports expenses as CSV with escaped cells and a download header', async () => {
    const res = await request(app.getHttpServer())
      .get('/reports/expenses?format=csv')
      .set(user.headers)
      .expect(200);

    const [header, row] = res.text.split('\n');
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.headers['content-disposition']).toContain('attachment');
    expect(header).toBe('id,title,amount,category,date,payment_method');
    expect(row).toContain('"Lunch, with ""friends"""');
    expect(row).toMatch(/"12.5","Food","2026-10-01","card"$/);
  });
});
