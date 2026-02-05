# Scaling for 500 Concurrent Users

This document describes the infrastructure changes required to support 500 concurrent students taking assessments simultaneously.

## Status

| Component | Status | Notes |
|-----------|--------|-------|
| PgBouncer Container | Deployed | Running on port 6432 |
| Redis Container | Deployed | Running on port 6379 |
| Performance Indexes | Applied | All 6 indexes in place |
| App PgBouncer Connection | **PENDING** | Requires Dokploy env update |
| App Redis Connection | **PENDING** | Requires Dokploy env update |
| Load Test | Pending | Blocked on above |

## Required Dokploy Environment Variable Updates

Update these environment variables in Dokploy for the Financial Literacy app:

### 1. DATABASE_URL (Change from direct PostgreSQL to PgBouncer)

**Current:**
```
postgresql://finlit_user:FinLit2025SecurePassword@finlit-postgres-db-g6ifwu:5432/financial_literacy
```

**New:**
```
postgresql://finlit_user:FinLit2025SecurePassword@finlit-pgbouncer:6432/financial_literacy
```

**Why:** PgBouncer pools database connections, allowing 600 client connections to share 50 PostgreSQL connections. This prevents connection exhaustion under high load.

### 2. REDIS_URL (Add new variable)

**Add:**
```
REDIS_URL=redis://finlit-redis:6379
```

**Why:** Redis provides L2 cache shared across app replicas. Currently only L1 (in-memory) caching is active.

## Steps to Update in Dokploy

1. Log into Dokploy at https://dokploy.qualiaai.fr (or your Dokploy URL)
2. Navigate to the Financial Literacy application
3. Go to **Environment Variables**
4. Update `DATABASE_URL`:
   - Change `finlit-postgres-db-g6ifwu:5432` to `finlit-pgbouncer:6432`
5. Add new variable `REDIS_URL`:
   - Value: `redis://finlit-redis:6379`
6. Click **Save** and **Redeploy**

## Verification After Update

### Test PgBouncer is being used:

```bash
# Check PgBouncer stats (should show active connections)
docker exec finlit-pgbouncer psql -h 127.0.0.1 -p 6432 -U finlit_user -d pgbouncer -c "SHOW POOLS;"
```

### Test Redis is being used:

```bash
# Check Redis connections
docker exec finlit-redis redis-cli INFO clients
```

### Check app logs:

```bash
# Should see "[Cache] Redis URL configured - L2 cache available"
docker logs <app-container-name> 2>&1 | grep -i cache
```

## Architecture After Scaling

```
                    ┌─────────────────────┐
                    │   Load Balancer     │
                    │     (Traefik)       │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
       ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐
       │  App Replica │  │  App Replica │  │  App Replica │
       │      #1      │  │      #2      │  │     ...      │
       └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
              │                │                │
              │    ┌───────────┴───────────┐    │
              │    │                       │    │
              ▼    ▼                       ▼    ▼
       ┌──────────────┐             ┌──────────────┐
       │   PgBouncer   │◄───────────│    Redis     │
       │  (6432)       │             │   (6379)     │
       │  600 clients  │             │  L2 Cache    │
       │  50 server    │             │  256MB       │
       └──────┬────────┘             └──────────────┘
              │
              ▼
       ┌──────────────┐
       │  PostgreSQL   │
       │  (5432)       │
       │  With indexes │
       └──────────────┘
```

## Running the Load Test

After environment variables are updated:

```bash
# Install k6
apt-get update && apt-get install -y gnupg2
curl -s https://dl.k6.io/key.gpg | gpg --dearmor -o /usr/share/keyrings/k6-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | tee /etc/apt/sources.list.d/k6.list
apt-get update && apt-get install -y k6

# Run load test
cd /root/Financial-Literacy-Toolkit
k6 run scripts/load-test.js
```

## Success Criteria

- 95% of requests complete in < 3 seconds
- Error rate < 2%
- 95% of submissions complete in < 5 seconds
- 99% of submissions complete in < 10 seconds
