# Expense Tracker API

NestJS API backed by PostgreSQL through Drizzle ORM. Users record expenses by category, set monthly budgets, and get spending analysis and PDF, CSV or JSON reports.

Endpoint documentation is at **http://localhost:3000/api** (Swagger UI).

## Setup

Requires Node.js 24 and PostgreSQL 17. `docker-compose.yml` starts a local Postgres if you don't have one.

```bash
npm install
cp .env.example .env      # set JWT_ACCESS_SECRET and DATABASE_URL
npm run start:dev
```

Migrations in `drizzle/` are applied automatically at startup.

## Structure

Each feature folder contains a controller (HTTP routes), a service (rules and queries), and `dto/` (validated input).

| Path | Responsibility |
| --- | --- |
| `src/main.ts`, `src/app-setup.ts` | Start the app; validation pipe and Swagger |
| `src/app.module.ts` | Imports the feature modules |
| `src/auth/` | Register, login, refresh, logout; JWT strategy and global guard |
| `src/users/` | User lookup and creation |
| `src/categories/` | Category CRUD |
| `src/expenses/` | Expense CRUD, filters, sorting, pagination, summary |
| `src/budgets/` | Monthly overall and per-category budgets |
| `src/analysis/` | Spending rules: budget flags, trends, suggestions (pure functions) |
| `src/reports/` | JSON, CSV and PDF exports |
| `src/database/` | Drizzle connection, startup migrations, schema |
| `src/common/` | Dates, money, pagination types, Postgres error codes |
| `drizzle/` | Generated SQL migrations |

Start reading at `src/database/schema.ts`, then `src/expenses/expenses.service.ts`, then `src/analysis/analyze-spending.ts`.

## Behaviour

- **Requests.** Every route except `/auth/*` needs `Authorization: Bearer <accessToken>`. Every query filters by the logged-in user, so another user's record returns `404`.
- **Auth.** Access tokens expire after 15 minutes. Refresh tokens are random, stored as hashes, and rotate on each use. Reusing a refresh token revokes all of that user's sessions.
- **Categories.** Names are unique per user. A category that still has expenses cannot be deleted (`409`).
- **Expense filters.** `categoryId`, `paymentMethod`, `from` and `to` (inclusive dates), and `month` (`YYYY-MM`, which overrides `from` and `to`). Sorting by `date` or `amount`. Lists are paginated with `page` and `limit`.
- **Analysis.** `GET /expenses/summary?month=YYYY-MM` adds budget flags (`exceeded`, `projected_to_exceed`, `near_limit`, `on_track`), the largest expenses behind each flag, and the change from the previous month. A `from`/`to` range adds category trends and suggestions. Analysis always uses every expense in the period, ignoring category and payment filters. Thresholds are in `src/analysis/analysis.constants.ts`.
- **Reports.** `GET /reports/expenses?format=json|csv|pdf`.

## Changing the schema

1. Edit `src/database/schema.ts`.
2. Run `npm run db:generate`.
3. Commit the schema change and the new files in `drizzle/` together.
