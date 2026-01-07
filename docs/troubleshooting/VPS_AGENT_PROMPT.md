# VPS Agent Prompt - Financial Literacy Toolkit Deployment

Copy and paste this prompt to an AI agent with VPS/SSH access:

---

## Task: Fix Financial Literacy Toolkit Deployment

I need you to diagnose and fix the deployment of a Next.js application on my VPS. The website `https://financial-literacy.qualiaai.fr` is returning 404 even though the containers are running.

### VPS Details
- **IP**: 82.25.112.7
- **OS**: Debian GNU/Linux 13
- **Stack**: Docker Swarm, Traefik (reverse proxy), Dokploy (deployment platform)

### Current Setup
- **Dokploy URL**: https://dokploy.qualiaai.fr
- **Project**: financial-literacy-assessment
- **Services**:
  - `financial-literacy-web` (Next.js app, port 3000)
  - `financial-literacy-db` (PostgreSQL 15, port 5432)

### Known Status
1. **Docker containers are running** - verified via Dokploy
2. **Next.js app starts successfully** - logs show "Ready in 95ms" on port 3000
3. **PostgreSQL is running** - "database system is ready to accept connections"
4. **DNS is correct** - `financial-literacy.qualiaai.fr` resolves to `82.25.112.7`
5. **Website returns 404** - Traefik's default 404, meaning no route to backend

### Environment Variables

**Project Level:**
```
DATABASE_URL=postgresql://postgres:postgres@finlit-postgres-db-g6ifwu:5432/financial_literacy
```

**financial-literacy-web:**
```
NODE_ENV=production
PORT=3000
DATABASE_URL=${{project.DATABASE_URL}}
```

**financial-literacy-db:**
```
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=financial_literacy
```

### What I Need You To Do

1. **SSH into the VPS** and check:
   ```bash
   # Check running containers
   docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
   
   # Check Traefik configuration
   docker exec traefik cat /etc/traefik/traefik.yml
   
   # Check Traefik dynamic config
   docker exec traefik cat /etc/traefik/dynamic.yml 2>/dev/null || echo "No dynamic config"
   
   # Check if app container has Traefik labels
   docker inspect app-compress-digital-panel-bbswn2 --format '{{json .Config.Labels}}' | jq .
   
   # Check Traefik logs for the domain
   docker logs traefik 2>&1 | grep -i "financial-literacy" | tail -20
   
   # Test internal connectivity
   docker exec traefik wget -qO- http://app-compress-digital-panel-bbswn2:3000 2>&1 | head -5
   ```

2. **Verify Traefik routing**:
   - The domain `financial-literacy.qualiaai.fr` should route to the Next.js container on port 3000
   - Check if the container has proper Traefik labels for routing
   - Verify the container is on the same Docker network as Traefik

3. **Fix the routing** by either:
   - Adding correct Traefik labels to the container
   - Updating Traefik dynamic configuration
   - Ensuring the container is on the `dokploy-network`

4. **Verify the fix**:
   ```bash
   curl -I https://financial-literacy.qualiaai.fr
   ```
   Should return `HTTP/2 200` instead of `404`

### Expected Traefik Labels

The web container should have labels like:
```
traefik.enable=true
traefik.http.routers.financial-literacy-web.rule=Host(`financial-literacy.qualiaai.fr`)
traefik.http.routers.financial-literacy-web.entrypoints=websecure
traefik.http.routers.financial-literacy-web.tls.certresolver=letsencrypt
traefik.http.services.financial-literacy-web.loadbalancer.server.port=3000
```

### Container Names (from Docker)
- Web app: `app-compress-digital-panel-bbswn2.1.xxxxx`
- Database: `finlit-postgres-db-g6ifwu.1.xxxxx`
- Traefik: `traefik`

### Additional Context
- Dokploy manages deployments via Docker Swarm
- The Domains tab in Dokploy shows the domain configured but with "Validate DNS" button (yellow)
- Other services on the same VPS work (n8n.qualiaai.fr, dokploy.qualiaai.fr)

Please diagnose the issue and provide the exact commands to fix the Traefik routing so the website becomes accessible.

---

## End of Prompt

