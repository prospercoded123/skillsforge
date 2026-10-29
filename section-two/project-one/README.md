# Expense Tracker API

A NestJS API backed by PostgreSQL. Users record expenses, organise them into categories, set monthly budgets (overall and per category), and get a spending analysis that flags overspending, shows trends, and suggests what to watch. Reports can be exported as JSON, CSV, or PDF.

This is Section Two, Project One of the SkillsForge backend assignment.

## Setup

Requires Node.js 24 and PostgreSQL 17. For a local database, `docker compose up -d` starts one on port 5432.

```bash
npm install
cp .env.example .env   # then set real JWT secrets
```

| Variable             | Required | Purpose                                                |
| -------------------- | -------- | ------------------------------------------------------ |
| `DATABASE_URL`       | yes      | Postgres connection string                             |
| `JWT_ACCESS_SECRET`  | yes      | Signs access tokens                                    |
| `PORT`               | no       | HTTP port, default `3000`                              |
| `TEST_DATABASE_URL`  | no       | Database the e2e tests use. Default: `expense_tracker_test` on localhost:5432 |

The e2e tests truncate every table before each test, so they always use `TEST_DATABASE_URL`, never `DATABASE_URL`. Create that database once before running them:

```sql
CREATE DATABASE expense_tracker_test;
```

## Run

```bash
npm run start:dev    # watch mode
npm run start:prod   # after npm run build
```

Pending migrations in `drizzle/` are applied automatically at startup. Swagger UI is at **http://localhost:3000/api**. Click **Authorize** and paste the `accessToken`. To import into Postman, use `http://localhost:3000/api-json`.

## Tests

```bash
npm test            # unit tests for the analysis rules and date helpers
npm run test:e2e    # HTTP tests against Postgres
npm run lint        # oxlint with type-aware rules
npm run format      # Prettier
```

## Authentication

- `POST /auth/register` and `POST /auth/login` return `{ accessToken, refreshToken }`.
- The **access token** is a JWT that expires after 15 minutes. Send it as `Authorization: Bearer <token>`.
- The **refresh token** is random and lasts 30 days. Only its SHA-256 hash is stored.
- `POST /auth/refresh` exchanges a refresh token for a new pair. Each refresh token works once.
- `POST /auth/logout` revokes a refresh token.
- If a token that was already used is presented again, every session for that user is revoked, because the token has probably leaked.

## Endpoints

Everything except `/auth/*` requires a valid access token. Users only see and change their own data; other users' records return `404`.

| Method | Path                                    | Description                                                    |
| ------ | --------------------------------------- | -------------------------------------------------------------- |
| POST   | `/auth/register`                        | Create an account                                              |
| POST   | `/auth/login`                           | Log in                                                         |
| POST   | `/auth/refresh`                         | Rotate the refresh token                                       |
| POST   | `/auth/logout`                          | Revoke a refresh token                                         |
| POST   | `/categories`                           | Create a category (name unique per user)                       |
| GET    | `/categories`                           | List categories                                                |
| GET    | `/categories/:id`                       | Get a category                                                 |
| PATCH  | `/categories/:id`                       | Rename a category                                              |
| DELETE | `/categories/:id`                       | Delete a category. Returns `409` while expenses use it         |
| POST   | `/expenses`                             | Log an expense                                                 |
| GET    | `/expenses`                             | List expenses with filters, sorting and pagination             |
| GET    | `/expenses/summary`                     | Totals, per-category totals and the analysis object            |
| GET    | `/expenses/:id`                         | Get an expense                                                 |
| PATCH  | `/expenses/:id`                         | Update an expense                                              |
| DELETE | `/expenses/:id`                         | Delete an expense                                              |
| GET    | `/budgets/:month`                       | Overall and per-category budgets for a month (`YYYY-MM`)       |
| PUT    | `/budgets/:month`                       | Set the overall budget for a month                             |
| DELETE | `/budgets/:month`                       | Remove the overall budget                                      |
| PUT    | `/budgets/:month/categories/:categoryId`| Set a budget for one category                                  |
| DELETE | `/budgets/:month/categories/:categoryId`| Remove a category budget                                       |
| GET    | `/reports/expenses`                     | Export as JSON (default), `?format=csv`, or `?format=pdf`      |

### Filters

`GET /expenses`, `GET /expenses/summary` and `GET /reports/expenses` accept:

- `categoryId`, `paymentMethod` (`cash`, `card`, `bank_transfer`, `mobile_wallet`)
- `from` and `to`: inclusive dates as `YYYY-MM-DD`
- `month`: a whole calendar month as `YYYY-MM`. It overrides `from` and `to`.
- `sortBy` (`date` or `amount`) and `order` (`asc` or `desc`, default `desc`)

`GET /expenses` also takes `page` (default `1`) and `limit` (default `20`, max `100`) and returns `{ data, total, page, limit }`.

## Spending analysis

`GET /expenses/summary` returns:

```json
{
  "total": 150,
  "byCategory": [{ "categoryId": "…", "categoryName": "Food", "total": 120 }],
  "analysis": {
    "budgetAlerts": [],
    "categoryTrends": [],
    "suggestions": []
  }
}
```

Analysis always covers every expense in the period. Category and payment-method filters do not change it, so a budget is always compared with the full month.

**Budget alerts** are created when `month` is given, for the overall budget and for each category budget that exists. Each alert has:

- `status`: `exceeded` (spent more than the limit), `projected_to_exceed` (the current pace would pass the limit by month end), `near_limit` (at least 80% spent), or `on_track`.
- `spent`, `previousSpent` and `increase`: this month against the previous month.
- `percentUsed`, `projectedTotal` and `safeDailySpend` (what can still be spent per remaining day).
- `largestExpenses`: up to three of the biggest expenses in that scope, with their titles and dates. These show what drove an increase.

**Category trends** are computed for any period with `from` and `to`, or with `month`. The period is split into two halves, and each half's spend per day is compared. A change above +20% is `rising`, below −20% is `falling`, and anything else is `stable`. Each trend also reports `weeklyAverage`.

**Suggestions** are plain sentences built from the same numbers. They cover budget status, a sharp month-over-month increase and its largest expense, rising trends, and any single expense that makes up at least half of its category's spend.

All thresholds are in `src/analysis/analysis.constants.ts`. The analysis rules are pure functions with unit tests, so they produce the same output for the same input.

## Exports

`GET /reports/expenses` takes the same filters as the list endpoint.

- `format=json` (default): `generatedAt`, the full summary including the analysis, and every matching expense.
- `format=csv`: one row per expense, with quoted cells.
- `format=pdf`: a formatted report with the summary, budget table, suggestions, and expense table.

## Program logic

- **Ownership.** Every row stores its owner's id. Queries always filter by it.
- **Categories and expenses.** An expense must use one of the user's own categories. Deleting a category that still has expenses is refused by the database (`ON DELETE RESTRICT`), and the API returns `409`.
- **Money.** Amounts are `numeric(12, 2)` in Postgres and are rounded to cents in responses.
- **Dates.** Expense dates are calendar dates (`date` column), so timezones cannot shift them.
- **Budgets.** Overall and category budgets are stored separately, one row per user and month, with a unique constraint on each.

## Project layout

```
src/
  main.ts            starts the app
  app-setup.ts       validation pipe and Swagger, shared with the e2e tests
  app.module.ts      imports every feature module
  database/          Drizzle schema, connection and migration runner
  auth/              register, login, refresh, logout, JWT strategy, global guard
  users/             user entity and store
  categories/        category CRUD
  expenses/          expense CRUD, filters, sorting, summary
  budgets/           monthly and category budgets
  analysis/          pure analysis rules: budget alerts, trends, suggestions
  reports/           JSON, CSV and PDF exports
  common/            shared dates, money, pagination and Postgres error helpers
test/                e2e tests and helpers
```

Each feature folder follows the same pattern: a controller for HTTP, a service for the rules, and `dto/` for validated input. Services query Postgres through Drizzle ORM. The schema lives in `src/database/schema.ts`.

## Database changes

- Change `src/database/schema.ts`, then run `npm run db:generate` to write a new SQL migration into `drizzle/`.
- Commit the generated files. Migrations run when the app starts, so deploy the new build to apply them.
- Use long random values for both JWT secrets in production.
