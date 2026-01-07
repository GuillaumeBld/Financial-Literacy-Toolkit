# Root Cause Found and Fix

**Date**: January 7, 2026  
**Status**: ROOT CAUSE IDENTIFIED

## The Problem

The website returns 404 because the container is running `/bin/sh` instead of the Node.js application server.

## Root Cause

In Dokploy > Application > **Advanced** tab:
- **Run Command** was set to `/bin/sh`
- This **overrides** the Dockerfile CMD (`node apps/web/server.js`)
- The container starts but doesn't serve the application

## Evidence

From Docker containers page:
- Container `app-compress-digital-panel-bbswn2` is "Running" (Up 7 Minutes)
- But the application is not serving because it's running a shell, not the server

From Advanced tab screenshot:
- Command: `/bin/sh`
- Arguments: None

## The Fix

### Step 1: Clear the Run Command

1. In Dokploy, go to: **Projects** > **financial-literacy-assessment** > **financial-literacy-web**
2. Click on **Advanced** tab
3. In the **Run Command** section:
   - **Clear the Command field** (make it empty or remove `/bin/sh`)
   - Leave Arguments empty
4. Click **Save**

### Step 2: Redeploy

1. Go back to **General** tab
2. Click **Deploy** or **Rebuild** button
3. Wait for deployment to complete

### Step 3: Verify

After redeployment:
```bash
curl -I https://financial-literacy.qualiaai.fr
```

Should return `HTTP/2 200` instead of `404`.

## Why This Happened

The default `/bin/sh` might have been set as a placeholder during initial configuration. When left empty, Dokploy uses the Dockerfile's CMD instruction.

## Correct Dockerfile CMD

From `Dockerfile`:
```dockerfile
CMD ["node", "apps/web/server.js"]
```

This is the command that should run when the container starts.

---

**Action Required**: Clear the Run Command field in Advanced settings and redeploy.

