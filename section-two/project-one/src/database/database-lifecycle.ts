import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { fileURLToPath } from 'node:url';
import type { Pool } from 'pg';
import { DATABASE, POOL } from './database.tokens.js';
import type { Database } from './database.tokens.js';

const MIGRATIONS_FOLDER = fileURLToPath(
  new URL('../../drizzle', import.meta.url),
);

// Applies pending migrations on startup and closes the pool on shutdown.
@Injectable()
export class DatabaseLifecycle implements OnModuleInit, OnModuleDestroy {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(POOL) private readonly pool: Pool,
  ) {}

  onModuleInit(): Promise<void> {
    return migrate(this.db, { migrationsFolder: MIGRATIONS_FOLDER });
  }

  onModuleDestroy(): Promise<void> {
    return this.pool.end();
  }
}
