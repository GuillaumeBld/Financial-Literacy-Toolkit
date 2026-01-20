# Root-level Dockerfile for Dokploy deployment
# This Dockerfile is used when Build Path is set to "." (root)
# It builds the Next.js app from apps/web

# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Install dependencies needed for native modules
RUN apk add --no-cache libc6-compat

# Copy package files - install dependencies from apps/web where pg is declared
COPY apps/web/package.json ./apps/web/package.json
# Copy package-lock.json if it exists (wildcard matches 0 files if missing - handled in RUN)
COPY apps/web/package-lock.json* ./apps/web/

# Install dependencies from apps/web (where pg and other dependencies are declared)
WORKDIR /app/apps/web
RUN if [ -f package-lock.json ]; then npm ci --legacy-peer-deps || npm install --legacy-peer-deps; else npm install --legacy-peer-deps; fi
WORKDIR /app

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/apps/web/package.json ./apps/web/package.json

# Copy application source
COPY apps/web ./apps/web
COPY . .

# Set working directory to app
WORKDIR /app/apps/web

# Set build-time environment variables
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
ENV NEXT_TELEMETRY_DISABLED=1

# Ensure public directory exists before build
RUN mkdir -p /app/apps/web/public

# Build the application
RUN npm run build

# Verify standalone output was created and show structure for debugging
RUN ls -la /app/apps/web/.next/ 2>&1 || echo "No .next directory found"
RUN if [ -d /app/apps/web/.next/standalone ]; then \
      echo "Standalone directory exists at /app/apps/web/.next/standalone"; \
      ls -la /app/apps/web/.next/standalone/; \
    else \
      echo "Standalone directory NOT found at expected path"; \
      find /app/apps/web/.next -name "standalone" -type d 2>&1 || echo "Could not find standalone directory anywhere"; \
    fi

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone output - handle different possible locations
# The standalone output includes the server at apps/web/server.js
COPY --from=builder /app/apps/web/.next/standalone ./

# Copy static files to the correct location relative to standalone server
# In standalone mode, server runs from /app and executes apps/web/server.js
# Static files need to be at apps/web/.next/static relative to /app
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static

# Copy public directory to match server location
# Public files should be at apps/web/public relative to /app
COPY --from=builder /app/apps/web/public ./apps/web/public

# Set correct permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

# Expose port
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the application (standalone output preserves directory structure)
CMD ["node", "apps/web/server.js"]

