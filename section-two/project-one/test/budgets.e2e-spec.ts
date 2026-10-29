import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { resetDatabase } from './helpers/reset-database.js';
import {
  createCategory,
  createTestApp,
  registerUser,
  TestUser,
} from './helpers/test-app.js';

describe('Budgets (e2e)', () => {
  let app: INestApplication;
  let user: TestUser;
  let food: { id: string };

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase(app);
    user = await registerUser(app, 'ana@example.com');
    food = await createCategory(app, user, 'Food');
  });

  afterAll(async () => {
    await app.close();
  });

  it('sets, updates and removes the overall monthly budget', async () => {
    await request(app.getHttpServer())
      .put('/budgets/2026-10')
      .set(user.headers)
      .send({ limit: 500 })
      .expect(200);
    await request(app.getHttpServer())
      .put('/budgets/2026-10')
      .set(user.headers)
      .send({ limit: 650 })
      .expect(200);

    const res = await request(app.getHttpServer())
      .get('/budgets/2026-10')
      .set(user.headers)
      .expect(200);
    expect(res.body).toEqual({
      month: '2026-10',
      overall: 650,
      categories: [],
    });

    await request(app.getHttpServer())
      .delete('/budgets/2026-10')
      .set(user.headers)
      .expect(204);
    await request(app.getHttpServer())
      .delete('/budgets/2026-10')
      .set(user.headers)
      .expect(404);
  });

  it('sets a budget for a single category', async () => {
    await request(app.getHttpServer())
      .put(`/budgets/2026-10/categories/${food.id}`)
      .set(user.headers)
      .send({ limit: 200 })
      .expect(200);

    const res = await request(app.getHttpServer())
      .get('/budgets/2026-10')
      .set(user.headers)
      .expect(200);
    expect(res.body.categories).toEqual([
      { categoryId: food.id, categoryName: 'Food', limit: 200 },
    ]);
  });

  it('rejects a category budget for a category the user does not own', async () => {
    const other = await registerUser(app, 'ben@example.com');

    await request(app.getHttpServer())
      .put(`/budgets/2026-10/categories/${food.id}`)
      .set(other.headers)
      .send({ limit: 200 })
      .expect(404);
  });

  it('rejects a month that is not YYYY-MM', async () => {
    await request(app.getHttpServer())
      .get('/budgets/2026-13')
      .set(user.headers)
      .expect(400);
  });
});
