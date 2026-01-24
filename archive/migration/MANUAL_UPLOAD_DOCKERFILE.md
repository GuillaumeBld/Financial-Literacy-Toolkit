# Manual Upload Dockerfile - Quick Solution

## Issue

Git push and GitHub API are both failing with permission errors, even though tokens show write permissions. This might be due to:
- Fine-grained token restrictions
- Branch protection rules
- Organization-level security settings

## Quick Solution: Manual Upload via GitHub Web

Since automated push isn't working, here's the fastest way to get the Dockerfile into GitHub:

### Step 1: Copy Dockerfile Content

The Dockerfile is ready at: `/root/Financial-Literacy-Toolkit/Dockerfile`

### Step 2: Upload via GitHub Web Interface

1. **Go to**: https://github.com/GuillaumeBld/Financial-Literacy-Toolkit
2. **Click**: "Add file" → "Create new file" (top right)
3. **File name**: `Dockerfile` (exactly this name, in root)
4. **Paste the Dockerfile content** (see below)
5. **Commit message**: `Add root-level Dockerfile for Dokploy deployment`
6. **Select**: "Commit directly to the `main` branch"
7. **Click**: "Commit new file"

### Step 3: Dockerfile Content

Copy this entire content:

```dockerfile
# Root-level Dockerfile for Dokploy deployment
# This Dockerfile is used when Build Path is set to "." (root)
# It builds the Next.js app from apps/web

# Stage 1: Dependencies
FROM node:18-alpine AS deps
WORKDIR /app

# Install dependencies needed for native modules
RUN apk add --no-cache libc6-compat

# Copy package files
COPY package.json package-lock.json* ./
COPY apps/web/package.json ./apps/web/
COPY pnpm-workspace.yaml ./

# Install dependencies
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps

# Stage 2: Builder
FROM node:18-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/pnpm-workspace.yaml ./pnpm-workspace.yaml

# Copy application source
COPY apps/web ./apps/web
COPY . .

# Set working directory to app
WORKDIR /app/apps/web

# Set build-time environment variables
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application
RUN npm run build

# Stage 3: Runner
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
# With standalone output, the structure is different
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./.next/static

# Set correct permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

# Expose port
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the application (standalone output puts server.js in root)
CMD ["node", "server.js"]
```

### Step 4: After Upload

1. **Wait 10-30 seconds** for GitHub to update
2. **Verify**: https://github.com/GuillaumeBld/Financial-Literacy-Toolkit
   - You should see `Dockerfile` in the root directory
3. **Redeploy in Dokploy**:
   - Go to Deployments tab
   - Click "Deploy"
   - Should work now! ✅

## Alternative: Push from Local Machine

If you have the repo on your local machine:

```bash
cd /path/to/Financial-Literacy-Toolkit
git pull origin main
git push origin main
```

This will push all 3 commits including the Dockerfile.

## Why This Works

Manual upload bypasses token permission issues and directly commits to the repository. Once the Dockerfile is in GitHub, Dokploy can find it and build successfully.

