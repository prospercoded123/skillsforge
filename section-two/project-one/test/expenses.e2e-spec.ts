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

describe('Expenses (e2e)', () => {
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
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates, reads, updates and deletes an expense', async () => {
    const created = await createExpense(app, user, {
      title: 'Lunch',
      categoryId: food.id,
    });

    await request(app.getHttpServer())
      .patch(`/expenses/${created.id}`)
      .set(user.headers)
      .send({ amount: 25.5 })
      .expect(200);
    const fetched = await request(app.getHttpServer())
      .get(`/expenses/${created.id}`)
      .set(user.headers)
      .expect(200);
    expect(fetched.body).toMatchObject({ title: 'Lunch', amount: 25.5 });

    await request(app.getHttpServer())
      .delete(`/expenses/${created.id}`)
      .set(user.headers)
      .expect(204);
    await request(app.getHttpServer())
      .get(`/expenses/${created.id}`)
      .set(user.headers)
      .expect(404);
  });

  it('rejects an expense in a category owned by another user', async () => {
    const other = await registerUser(app, 'ben@example.com');

    await request(app.getHttpServer())
      .post('/expenses')
      .set(other.headers)
      .send({
        title: 'Lunch',
        amount: 10,
        categoryId: food.id,
        date: '2026-10-01',
        paymentMethod: 'cash',
      })
      .expect(404);
  });

  it('hides another user’s expenses', async () => {
    const created = await createExpense(app, user, { categoryId: food.id });
    const other = await registerUser(app, 'ben@example.com');

    await request(app.getHttpServer())
      .get(`/expenses/${created.id}`)
      .set(other.headers)
      .expect(404);
  });

  it('filters by category, payment method and inclusive date range', async () => {
    await createExpense(app, user, {
      title: 'Bus',
      categoryId: transport.id,
      date: '2026-10-01',
    });
    await createExpense(app, user, {
      title: 'Lunch',
      categoryId: food.id,
      paymentMethod: 'cash',
      date: '2026-10-15',
    });
    await createExpense(app, user, {
      title: 'Late',
      categoryId: food.id,
      date: '2026-11-01',
    });

    const byCategory = await request(app.getHttpServer())
      .get(`/expenses?categoryId=${transport.id}`)
      .set(user.headers)
      .expect(200);
    expect(byCategory.body.data.map((e: { title: string }) => e.title)).toEqual(
      ['Bus'],
    );

    const byPayment = await request(app.getHttpServer())
      .get('/expenses?paymentMethod=cash')
      .set(user.headers)
      .expect(200);
    expect(byPayment.body.data.map((e: { title: string }) => e.title)).toEqual([
      'Lunch',
    ]);

    const byDate = await request(app.getHttpServer())
      .get('/expenses?from=2026-10-01&to=2026-10-31')
      .set(user.headers)
      .expect(200);
    expect(byDate.body.total).toBe(2);
  });

  it('sorts by amount and date', async () => {
    await createExpense(app, user, {
      title: 'Mid',
      amount: 20,
      date: '2026-01-02',
      categoryId: food.id,
    });
    await createExpense(app, user, {
      title: 'Small',
      amount: 5,
      date: '2026-01-01',
      categoryId: food.id,
    });
    await createExpense(app, user, {
      title: 'Big',
      amount: 50,
      date: '2026-01-03',
      categoryId: food.id,
    });

    const asc = await request(app.getHttpServer())
      .get('/expenses?sortBy=amount&order=asc')
      .set(user.headers);
    expect(asc.body.data.map((e: { title: string }) => e.title)).toEqual([
      'Small',
      'Mid',
      'Big',
    ]);

    const newest = await request(app.getHttpServer())
      .get('/expenses')
      .set(user.headers);
    expect(newest.body.data[0].title).toBe('Big');
  });

  it('paginates and reports the full total', async () => {
    for (let day = 1; day <= 3; day++) {
      await createExpense(app, user, {
        date: `2026-10-0${day}`,
        categoryId: food.id,
      });
    }

    const res = await request(app.getHttpServer())
      .get('/expenses?page=2&limit=2&order=asc')
      .set(user.headers)
      .expect(200);

    expect(res.body).toMatchObject({ total: 3, page: 2, limit: 2 });
    expect(res.body.data).toHaveLength(1);
  });

  it('totals spending overall and per category', async () => {
    await createExpense(app, user, { amount: 10.1, categoryId: food.id });
    await createExpense(app, user, { amount: 5.2, categoryId: food.id });
    await createExpense(app, user, { amount: 3, categoryId: transport.id });

    const res = await request(app.getHttpServer())
      .get('/expenses/summary')
      .set(user.headers)
      .expect(200);

    expect(res.body.total).toBe(18.3);
    expect(res.body.byCategory).toEqual(
      expect.arrayContaining([
        { categoryId: food.id, categoryName: 'Food', total: 15.3 },
        { categoryId: transport.id, categoryName: 'Transport', total: 3 },
      ]),
    );
  });

  it('blocks deleting a category while expenses use it', async () => {
    const expense = await createExpense(app, user, { categoryId: food.id });

    await request(app.getHttpServer())
      .delete(`/categories/${food.id}`)
      .set(user.headers)
      .expect(409);

    await request(app.getHttpServer())
      .delete(`/expenses/${expense.id}`)
      .set(user.headers)
      .expect(204);
    await request(app.getHttpServer())
      .delete(`/categories/${food.id}`)
      .set(user.headers)
      .expect(204);
  });

  it('rejects an invalid amount and a non-date value', async () => {
    await request(app.getHttpServer())
      .post('/expenses')
      .set(user.headers)
      .send({
        title: 'Bad',
        amount: -5,
        categoryId: food.id,
        date: '2026-10-01',
        paymentMethod: 'card',
      })
      .expect(400);
    await request(app.getHttpServer())
      .post('/expenses')
      .set(user.headers)
      .send({
        title: 'Bad',
        amount: 5,
        categoryId: food.id,
        date: 'not-a-date',
        paymentMethod: 'card',
      })
      .expect(400);
  });
});
