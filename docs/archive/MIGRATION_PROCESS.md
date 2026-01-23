# Database Migration Process Guide

## Overview

This project supports **dual database architecture**:
- **Supabase** (Cloud PostgreSQL with REST API) - Currently in production
- **PostgreSQL** (Direct PostgreSQL connection) - Available for local/self-hosted deployment

The application can use either database depending on environment variables.

---

## Current State Analysis

### Database Usage
✅ **All API routes use PostgreSQL** (`@/lib/db`) - Direct connection via `pg` library
- ✅ Production: Currently using **Supabase** (via DATABASE_URL connection string)
- ⚠️ Local: PostgreSQL container exists but is **empty** (no tables)

### Database Connections

**Supabase (Production):**
- Project ID: `fzjirysmzvhsetmcmfqg`
- URL: `https://fzjirysmzvhsetmcmfqg.supabase.co`
- Connection: Via `DATABASE_URL` connection string (PostgreSQL connection)
- Status: ✅ **Has data** (27 users, 3 courses, 6 attempts, etc.)

**Local PostgreSQL (Docker):**
- Container: `financial_literacy_postgres`
- Port: `5435:5432`
- Connection: `postgresql://finlit_user:password@postgres:5432/financial_literacy`
- Status: ⚠️ **Empty** (no tables exist)

---

## Migration Files Structure

### 1. Base Schema Migrations

**Location: `infra/` directory**

| File | Purpose | Order |
|------|---------|-------|
| `schema.sql` | Base schema (tables, indexes, RLS setup) | **1** |
| `rls-policies.sql` | Row Level Security policies | **2** |
| `seed.sql` | Initial seed data (courses, instruments, sample items) | **3** (optional) |
| `seed-instructor.sql` | Instructor account setup | **4** (optional) |

### 2. Feature Migrations

**Location: `infra/migration-*.sql`**

| File | Feature | Order | Dependencies |
|------|---------|-------|--------------|
| `migration-add-student-profiles.sql` | Student demographic data table | **5** | `schema.sql` |
| `migration-add-baseline-covariates.sql` | Baseline survey fields (B1-B8) | **6** | `migration-add-student-profiles.sql` |
| `migration-add-is-active-to-items.sql` | Enable/disable questions | **7** | `schema.sql` (items table) |
| `migration-add-password-reset.sql` | Password reset functionality | **8** | `migration-add-student-profiles.sql` |
| `migration-add-student-password.sql` | Student password storage | **9** | `migration-add-student-profiles.sql` |

### 3. Archive Migrations

**Location: `archive/migration/`**

| File | Purpose |
|------|---------|
| `supabase-to-postgres.sql` | Adapted schema for direct PostgreSQL (similar to `infra/schema.sql`) |
| `migrate-rls-policies.sql` | RLS policies adapted for PostgreSQL |

---

## Migration Execution Order

### For New Database (Fresh Installation)

```bash
# 1. Base Schema
infra/schema.sql

# 2. Security Policies
infra/rls-policies.sql

# 3. Feature Migrations (in order)
infra/migration-add-student-profiles.sql
infra/migration-add-baseline-covariates.sql
infra/migration-add-is-active-to-items.sql
infra/migration-add-password-reset.sql
infra/migration-add-student-password.sql

# 4. Seed Data (optional)
infra/seed.sql
infra/seed-instructor.sql
```

### For Existing Database (Upgrade)

Only run **new feature migrations** that haven't been applied yet:

```sql
-- Check which migrations have been applied
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'student_profiles';

-- If student_profiles doesn't exist, run:
-- migration-add-student-profiles.sql
-- migration-add-baseline-covariates.sql
-- migration-add-password-reset.sql
-- migration-add-student-password.sql

-- If items table exists but no is_active column:
-- migration-add-is-active-to-items.sql
```

---

## Migration Execution Methods

### Method 1: Supabase SQL Editor (Production)

1. Go to: https://supabase.com/dashboard/project/fzjirysmzvhsetmcmfqg/sql/new
2. Copy and paste migration SQL
3. Click "Run"
4. Verify execution

**Best for:** Production Supabase database

### Method 2: Direct PostgreSQL Connection (Local Docker)

```bash
# Using docker exec
docker exec -i financial_literacy_postgres psql -U finlit_user -d financial_literacy < infra/schema.sql

# Or connect interactively
docker exec -it financial_literacy_postgres psql -U finlit_user -d financial_literacy
# Then copy/paste SQL
```

**Best for:** Local development, testing migrations

### Method 3: psql CLI (Remote PostgreSQL)

```bash
# From host machine
psql $DATABASE_URL < infra/schema.sql

# Or using connection string
psql "postgresql://user:pass@host:5432/db" < infra/schema.sql
```

**Best for:** Self-hosted PostgreSQL, production deployments

### Method 4: Application-Level Migration Script

```javascript
// Create a migration script (apps/web/scripts/migrate.js)
import { Pool } from 'pg';
import { readFileSync } from 'fs';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate(filePath) {
  const sql = readFileSync(filePath, 'utf8');
  await pool.query(sql);
  console.log(`✅ Migrated: ${filePath}`);
}
```

**Best for:** Automated migrations, CI/CD pipelines

---

## Migration Verification

### Check Applied Migrations

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Expected tables:
-- - users
-- - courses
-- - enrollments
-- - instruments
-- - items
-- - attempts
-- - responses
-- - scores
-- - student_profiles (if migration applied)
-- - password_reset_tokens (if migration applied)

-- Check specific columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'items' 
ORDER BY ordinal_position;

-- Should include: is_active (if migration applied)

-- Check indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'items';
```

### Verify Data Integrity

```sql
-- Check record counts
SELECT 
  (SELECT COUNT(*) FROM users) as users,
  (SELECT COUNT(*) FROM courses) as courses,
  (SELECT COUNT(*) FROM items) as items,
  (SELECT COUNT(*) FROM attempts) as attempts;

-- Check foreign key constraints
SELECT 
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  confrelid::regclass AS referenced_table
FROM pg_constraint
WHERE contype = 'f';
```

---

## Data Migration (Supabase → PostgreSQL)

If you need to migrate **data** from Supabase to local PostgreSQL:

### Step 1: Export from Supabase

```bash
# Using Supabase MCP or REST API
# Or use the export script in archive/migration/data-export.js

node archive/migration/data-export.js
```

### Step 2: Import to PostgreSQL

```bash
# Using psql COPY or INSERT statements
psql $DATABASE_URL < exported-data.sql

# Or use the import script
node archive/migration/data-import.js
```

### Step 3: Verify Data

```sql
-- Compare record counts
-- Check sample records
-- Verify foreign key relationships
```

---

## Current Migration Status

### Supabase (Production)
✅ Base schema: **Applied** (has all core tables)
✅ Data: **Present** (27 users, 3 courses, etc.)
❓ Feature migrations: **Status unknown** - Need to verify:
- [ ] `student_profiles` table exists?
- [ ] `items.is_active` column exists?
- [ ] `password_reset_tokens` table exists?

### Local PostgreSQL (Docker)
❌ Base schema: **Not applied** (empty database)
❌ Data: **No data**
❌ Feature migrations: **Not applied**

---

## Recommended Next Steps

### Option A: Verify Supabase Migrations

```bash
# Test Supabase connection and check schema
node apps/web/test-supabase-connection.js

# Check if feature tables/columns exist
curl -X POST https://fzjirysmzvhsetmcmfqg.supabase.co/rest/v1/rpc/exec_sql \
  -H "apikey: YOUR_SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT column_name FROM information_schema.columns WHERE table_name = '\''items'\''"}'
```

### Option B: Apply Migrations to Local PostgreSQL

```bash
# 1. Apply base schema
docker exec -i financial_literacy_postgres psql -U finlit_user -d financial_literacy < infra/schema.sql

# 2. Apply RLS policies
docker exec -i financial_literacy_postgres psql -U finlit_user -d financial_literacy < infra/rls-policies.sql

# 3. Apply feature migrations
docker exec -i financial_literacy_postgres psql -U finlit_user -d financial_literacy < infra/migration-add-student-profiles.sql
docker exec -i financial_literacy_postgres psql -U finlit_user -d financial_literacy < infra/migration-add-baseline-covariates.sql
docker exec -i financial_literacy_postgres psql -U finlit_user -d financial_literacy < infra/migration-add-is-active-to-items.sql
docker exec -i financial_literacy_postgres psql -U finlit_user -d financial_literacy < infra/migration-add-password-reset.sql
docker exec -i financial_literacy_postgres psql -U finlit_user -d financial_literacy < infra/migration-add-student-password.sql

# 4. Seed data (optional)
docker exec -i financial_literacy_postgres psql -U finlit_user -d financial_literacy < infra/seed.sql
```

### Option C: Create Migration Management Script

Create a unified migration runner that:
1. Tracks applied migrations
2. Runs migrations in order
3. Handles rollbacks
4. Works with both Supabase and PostgreSQL

---

## Migration Best Practices

1. **Always backup before migrations** (especially production)
2. **Test migrations on staging/local first**
3. **Run migrations during low-traffic periods**
4. **Verify each migration before proceeding**
5. **Use transactions** where possible for rollback safety
6. **Document breaking changes** in migration files
7. **Version control** all migration files
8. **Keep migrations small and focused** (one feature per migration)

---

## Troubleshooting

### Common Issues

**Issue: "relation already exists"**
- Solution: Migration already applied. Check if objects exist before creating.

**Issue: "column does not exist"**
- Solution: Dependency migration not run. Run migrations in order.

**Issue: "permission denied"**
- Solution: Use service role key (Supabase) or superuser (PostgreSQL).

**Issue: RLS policies blocking operations**
- Solution: Verify RLS policies match your authentication setup.

---

## Questions?

- Check migration files for inline comments
- Review `infra/` directory for all available migrations
- Test with local PostgreSQL before applying to production
- Verify schema with SQL queries before/after migrations
