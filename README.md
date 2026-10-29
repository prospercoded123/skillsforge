# SkillsForge Backend Assignment

Submission for the SkillsForge backend internship. The brief is in `DocInstruction.pdf`.

## Where things are

| Path | What it is |
| --- | --- |
| `section-one/` | Two-sum in unsorted and descending arrays (TypeScript, no dependencies) |
| `section-two/project-one/` | Expense Tracker API (NestJS, PostgreSQL, Drizzle ORM) |

## Section one

- `two-sum-unsorted.ts`: exports `twoSumUnsorted(nums, k)`, using a hash map, O(N) time and space.
- `two-sum-descending.ts`: exports `twoSumDescending(nums, k)`, using two pointers, O(N) time and O(1) extra space.

## Section two: Expense Tracker API

See [`section-two/project-one/README.md`](section-two/project-one/README.md) for setup, endpoints, and the code layout.

```bash
cd section-two/project-one
cp .env.example .env
npm install
npm run start:dev         # Swagger UI at http://localhost:3000/api
```
