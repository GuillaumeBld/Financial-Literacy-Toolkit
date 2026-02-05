# Dokploy Deployment Fix Instructions

**Date**: January 7, 2026  
**Issue**: Build completed but website returns 404  
**Solution**: Verify and complete deployment in Dokploy dashboard

## Current Status

✅ **Build Completed**: Docker image built successfully  
❌ **Website**: Returns 404 Not Found  
⚠️ **Issue**: Container may not be running or Traefik routing not configured

## Root Cause

The Docker build completed successfully, but the deployment process requires:
1. **Container must be started** after build
2. **Domain must be configured** in Dokploy
3. **Traefik must route** the domain to the container

## Step-by-Step Fix

### Step 1: Access Dokploy Dashboard

1. Go to: **https://dokploy.qualiaai.fr**
2. Log in if needed
3. Navigate to: **Projects** → **financial-literacy-assessment** → **financial-literacy-web**

### Step 2: Check Deployment Status

1. Click on **"Deployments"** tab
2. Look for the latest deployment
3. Check the status:
   - ✅ **"Running"** or **"Done"** = Container is running
   - ⚠️ **"Built"** = Image built but container not started
   - ❌ **"Failed"** = Check logs for errors

### Step 3: Start/Redeploy Container (If Needed)

If the deployment shows "Built" but not "Running":

1. Click **"Deploy"** or **"Redeploy"** button
2. Wait for deployment to complete (2-5 minutes)
3. Monitor the logs for any errors
4. Status should change to "Running" or "Done"

### Step 4: Verify Domain Configuration

1. In the application settings, click **"Domains"** tab
2. Check if `financial-literacy.qualiaai.fr` is listed:
   - ✅ **If listed**: Verify it's enabled/active
   - ❌ **If missing**: Click "Add Domain" and add it

3. **Add Domain** (if missing):
   - Domain: `financial-literacy.qualiaai.fr`
   - Enable SSL: ✅ Yes (Let's Encrypt)
   - Click "Save"
   - Wait for SSL certificate generation (1-2 minutes)

### Step 5: Check Container Logs

1. Click on **"Logs"** tab
2. Look for:
   - ✅ Container startup messages
   - ✅ "Server listening on port 3000"
   - ❌ Database connection errors
   - ❌ Port binding errors

### Step 6: Verify Environment Variables

1. Click on **"Environment Variables"** tab
2. Verify all required variables are set:
   ```
   NODE_ENV=production
   PORT=3000
   DATABASE_URL=postgresql://finlit_user:FinLit2025SecurePassword@finlit-postgres-db-g6ifwu:5432/financial_literacy
   POSTGRES_USER=finlit_user
   POSTGRES_PASSWORD=FinLit2025SecurePassword
   POSTGRES_DB=financial_literacy
   ```

3. **Important**: Ensure `DATABASE_URL` uses the correct service name:
   - ✅ Correct: `finlit-postgres-db-g6ifwu`
   - ❌ Wrong: `localhost`, `postgres`, or `127.0.0.1`

### Step 7: Test Website

After completing the above steps:

1. **Wait 1-2 minutes** for changes to propagate
2. **Test HTTPS**: https://financial-literacy.qualiaai.fr
3. **Test API**: https://financial-literacy.qualiaai.fr/api/test

Expected results:
- ✅ Website loads (HTTP 200)
- ✅ API returns: `{"success":true,"database":"connected",...}`

## Common Issues and Solutions

### Issue 1: Container Not Starting

**Symptom**: Build completed but container status shows "Stopped" or "Error"

**Solution**:
1. Check container logs for errors
2. Verify environment variables are correct
3. Check database connection (ensure PostgreSQL container is running)
4. Try restarting the container

### Issue 2: Domain Not Routing

**Symptom**: Container running but website returns 404

**Solution**:
1. Verify domain is added in "Domains" tab
2. Check Traefik logs (if accessible)
3. Ensure domain is enabled/active
4. Wait 1-2 minutes for Traefik to update routing

### Issue 3: SSL Certificate Not Generated

**Symptom**: Domain configured but SSL certificate pending

**Solution**:
1. Verify DNS is correctly pointing to `82.25.112.7`
2. Ensure port 80 is accessible (required for Let's Encrypt challenge)
3. Wait 5-10 minutes for certificate generation
4. Check Traefik logs for ACME errors

### Issue 4: Database Connection Failed

**Symptom**: Container starts but crashes or can't connect to database

**Solution**:
1. Verify PostgreSQL container is running
2. Check `DATABASE_URL` uses correct service name: `finlit-postgres-db-g6ifwu`
3. Verify database credentials are correct
4. Ensure both containers are on the same Docker network

## Verification Checklist

After completing the fix, verify:

- [ ] Container status shows "Running" or "Done"
- [ ] Domain `financial-literacy.qualiaai.fr` is configured and enabled
- [ ] SSL certificate is valid (not pending)
- [ ] Container logs show no errors
- [ ] Website loads at https://financial-literacy.qualiaai.fr
- [ ] API endpoint responds: `/api/test`
- [ ] Database connection is working

## Quick Reference

- **Dokploy Dashboard**: https://dokploy.qualiaai.fr
- **Website**: https://financial-literacy.qualiaai.fr
- **API Test**: https://financial-literacy.qualiaai.fr/api/test
- **VPS IP**: 82.25.112.7
- **Application ID**: sIdrzBlAtbsACJ9Lr--Pc
- **Project**: financial-literacy-assessment

## Next Steps After Fix

Once the website is working:

1. **Test all functionality**:
   - Homepage loads
   - Assessment submission works
   - API endpoints respond correctly

2. **Monitor logs** for any runtime errors

3. **Set up monitoring** (if not already done)

4. **Document any issues** encountered for future reference

