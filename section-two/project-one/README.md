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

### Run with Docker

No Node.js or local Postgres needed. One command starts Postgres 17 and the API, with the API connected to the database:

```bash
docker compose up -d --build
```

- API and Swagger UI: http://localhost:3000/api
- Postgres is also exposed on `localhost:5432`.
- `JWT_ACCESS_SECRET` is read from your shell or `.env` and falls back to a development value. Set your own for anything beyond local use.
- Stop with `docker compose down`. Add `-v` to also delete the database volume.

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
