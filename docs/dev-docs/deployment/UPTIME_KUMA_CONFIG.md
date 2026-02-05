# Uptime Kuma Configuration Quick Reference

This is a step-by-step checklist for configuring Uptime Kuma to monitor and trigger Dokploy redeployments.

## Prerequisites Checklist

- [ ] Dokploy API token created with `application:deploy` permission
- [ ] Application ID identified (format: `app_[random_string]`)
- [ ] Uptime Kuma installed and accessible
- [ ] Application deployed and `/api/healthz` endpoint working

---

## Step 1: Create Dokploy API Token

1. Log in to Dokploy: `https://dokploy.yourdomain.com`
2. Navigate to **Settings** → **API Tokens**
3. Click **Create Token**
4. Configure:
   - **Name**: `uptime-kuma-redeploy`
   - **Permissions**: Select `application:deploy`
   - **Expiration**: 365 days (set calendar reminder to rotate)
5. Click **Create** and **copy token immediately**
6. Store securely in password manager

**Token format**: `dkp_[random_string]`

---

## Step 2: Find Your Application ID

### Method A: From Dokploy UI
1. Navigate to your application in Dokploy
2. Look at the URL in browser:
   ```
   https://dokploy.yourdomain.com/application/app_abc123xyz456
                                              ^^^^^^^^^^^^^^^^^^
                                              Your Application ID
   ```

### Method B: From API (if available)
```bash
curl -X GET https://dokploy.yourdomain.com/api/application.list \
  -H "x-api-key: YOUR_TOKEN_FROM_STEP_1" \
  -H "Content-Type: application/json"
```

**Your Application ID**: `___________________________` (fill in)

---

## Step 3: Create Uptime Kuma Monitor

1. Open Uptime Kuma dashboard
2. Click **Add New Monitor**
3. Configure monitor:

### Basic Settings
```yaml
Monitor Type: HTTP(s)
Friendly Name: Financial Literacy - Health Check
URL: https://financial-literacy.qualiaai.fr/api/healthz
Heartbeat Interval: 60 seconds
Retries: 2
```

### Advanced Settings
```yaml
Method: GET
Expected Status Code: 200
Timeout: 10 seconds
Max Redirects: 5
Upside Down Mode: OFF
Accepted Status Codes: 200-299
```

### Response Validation (Optional)
```yaml
Keyword: "status":"ok"
Keyword Match Type: Contains
```

### Notification Settings (CRITICAL)
```yaml
☑️ Only notify when status changes (prevents storms!)
Alert After: 3 failed checks
Resend Notification if Down X times: 15
```

4. Click **Save**

---

## Step 4: Create Webhook Notification

1. In Uptime Kuma → **Settings** (gear icon) → **Notifications**
2. Click **Setup Notification**
3. Select **Webhook** type
4. Configure:

### Basic Info
```yaml
Notification Type: Webhook
Friendly Name: Dokploy Redeploy - Financial Literacy
```

### Webhook Configuration
```yaml
POST URL: https://dokploy.yourdomain.com/api/application.deploy
Content Type: application/json
```

### Custom Headers
Click **Add Header** twice and add:
```
Header 1:
  Key: x-api-key
  Value: [YOUR_TOKEN_FROM_STEP_1]

Header 2:
  Key: Content-Type
  Value: application/json
```

### Request Body
```json
{
  "applicationId": "YOUR_APPLICATION_ID_FROM_STEP_2"
}
```

**Replace placeholders**:
- `YOUR_TOKEN_FROM_STEP_1`: Paste your Dokploy API token
- `YOUR_APPLICATION_ID_FROM_STEP_2`: Paste your application ID

5. Click **Test** to verify webhook works
6. Click **Save**

---

## Step 5: Apply Notification to Monitor

1. Go back to **Dashboard**
2. Click **Edit** on "Financial Literacy - Health Check" monitor
3. Scroll to **Notifications** section
4. Select **Dokploy Redeploy - Financial Literacy** from dropdown
5. Click **Apply to this monitor**
6. **Save** monitor

---

## Step 6: Test End-to-End

### Test 1: Manual Webhook Test
```bash
# From your local machine or server
curl -X POST https://dokploy.yourdomain.com/api/application.deploy \
  -H "x-api-key: YOUR_DOKPLOY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"applicationId":"YOUR_APP_ID"}'

# Expected response:
# {"success":true,"message":"Deployment triggered"}
```

### Test 2: Simulated Downtime
⚠️ **Do this during maintenance window**

1. **Pause monitor**: In Uptime Kuma, click ⏸️ on monitor
2. **Stop application**: In Dokploy, manually stop the application
3. **Resume monitor**: Click ▶️ in Uptime Kuma
4. **Wait 3-6 minutes**: Monitor should detect downtime after 3 failed checks
5. **Verify webhook**: Check Uptime Kuma → Events (should see webhook sent)
6. **Verify redeploy**: Check Dokploy → Activity Log (should see deploy triggered)
7. **Verify recovery**: Application should restart and monitor turn green

---

## Configuration Summary

**Final Monitor Settings**:
```yaml
URL: https://financial-literacy.qualiaai.fr/api/healthz
Interval: 60 seconds
Retries: 2
Alert After: 3 failed checks (3-6 min)
Status Change Only: ✅ ENABLED (critical!)
Resend if Down: 15 times (15+ min between redeploys)
Notification: Dokploy Redeploy webhook
```

**Expected Behavior**:
```
Service healthy → No action
├─ 1 failed check (60s) → No action, retry
├─ 2 failed checks (120s) → No action, retry
├─ 3 failed checks (180s) → Trigger webhook → Dokploy redeploy
└─ Service still down after 15 min → Resend webhook → Another redeploy
```

**Recovery Times**:
- Internal restart (Docker health check): 5-30 seconds
- External redeploy (Uptime Kuma): 3-8 minutes (3 min alert + 2-5 min deploy)

---

## Troubleshooting Checklist

### Webhook Not Triggering
- [ ] "Status Change Only" is enabled on monitor
- [ ] Notification is applied to monitor (check Edit Monitor → Notifications)
- [ ] API token has `application:deploy` permission
- [ ] Application ID is correct (check browser URL)
- [ ] Test webhook manually with curl command above

### Constant Redeployments (Storm)
- [ ] "Status Change Only" is ENABLED (most common cause)
- [ ] "Resend if Down" is set to 15 or higher
- [ ] "Alert After" is set to 3+ failed checks

### Health Endpoint Not Responding
- [ ] Test manually: `curl https://financial-literacy.qualiaai.fr/api/healthz`
- [ ] Check application logs in Dokploy
- [ ] Verify database is running
- [ ] Check Docker health status: `docker ps` (should show "healthy")

### API Token Issues
- [ ] Token copied correctly (no extra spaces)
- [ ] Token not expired
- [ ] Token has correct permissions
- [ ] Using correct header name: `x-api-key` (not `Authorization`)

---

## Security Checklist

- [ ] API token stored in password manager (not in plain text)
- [ ] Calendar reminder set for token rotation (90-365 days)
- [ ] Dokploy behind HTTPS (Traefik + Let's Encrypt)
- [ ] Webhook uses HTTPS, not HTTP
- [ ] Token not committed to Git
- [ ] Token not shared via email/chat

---

## Next Steps

After configuration:

1. **Monitor for 24-48 hours** to verify no false positives
2. **Adjust thresholds** if needed:
   - Too many alerts? Increase "Alert After" to 5
   - Not catching failures? Decrease to 2
3. **Add additional notifications**:
   - Slack webhook for team alerts
   - Email for critical failures
4. **Create status page**:
   - Uptime Kuma → Status Pages
   - Add monitor and share public URL
5. **Document in runbook**:
   - Add this config to team wiki
   - Include in on-call playbook

---

## Quick Reference Card

Print or save this for quick access:

```
==============================================
Uptime Kuma → Dokploy Integration
==============================================

Monitor URL:
https://financial-literacy.qualiaai.fr/api/healthz

Webhook Endpoint:
https://dokploy.yourdomain.com/api/application.deploy

Headers:
x-api-key: [YOUR_TOKEN]
Content-Type: application/json

Body:
{"applicationId":"[YOUR_APP_ID]"}

Critical Setting:
✅ Status Change Only → MUST BE ENABLED

Thresholds:
- Check interval: 60s
- Alert after: 3 failures (3-6 min)
- Resend interval: 15 failures (15+ min)

Recovery Time:
- Docker restart: 5-30s
- Full redeploy: 3-8 min
==============================================
```

---

## Support & References

**Documentation**:
- Full setup guide: `docs/deployment/SELF_HEALING_SETUP.md`
- Health endpoint code: `apps/web/src/app/api/healthz/route.ts`
- Dokploy config: `dokploy.yml`

**API References**:
- Dokploy API: `https://dokploy.yourdomain.com/api/docs`
- Uptime Kuma: `https://github.com/louislam/uptime-kuma/wiki`

**Emergency Contacts**:
- [Add your team's contact info here]
