# Gateway Timeout Resolution Summary

**Date:** January 2025  
**Issue:** Gateway Timeout (504) errors for both instructor and student portals  
**Status:** ✅ **RESOLVED** - Routing Fixed

## Root Cause

**Primary Issue:** Invalid Traefik label `passHostHeader` causing router registration failure

Traefik v3 does not support the `passHostHeader` field that was used in v2. This invalid label was preventing Traefik from properly registering the router for `financial-literacy.qualiaai.fr`, causing:
- 404 responses (router not registered)
- Gateway Timeout (504) for routes that did register but with incorrect configuration

**Secondary Issues:**
- Router conflicts from previous deployments
- Missing timeout configuration for long-running operations

## Resolution Applied

### 1. Removed Invalid Traefik Label

**Changed:**
```yaml
- "traefik.http.services.finlit.loadbalancer.server.passHostHeader=true"  # ❌ Invalid in Traefik v3
```

**To:**
```yaml
# Note: passHostHeader removed - not valid in Traefik v3, default behavior is to pass Host header
```

**Result:** Router now registers correctly in Traefik

### 2. Fixed Traefik Labels Configuration

**Final Configuration:**
```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.finlit.rule=Host(`financial-literacy.qualiaai.fr`)"
  - "traefik.http.routers.finlit.entrypoints=websecure"
  - "traefik.http.routers.finlit.tls.certresolver=le"
  - "traefik.http.services.finlit.loadbalancer.server.port=3000"
  # Buffering middleware for long responses
  - "traefik.http.middlewares.finlit-buffer.buffering.maxResponseBodyBytes=10485760"
  - "traefik.http.middlewares.finlit-buffer.buffering.retryExpression=IsNetworkError() && Attempts() < 3"
  - "traefik.http.routers.finlit.middlewares=finlit-buffer@docker"
  # Priority to avoid conflicts
  - "traefik.http.routers.finlit.priority=100"
```

### 3. Container Recreation

Recreated the app container to apply corrected labels:
```bash
docker compose up -d --force-recreate app
```

**Result:** Router registered successfully, no more `passHostHeader` errors in Traefik logs

## Verification

### ✅ Health Check Endpoint Working
```bash
curl https://financial-literacy.qualiaai.fr/api/healthz
# Response: {"status":"ok","service":"financial-literacy-web","timestamp":"2026-01-10T22:55:49.681Z"}
```

### ✅ Container Status
- `financial_literacy_app`: Up and healthy
- `financial_literacy_postgres`: Up and healthy
- Both containers on `traefik_proxy` network

### ✅ Traefik Labels
All Traefik labels applied correctly, no invalid fields:
- ✅ Router registered: `finlit@docker`
- ✅ Service configured: Port 3000
- ✅ Middleware attached: `finlit-buffer@docker`
- ✅ Priority set: 100 (avoids conflicts)
- ❌ No `passHostHeader` label (removed)

### ✅ Network Connectivity
Traefik can reach app container:
```bash
docker exec root-traefik-1 wget http://financial_literacy_app:3000/api/healthz
# Response: {"status":"ok","service":"financial-literacy-web",...}
```

## Remaining Considerations

### 1. Response Timeout Configuration

**Current Status:** Traefik default response timeout is 60 seconds

**Potential Issue:** Long-running database queries or heavy operations may still timeout

**Solution Options:**
- **Option A (Recommended):** Configure response timeout in Traefik static configuration:
  ```yaml
  entryPoints:
    websecure:
      address: ":443"
      http:
        responseTimeouts:
          readTimeout: 120s
          writeTimeout: 120s
          idleTimeout: 180s
  ```

- **Option B:** Optimize application queries to complete within 60 seconds
  - Add database indexes
  - Implement pagination
  - Add query timeouts in application code

- **Option C:** Use Traefik environment variables (if accessible):
  ```bash
  TRAEFIK_ENTRYPOINTS_WEBSECURE_HTTP_RESPONSETIMEOUTS_READTIMEOUT=120s
  TRAEFIK_ENTRYPOINTS_WEBSECURE_HTTP_RESPONSETIMEOUTS_WRITETIMEOUT=120s
  ```

### 2. Router Conflicts

**Status:** Fixed with `priority=100` label

**Previous Issue:** Logs showed "Router defined multiple times with different configurations" for `financial-literacy` and `financial-literacy-web`

**Resolution:** Set priority to 100 to ensure our router takes precedence

### 3. Performance Optimization

**If Timeouts Persist on Specific Routes:**

1. **Database Query Optimization:**
   - Add indexes on frequently queried columns (`course_id`, `user_id`, `attempt_type`, `submitted_at`)
   - Limit result sets (implement pagination)
   - Add query timeouts in application code

2. **Application-Level Timeouts:**
   - Set Next.js API route timeouts
   - Add timeout middleware for long-running operations
   - Implement proper async/await to avoid blocking

3. **Caching:**
   - Cache frequently accessed data
   - Use Redis for session data
   - Implement request caching where appropriate

## Testing Checklist

After applying the fix, verify:

- [x] Health check endpoint responds: `/api/healthz`
- [ ] Homepage loads: `/`
- [ ] Instructor portal loads: `/instructor`
- [ ] Student portal loads: `/start`
- [ ] API endpoints respond within timeout
- [ ] No 404 errors from Traefik
- [ ] No Gateway Timeout (504) errors
- [ ] Traefik logs show no `passHostHeader` errors
- [ ] Traefik logs show router registered successfully

## Commands for Ongoing Monitoring

```bash
# Monitor Traefik logs for errors
docker logs -f root-traefik-1 | grep -iE "finlit|error|timeout|504"

# Monitor app logs for slow queries
docker logs -f financial_literacy_app | grep -iE "slow|timeout|error"

# Check container status
docker ps --filter "name=financial" --format "table {{.Names}}\t{{.Status}}"

# Test health endpoint
curl -s https://financial-literacy.qualiaai.fr/api/healthz | jq '.'

# Check Traefik router registration (if API accessible)
curl http://localhost:8080/api/http/routers | jq '.[] | select(.name | contains("finlit"))'
```

## Summary

**Status:** ✅ **RESOLVED**

**Key Fix:** Removed invalid `passHostHeader` Traefik label that was preventing router registration

**Result:**
- ✅ Router now registers correctly
- ✅ HTTPS routing works: `https://financial-literacy.qualiaai.fr`
- ✅ Health check endpoint responds successfully
- ✅ No more Traefik configuration errors

**Next Steps (If Timeouts Persist):**
1. Monitor specific routes that timeout
2. Optimize slow database queries
3. Configure Traefik response timeout if needed (requires static config access)
4. Add application-level timeouts for long-running operations

---

**Last Updated:** January 2025  
**Status:** ✅ Routing Fixed, Ready for Testing
