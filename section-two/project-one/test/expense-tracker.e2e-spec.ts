import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { configureApp } from '../src/app-setup.js';
import { AppModule } from '../src/app.module.js';

describe('Expense tracker (e2e)', () => {
  let app: INestApplication;
  let server: unknown;
  let auth: { Authorization: string };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    server = app.getHttpServer();

    const res = await request(server)
      .post('/auth/register')
      .send({ email: 'ana@example.com', password: 'password123' })
      .expect(201);
    auth = { Authorization: `Bearer ${res.body.accessToken}` };
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects requests without a token', async () => {
    await request(server).get('/expenses').expect(401);
  });

  it('rejects a login with the wrong password', async () => {
    await request(server)
      .post('/auth/login')
      .send({ email: 'ana@example.com', password: 'wrong-password' })
      .expect(401);
  });

  it('validates the request body', async () => {
    await request(server)
      .post('/categories')
      .set(auth)
      .send({ name: '', unknownField: true })
      .expect(400);
  });

  it('creates an expense, lists it, and summarises spending', async () => {
    const category = await request(server)
      .post('/categories')
      .set(auth)
      .send({ name: 'Groceries' })
      .expect(201);

    await request(server)
      .post('/expenses')
      .set(auth)
      .send({
        title: 'Weekly shop',
        amount: 42.5,
        categoryId: category.body.id,
        date: '2026-10-03',
        paymentMethod: 'card',
      })
      .expect(201);

    const list = await request(server).get('/expenses').set(auth).expect(200);
    expect(list.body.total).toBe(1);
    expect(list.body.data[0].title).toBe('Weekly shop');

    // "summary" must not be parsed as an expense id.
    const summary = await request(server)
      .get('/expenses/summary')
      .set(auth)
      .expect(200);
    expect(summary.body.total).toBe(42.5);
    expect(summary.body.byCategory[0]).toMatchObject({
      categoryName: 'Groceries',
      total: 42.5,
    });
  });

  it('reports a budget as exceeded when spending passes the limit', async () => {
    const category = await request(server)
      .post('/categories')
      .set(auth)
      .send({ name: 'Transport' })
      .expect(201);
    await request(server)
      .post('/expenses')
      .set(auth)
      .send({
        title: 'Taxi',
        amount: 80,
        categoryId: category.body.id,
        date: '2026-11-02',
        paymentMethod: 'cash',
      })
      .expect(201);

    await request(server)
      .put('/budgets/2026-11')
      .set(auth)
      .send({ limit: 50 })
      .expect(200);
    const status = await request(server)
      .get('/budgets/2026-11')
      .set(auth)
      .expect(200);

    expect(status.body).toMatchObject({
      spent: 80,
      remaining: -30,
      exceeded: true,
    });
  });

  it('exports expenses as CSV with a download header', async () => {
    const res = await request(server)
      .get('/reports/expenses?format=csv')
      .set(auth)
      .expect(200);

    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.headers['content-disposition']).toContain('attachment');
    expect(res.text.split('\n')[0]).toBe(
      'id,title,amount,category,date,payment_method',
    );
  });
});
