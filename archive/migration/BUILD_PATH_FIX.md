# Build Path Configuration Fix

## Issue

The deployment error shows:
```
cannot create /etc/dokploy/applications/.../code/apps/web/apps/web/.env: Directory nonexistent
```

This indicates that Dokploy's **Build Path** is set to `/apps/web`, but the Dockerfile expects to run from the repository root.

## Solution

You have two options:

### Option 1: Change Build Path in Dokploy (Recommended)

1. Go to: **Projects** → **financial-literacy-assessment** → **financial-literacy-web**
2. Click **"General"** tab
3. Find **"Build Path"** field
4. Change from: `/apps/web`
5. To: `.` (root directory)
6. Click **"Save"**

This way, the Dockerfile runs from the repository root as expected.

### Option 2: Keep Build Path as `/apps/web` and Update Dockerfile

If you want to keep the build path as `/apps/web`, we need to create a different Dockerfile that works from that directory. However, this is more complex because the Dockerfile needs access to the root `package.json`.

## Current Dockerfile Expectation

The current Dockerfile expects:
- **Build Context**: Root of repository (`.`)
- **Dockerfile Path**: `apps/web/Dockerfile`
- **Working Directory**: Changes to `/app/apps/web` during build

## Recommended Fix

**Change Build Path to `.` (root)** in Dokploy dashboard. This is the simplest solution and matches how the Dockerfile is structured.

After changing:
1. **Save** the application settings
2. **Redeploy** - it should work now!

## What I Fixed

I already updated the Dockerfile to correctly handle Next.js standalone output:
- ✅ Fixed `server.js` path (now `server.js` instead of `apps/web/server.js`)
- ✅ Fixed static files path (now `.next/static` instead of `apps/web/.next/static`)
- ✅ Fixed public files path (now `public` instead of `apps/web/public`)

Now you just need to set the Build Path to `.` in Dokploy!

