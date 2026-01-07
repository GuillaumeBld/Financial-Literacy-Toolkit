# Database Initialization Guide

## Overview

This guide explains how to initialize the PostgreSQL database schema for the Financial Literacy Assessment Platform after it's been deployed to Dokploy.

## Prerequisites

- PostgreSQL database is running in Dokploy
- Database credentials are configured
- You have access to the VPS or can connect to the database

## Database Connection Details

**Service Name**: `finlit-postgres-db-g6ifwu` (Docker network)  
**External Access**: Check Dokploy dashboard for exposed port (if any)

**Credentials**:
- **Database**: `financial_literacy`
- **User**: `finlit_user`
- **Password**: `FinLit2025SecurePassword`

## Method 1: Using Node.js Script (Recommended)

This method works from anywhere you can connect to the database.

### Step 1: Set Environment Variables

```bash
export DATABASE_URL="postgresql://finlit_user:FinLit2025SecurePassword@finlit-postgres-db-g6ifwu:5432/financial_literacy"
```

Or create a `.env` file:
```bash
DATABASE_URL=postgresql://finlit_user:FinLit2025SecurePassword@finlit-postgres-db-g6ifwu:5432/financial_literacy
```

### Step 2: Install Dependencies (if needed)

```bash
cd /root/Financial-Literacy-Toolkit
npm install pg
```

### Step 3: Run Migration Script

```bash
node migration/init-database.js
```

This script will:
- ✅ Test database connection
- ✅ Create all tables (users, courses, enrollments, etc.)
- ✅ Set up indexes
- ✅ Configure RLS policies
- ✅ Verify schema creation

## Method 2: Using psql (From VPS)

If you have SSH access to the VPS where Dokploy is running:

### Step 1: Connect to VPS

```bash
ssh root@82.25.112.7
```

### Step 2: Find PostgreSQL Container

```bash
docker ps | grep postgres
```

### Step 3: Execute Migration

**Option A: Using Docker exec**

```bash
# Copy SQL files to container
docker cp migration/supabase-to-postgres.sql <container_id>:/tmp/schema.sql
docker cp migration/migrate-rls-policies.sql <container_id>:/tmp/rls.sql

# Execute migrations
docker exec -i <container_id> psql -U finlit_user -d financial_literacy < /tmp/schema.sql
docker exec -i <container_id> psql -U finlit_user -d financial_literacy < /tmp/rls.sql
```

**Option B: Using shell script**

```bash
# Set environment variables
export POSTGRES_HOST=finlit-postgres-db-g6ifwu
export POSTGRES_PORT=5432
export POSTGRES_DB=financial_literacy
export POSTGRES_USER=finlit_user
export POSTGRES_PASSWORD=FinLit2025SecurePassword

# Run migration script
./migration/run-migration.sh
```

## Method 3: Using Dokploy Database Management

If Dokploy provides a database management interface:

1. Navigate to Dokploy dashboard
2. Go to your project → PostgreSQL database
3. Look for "SQL Console" or "Database Management"
4. Copy and paste the contents of:
   - `migration/supabase-to-postgres.sql`
   - `migration/migrate-rls-policies.sql`

## Method 4: From Application Container (After Deployment)

Once the application is deployed, you can run migrations from within the app container:

```bash
# Find application container
docker ps | grep financial-literacy

# Execute migration script
docker exec -it <app_container_id> node migration/init-database.js
```

## Verification

After running migrations, verify the schema:

```sql
-- Connect to database
psql postgresql://finlit_user:FinLit2025SecurePassword@finlit-postgres-db-g6ifwu:5432/financial_literacy

-- List all tables
\dt

-- Check table structure
\d users
\d courses
\d enrollments
\d instruments
\d items
\d attempts
\d responses
\d scores
\d instructors
```

Expected tables:
- ✅ users
- ✅ courses
- ✅ enrollments
- ✅ instruments
- ✅ items
- ✅ attempts
- ✅ responses
- ✅ scores
- ✅ instructors
- ✅ instructor_courses
- ✅ instructor_sessions

## Troubleshooting

### Connection Refused

**Problem**: Cannot connect to database

**Solutions**:
1. Verify PostgreSQL container is running: `docker ps | grep postgres`
2. Check service name in DATABASE_URL matches actual container name
3. Verify network connectivity (containers must be on same Docker network)
4. Check firewall rules

### Permission Denied

**Problem**: `permission denied for table/users`

**Solutions**:
1. Verify user has correct permissions:
   ```sql
   GRANT ALL PRIVILEGES ON DATABASE financial_literacy TO finlit_user;
   GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO finlit_user;
   ```

### Tables Already Exist

**Problem**: `relation "users" already exists`

**Solutions**:
- This is OK if you're re-running migrations
- The scripts use `CREATE TABLE IF NOT EXISTS` to handle this
- If you need to reset, drop tables first:
  ```sql
  DROP TABLE IF EXISTS instructor_sessions CASCADE;
  DROP TABLE IF EXISTS instructor_courses CASCADE;
  DROP TABLE IF EXISTS instructors CASCADE;
  DROP TABLE IF EXISTS scores CASCADE;
  DROP TABLE IF EXISTS responses CASCADE;
  DROP TABLE IF EXISTS attempts CASCADE;
  DROP TABLE IF EXISTS items CASCADE;
  DROP TABLE IF EXISTS instruments CASCADE;
  DROP TABLE IF EXISTS enrollments CASCADE;
  DROP TABLE IF EXISTS courses CASCADE;
  DROP TABLE IF EXISTS users CASCADE;
  ```

## Next Steps

After database initialization:

1. **Import Existing Data** (if migrating from Supabase):
   ```bash
   node migration/data-import.js
   ```

2. **Verify Data Integrity**:
   ```bash
   node migration/verify-migration.js
   ```

3. **Deploy Application**:
   - Push to GitHub (auto-deploys)
   - Or manually deploy via Dokploy dashboard

4. **Test Application**:
   - Visit: https://financial-literacy.qualiaai.fr
   - Test API: https://financial-literacy.qualiaai.fr/api/test

## Quick Reference

```bash
# One-liner to initialize database (from project root)
DATABASE_URL="postgresql://finlit_user:FinLit2025SecurePassword@finlit-postgres-db-g6ifwu:5432/financial_literacy" node migration/init-database.js
```

