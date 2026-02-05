# Pre-Load Test Checklist

Before running the k6 load test (`scripts/load-test.js`), complete this checklist to ensure safe and meaningful results.

## Pre-Test Checklist

### 1. Database Backup ✅
- [ ] Verify recent backup exists
  ```bash
  # Check Dokploy for latest backup, or run manual backup:
  docker exec finlit-postgres-db-g6ifwu pg_dump -U finlit_user finlit_db > /root/Financial-Literacy-Toolkit/backups/pre-loadtest-$(date +%Y%m%d-%H%M%S).sql
  ```
- [ ] Verify backup is readable
  ```bash
  head -50 /root/Financial-Literacy-Toolkit/backups/pre-loadtest-*.sql
  ```

### 2. Infrastructure Verification ✅
- [ ] PgBouncer is running and healthy
  ```bash
  docker exec finlit-pgbouncer psql -h 127.0.0.1 -p 6432 -U finlit_user -d pgbouncer -c "SHOW POOLS;"
  ```
- [ ] Redis is running and healthy
  ```bash
  docker exec finlit-redis redis-cli PING
  # Should return: PONG
  ```
- [ ] App is responding
  ```bash
  curl -s https://financial-literacy.qualiaai.fr/api/healthz | jq
  curl -s https://financial-literacy.qualiaai.fr/api/readyz | jq
  ```

### 3. Environment Variables ✅
- [ ] Verify DATABASE_URL uses PgBouncer (port 6432, not 5432)
- [ ] Verify REDIS_URL is set
  ```bash
  # In Dokploy, check environment variables include:
  # DATABASE_URL=postgresql://...@finlit-pgbouncer:6432/...
  # REDIS_URL=redis://finlit-redis:6379
  ```

### 4. Monitoring Ready ✅
- [ ] Open Uptime Kuma dashboard
- [ ] Open Docker stats (optional)
  ```bash
  docker stats finlit-pgbouncer finlit-redis finlit-postgres-db-g6ifwu
  ```

### 5. Test Course Setup ✅
- [ ] Create or verify load test course exists
  ```sql
  -- In PostgreSQL:
  INSERT INTO courses (name, pepper, status)
  VALUES ('LOAD-TEST', 'loadtest-pepper-' || gen_random_uuid(), 'active')
  ON CONFLICT (name) DO NOTHING;
  ```

### 6. Cleanup Script Ready ✅
- [ ] Review cleanup script: `scripts/load-test-cleanup.sql`
- [ ] Understand what data will be deleted (loadtest-* prefixed users)

---

## Running the Load Test

### Install k6 (if not installed)
```bash
apt-get update && apt-get install -y gnupg2
curl -s https://dl.k6.io/key.gpg | gpg --dearmor -o /usr/share/keyrings/k6-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | tee /etc/apt/sources.list.d/k6.list
apt-get update && apt-get install -y k6
```

### Run the Test
```bash
cd /root/Financial-Literacy-Toolkit

# Full test (12 minutes, ramps to 500 users)
k6 run scripts/load-test.js

# Or with custom settings:
k6 run --env BASE_URL=https://financial-literacy.qualiaai.fr scripts/load-test.js

# Quick smoke test (fewer users, shorter duration)
k6 run --vus 10 --duration 30s scripts/load-test.js
```

### Monitor During Test
In separate terminals:
```bash
# Terminal 1: PgBouncer stats
watch -n 5 'docker exec finlit-pgbouncer psql -h 127.0.0.1 -p 6432 -U finlit_user -d pgbouncer -c "SHOW POOLS;"'

# Terminal 2: Redis stats
watch -n 5 'docker exec finlit-redis redis-cli INFO clients'

# Terminal 3: Docker resource usage
docker stats finlit-pgbouncer finlit-redis finlit-postgres-db-g6ifwu
```

---

## Post-Test Actions

### 1. Review Results
k6 will output:
- `http_req_duration`: Request latency percentiles
- `http_req_failed`: Error rate
- `submission_time`: Assessment submission timing
- `items_load_time`: Items API timing

### Success Criteria
| Metric | Threshold | Pass? |
|--------|-----------|-------|
| 95% requests | < 3s | |
| Error rate | < 2% | |
| 95% submissions | < 5s | |
| 95% item loads | < 1s | |

### 2. Clean Up Test Data
```bash
# Connect to database and run cleanup
docker exec -i finlit-postgres-db-g6ifwu psql -U finlit_user finlit_db < /root/Financial-Literacy-Toolkit/scripts/load-test-cleanup.sql
```

### 3. Document Results
Add results to `_project/CHANGELOG.md`:
```markdown
## [date] Load Test Results
- Peak concurrent users: X
- p95 latency: Xms
- Error rate: X%
- Bottlenecks identified: [list]
```

---

## Rollback Procedure

If the load test causes issues:

### 1. Stop the Test
Press `Ctrl+C` in the k6 terminal.

### 2. Check Service Health
```bash
curl -s https://financial-literacy.qualiaai.fr/api/readyz | jq
```

### 3. Restart Services (if needed)
```bash
# Restart app via Dokploy UI, or:
docker service update --force <service-name>
```

### 4. Restore Database (worst case)
```bash
# Only if data corruption occurred:
docker exec -i finlit-postgres-db-g6ifwu psql -U finlit_user finlit_db < /root/Financial-Literacy-Toolkit/backups/pre-loadtest-YYYYMMDD-HHMMSS.sql
```

---

## Troubleshooting

### High Error Rate During Test
- Check PgBouncer `cl_waiting` - if high, increase `max_client_conn`
- Check Redis memory - if near 256MB, increase limit
- Check app logs for specific errors

### Slow Response Times
- Check if cache is being used (Redis hit rate)
- Check PgBouncer `sv_active` vs `sv_idle` ratio
- Look for slow queries in PostgreSQL logs

### Connection Errors
- PgBouncer may have hit `max_db_connections` (50)
- Consider increasing if DB can handle more
