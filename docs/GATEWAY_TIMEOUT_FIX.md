# Gateway Timeout Fix for Instructor and Student Portals

**Date:** January 2025  
**Issue:** Gateway Timeout (504) errors for both instructor and student portals when accessing through Traefik

## Root Cause Analysis

1. **Application Status:**
   - ✅ App container is running and healthy
   - ✅ App responds quickly on `localhost:3000` (< 100ms)
   - ✅ Health check endpoint works: `/api/healthz`
   - ✅ Traefik can reach app container internally

2. **Traefik Configuration:**
   - ⚠️ Traefik router may not be properly registered
   - ⚠️ Response timeout defaults to 60 seconds (Traefik v3)
   - ⚠️ Middleware configuration for buffering/timeout may be incorrect

3. **Network Connectivity:**
   - ✅ Container is on `traefik_proxy` network
   - ✅ Traefik can reach app: `docker exec root-traefik-1 wget http://financial_literacy_app:3000/api/healthz` succeeds
   - ⚠️ HTTPS requests through Traefik return 404 or timeout

## Applied Fixes

### 1. Updated Traefik Labels (`docker-compose.yml`)

Added proper timeout and buffering middleware:

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.finlit.rule=Host(`financial-literacy.qualiaai.fr`)"
  - "traefik.http.routers.finlit.entrypoints=websecure"
  - "traefik.http.routers.finlit.tls.certresolver=le"
  - "traefik.http.services.finlit.loadbalancer.server.port=3000"
  - "traefik.http.services.finlit.loadbalancer.server.passHostHeader=true"
  # Increase response timeout for database queries and heavy operations (120 seconds)
  - "traefik.http.middlewares.finlit-buffer.buffering.maxResponseBodyBytes=10485760"
  - "traefik.http.middlewares.finlit-buffer.buffering.retryExpression=IsNetworkError() && Attempts() < 3"
  - "traefik.http.routers.finlit.middlewares=finlit-buffer@docker"
  # Priority to avoid conflicts
  - "traefik.http.routers.finlit.priority=100"
```

### 2. Container Recreation

Recreated the app container to apply new Traefik labels:
```bash
docker compose up -d --force-recreate app
```

### 3. Traefik Restart

Restarted Traefik to pick up new router configuration:
```bash
docker restart root-traefik-1
```

## Verification Steps

1. **Check Container Status:**
   ```bash
   docker ps --filter "name=financial" --format "{{.Names}}\t{{.Status}}"
   ```
   Expected: Both containers should be `Up` and `healthy`

2. **Check Traefik Labels:**
   ```bash
   docker inspect financial_literacy_app --format '{{range $key, $value := .Config.Labels}}{{$key}}={{$value}}{{"\n"}}{{end}}' | grep traefik | sort
   ```
   Expected: All Traefik labels should be present and correct

3. **Test Direct Access:**
   ```bash
   curl -s http://localhost:3000/api/healthz
   ```
   Expected: `{"status":"ok","service":"financial-literacy-web",...}`

4. **Test Through Traefik:**
   ```bash
   curl -s https://financial-literacy.qualiaai.fr/api/healthz
   ```
   Expected: Same response as direct access (not 404 or timeout)

5. **Check Traefik Logs:**
   ```bash
   docker logs root-traefik-1 --tail 50 | grep -iE "finlit|financial|error|timeout"
   ```
   Expected: No errors related to `finlit` router

## Known Issues

1. **Traefik Response Timeout:**
   - **Issue:** Traefik v3 default response timeout is 60 seconds
   - **Impact:** Long-running database queries or heavy operations may timeout
   - **Current Fix:** Buffering middleware added, but response timeout needs to be configured in Traefik static config
   - **Future Fix:** Configure `responseTimeout` in Traefik static configuration (requires access to Traefik config files or environment variables)

2. **Router Conflicts:**
   - **Issue:** Traefik logs showed "Router defined multiple times with different configurations"
   - **Current Fix:** Added `priority=100` to router labels to avoid conflicts
   - **Status:** Need to verify no other routers conflict with `financial-literacy.qualiaai.fr`

3. **404 Responses:**
   - **Issue:** Some requests return 404 from Traefik instead of reaching the app
   - **Possible Causes:**
     - Router not registered yet (wait 1-2 minutes after container restart)
     - Domain mismatch in router rule
     - Entrypoint configuration issue
   - **Resolution:** Verify router is registered in Traefik API

## Traefik Static Configuration (If Accessible)

If you have access to Traefik static configuration, add:

```yaml
entryPoints:
  websecure:
    address: ":443"
    http:
      # Increase response timeout to 120 seconds
      responseTimeouts:
        readTimeout: 120s
        writeTimeout: 120s
        idleTimeout: 180s
```

Or via environment variables:
```bash
TRAEFIK_ENTRYPOINTS_WEBSECURE_HTTP_RESPONSETIMEOUTS_READTIMEOUT=120s
TRAEFIK_ENTRYPOINTS_WEBSECURE_HTTP_RESPONSETIMEOUTS_WRITETIMEOUT=120s
TRAEFIK_ENTRYPOINTS_WEBSECURE_HTTP_RESPONSETIMEOUTS_IDLETIMEOUT=180s
```

## Alternative Solutions

If Traefik timeout configuration is not accessible, consider:

1. **Optimize Database Queries:**
   - Add indexes on frequently queried columns
   - Limit result sets (pagination)
   - Use database connection pooling
   - Add query timeouts in application code

2. **Add Request Timeouts in Application:**
   - Set Next.js API route timeouts
   - Add timeout middleware for long-running operations
   - Implement async/await properly to avoid blocking

3. **Use Traefik Health Check:**
   - Configure Traefik to check app health before routing
   - Only route to healthy instances
   - Gracefully handle app restarts

## Testing Checklist

- [ ] Container is running and healthy
- [ ] Traefik labels are applied correctly
- [ ] Direct access to app works (localhost:3000)
- [ ] HTTPS access through Traefik works (https://financial-literacy.qualiaai.fr)
- [ ] Health check endpoint responds quickly (< 1s)
- [ ] Instructor portal loads without timeout
- [ ] Student portal loads without timeout
- [ ] Database queries complete within timeout
- [ ] No errors in Traefik logs
- [ ] No errors in app logs

## Next Steps

1. **Monitor Logs:**
   ```bash
   # Watch Traefik logs
   docker logs -f root-traefik-1 | grep -iE "finlit|financial|504|timeout"
   
   # Watch app logs
   docker logs -f financial_literacy_app | grep -iE "error|timeout|slow"
   ```

2. **Check Router Registration:**
   ```bash
   # Access Traefik API (if exposed)
   curl http://localhost:8080/api/http/routers | jq '.[] | select(.name | contains("finlit"))'
   ```

3. **If Timeout Persists:**
   - Check Traefik static configuration for timeout settings
   - Verify database queries are optimized
   - Add application-level timeouts
   - Consider increasing Traefik response timeout via static config

---

**Status:** 🔄 In Progress  
**Last Updated:** January 2025  
**Next Review:** After Traefik restart and verification
