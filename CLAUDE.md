# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**claude-mem tag**: `fin-literacy`

## Build & Development Commands

```bash
# Development
npm run dev                    # Start Next.js dev server (binds 0.0.0.0 for Docker/remote)
npm run build                  # Production build (runs type-check as prebuild)
npm run start                  # Start production server

# Quality checks
npm run check                  # type-check + lint (same as pre-commit hook)
npm run type-check             # tsc --noEmit
npm run lint                   # next lint

# Tests (SDM adaptive algorithm)
npm run test:sdm               # Run both SDM tests
npm run test:sdm:unit          # Algorithm logic only
npm run test:sdm:integration   # Item selection integration
npx tsx scripts/critical-path.test.ts   # End-to-end critical path

# Load testing
node scripts/load-test.js      # General load test
node scripts/load-test-sdm.js  # SDM-specific load test
```

Package manager is **pnpm 8.15.8** (workspaces monorepo). Root scripts proxy into `apps/web` via `pnpm --filter web`.

Pre-commit hook runs `type-check + lint`. Pre-push hook runs full `build`.

## Architecture

### Monorepo Layout

- `apps/web/` — Single Next.js 14 app (App Router, standalone output mode)
- `infra/` — SQL migrations (`migration-*.sql`), PgBouncer config, complete schema
- `scripts/` — Test suites, import tools, load tests
- `_project/source_of_truth/` — Question bank CSV, SDM-10 implementation guide
- `docs/` — Deployment, architecture, research, troubleshooting docs

### Database (Raw SQL, No ORM)

PostgreSQL 15 accessed via `pg` pool through PgBouncer. No ORM — all queries are raw SQL.

Key helpers in `apps/web/src/lib/db.ts`:
- `query<T>(sql, params)` / `queryOne<T>()` / `queryMany<T>()` — typed query wrappers
- `transaction(callback)` — ACID transaction wrapper
- Statement timeout set to 30s per connection via `pool.on('connect')`

Schema types are defined inline in `db.ts`. Migrations are plain SQL files in `infra/`.

### Running Database Migrations

**IMPORTANT**: The app connects via PgBouncer to the Dokploy-managed database, NOT the standalone `financial_literacy_postgres` container.

```bash
# CORRECT - Run migrations via PgBouncer (production database)
docker run --rm --network host postgres:15-alpine psql \
  "postgresql://finlit_user:FinLit2025SecurePassword@localhost:6432/financial_literacy" \
  -f /path/to/migration.sql

# Or for inline SQL:
docker run --rm --network host postgres:15-alpine psql \
  "postgresql://finlit_user:FinLit2025SecurePassword@localhost:6432/financial_literacy" \
  -c "YOUR SQL HERE"

# WRONG - Do NOT use this (standalone container, not used by app)
docker exec financial_literacy_postgres psql ...
```

**Verify you're on the right database**:
```bash
docker run --rm --network host postgres:15-alpine psql \
  "postgresql://finlit_user:FinLit2025SecurePassword@localhost:6432/financial_literacy" \
  -c "SELECT current_database(), inet_server_addr();"
```

### Authentication (FERPA-Compliant)

`apps/web/src/lib/auth.ts` — `AuthUtils` class:
- **Students**: No passwords. Course code + student ID → `SHA256(course_pepper + normalized_id)` → one-way hashed key stored in DB. No raw student IDs persisted anywhere.
- **Instructors**: PBKDF2-SHA512 password hashing with salt. Token-based sessions via `instructor_sessions` table.
- Per-course pepper isolates student hashes across courses.

### API Routes

All under `apps/web/src/app/api/`:
- `student/login` — Course code + student ID authentication
- `assessment/submit|save|resume` — Assessment lifecycle
- `onboarding/submit` — Baseline demographic data
- `instructor/login|dashboard|analytics|questions` — Instructor operations
- `plan-b/status` — SDM-10 adaptive testing selection
- `items` — Question bank retrieval
- `healthz` (liveness, no DB) / `readyz` (full dependency check)

### Caching (L1 + L2)

`apps/web/src/lib/cache.ts`:
- **L1**: In-memory LRU (per-process, TTL-based)
- **L2**: Redis via ioredis (shared across replicas)
- Graceful fallback if Redis unavailable

### Assessment Flow

1. Student enters course code + student ID → hashed lookup
2. Onboarding (demographics/socioeconomic baseline)
3. 40 randomized anchor questions (26 scored knowledge + 14 unscored preference)
4. Optional: SDM-10 adaptive follow-up (10 items selected based on anchor response signal)
5. Score calculation per domain → results display

Three scoring domains: Borrowing & Credit, Risk Management, Investment & Risk.

## Deployment

- **Production URL**: `financial-literacy.qualiaai.fr`
- **Pipeline**: Push to `main` → GitHub Actions CI (type-check, lint, build) → Dokploy webhook → Docker multi-stage build → 2 rolling replicas
- **Infrastructure**: Traefik (SSL/proxy) → Next.js standalone (port 3000) → PgBouncer (600 client / 100 server connections) → PostgreSQL 15
- **Redis**: Optional L2 cache layer
- **Dockerfile**: Multi-stage Node 20-alpine, non-root user `nextjs:1001`
- **Resource allocation**: 2 replicas × 2GB RAM × 0.8 CPU (targeting 500 concurrent users)

## Key Conventions

- Path alias: `@/*` → `./src/*`
- Styling: Tailwind CSS with Loyola University branding — maroon `#8B0015`, gold `#F1BE48`
- All student-facing data uses hashed identifiers (never raw PII)
- JSONB columns for flexible metadata (question options, domain scores, AI flags)
- Rate limiting on auth endpoints (`apps/web/src/lib/rate-limiter.ts`)
