# Financial Literacy Database - Migration Information

## Current Database Configuration

### Active PostgreSQL Database

**Container Name:** `financial_literacy_postgres`
**Image:** `postgres:15-alpine`
**Status:** Running (healthy)
**Database Name:** `financial_literacy`
**Database User:** `finlit_user`
**Database Password:** `change_me_in_production`

---

## Connection Strings

### Internal Connections (from Docker containers)

**Service Name (docker-compose):**
```
postgresql://finlit_user:change_me_in_production@postgres:5432/financial_literacy
```

**Container Name:**
```
postgresql://finlit_user:change_me_in_production@financial_literacy_postgres:5432/financial_literacy
```

### External Connections (from host/server)

```
postgresql://finlit_user:change_me_in_production@localhost:5435/financial_literacy
```

**Note:** External port is `5435` (mapped from internal `5432`)

---

## Network Information

- **Docker Network:** `financial_literacy_network`
- **Type:** Bridge network
- **Also Connected To:** `traefik_proxy` (external network)

---

## Database Status

- **Tables:** 0 (empty database awaiting migration)
- **Schema:** Not initialized
- **Volume:** `financial_literacy_postgres_data`
- **Data Location:** `/var/lib/postgresql/data/pgdata`

---

## Migration Notes

### Previous Database (REMOVED)

The Dokploy service `finlit-postgres-db-g6ifwu` was removed during infrastructure cleanup.

### Migration File Status

The following directories exist but are **EMPTY**:
- `/root/Financial-Literacy-Toolkit/migration/supabase-to-postgres.sql/`
- `/root/Financial-Literacy-Toolkit/migration/migrate-rls-policies.sql/`

**Action Required:** Place actual `.sql` migration files in the `migration/` directory.

---

## Quick Test Connections

### From Host/Server:
```bash
docker exec financial_literacy_postgres psql -U finlit_user -d financial_literacy -c "SELECT version();"
```

### From Another Container:
```bash
docker run --rm --network financial_literacy_network postgres:15-alpine \
  psql postgresql://finlit_user:change_me_in_production@postgres:5432/financial_literacy \
  -c "SELECT version();"
```

### Using psql from Host:
```bash
PGPASSWORD=change_me_in_production psql -h localhost -p 5435 -U finlit_user -d financial_literacy
```

---

## For Migration Agent

### To Run Migration Scripts

1. Place your SQL migration files in:
   - `/root/Financial-Literacy-Toolkit/migration/01-schema.sql`
   - `/root/Financial-Literacy-Toolkit/migration/02-data.sql`
   - etc.

2. Execute manually:
```bash
docker exec -i financial_literacy_postgres psql -U finlit_user -d financial_literacy < migration/01-schema.sql
```

3. Or copy into container and execute:
```bash
docker cp migration/01-schema.sql financial_literacy_postgres:/tmp/
docker exec financial_literacy_postgres psql -U finlit_user -d financial_literacy -f /tmp/01-schema.sql
```

---

## Container Details

```yaml
Container ID: (check with docker ps)
Restart Policy: unless-stopped
Health Check: pg_isready -U finlit_user
Environment:
  - POSTGRES_USER=finlit_user
  - POSTGRES_PASSWORD=change_me_in_production
  - POSTGRES_DB=financial_literacy
  - PGDATA=/var/lib/postgresql/data/pgdata
```

---

## Related Containers

- **Application:** `financial_literacy_app` (Next.js 14.2.35)
- **App Database URL:** Uses `@postgres:5432` (service name in docker-compose)
- **Other Postgres Instances:**
  - `dokploy-postgres` (port 5432 - internal only)
  - `n8n-postgres-1` (port 5432 external)

---

## Troubleshooting

### Database Not Found?
The database name is `financial_literacy` (no underscore between financial and literacy in DB name, but underscore in container name).

### Connection Refused?
- From containers: Use `postgres:5432` (service name)
- From host: Use `localhost:5435`

### Empty Database?
The database exists but has no schema. You need to:
1. Run migration SQL files to create tables
2. Or populate it with your migration agent

---

**Generated:** 2026-01-10
**Location:** `/root/Financial-Literacy-Toolkit/DATABASE_MIGRATION_INFO.md`
