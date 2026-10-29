import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { configureApp } from '../src/app-setup.js';
import { AppModule } from '../src/app.module.js';

describe('Expense tracker (e2e)', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();

    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'ana@example.com', password: 'password123' });
    token = res.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects requests without a token', async () => {
    await request(app.getHttpServer()).get('/expenses').expect(401);
  });

  it('blocks deleting a category that still has expenses', async () => {
    const server = app.getHttpServer();
    const auth = { Authorization: `Bearer ${token}` };

    const category = await request(server)
      .post('/categories')
      .set(auth)
      .send({ name: 'Food' })
      .expect(201);
    await request(server)
      .post('/expenses')
      .set(auth)
      .send({
        title: 'Lunch',
        amount: 12.5,
        categoryId: category.body.id,
        date: '2026-10-01',
        paymentMethod: 'card',
      })
      .expect(201);

    await request(server)
      .delete(`/categories/${category.body.id}`)
      .set(auth)
      .expect(409);
  });
});
