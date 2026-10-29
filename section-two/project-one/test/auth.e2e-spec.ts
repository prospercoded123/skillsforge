import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { configureApp } from '../src/app-setup.js';
import { AppModule } from '../src/app.module.js';
import { resetDatabase } from './helpers/reset-database.js';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let server: unknown;
  const credentials = { email: 'ana@example.com', password: 'password123' };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    server = app.getHttpServer();
  });

  beforeEach(async () => {
    await resetDatabase(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('registers and returns an access and refresh token', async () => {
    const res = await request(server).post('/auth/register').send(credentials).expect(201);

    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.refreshToken).toEqual(expect.any(String));
  });

  it('rejects a duplicate email', async () => {
    await request(server).post('/auth/register').send(credentials).expect(201);
    await request(server).post('/auth/register').send(credentials).expect(409);
  });

  it('logs in with the right password only', async () => {
    await request(server).post('/auth/register').send(credentials).expect(201);

    await request(server)
      .post('/auth/login')
      .send({ ...credentials, password: 'wrong-password' })
      .expect(401);
    await request(server).post('/auth/login').send(credentials).expect(200);
  });

  it('rotates the refresh token and rejects the old one', async () => {
    const first = await request(server).post('/auth/register').send(credentials).expect(201);

    const refreshed = await request(server)
      .post('/auth/refresh')
      .send({ refreshToken: first.body.refreshToken })
      .expect(200);
    expect(refreshed.body.refreshToken).not.toBe(first.body.refreshToken);

    await request(server)
      .get('/categories')
      .set('Authorization', `Bearer ${refreshed.body.accessToken}`)
      .expect(200);
  });

  it('ends every session when a used refresh token is replayed', async () => {
    const first = await request(server).post('/auth/register').send(credentials).expect(201);
    const second = await request(server).post('/auth/refresh').send({
      refreshToken: first.body.refreshToken,
    });
    expect(second.status).toBe(200);

    await request(server)
      .post('/auth/refresh')
      .send({ refreshToken: first.body.refreshToken })
      .expect(401);
    await request(server)
      .post('/auth/refresh')
      .send({ refreshToken: second.body.refreshToken })
      .expect(401);
  });

  it('revokes the refresh token on logout', async () => {
    const tokens = await request(server).post('/auth/register').send(credentials).expect(201);

    await request(server)
      .post('/auth/logout')
      .send({ refreshToken: tokens.body.refreshToken })
      .expect(204);
    await request(server)
      .post('/auth/refresh')
      .send({ refreshToken: tokens.body.refreshToken })
      .expect(401);
  });

  it('rejects an invalid access token', async () => {
    await request(server).get('/categories').set('Authorization', 'Bearer not-a-token').expect(401);
  });
});
