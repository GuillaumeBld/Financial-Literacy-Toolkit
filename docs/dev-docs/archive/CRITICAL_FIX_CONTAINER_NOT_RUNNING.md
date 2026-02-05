# CRITICAL: Container Not Running

**Date**: January 7, 2026  
**Root Cause Identified**: Container is NOT running - Traefik has no backend to route to

## Diagnosis

### Evidence
1. **n8n.qualiaai.fr** - Works (returns HTML) - container is running
2. **financial-literacy.qualiaai.fr** - Returns 404 - container NOT running
3. **bytebot.qualiaai.fr** - Returns 404 - container NOT running (same issue)

### The 404 Response
```
HTTP/2 404 
x-content-type-options: nosniff
```
This is Traefik's default 404 response when there's NO BACKEND SERVICE to route to.

## Root Cause

The deployment shows "Done" but this only means the **build** completed, not that the **container is running**.

Possible reasons:
1. Container started but crashed immediately
2. Container is in "stopped" state
3. Container failed health check and was stopped

## SOLUTION

### Step 1: Check Container Status in Dokploy

1. Go to: **Projects** → **financial-literacy-assessment** → **financial-literacy-web**
2. Look for the container status indicator:
   - ✅ Green = Running
   - ⚠️ Yellow = Starting/Stopping
   - ❌ Red = Stopped/Crashed

### Step 2: Check Logs Tab

1. In the application view, click **"Logs"** tab
2. Look for error messages:
   - Database connection errors
   - Port binding errors
   - Module not found errors
   - Any crash messages

### Step 3: Manually Start the Container

If container is stopped:
1. Click **"Deploy"** button (in General tab)
2. Or click **"Reload"** button
3. Watch the deployment logs for errors

### Step 4: Check Environment Variables

Critical environment variables needed:
```
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://finlit_user:PASSWORD@finlit-postgres-db-g6ifwu:5432/financial_literacy
```

If DATABASE_URL is missing or wrong, the container will crash.

## Most Likely Issue: Database Connection

Looking at the build logs:
```
DATABASE_URL environment variable is not set. Database operations will fail.
Error: connect ECONNREFUSED ::1:5432
```

This was during build (expected), but at RUNTIME:
- DATABASE_URL must be set in Environment Variables
- PostgreSQL container must be running
- Network connectivity must exist between containers

### Check PostgreSQL Container

In Dokploy:
1. Look for the PostgreSQL database (`financial-literacy-db`)
2. Verify it's running
3. Verify the service name matches: `finlit-postgres-db-g6ifwu`

## Quick Fix Checklist

- [ ] Go to application in Dokploy
- [ ] Check if container status is "Running" or "Stopped"
- [ ] If stopped, check "Logs" tab for errors
- [ ] Verify DATABASE_URL in Environment Variables
- [ ] Verify PostgreSQL container is running
- [ ] Click "Deploy" to restart the container
- [ ] Wait 1-2 minutes
- [ ] Test website: https://financial-literacy.qualiaai.fr

## What You Should See in Logs (If Working)

Successful startup logs should show:
```
Ready in <X>ms
Server listening on port 3000
```

## What You Might See (If Crashing)

Error logs might show:
```
Error: connect ECONNREFUSED
Error: DATABASE_URL not set
Error: Cannot find module 'server.js'
```

## Next Steps

1. **Check container status** - Is it running?
2. **Check logs** - What errors are showing?
3. **Verify environment variables** - Is DATABASE_URL set correctly?
4. **Verify PostgreSQL** - Is the database container running?
5. **Restart** - Click Deploy to restart everything

Please check the container status and logs in Dokploy and share what you find!

