# Financial Literacy Website Fix Instructions

**Date**: January 7, 2026  
**Status**: ROOT CAUSE IDENTIFIED - ACTION REQUIRED

## Summary

The website `https://financial-literacy.qualiaai.fr` returns 404 even though the container is running.

## Root Cause

The **Run Command** in Dokploy's Advanced settings is set to `/bin/sh`, which may be interfering with the application startup.

## Verification Results

| Component | Status | Details |
|-----------|--------|---------|
| DNS | Working | `financial-literacy.qualiaai.fr` → `82.25.112.7` |
| Container | Running | `app-compress-digital-panel-bbswn2` - Up 7+ minutes |
| Database | Running | `finlit-postgres-db` - Up 4 hours |
| Domain Config | Correct | Port 3000, HTTPS, Let's Encrypt |
| Website | 404 | Traefik returns 404 (no backend) |

## FIX: Clear the Run Command

### Step 1: Navigate to Advanced Settings

1. Go to: https://dokploy.qualiaai.fr
2. Navigate to: **Projects** → **financial-literacy-assessment** → **financial-literacy-web**
3. Click on the **Advanced** tab

### Step 2: Clear the Run Command

1. Find the **"Run Command"** section
2. The **Command** field currently shows `/bin/sh`
3. **Clear this field** (delete the text, leave it empty)
4. Click **Save**

### Step 3: Reload or Redeploy

1. Go back to the **General** tab
2. Click **Reload** button to restart the container
3. Wait 30-60 seconds

### Step 4: Verify

```bash
curl -I https://financial-literacy.qualiaai.fr
```

Should return `HTTP/2 200` (success) instead of `404`.

## If Still Not Working

If clearing the Run Command doesn't fix it:

1. Click **Rebuild** button (does a fresh build)
2. Wait for the build to complete
3. The website should start working

## Technical Details

### Why This Happened

The `/bin/sh` command was likely set as a default placeholder. When left in place, it may interfere with the application's normal startup command defined in the Dockerfile:

```dockerfile
CMD ["node", "apps/web/server.js"]
```

### Expected Behavior

After fixing:
- Container runs `node apps/web/server.js`
- Application starts on port 3000
- Traefik routes `financial-literacy.qualiaai.fr` to the container
- Website becomes accessible

---

**Action Required**: Clear the Run Command in Advanced settings and click Reload.

