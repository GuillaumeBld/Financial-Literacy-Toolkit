# Dockerfile Fix for Deployment

## Issue

Deployment was failing with:
```
cannot create /etc/dokploy/applications/.../code/apps/web/apps/web/.env: Directory nonexistent
```

This indicated a path duplication issue with the Dockerfile and standalone output.

## Fix Applied

Updated the Dockerfile to correctly handle Next.js standalone output:

### Changes Made

1. **Fixed static files path**:
   - Changed: `./apps/web/.next/static` 
   - To: `./.next/static`

2. **Fixed public files path**:
   - Changed: `./apps/web/public`
   - To: `./public`

3. **Fixed server.js path**:
   - Changed: `CMD ["node", "apps/web/server.js"]`
   - To: `CMD ["node", "server.js"]`

### Why This Works

With Next.js `output: 'standalone'`, the build process creates a self-contained output where:
- `server.js` is in the root of the standalone directory
- Static files are in `.next/static` relative to the root
- Public files are in `public` relative to the root

The Dockerfile now correctly copies these files to the expected locations.

## Next Steps

1. **Push the fix**:
   ```bash
   git push origin main
   ```

2. **Redeploy in Dokploy**:
   - The deployment should now succeed
   - Dokploy will pull the updated Dockerfile
   - Build should complete successfully

## Verification

After deployment, verify:
- ✅ Build completes without path errors
- ✅ Container starts successfully
- ✅ Application is accessible at https://financial-literacy.qualiaai.fr

