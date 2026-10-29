# Expense Tracker API

NestJS API backed by PostgreSQL (Drizzle ORM). Users track expenses by category, set monthly budgets, and get spending analysis and PDF/CSV/JSON reports.

Interactive endpoint docs: **http://localhost:3000/api** (Swagger UI). Import `http://localhost:3000/api-json` into Postman.

## Run it

Requires Node.js 24 and PostgreSQL 17. `docker-compose.yml` starts Postgres locally if you don't have one.

```bash
npm install
cp .env.example .env       # set JWT_ACCESS_SECRET; point DATABASE_URL at your database
npm run start:dev
```

Migrations in `drizzle/` run automatically at startup.

## Test it

```bash
npm test            # unit tests: analysis rules and date helpers
npm run test:e2e    # HTTP tests; need an empty database
npm run lint
```

The e2e suite wipes its database before each test. It uses `TEST_DATABASE_URL`, which defaults to `postgres://postgres:postgres@localhost:5432/expense_tracker_test`. Create that database before running it, and never point it at real data.

## How a request flows

```
HTTP request
  -> JwtAuthGuard (global; @Public() skips it)
  -> ValidationPipe (DTOs in dto/ are checked; unknown fields are rejected)
  -> controller   (routes and HTTP status only)
  -> service      (rules and queries; talks to Postgres via Drizzle)
  -> database     (src/database/schema.ts defines every table)
```

Every query filters by the logged-in user's id, so users only see their own data. Another user's record returns `404`.

## Folder map

| Folder | Responsibility |
| --- | --- |
| `src/main.ts`, `src/app-setup.ts` | Start the app; set up validation and Swagger (shared with tests) |
| `src/app.module.ts` | Imports every feature module |
| `src/auth/` | Register, login, refresh, logout; JWT strategy and global guard |
| `src/users/` | User lookup and creation |
| `src/categories/` | Category CRUD. Delete is refused while expenses use the category |
| `src/expenses/` | Expense CRUD, filters, sorting, pagination, and the summary |
| `src/budgets/` | Monthly overall and per-category budgets |
| `src/analysis/` | Pure spending rules: budget flags, trends, suggestions. No database access |
| `src/reports/` | JSON, CSV and PDF exports (`expense-report-pdf.ts` does the PDF layout) |
| `src/database/` | Drizzle connection, lifecycle (migrations, shutdown) and schema |
| `src/common/` | Shared helpers: dates, money, pagination types, Postgres error codes |
| `drizzle/` | Generated SQL migrations. Commit these with schema changes |
| `test/` | End-to-end tests and helpers |

Where to start reading: `src/database/schema.ts`, then `src/expenses/expenses.service.ts`, then `src/analysis/analyze-spending.ts`.

## Key behaviour

- **Auth.** Access tokens are JWTs that expire in 15 minutes. Refresh tokens are random, stored as hashes, and rotate on each use. Reusing a token revokes every session for that user.
- **Categories and expenses.** An expense must use one of the user's own categories. Postgres refuses to delete a category that still has expenses (`ON DELETE RESTRICT`), and the API returns `409`.
- **Filters.** `categoryId`, `paymentMethod`, `from`/`to` (inclusive dates), and `month` (`YYYY-MM`, which overrides `from`/`to`).
- **Analysis.** `GET /expenses/summary?month=YYYY-MM` adds budget flags (`exceeded`, `projected_to_exceed`, `near_limit`, `on_track`), the largest expenses behind each flag, and month-over-month increase. Any `from`/`to` range also gets category trends (rising, falling, stable) and plain-language suggestions. Analysis always uses all expenses in the period, ignoring category and payment filters. Thresholds are in `src/analysis/analysis.constants.ts`.
- **Reports.** `GET /reports/expenses?format=json|csv|pdf`.

## Changing the database

1. Edit `src/database/schema.ts`.
2. Run `npm run db:generate`. This writes a new SQL file into `drizzle/`.
3. Commit the schema change and the generated files together.

`npm run db:migrate` applies migrations by hand. The app also applies them on startup.
