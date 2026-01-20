# Current Deployment Status

**Status:** ✅ ACTIVE
**Last Updated:** 2026-01-13
**Maintained By:** Operations Team

---

## Production Environment

### Website
- **URL:** https://financial-literacy.qualiaai.fr
- **Status:** ✅ Online and Healthy
- **Last Deploy:** 2026-01-13 14:12 UTC
- **Version:** bcrypt-authentication-upgrade

### Uptime Monitoring
- **URL:** https://status.qualiaai.fr
- **Status:** ✅ Active
- **Container:** uptime-kuma

---

## Running Services

### Application Server
- **Container:** financial_literacy_app
- **Image:** financial-literacy-toolkit-app:latest
- **Status:** ✅ Running (Healthy)
- **Port:** 3000 (internal), proxied via Traefik
- **Health Check:** `/api/healthz`

### Database
- **Container:** financial_literacy_postgres
- **Image:** postgres:15-alpine
- **Status:** ✅ Running (Healthy)
- **Port:** 5435 (external), 5432 (internal)
- **Volume:** financial_literacy_postgres_data
- **Backup:** Persistent Docker volume

### Reverse Proxy
- **Container:** root-traefik-1
- **Image:** traefik:v3.1
- **Status:** ✅ Running
- **Ports:** 80 (HTTP), 443 (HTTPS)
- **SSL:** Let's Encrypt auto-renewal
- **Config:** /opt/traefik/

---

## Recent Changes

### 2026-01-13: Bcrypt Authentication Upgrade
- **What:** Upgraded from SHA256 to bcrypt password hashing
- **Impact:** More secure instructor authentication
- **Downtime:** ~30 seconds during container restart
- **Status:** ✅ Complete and verified
- **Documentation:** [BCRYPT_UPGRADE_2026-01-13.md](../security/BCRYPT_UPGRADE_2026-01-13.md)

### 2026-01-13: Onboarding Page Fix
- **What:** Fixed Next.js Suspense boundary issue
- **Impact:** Onboarding page now builds and renders correctly
- **Downtime:** None (included in bcrypt rebuild)
- **Status:** ✅ Complete

---

## Active Configuration

### Environment Variables
- `NODE_ENV`: production
- `PORT`: 3000
- `DATABASE_URL`: postgresql://finlit_user:***@postgres:5432/financial_literacy

### Docker Networks
- `financial_literacy_network` - Internal app network
- `traefik_proxy` - External routing network

### Docker Volumes
- `financial_literacy_postgres_data` - Database persistence

---

## Instructor Access

### Login Portal
**URL:** https://financial-literacy.qualiaai.fr/instructor

### Active Instructors
See: [INSTRUCTOR_CREDENTIALS.md](./INSTRUCTOR_CREDENTIALS.md) for current credentials

---

## Health Checks

### Quick Verification
```bash
# Check all containers
docker ps | grep financial

# Test website
curl -I https://financial-literacy.qualiaai.fr

# Test API
curl https://financial-literacy.qualiaai.fr/api/healthz

# Check database
docker exec financial_literacy_postgres pg_isready -U finlit_user
```

### Expected Results
- All containers show "healthy" status
- Website returns HTTP 200
- API returns {"status":"ok"}
- Database returns "accepting connections"

---

## Known Issues

See: [ACTIVE_ISSUES.md](./ACTIVE_ISSUES.md)

**Current Status:** No active issues ✅

---

## Maintenance Window

- **Schedule:** As needed (low-traffic periods)
- **Notification:** Email instructors 24h in advance
- **Typical Duration:** 5-15 minutes
- **Rollback Plan:** Available for all changes

---

## Emergency Contacts

### If Service is Down
1. Check container status: `docker ps`
2. Check logs: `docker logs financial_literacy_app --tail 100`
3. Check Traefik: `docker logs root-traefik-1 --tail 50`
4. Restart if needed: `docker-compose restart app`

### Escalation
- **Operations Documentation:** [../operations/TROUBLESHOOTING.md](../operations/TROUBLESHOOTING.md)
- **Security Issues:** [../security/](../security/)
- **Development Issues:** [../development/](../development/)

---

## Next Scheduled Maintenance

- **Date:** TBD
- **Purpose:** Regular updates and security patches
- **Duration:** ~30 minutes
- **Communication:** Will notify instructors 48h in advance

---

**Last Verified:** 2026-01-13 14:25 UTC
