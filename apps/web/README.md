# Web application MVP

This package contains the Sprint 0 web experience for the Financial Literacy Assessment Toolkit.

## Scripts

```bash
pnpm install           # install dependencies from the repo root
pnpm --filter web dev  # start Next.js in development mode
pnpm --filter web build
pnpm --filter web start
```

## Tech notes

- Next.js 14 app router with TypeScript and Tailwind CSS.
- Loyola and Quinlan brand tokens mapped to Tailwind theme extensions.
- Content structured as an MVP overview page highlighting scope, workflow, and next steps.

Environment variables live in `apps/web/.env.example` (add as needed for future sprints).
