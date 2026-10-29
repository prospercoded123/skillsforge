import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { configureApp } from '../../src/app-setup.js';
import { AppModule } from '../../src/app.module.js';

export async function createTestApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication();
  configureApp(app);
  await app.init();
  return app;
}

export interface TestUser {
  email: string;
  headers: { Authorization: string };
}

export async function registerUser(app: INestApplication, email: string): Promise<TestUser> {
  const res = await request(app.getHttpServer())
    .post('/auth/register')
    .send({ email, password: 'password123' })
    .expect(201);
  return { email, headers: { Authorization: `Bearer ${res.body.accessToken}` } };
}

export async function createCategory(app: INestApplication, user: TestUser, name: string) {
  const res = await request(app.getHttpServer())
    .post('/categories')
    .set(user.headers)
    .send({ name })
    .expect(201);
  return res.body as { id: string; name: string };
}

export async function createExpense(
  app: INestApplication,
  user: TestUser,
  overrides: Record<string, unknown>,
) {
  const res = await request(app.getHttpServer())
    .post('/expenses')
    .set(user.headers)
    .send({
      title: 'Expense',
      amount: 10,
      date: '2026-10-01',
      paymentMethod: 'card',
      ...overrides,
    })
    .expect(201);
  return res.body as { id: string };
}
