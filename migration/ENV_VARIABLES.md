# Environment Variables for PostgreSQL Migration

## Required Environment Variables

### PostgreSQL Database Configuration

```bash
# Primary connection string (recommended)
DATABASE_URL=postgresql://finlit_user:password@localhost:5432/financial_literacy

# Alternative: Individual connection parameters
POSTGRES_USER=finlit_user
POSTGRES_PASSWORD=change_me_in_production
POSTGRES_DB=financial_literacy
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
```

### Application Configuration

```bash
NODE_ENV=production
PORT=3000
NEXT_TELEMETRY_DISABLED=1
```

## Removed Environment Variables

The following Supabase-specific environment variables are no longer needed:

- `NEXT_PUBLIC_SUPABASE_URL` (removed)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (removed)
- `SUPABASE_SERVICE_ROLE_KEY` (removed)

## Docker Compose Environment

When using docker-compose.yml, set these in the `.env` file in the project root:

```bash
POSTGRES_USER=finlit_user
POSTGRES_PASSWORD=secure_password_here
POSTGRES_DB=financial_literacy
```

## Dokploy Environment Variables

In Dokploy, configure these environment variables:

1. `DATABASE_URL` - Full PostgreSQL connection string
2. `NODE_ENV=production`
3. `PORT=3000`

## Local Development

For local development, create `apps/web/.env.local`:

```bash
DATABASE_URL=postgresql://finlit_user:password@localhost:5432/financial_literacy
NODE_ENV=development
PORT=3000
```



