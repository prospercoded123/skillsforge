# Expense Tracker API

A NestJS API where each user logs personal expenses, organises them into categories, filters and sorts them, and tracks monthly spending against a budget. Data is kept in memory, so it resets when the server restarts.

This is Section Two, Project One of the SkillsForge backend assignment.

## Setup

Tested with Node.js 24.

```bash
npm install
```

Optional environment variables:

| Variable     | Default               | Purpose                                  |
| ------------ | --------------------- | ---------------------------------------- |
| `PORT`       | `3000`                | HTTP port                                |
| `JWT_SECRET` | `dev-only-secret`     | Signs login tokens. Set it outside dev.  |

## Run

```bash
npm run start:dev    # watch mode
npm run start:prod   # after npm run build
```

API documentation (Swagger UI) is at **http://localhost:3000/api**. Use the **Authorize** button with the token returned by `/auth/login` or `/auth/register`.

To import the API into Postman, open the running app's `http://localhost:3000/api-json` and import it as an OpenAPI file.

## Tests

```bash
npm test            # unit tests (service logic)
npm run test:e2e    # end-to-end tests (HTTP routes through the real app)
npm run lint        # oxlint with type-aware rules
npm run format      # Prettier
```

## Endpoints

All endpoints except `/auth/*` require `Authorization: Bearer <token>`. Every user only sees and changes their own data.

| Method | Path                     | Description                                              |
| ------ | ------------------------ | -------------------------------------------------------- |
| POST   | `/auth/register`         | Create an account, returns `accessToken`                 |
| POST   | `/auth/login`            | Log in, returns `accessToken`                            |
| POST   | `/categories`            | Create a category                                        |
| GET    | `/categories`            | List your categories                                     |
| GET    | `/categories/:id`        | Get one category                                         |
| PATCH  | `/categories/:id`        | Rename a category                                        |
| DELETE | `/categories/:id`        | Delete a category (rejected while expenses still use it) |
| POST   | `/expenses`              | Log an expense                                           |
| GET    | `/expenses`              | List expenses, with filters, sorting and pagination      |
| GET    | `/expenses/summary`      | Total spent, and total per category, for the same filters |
| GET    | `/expenses/:id`          | Get one expense                                          |
| PATCH  | `/expenses/:id`          | Update an expense                                        |
| DELETE | `/expenses/:id`          | Delete an expense                                        |
| PUT    | `/budgets/:month`        | Set the budget for a month (`YYYY-MM`)                   |
| GET    | `/budgets/:month`        | Spent, remaining and `exceeded` flag for that month      |
| DELETE | `/budgets/:month`        | Remove the budget for a month                            |
| GET    | `/reports/expenses`      | Export expenses as JSON (default) or CSV (`?format=csv`) |

### Filters and sorting

`GET /expenses`, `GET /expenses/summary` and `GET /reports/expenses` accept these query parameters:

- `categoryId`: only expenses in this category
- `paymentMethod`: `cash`, `card`, `bank_transfer` or `mobile_wallet`
- `from` and `to`: inclusive date range, as `YYYY-MM-DD`
- `sortBy`: `date` (default) or `amount`
- `order`: `desc` (default) or `asc`

`GET /expenses` also takes `page` (default `1`) and `limit` (default `20`, max `100`). It responds with `{ data, total, page, limit }`, where `total` counts every match, not just the current page.

## Program logic

**Ownership.** Every category, expense and budget stores the id of the user who created it. Requests for another user's records return `404`, so their existence is not revealed. Category names are unique per user.

**Expenses must use your own category.** Creating or moving an expense into a category that belongs to someone else returns `404`.

**Deleting a category.** A category that still has expenses cannot be deleted. The API returns `409 Conflict`. Delete or move those expenses first. This prevents orphaned expenses.

**Summaries.** `total` is the sum of matching expenses. `byCategory` groups the same expenses by category. Totals are rounded to two decimal places.

**Budgets.** A budget applies to one calendar month. `spent` is the sum of that month's expenses, `remaining` is `limit - spent`, and `exceeded` is `true` when `spent` is greater than `limit`. Expenses are not blocked when a budget is exceeded. The flag is informational.

**Authentication.** Passwords are hashed with bcrypt (via `bcryptjs`). Tokens are JWTs that expire after one hour. A global guard requires a valid token on every route, except the two `/auth` routes, which are marked `@Public()`.

**Validation.** Request bodies and queries are validated with `class-validator`. Unknown fields are rejected with `400`.

## Project layout

```
src/
  main.ts              starts the app
  app-setup.ts         validation pipe and Swagger, shared with the e2e tests
  app.module.ts        imports every feature module
  auth/                register, login, JWT strategy, global guard
  users/               user store used by auth
  categories/          category CRUD
  expenses/            expense CRUD, filters, sorting, summary
  budgets/             monthly budgets and the exceeded flag
  reports/             CSV and JSON export
  common/              shared pagination and money helpers
test/                  e2e tests
```

Each feature folder follows the same pattern: a controller for HTTP, a service for the rules, and `dto/` for validated input.
