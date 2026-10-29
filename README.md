# SkillsForge Backend Assignment

Submission for the SkillsForge backend internship. The brief is in `DocInstruction.pdf`.

## Where things are

| Path | What it is |
| --- | --- |
| `section-one/` | Section one: two-sum in unsorted and descending arrays (TypeScript, no dependencies) |
| `section-two/project-one/` | Section two, project one: Expense Tracker API (NestJS + Postgres) |

## Section one

```bash
cd section-one
npm test
```

- `two-sum-unsorted.ts`: hash map, O(N) time and space.
- `two-sum-descending.ts`: two pointers, O(N) time and O(1) extra space.
- `two-sum.test.ts`: the asserts from the brief.

## Section two: Expense Tracker API

See [`section-two/project-one/README.md`](section-two/project-one/README.md) for setup, endpoints and how the code is organised.

Quick start:

```bash
cd section-two/project-one
docker compose up -d      # local Postgres, optional
cp .env.example .env
npm install
npm run start:dev         # Swagger UI at http://localhost:3000/api
```

## Repository conventions

- Commit messages are short and describe the change.
- Each section is a separate project, so it has its own `package.json`.
