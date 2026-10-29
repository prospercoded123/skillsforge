import {
  date,
  index,
  numeric,
  pgEnum,
  pgTable,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { PaymentMethod } from '../expenses/enums/payment-method.enum.js';

export const paymentMethod = pgEnum('payment_method', [
  PaymentMethod.CASH,
  PaymentMethod.CARD,
  PaymentMethod.BANK_TRANSFER,
  PaymentMethod.MOBILE_WALLET,
]);

const money = (name: string) =>
  numeric(name, { precision: 12, scale: 2, mode: 'number' });

const createdAt = () =>
  timestamp('created_at', { withTimezone: true }).notNull().defaultNow();

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  createdAt: createdAt(),
});

export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: varchar('token_hash', { length: 64 }).notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  createdAt: createdAt(),
});

export const categories = pgTable(
  'categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 50 }).notNull(),
    createdAt: createdAt(),
  },
  (table) => [unique().on(table.userId, table.name)],
);

export const expenses = pgTable(
  'expenses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // RESTRICT makes Postgres refuse to delete a category that still has expenses.
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'restrict' }),
    title: varchar('title', { length: 100 }).notNull(),
    amount: money('amount').notNull(),
    // A calendar date (YYYY-MM-DD), so timezones cannot shift it.
    date: date('date', { mode: 'string' }).notNull(),
    paymentMethod: paymentMethod('payment_method').notNull(),
    createdAt: createdAt(),
  },
  (table) => [index().on(table.userId, table.date)],
);

export const monthlyBudgets = pgTable(
  'monthly_budgets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    month: varchar('month', { length: 7 }).notNull(),
    limitAmount: money('limit_amount').notNull(),
  },
  (table) => [unique().on(table.userId, table.month)],
);

export const categoryBudgets = pgTable(
  'category_budgets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
    month: varchar('month', { length: 7 }).notNull(),
    limitAmount: money('limit_amount').notNull(),
  },
  (table) => [unique().on(table.userId, table.categoryId, table.month)],
);

export type User = typeof users.$inferSelect;
export type RefreshToken = typeof refreshTokens.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
export type MonthlyBudget = typeof monthlyBudgets.$inferSelect;
export type CategoryBudget = typeof categoryBudgets.$inferSelect;
