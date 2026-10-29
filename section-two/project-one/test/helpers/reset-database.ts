import type { INestApplication } from '@nestjs/common';
import type { Pool } from 'pg';
import { POOL } from '../../src/database/database.tokens.js';

// Empties every table so each test starts from a clean database.
export async function resetDatabase(app: INestApplication): Promise<void> {
  const pool = app.get<Pool>(POOL);
  await pool.query(
    'TRUNCATE users, refresh_tokens, categories, expenses, monthly_budgets, category_budgets RESTART IDENTITY CASCADE',
  );
}
