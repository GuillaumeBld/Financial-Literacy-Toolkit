# Infrastructure Documentation

Last updated: 2026-01-24

## Current Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     PRODUCTION SETUP                         │
│                   (Fully Dokploy-managed)                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  app-compress-digital-panel-bbswn2 (Dokploy)        │    │
│  │  - Dokploy Name: financial-literacy-web             │    │
│  │  - Auto-deploy: Enabled (on git push to main)       │    │
│  │  - Port: 3000                                       │    │
│  │  - Network: dokploy-network (swarm overlay)         │    │
│  └─────────────────────┬───────────────────────────────┘    │
│                        │                                     │
│                        ▼                                     │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  finlit-postgres-db-g6ifwu (Dokploy)                │    │
│  │  - Image: postgres:15                               │    │
│  │  - Database: financial_literacy                     │    │
│  │  - User: finlit_user                                │    │
│  │  - Network: dokploy-network (swarm overlay)         │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Traefik (reverse proxy)                            │    │
│  │  - SSL/TLS termination (Let's Encrypt)              │    │
│  │  - Domain: financial-literacy.qualiaai.fr           │    │
│  │  - Config: /opt/traefik/dynamic/                    │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Containers

### Active Containers (Dokploy-managed)

| Service | Dokploy Name | Image | Purpose |
|---------|--------------|-------|---------|
| `app-compress-digital-panel-bbswn2` | financial-literacy-web | Next.js | Web application (auto-deploy enabled) |
| `finlit-postgres-db-g6ifwu` | finlit-postgres-db | postgres:15 | Production PostgreSQL database |

### Auto-Deploy

Auto-deploy is configured via GitHub App integration:
- **Trigger**: Push to `main` branch
- **GitHub App**: `dokploy-2026-01-07-yn3zk8`
- **Repository**: `GuillaumeBld/Financial-Literacy-Toolkit`

## Database

### Production Database (Dokploy-managed)

- **Service**: `finlit-postgres-db-g6ifwu`
- **Database**: `financial_literacy`
- **User**: `finlit_user`
- **Password**: Set in environment (matches docker-compose POSTGRES_PASSWORD)
- **Network**: `dokploy-network` (swarm overlay)
- **Storage**: Dokploy-managed volume

### Database Schema

13 tables:
- `users` - Hashed student keys (FERPA-compliant)
- `courses` - Course definitions with per-course pepper
- `enrollments` - User-course assignments
- `student_profiles` - Baseline demographics (B1-B13)
- `instruments` - Assessment forms
- `items` - Questions (196 items: 40 anchors + variants)
- `attempts` - Assessment sessions
- `responses` - Individual answers
- `scores` - Aggregated scores
- `instructors` - Instructor accounts
- `instructor_sessions` - Instructor auth tokens
- `instructor_courses` - Instructor-course assignments
- `password_reset_tokens` - (Legacy, not used for students)

## Networks

| Network | Type | Purpose |
|---------|------|---------|
| `dokploy-network` | swarm overlay | Connects app to Dokploy-managed database |
| `traefik_proxy` | external | SSL/TLS termination and routing |
| `app_network` | bridge | Internal app networking |

## Migration History

### 2026-01-24: Database Migration to Dokploy

**Reason**: Consolidate infrastructure to use Dokploy-managed PostgreSQL for better maintainability.

**Migration Steps Performed**:
1. Stopped `financial_literacy_app` to prevent writes
2. Created full backup of source database:
   - `/root/Financial-Literacy-Toolkit/backups/source_backup_20260124_040621.dump`
   - `/root/Financial-Literacy-Toolkit/backups/source_backup_20260124_040703.sql`
3. Restored data to Dokploy database using `pg_dump`/`psql`
4. Verified row counts matched (8 users, 196 items, etc.)
5. Updated `docker-compose.yml` to connect app to Dokploy database
6. Set `finlit_user` password in Dokploy database
7. Restarted app and verified connectivity
8. Stopped old database (kept as backup)

**Data Migrated**:
| Table | Rows |
|-------|------|
| users | 8 |
| courses | 1 |
| items | 196 |
| attempts | 2 |
| responses | 41 |
| student_profiles | 8 |
| instruments | 2 |
| enrollments | 8 |

## Backups

### Location
`/root/Financial-Literacy-Toolkit/backups/`

### Files
- `source_backup_20260124_040621.dump` - pg_dump custom format
- `source_backup_20260124_040703.sql` - Plain SQL format

### Backup Container
The old docker-compose database `financial_literacy_postgres` is stopped but preserved.

**To restore from backup container**:
```bash
docker start financial_literacy_postgres
# Update docker-compose.yml DATABASE_URL to point to postgres:5432
docker restart financial_literacy_app
```

**To remove backup container** (after confirming production is stable):
```bash
docker rm financial_literacy_postgres
docker volume rm financial_literacy_postgres_data
```

## Health Checks

### Endpoints
- **Liveness**: `https://financial-literacy.qualiaai.fr/api/healthz`
- **Readiness** (includes DB): `https://financial-literacy.qualiaai.fr/api/readyz`

### Quick Check
```bash
curl -s https://financial-literacy.qualiaai.fr/api/readyz | jq
```

Expected response:
```json
{
  "status": "ready",
  "service": "financial-literacy-web",
  "checks": {
    "database": {
      "status": "connected",
      "responseTime": "11ms"
    }
  }
}
```

## Troubleshooting

### App can't connect to database
1. Check if Dokploy database is running:
   ```bash
   docker ps | grep finlit-postgres
   ```
2. Verify app is on dokploy-network:
   ```bash
   docker network inspect dokploy-network | grep financial_literacy_app
   ```
3. Check DATABASE_URL in app:
   ```bash
   docker exec financial_literacy_app env | grep DATABASE
   ```

### Restart app with fresh connection
```bash
docker restart financial_literacy_app
```

### Check database directly
```bash
DOKPLOY_DB=$(docker ps --filter "name=finlit-postgres" --format "{{.Names}}")
docker exec $DOKPLOY_DB psql -U finlit_user -d financial_literacy -c "\dt"
```
