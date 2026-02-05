# VPS Troubleshooting Guide - financial-literacy.qualiaai.fr

**Date**: January 7, 2026  
**Issue**: Website returning 404 Not Found  
**Status**: ⚠️ **VPS/Traefik Configuration Issue**

## Current Status

### ✅ Working Components
- DNS Configuration: `financial-literacy.qualiaai.fr` → `82.25.112.7` ✅
- DNS Resolution: Working correctly ✅
- VPS Server: `82.25.112.7` (Hostinger VPS) ✅

### ❌ Issues Found
- Website returns **404 Not Found** on both HTTP and HTTPS
- Application container likely not running or not routed by Traefik

## Root Cause Analysis

The 404 error indicates that:
1. Traefik is receiving requests for `financial-literacy.qualiaai.fr`
2. Traefik cannot find a route/service for this domain
3. This means either:
   - The application container is not running
   - Traefik labels are missing or incorrect
   - Dokploy deployment was not completed

## Diagnostic Steps

### Step 1: Check Dokploy Dashboard

1. **Access Dokploy**: https://dokploy.qualiaai.fr
2. **Navigate to**: Projects → `financial-literacy-assessment` → `financial-literacy-web`
3. **Check Status**:
   - Is the application status "Running" or "Done"?
   - Are there any failed deployments?
   - Check the "Deployments" tab for recent activity

### Step 2: Verify Application Container

If you have SSH access to the VPS:

```bash
# SSH to VPS
ssh root@82.25.112.7

# Check if application container is running
docker ps | grep financial-literacy

# Check all containers
docker ps -a

# Check Traefik logs for routing issues
docker logs traefik --tail 100 | grep financial-literacy

# Check application container logs
docker logs <container_name> --tail 100
```

### Step 3: Check Traefik Configuration

Traefik should have labels on the application container:

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.financial-literacy.rule=Host(`financial-literacy.qualiaai.fr`)"
  - "traefik.http.routers.financial-literacy.entrypoints=websecure"
  - "traefik.http.routers.financial-literacy.tls.certresolver=letsencrypt"
  - "traefik.http.routers.financial-literacy.service=financial-literacy-service"
  - "traefik.http.services.financial-literacy-service.loadbalancer.server.port=3000"
```

## Solutions

### Solution 1: Complete Deployment in Dokploy

If the application is not deployed:

1. **Go to Dokploy Dashboard**
2. **Navigate to**: Projects → `financial-literacy-assessment` → `financial-literacy-web`
3. **Click "Deploy" or "Redeploy"**
4. **Monitor the deployment logs**
5. **Wait for deployment to complete** (2-5 minutes)
6. **Verify status shows "Running"**

### Solution 2: Verify Domain Configuration in Dokploy

1. **Go to**: Projects → `financial-literacy-assessment` → `financial-literacy-web`
2. **Click "Domains" tab**
3. **Verify**: `financial-literacy.qualiaai.fr` is listed
4. **Check**: SSL certificate status (should be "Valid" or "Pending")
5. **If domain is missing**: Add it manually

### Solution 3: Check GitHub Provider Link

1. **Go to**: Projects → `financial-literacy-assessment` → `financial-literacy-web`
2. **Click "General" tab**
3. **Under "Source"**:
   - Verify GitHub Provider is selected
   - Verify Repository: `GuillaumeBld/Financial-Literacy-Toolkit`
   - Verify Branch: `main`
4. **If not linked**: Select GitHub Provider and save

### Solution 4: Manual Container Check (via SSH)

If you have SSH access:

```bash
# Check if container exists
docker ps -a | grep financial

# Check Traefik service discovery
docker exec traefik wget -qO- http://localhost:8080/api/http/routers | grep financial-literacy

# Check Traefik services
docker exec traefik wget -qO- http://localhost:8080/api/http/services | grep financial-literacy
```

### Solution 5: Restart Application Container

If container exists but is not responding:

```bash
# Restart the container
docker restart <container_name>

# Or via Dokploy dashboard: Click "Restart" button
```

### Solution 6: Check Environment Variables

1. **In Dokploy Dashboard**: Go to application → "Environment Variables"
2. **Verify all required variables are set**:
   - `NODE_ENV=production`
   - `PORT=3000`
   - `DATABASE_URL=postgresql://...`
   - `POSTGRES_USER=finlit_user`
   - `POSTGRES_PASSWORD=...`
   - `POSTGRES_DB=financial_literacy`

## Quick Fix Checklist

- [ ] Check Dokploy dashboard for application status
- [ ] Verify domain is configured in Dokploy
- [ ] Check if GitHub provider is linked
- [ ] Trigger deployment if not running
- [ ] Verify container is running (via SSH or Dokploy)
- [ ] Check Traefik logs for routing errors
- [ ] Verify environment variables are set
- [ ] Test website after fixes

## Expected Behavior After Fix

Once fixed, you should see:

```bash
# HTTPS should return 200 OK
curl -I https://financial-literacy.qualiaai.fr
# HTTP/2 200

# HTTP should redirect to HTTPS (or return 200)
curl -I http://financial-literacy.qualiaai.fr
# HTTP/1.1 301 Moved Permanently
# Location: https://financial-literacy.qualiaai.fr
```

## Next Steps

1. **Access Dokploy Dashboard**: https://dokploy.qualiaai.fr
2. **Check application status**
3. **Complete deployment if needed**
4. **Verify domain configuration**
5. **Test website**: https://financial-literacy.qualiaai.fr

## Contact Points

- **Dokploy Dashboard**: https://dokploy.qualiaai.fr
- **VPS IP**: 82.25.112.7
- **Domain**: financial-literacy.qualiaai.fr
- **Application**: financial-literacy-web (ID: sIdrzBlAtbsACJ9Lr--Pc)

