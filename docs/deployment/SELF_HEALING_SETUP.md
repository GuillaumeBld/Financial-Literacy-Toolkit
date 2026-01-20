# Self-Healing Infrastructure Setup

This guide implements a multi-layered self-healing architecture for the Financial Literacy Assessment Platform with Dokploy and Uptime Kuma.

## Architecture Overview

**Layer 1: Internal Self-Healing (Fast Recovery)**
- Health check endpoint with database connectivity test
- Docker Swarm restart policy for automatic container restart
- Recovery time: 5-30 seconds

**Layer 2: External Monitoring (Fail-Safe)**
- Uptime Kuma monitoring external availability
- Triggers Dokploy API redeploy on persistent failures
- Recovery time: 2-5 minutes (full redeploy)

---

## Part 1: Dokploy Application Health Check & Restart Policy

### 1.1 Health Endpoint Implementation

The `/api/healthz` endpoint provides fast health checks with database validation:

**Location**: `apps/web/src/app/api/healthz/route.ts`

**Features**:
- Fast `SELECT 1` database ping (typically <100ms)
- Returns 200 OK when healthy
- Returns 503 Service Unavailable when database is unreachable
- Includes response time metrics

**Test locally**:
```bash
curl http://localhost:3000/api/healthz
# Expected response:
# {"status":"ok","database":"connected","responseTime":"45ms","timestamp":"2026-01-07T20:00:00.000Z"}
```

### 1.2 Configure Dokploy Application Settings

Navigate to your Dokploy Application → **Advanced** → **Swarm Settings**

#### Health Check Configuration

```yaml
healthcheck:
  path: /api/healthz
  interval: 30s       # Check every 30 seconds
  timeout: 3s         # Fail if no response in 3 seconds
  retries: 3          # Mark unhealthy after 3 consecutive failures
  start_period: 30s   # Grace period during startup
```

**How it works**:
- Docker Swarm sends `curl http://container:3000/api/healthz` every 30 seconds
- If 3 consecutive checks fail (90 seconds total), container is marked unhealthy
- Restart policy triggers automatic restart

#### Restart Policy Configuration

```yaml
restart_policy:
  condition: on-failure     # Only restart on failure, not manual stops
  delay: 5s                 # Wait 5 seconds before restarting
  max_attempts: 5           # Try up to 5 restarts
  window: 120s              # Reset attempt counter after 120 seconds of stability
```

**Behavior**:
- Container fails health check → marked unhealthy
- After 5 second delay → Docker Swarm restarts container
- If container stays healthy for 2 minutes → attempt counter resets
- If 5 restarts fail within 2 minutes → escalate to Uptime Kuma

### 1.3 Alternative: Dockerfile HEALTHCHECK

If you prefer embedding health checks in the Docker image:

**Add to `Dockerfile`** (after EXPOSE 3000):
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
  CMD curl -fsS http://localhost:3000/api/healthz || exit 1
```

**Note**: Install curl in the runner stage:
```dockerfile
# In runner stage, before RUN addgroup
RUN apk add --no-cache curl
```

⚠️ **Recommendation**: Use Dokploy UI configuration instead of Dockerfile HEALTHCHECK for easier management.

---

## Part 2: Uptime Kuma Fail-Safe Integration

Uptime Kuma monitors external availability and triggers redeployment via Dokploy API when internal healing fails.

### 2.1 Prerequisites

**Dokploy API Setup**:
1. Log in to Dokploy dashboard
2. Navigate to **Settings** → **API Tokens**
3. Create new token:
   - Name: `uptime-kuma-redeploy`
   - Permissions: `application:deploy`
   - Expiration: Set based on security policy (recommend 1 year with calendar reminder)
4. **Copy token immediately** (shown only once)

**Find Application ID**:
```bash
# Method 1: Dokploy UI
# Navigate to your Application → Settings → look for Application ID in URL
# Example: https://dokploy.yourdomain.com/application/app_abc123xyz456

# Method 2: API (if available)
curl -X GET https://dokploy.yourdomain.com/api/application.list \
  -H "x-api-key: YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

Your Application ID format: `app_[random_string]`

### 2.2 Configure Uptime Kuma Monitor

#### Create HTTP(s) Monitor

**Basic Settings**:
- **Monitor Type**: HTTP(s)
- **Friendly Name**: Financial Literacy Web - Health Check
- **URL**: `https://financial-literacy.qualiaai.fr/api/healthz`
- **Heartbeat Interval**: 60 seconds (check every minute)
- **Retries**: 2 (declare down after 2 failures)

**Advanced Settings**:
- **Method**: GET
- **Expected Status Code**: 200
- **Timeout**: 10 seconds
- **Max Redirects**: 5
- **Upside Down Mode**: OFF
- **Accepted Status Codes**: 200-299

**Response Validation** (optional):
- **Keyword**: `"status":"ok"`
- **Keyword Match Type**: Contains

#### Configure Redeploy Notification

**Create Webhook Notification**:
1. In Uptime Kuma → **Settings** → **Notifications** → **Setup Notification**
2. Select **Webhook** type
3. Configure:

```yaml
Notification Type: Webhook
Friendly Name: Dokploy Redeploy - Financial Literacy
POST URL: https://dokploy.yourdomain.com/api/application.deploy
Content Type: application/json
```

**Custom Headers**:
```
x-api-key: YOUR_DOKPLOY_API_TOKEN
Content-Type: application/json
```

**Body**:
```json
{
  "applicationId": "YOUR_APPLICATION_ID"
}
```

**Replace**:
- `YOUR_DOKPLOY_API_TOKEN`: Token from step 2.1
- `YOUR_APPLICATION_ID`: Your app ID (e.g., `app_abc123xyz456`)

4. **Test notification** before saving
5. **Apply to monitor** → Select "Financial Literacy Web - Health Check"

### 2.3 Prevent Redeploy Storms

**Critical Settings to Avoid False Positives**:

1. **Enable "Status Change Only" notifications**:
   - Monitor Settings → Notifications → ✅ **Only notify when status changes**
   - This ensures webhook fires ONCE when going down, not every minute

2. **Set Resend Interval**:
   - Monitor Settings → **Resend Notification if Down X times**: 15
   - With 60s interval = redeploy only if down for 15+ minutes

3. **Alert Delay (optional)**:
   - Monitor Settings → **Alert After X Failed Checks**: 3
   - Prevents temporary blips from triggering redeploy

**Recommended Final Configuration**:
```yaml
Heartbeat Interval: 60s
Retries: 2
Alert After: 3 failed checks           # 3-6 minutes before alert
Status Change Only: ✅ Enabled
Resend if Down: 15 times               # Only redeploy after 15+ minutes
```

**Behavior**:
1. Service goes down → 3 failed checks (3-6 minutes)
2. Uptime Kuma triggers webhook → Dokploy redeploys
3. If still down after 15 minutes → resend webhook (trigger another redeploy)

### 2.4 Security Best Practices

✅ **DO**:
- Store Dokploy API token securely (password manager)
- Use HTTPS for all API calls
- Set token expiration and calendar reminders
- Keep Dokploy behind Traefik with TLS
- Regularly rotate API tokens (quarterly)

❌ **DON'T**:
- Share API tokens in chat/email
- Use the raw Dokploy webhook URL (no authentication)
- Commit tokens to Git
- Set unlimited token expiration

---

## Part 3: Testing & Verification

### 3.1 Test Health Endpoint

**Local test**:
```bash
# Healthy response
curl http://localhost:3000/api/healthz
# {"status":"ok","database":"connected","responseTime":"45ms",...}

# Simulate unhealthy (stop database)
docker-compose stop postgres
curl http://localhost:3000/api/healthz
# {"status":"unhealthy","database":"disconnected","error":"..."}
```

**Production test**:
```bash
curl https://financial-literacy.qualiaai.fr/api/healthz
```

### 3.2 Test Docker Health Check

**Check container health status**:
```bash
# On Dokploy server
docker ps --filter name=financial-literacy
# Look for "healthy" status in HEALTH column

# View health check logs
docker inspect $(docker ps -q --filter name=financial-literacy) | jq '.[0].State.Health'
```

**Simulate failure**:
```bash
# Stop database to trigger unhealthy status
docker-compose stop postgres

# Wait 90-120 seconds (3 failed checks)
# Container should be marked unhealthy and restart automatically

# Check logs
docker logs -f $(docker ps -q --filter name=financial-literacy)
```

### 3.3 Test Uptime Kuma Integration

**Test webhook manually** (before enabling auto-redeploy):
```bash
curl -X POST https://dokploy.yourdomain.com/api/application.deploy \
  -H "x-api-key: YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"applicationId":"YOUR_APP_ID"}'

# Expected response:
# {"success":true,"message":"Deployment triggered"}
```

**Test end-to-end**:
1. Manually pause the Uptime Kuma monitor
2. In Dokploy, stop the application
3. Resume the monitor
4. Wait for alert (3-6 minutes)
5. Verify webhook triggered in Uptime Kuma → **Status Pages**
6. Verify deployment started in Dokploy → **Activity Log**

---

## Part 4: Monitoring & Maintenance

### 4.1 Health Check Dashboard

**Uptime Kuma Status Page**:
- Create public status page: Settings → Status Pages
- Add "Financial Literacy Web - Health Check" monitor
- Share URL: `https://uptime.yourdomain.com/status/financial-literacy`

**Dokploy Activity Log**:
- Application → Activity → Filter by "health-check" events
- Shows restart history and redeploy triggers

### 4.2 Alerts & Escalation

**Recommended Alert Chain**:
1. **Health Check Fails** (0-90s) → Docker Swarm restarts container silently
2. **3 Restarts in 2 Minutes** (90s-2m) → Log warning, investigate logs
3. **Uptime Kuma Down Alert** (3-6m) → Send notification to team (Slack/email)
4. **Redeploy Triggered** (6m+) → Dokploy redeploys, send critical alert

**Add additional Uptime Kuma notifications**:
- Slack webhook for team alerts
- Email for critical failures
- PagerDuty for on-call escalation

### 4.3 Metrics to Monitor

**Health Endpoint Metrics**:
- Response time (should be <200ms)
- Success rate (target: 99.9%+)
- Database ping latency

**Container Metrics**:
- Restart count per day (target: <5)
- Time between restarts (should increase over time)
- Health check success rate

**Uptime Kuma Metrics**:
- Uptime percentage (target: 99.9%+)
- Average response time
- Downtime incidents per week

---

## Part 5: Troubleshooting

### Common Issues

#### Health Check Always Failing
**Symptoms**: Container constantly restarting
**Causes**:
- Database connection string incorrect
- Database not accessible from container network
- Health check timeout too short

**Solution**:
```bash
# Check health endpoint manually
docker exec -it $(docker ps -q --filter name=financial-literacy) \
  curl -v http://localhost:3000/api/healthz

# Check database connectivity
docker exec -it $(docker ps -q --filter name=financial-literacy) \
  node -e "require('./test-database.js')"

# Increase timeout if needed
# Dokploy UI → Advanced → Swarm Settings → Timeout: 5s
```

#### Restart Loop (5 Restarts, Then Stops)
**Symptoms**: Container stops after 5 restart attempts
**Causes**:
- Persistent issue (bad deploy, config error)
- max_attempts reached within window

**Solution**:
```bash
# Check application logs
docker logs $(docker ps -aq --filter name=financial-literacy | head -1)

# Manually fix and redeploy
# Or increase max_attempts to 10 if failures are transient
```

#### Uptime Kuma Redeploy Storms
**Symptoms**: Constant redeployments every minute
**Causes**:
- "Status Change Only" not enabled
- Resend interval too low

**Solution**:
1. Pause monitor in Uptime Kuma
2. Enable "Only notify when status changes"
3. Increase "Resend Notification" to 15+
4. Resume monitor

#### Webhook Not Triggering
**Symptoms**: Monitor shows down, but no redeploy
**Causes**:
- Invalid API token
- Wrong application ID
- Notification not applied to monitor

**Solution**:
```bash
# Test webhook manually
curl -X POST https://dokploy.yourdomain.com/api/application.deploy \
  -H "x-api-key: YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"applicationId":"YOUR_APP_ID"}' \
  -v

# Check Uptime Kuma notification logs
# Settings → Notifications → View Logs

# Verify notification is applied to monitor
# Monitor Settings → Notifications → Should see webhook listed
```

---

## Summary

**What You've Implemented**:
1. ✅ Fast health endpoint with database validation (`/api/healthz`)
2. ✅ Docker Swarm health check (30s interval, 3 retries)
3. ✅ Automatic restart policy (on-failure, 5 attempts, 120s window)
4. ✅ Uptime Kuma external monitoring with Dokploy API integration
5. ✅ Storm prevention (status change only, 15-minute resend interval)

**Recovery Times**:
- Transient failure: 5-30 seconds (automatic restart)
- Persistent failure: 2-5 minutes (full redeploy)
- Bad deploy: Caught within 6 minutes, rollback required

**Next Steps**:
1. Deploy updated code to Dokploy (includes enhanced `/api/healthz`)
2. Configure health check and restart policy in Dokploy UI
3. Set up Uptime Kuma monitor with webhook notification
4. Test the full chain with a controlled outage
5. Share status page URL with stakeholders

**Reference**:
- Health endpoint: `apps/web/src/app/api/healthz/route.ts`
- Dokploy config: `dokploy.yml` (lines 33-52)
- Deployment type: **Dokploy Application** (not Docker Compose)
- API endpoint: `POST /api/application.deploy`
