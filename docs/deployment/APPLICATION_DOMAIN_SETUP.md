# Application Domain Setup Guide

**Date**: January 7, 2026  
**Important**: Domain must be configured at the **Application Level**, not Server Level

## Current Situation

You're viewing the **Server-level** configuration (Web Server settings), but the domain needs to be configured at the **Application-level**.

## Where to Configure the Domain

### Step 1: Navigate to Application Settings

1. In Dokploy dashboard, go to: **Projects** → **financial-literacy-assessment** → **financial-literacy-web**
2. You should see tabs: **"General"**, **"Environment"**, **"Domains"**, **"Deployments"**
3. Click on **"Domains"** tab (NOT the server-level "Web Server" settings)

### Step 2: Add Application Domain

In the **"Domains"** tab of the application:

1. Look for a list of domains (might be empty)
2. Click **"Add Domain"** or **"+"** button
3. Enter: `financial-literacy.qualiaai.fr`
4. Enable **SSL/HTTPS** (Let's Encrypt)
5. Click **"Save"** or **"Add"**

### Step 3: Verify Domain Configuration

After adding the domain, you should see:
- Domain: `financial-literacy.qualiaai.fr`
- Status: Active/Enabled
- SSL: Valid (or Pending, wait 1-2 minutes)

## Difference: Server Domain vs Application Domain

### Server Domain (What you're currently viewing)
- Location: Settings → Web Server
- Purpose: Server-level domain (e.g., `dokploy.qualiaai.fr`)
- Current: `dokploy.com` (this is fine for the server)

### Application Domain (What you need to configure)
- Location: Application → Domains tab
- Purpose: Application-specific domain
- Required: `financial-literacy.qualiaai.fr`

## Why This Matters

- **Server Domain**: Used for accessing Dokploy itself
- **Application Domain**: Used for routing traffic to your specific application container

Traefik needs to know that `financial-literacy.qualiaai.fr` should route to your `financial-literacy-web` container. This is configured in the application's "Domains" tab, not the server settings.

## Verification Steps

After adding the domain in the application's "Domains" tab:

1. **Wait 1-2 minutes** for Traefik to update routing
2. **Test website**: https://financial-literacy.qualiaai.fr
3. **Test API**: https://financial-literacy.qualiaai.fr/api/test

Expected results:
- ✅ Website loads (HTTP 200)
- ✅ API responds correctly

## Quick Navigation Path

```
Dokploy Dashboard
  → Projects
    → financial-literacy-assessment
      → production (or your environment)
        → financial-literacy-web
          → [Click "Domains" tab]
            → Add Domain: financial-literacy.qualiaai.fr
```

## Current Status Summary

✅ **DNS**: Correctly configured (`82.25.112.7`)  
✅ **Build**: Working perfectly  
✅ **Deployments**: Completing successfully  
⚠️ **Domain**: Needs to be added in Application → Domains tab  
❌ **Website**: Returns 404 (will work after domain is added)

Once you add `financial-literacy.qualiaai.fr` in the application's "Domains" tab, Traefik will automatically route traffic to your container and the website will be accessible!

