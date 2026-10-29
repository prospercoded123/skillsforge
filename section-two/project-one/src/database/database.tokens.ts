import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type * as schema from './schema.js';

export const POOL = Symbol('POOL');
export const DATABASE = Symbol('DATABASE');

export type Database = NodePgDatabase<typeof schema>;
