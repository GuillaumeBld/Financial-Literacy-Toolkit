# Root Dockerfile Fix

## Issue

Deployment failed with:
```
ERROR: failed to build: failed to solve: failed to read dockerfile: open Dockerfile: no such file or directory
```

This happened because:
- Build Path was set to `.` (root)
- Dockerfile Path was set to `apps/web/Dockerfile`
- Dokploy was looking for `Dockerfile` in the root, not `apps/web/Dockerfile`

## Solution

Created a root-level `Dockerfile` that:
- ✅ Works when Build Path is `.` (root)
- ✅ Builds the Next.js app from `apps/web`
- ✅ Uses the same multi-stage build process
- ✅ Correctly handles Next.js standalone output

## Configuration Updated

Updated application settings via API:
- **Build Path**: `.` (root)
- **Dockerfile Path**: `Dockerfile` (root level)
- **Docker Context Path**: `.` (root)

## Next Steps

1. **Push the new Dockerfile**:
   ```bash
   git push origin main
   ```

2. **Redeploy in Dokploy**:
   - The deployment should now find the Dockerfile
   - Build should proceed successfully

## File Structure

```
Financial-Literacy-Toolkit/
├── Dockerfile          ← New root-level Dockerfile for Dokploy
├── apps/
│   └── web/
│       ├── Dockerfile  ← Original (still works for other deployments)
│       └── ...
└── ...
```

Both Dockerfiles are identical and work the same way. The root one is for Dokploy when Build Path is `.`.

