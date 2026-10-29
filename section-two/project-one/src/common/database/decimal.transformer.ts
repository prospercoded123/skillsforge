import type { ValueTransformer } from 'typeorm';

// Postgres returns numeric columns as strings. Expose them as numbers.
export const decimalTransformer: ValueTransformer = {
  to: (value: number) => value,
  from: (value: string) => Number(value),
};
