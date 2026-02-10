# Development Guide

This document contains setup, deployment, and development instructions for the Financial Literacy Assessment Toolkit.

## Live Instance

**Production**: https://financial-literacy.qualiaai.fr

Test Credentials:
- Course Code: `QUIN 102`
- Student ID: any 6-12 digit number (e.g., `123456789`)

## Quick Update Workflow

Push changes to `main` branch. Dokploy will automatically deploy.

```bash
git add .
git commit -m "Your changes"
git push origin main
```

## Prerequisites

- Node.js 18+
- pnpm 8.15.8
- Docker (for database and production deployment)

## Local Setup

### 1. Clone and Install

```bash
git clone https://github.com/GuillaumeBld/Financial-Literacy-Toolkit.git
cd Financial-Literacy-Toolkit
pnpm install
```

### 2. Environment Variables

```bash
cd apps/web
cp .env.example .env.local
# Edit .env.local with your database credentials
```

### 3. Run Locally

```bash
pnpm run dev
# Open http://localhost:3001
```

## Available Scripts

```bash
# Development
pnpm run dev                    # Start Next.js dev server
pnpm run build                  # Production build (runs type-check as prebuild)
pnpm run start                  # Start production server

# Quality checks
pnpm run check                  # type-check + lint (same as pre-commit hook)
pnpm run type-check             # tsc --noEmit
pnpm run lint                   # next lint

# Tests (SDM adaptive algorithm)
pnpm run test:sdm               # Run both SDM tests
pnpm run test:sdm:unit          # Algorithm logic only
pnpm run test:sdm:integration   # Item selection integration
npx tsx scripts/critical-path.test.ts   # End-to-end critical path
```

## Code Quality Safeguards

- **Pre-commit hooks**: TypeScript and ESLint checks before each commit
- **Pre-push hooks**: Build verification before pushing to GitHub
- **CI/CD pipeline**: Automated checks on every push via GitHub Actions

## Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS (Loyola branding)
- **Database**: PostgreSQL 15 via PgBouncer (raw SQL, no ORM)
- **Hosting**: Self-hosted VPS with Dokploy + Traefik SSL
- **Authentication**: FERPA-compliant hashed student IDs (SHA256 with per-course peppers)
- **Caching**: L1 in-memory LRU + L2 Redis (optional)

## Architecture

```
VPS Server
  Next.js App (Docker, 2 replicas) --> PgBouncer --> PostgreSQL 15
       |
  Traefik (Reverse Proxy, SSL/TLS via Let's Encrypt)
       |
  https://financial-literacy.qualiaai.fr
```

## Deployment

### Production (Dokploy)

Push to `main` triggers GitHub Actions CI, then Dokploy webhook for automatic Docker deployment with rolling replicas.

See [dev-docs/deployment/](dev-docs/deployment/) for detailed deployment guides:
- `DEPLOYMENT_WORKFLOW.md` -- Main CI/CD workflow
- `QUICK_DEPLOY.md` -- Quick deployment guide
- `INFRASTRUCTURE.md` -- System architecture and topology
- `SCALING_500_USERS.md` -- Performance considerations

### Database Migrations

Migrations run via PgBouncer to the Dokploy-managed database:

```bash
docker run --rm --network host postgres:15-alpine psql \
  "$DATABASE_URL" -f /path/to/migration.sql
```

Migration files are in `infra/`.

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Code Standards
- TypeScript strict type checking
- ESLint for code quality
- Tailwind CSS with Loyola University branding (maroon `#8B0015`, gold `#F1BE48`)

## Further Documentation

- [Technical Documentation](technical-documentation.md)
- [API Endpoint Reference](appendices/api-endpoint-reference.md)
- [Database ERD](appendices/database-erd.md)
- [Troubleshooting](dev-docs/troubleshooting/)
