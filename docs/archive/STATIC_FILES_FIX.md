# Static Files (CSS) Fix

## Problem
CSS and other static files were returning 404 errors, causing the website to display without styling.

## Root Cause
The Dockerfile was copying static files to the wrong location. In Next.js standalone mode:
- Server runs from `/app` and executes `apps/web/server.js`
- Static files must be at `apps/web/.next/static` relative to `/app`
- The Dockerfile was copying them to `./.next/static` instead

## Fix Applied
Updated `Dockerfile` to copy static files to the correct location:
```dockerfile
# Copy static files to the correct location relative to standalone server
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static

# Copy public directory to match server location
COPY --from=builder /app/apps/web/public ./apps/web/public
```

## Next Steps

### Option 1: Automatic Rebuild (if Autodeploy is enabled)
Dokploy should automatically detect the push and rebuild. Wait 2-3 minutes, then check the website.

### Option 2: Manual Rebuild
1. Go to Dokploy: **financial-literacy-web** > **General** tab
2. Click **Rebuild** button
3. Wait for build to complete (2-3 minutes)
4. Test the website: https://financial-literacy.qualiaai.fr

## Verification
After rebuild, verify CSS is loading:
```bash
curl -I https://financial-literacy.qualiaai.fr/_next/static/css/*.css
```
Should return `HTTP/2 200` instead of `404`.

## Status
✅ Fix committed and pushed to `main` branch
⏳ Waiting for Dokploy rebuild
🔍 CSS should load correctly after rebuild

