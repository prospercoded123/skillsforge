export const UNIQUE_VIOLATION = '23505';
export const FOREIGN_KEY_VIOLATION = '23503';

// Drizzle may wrap the driver error, so the code is checked on the error and its cause.
export function hasPostgresCode(error: unknown, code: string): boolean {
  const cause = error instanceof Error ? error.cause : undefined;
  return [error, cause].some(
    (candidate) =>
      typeof candidate === 'object' &&
      candidate !== null &&
      (candidate as { code?: unknown }).code === code,
  );
}
