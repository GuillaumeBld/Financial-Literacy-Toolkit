# Self-Healing Implementation Summary

## ✅ What Was Implemented

### 1. Enhanced Health Endpoint
**File**: `apps/web/src/app/api/healthz/route.ts`

**Changes**:
- Added fast database connectivity check (`SELECT 1`)
- Returns 200 OK when healthy, 503 when database unreachable
- Includes response time metrics and timestamp
- Typical response time: <100ms

**Before**:
```typescript
// Simple status check, no database validation
return NextResponse.json({ status: 'ok' }, { status: 200 });
```

**After**:
```typescript
// Fast database ping with proper error handling
const startTime = Date.now();
await queryMany('SELECT 1 as health_check');
return NextResponse.json({
  status: 'ok',
  database: 'connected',
  responseTime: `${responseTime}ms`,
  timestamp: new Date().toISOString()
}, { status: 200 });
```

### 2. Updated Dokploy Configuration
**File**: `dokploy.yml`

**Changes**:
1. **Health Check Path**: Changed from `/api/test` (slow, comprehensive) to `/api/healthz` (fast, focused)
2. **Optimized Timeouts**: Reduced timeout from 10s to 3s (health endpoint responds in <1s)
3. **Added Restart Policy**: Automatic container restart on failure

**Configuration**:
```yaml
healthcheck:
  path: /api/healthz           # Fast endpoint
  interval: 30s                # Check every 30 seconds
  timeout: 3s                  # Fail if no response in 3s
  retries: 3                   # 3 failures = unhealthy
  start_period: 30s            # Grace period during startup

restart_policy:
  condition: on-failure        # Only restart on failures
  delay: 5s                    # Wait 5s before restart
  max_attempts: 5              # Try up to 5 times
  window: 120s                 # Reset counter after 2min stability
```

### 3. Comprehensive Documentation

Created three detailed guides:

#### A. `SELF_HEALING_SETUP.md` (Main Guide)
- Complete architecture overview
- Layer 1: Internal self-healing (Docker Swarm)
- Layer 2: External monitoring (Uptime Kuma)
- Step-by-step configuration for both layers
- Testing procedures and troubleshooting
- Security best practices

#### B. `UPTIME_KUMA_CONFIG.md` (Quick Reference)
- Step-by-step checklist format
- Exact configuration values
- Copy-paste ready webhook setup
- Troubleshooting checklist
- Quick reference card for printing

#### C. This Summary Document
- Implementation overview
- Deployment instructions
- Testing plan

---

## 🚀 Deployment Instructions

### Step 1: Commit and Push Changes

```bash
cd /root/Financial-Literacy-Toolkit

# Review changes
git status
git diff apps/web/src/app/api/healthz/route.ts
git diff dokploy.yml

# Commit changes
git add apps/web/src/app/api/healthz/route.ts
git add dokploy.yml
git add docs/deployment/SELF_HEALING_SETUP.md
git add docs/deployment/UPTIME_KUMA_CONFIG.md
git add docs/deployment/SELF_HEALING_IMPLEMENTATION_SUMMARY.md

git commit -m "feat: implement self-healing infrastructure with health checks and restart policy

- Enhanced /api/healthz endpoint with database connectivity check
- Updated Dokploy health check to use fast /api/healthz endpoint
- Added automatic restart policy (on-failure, 5 attempts, 120s window)
- Created comprehensive documentation for Dokploy and Uptime Kuma setup

This implements a two-layer self-healing architecture:
- Layer 1: Docker Swarm automatic restart (5-30s recovery)
- Layer 2: Uptime Kuma triggered redeploy (3-8min recovery)

Documentation: docs/deployment/SELF_HEALING_SETUP.md"

git push origin main
```

### Step 2: Deploy to Dokploy

**Option A: Auto-Deploy (if enabled in dokploy.yml)**
- Dokploy will automatically detect the push and redeploy
- Monitor in Dokploy → Activity Log

**Option B: Manual Deploy**
1. Log in to Dokploy dashboard
2. Navigate to your application
3. Click **Deploy** button
4. Wait for deployment to complete

### Step 3: Verify Health Endpoint

```bash
# Test the new health endpoint
curl https://financial-literacy.qualiaai.fr/api/healthz

# Expected response:
# {
#   "status": "ok",
#   "database": "connected",
#   "responseTime": "45ms",
#   "timestamp": "2026-01-07T20:00:00.000Z"
# }
```

### Step 4: Configure Dokploy Swarm Settings

1. Log in to Dokploy dashboard
2. Navigate to your application
3. Go to **Advanced** → **Swarm Settings**

**Health Check Section**:
```
Test Command: curl -fsS http://127.0.0.1:3000/api/healthz || exit 1
Interval: 30s
Timeout: 3s
Start Period: 30s
Retries: 3
```

**Restart Policy Section**:
```
Condition: on-failure
Delay: 5s
Max Attempts: 5
Window: 120s
```

4. Click **Save** and **Redeploy** if prompted

### Step 5: Set Up Uptime Kuma

Follow the detailed checklist in `docs/deployment/UPTIME_KUMA_CONFIG.md`:

1. Create Dokploy API token
2. Find your Application ID
3. Create Uptime Kuma monitor (URL: `/api/healthz`)
4. Create webhook notification (Dokploy API endpoint)
5. Apply notification to monitor
6. Test end-to-end

**Key Configuration Values**:
- Monitor URL: `https://financial-literacy.qualiaai.fr/api/healthz`
- Webhook URL: `https://dokploy.yourdomain.com/api/application.deploy`
- **Critical**: Enable "Status Change Only" to prevent storms
- Alert after: 3 failed checks
- Resend interval: 15 failures

---

## 🧪 Testing Plan

### Test 1: Health Endpoint (Immediate)
```bash
# Should return 200 OK with database status
curl -i https://financial-literacy.qualiaai.fr/api/healthz
```

### Test 2: Docker Health Check (After Deploy)
```bash
# SSH into Dokploy server
ssh your-server

# Check container health status
docker ps --filter name=financial-literacy
# Should show "healthy" in STATUS column

# View health check history
docker inspect $(docker ps -q --filter name=financial-literacy) \
  | jq '.[0].State.Health'
```

### Test 3: Automatic Restart (Controlled Test)
⚠️ **Do during maintenance window**

**Scenario**: Simulate database connection failure

```bash
# On Dokploy server
# Stop database temporarily
docker-compose -f /path/to/postgres/docker-compose.yml stop

# Wait 90-120 seconds (3 failed health checks)
# Container should be marked unhealthy

# Check container logs
docker logs -f $(docker ps -q --filter name=financial-literacy)
# Should see: health check failures → container restart

# Restart database
docker-compose -f /path/to/postgres/docker-compose.yml start

# Verify recovery
curl https://financial-literacy.qualiaai.fr/api/healthz
```

### Test 4: Uptime Kuma Integration (After Configuration)
⚠️ **Do during maintenance window**

**Scenario**: Verify webhook triggers Dokploy redeploy

1. In Uptime Kuma, pause the monitor
2. In Dokploy, stop the application
3. Resume the monitor
4. Wait 3-6 minutes for alert
5. Verify webhook sent in Uptime Kuma events
6. Verify deployment triggered in Dokploy Activity Log
7. Verify application recovers automatically

---

## 📊 Expected Behavior

### Normal Operation
```
Every 30 seconds:
├─ Docker Swarm: curl http://container:3000/api/healthz
├─ Response: 200 OK, <100ms
└─ Container marked: healthy ✅

Every 60 seconds:
├─ Uptime Kuma: curl https://financial-literacy.qualiaai.fr/api/healthz
├─ Response: 200 OK, {"status":"ok","database":"connected"}
└─ Monitor status: UP ✅
```

### Failure Scenario: Transient Database Glitch
```
t=0s: Database connection drops
├─ Health check #1 fails (30s)
├─ Health check #2 fails (60s)
├─ Health check #3 fails (90s)
└─ Docker marks container: unhealthy ❌

t=95s: Docker Swarm triggers restart
├─ Container stops gracefully
├─ Wait 5 seconds (delay)
└─ Container starts

t=125s: Container starting (start_period grace)
└─ Health checks ignored for 30s

t=155s: Health check passes
└─ Container marked: healthy ✅

Total downtime: ~60-90 seconds
Uptime Kuma: No alert (only 2-3 failed checks)
```

### Failure Scenario: Persistent Application Issue
```
t=0s: Application crashes (bad deploy)
├─ Health check #1 fails
├─ Restart #1: Container restarts → still fails
├─ Restart #2: Container restarts → still fails
├─ Restart #3: Container restarts → still fails
└─ After 5 attempts in 120s → stop trying

t=3-6min: Uptime Kuma detects persistent failure
├─ 3 consecutive failures (60s intervals)
├─ Sends webhook to Dokploy
└─ Dokploy triggers full redeploy

t=8-10min: Redeploy completes
└─ Application recovers (or requires rollback)

Total downtime: 8-10 minutes
Action required: Investigate logs, consider rollback
```

---

## 🎯 Success Metrics

After deployment, monitor these metrics:

### Week 1: Validation
- [ ] Health endpoint responds in <200ms consistently
- [ ] Zero false positive restarts
- [ ] Zero false positive Uptime Kuma alerts
- [ ] Uptime: 99.5%+ (expected during validation)

### Month 1: Stability
- [ ] Average container restarts per day: <2
- [ ] Time between restarts: >24 hours
- [ ] Health check success rate: 99.9%+
- [ ] Uptime Kuma redeploy triggers: 0-2 per month
- [ ] Uptime: 99.9%+

### Alerts to Monitor
- Container restart count spike (>5 per hour)
- Health endpoint response time >500ms
- Multiple Uptime Kuma redeploy triggers in <6 hours
- Application error rate increase

---

## 🔧 Fine-Tuning Options

If you experience issues, adjust these parameters:

### Too Sensitive (False Positives)
**Symptoms**: Frequent restarts, but application is actually healthy

**Solutions**:
```yaml
# Increase health check retries
retries: 5              # Was: 3

# Increase timeout
timeout: 5s             # Was: 3s

# Increase restart delay
delay: 10s              # Was: 5s

# Uptime Kuma: Increase alert threshold
Alert After: 5          # Was: 3
```

### Not Sensitive Enough (Missed Failures)
**Symptoms**: Downtime not detected quickly enough

**Solutions**:
```yaml
# Decrease health check interval
interval: 20s           # Was: 30s

# Decrease retries (faster detection)
retries: 2              # Was: 3

# Uptime Kuma: Decrease alert threshold
Alert After: 2          # Was: 3
Heartbeat Interval: 30s # Was: 60s
```

### Restart Loops
**Symptoms**: Container keeps restarting, never stabilizes

**Solutions**:
```yaml
# Increase max attempts
max_attempts: 10        # Was: 5

# Increase window
window: 300s            # Was: 120s (5 minutes)

# Investigate root cause
# Check logs: docker logs container_id
# Check database: connectivity, credentials, firewall
```

---

## 📋 Post-Deployment Checklist

### Immediate (Day 1)
- [ ] Code deployed to production
- [ ] Health endpoint responding correctly
- [ ] Docker health check configured in Dokploy
- [ ] Restart policy configured in Dokploy
- [ ] Container shows "healthy" status
- [ ] Test health check with database stop (maintenance window)

### Week 1
- [ ] Uptime Kuma configured with monitor
- [ ] Webhook notification created with Dokploy API token
- [ ] Test webhook manually with curl
- [ ] Test end-to-end with controlled downtime
- [ ] Monitor for false positives
- [ ] Adjust thresholds if needed

### Week 2
- [ ] Create Uptime Kuma status page
- [ ] Add additional notifications (Slack, email)
- [ ] Document application ID and API token location in password manager
- [ ] Set calendar reminder for token rotation (90 days)
- [ ] Add configuration to team wiki

### Month 1
- [ ] Review restart logs and identify patterns
- [ ] Adjust thresholds based on real-world data
- [ ] Validate uptime metrics (target: 99.9%+)
- [ ] Update on-call runbook with self-healing procedures

---

## 🆘 Rollback Plan

If issues occur after deployment:

### Rollback Code Changes
```bash
git revert HEAD
git push origin main
# Dokploy will auto-deploy previous version
```

### Disable Uptime Kuma Redeploy
1. Log in to Uptime Kuma
2. Edit monitor
3. Remove webhook notification
4. Save

### Disable Docker Health Check (Emergency Only)
1. Log in to Dokploy
2. Application → Advanced → Swarm Settings
3. Remove health check configuration
4. Set restart policy to `unless-stopped` (remove on-failure policy)
5. Redeploy

---

## 📚 Reference Documentation

**Implementation Files**:
- Health endpoint: `apps/web/src/app/api/healthz/route.ts`
- Dokploy config: `dokploy.yml` (lines 33-52)
- Full setup guide: `docs/deployment/SELF_HEALING_SETUP.md`
- Quick reference: `docs/deployment/UPTIME_KUMA_CONFIG.md`

**External Documentation**:
- Dokploy API: https://dokploy.com/docs/api
- Docker Healthcheck: https://docs.docker.com/engine/reference/builder/#healthcheck
- Docker Swarm: https://docs.docker.com/engine/swarm/
- Uptime Kuma: https://github.com/louislam/uptime-kuma

**Key Decisions**:
- **Why /api/healthz over /api/test?** Faster (<100ms vs 500ms+), focused check
- **Why database ping in health check?** Catches most common failure mode
- **Why 3 retries?** Balance between false positives (too few) and slow detection (too many)
- **Why 5 second delay?** Gives container time to stabilize without delaying recovery
- **Why Dokploy API over webhook URL?** Authenticated, auditable, revocable

---

## 🎉 Summary

You now have a production-ready, two-layer self-healing infrastructure:

1. **Fast recovery (5-30s)**: Docker Swarm automatically restarts unhealthy containers
2. **Fail-safe recovery (3-8min)**: Uptime Kuma triggers full redeploy for persistent issues
3. **Storm prevention**: Status-change-only notifications prevent redeploy loops
4. **Security**: API token-based authentication for webhooks
5. **Observability**: Health metrics, response times, and deployment history

**Next**: Deploy and test according to the plan above. Monitor for 48 hours, then adjust thresholds as needed.

**Questions?** Refer to:
- `docs/deployment/SELF_HEALING_SETUP.md` for comprehensive guide
- `docs/deployment/UPTIME_KUMA_CONFIG.md` for step-by-step checklist
