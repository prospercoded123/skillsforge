import { QueryFailedError } from 'typeorm';

export const UNIQUE_VIOLATION = '23505';
export const FOREIGN_KEY_VIOLATION = '23503';

// True when a TypeORM query failed with the given Postgres error code.
export function hasPostgresCode(error: unknown, code: string): boolean {
  return (
    error instanceof QueryFailedError &&
    (error.driverError as { code?: string }).code === code
  );
}
