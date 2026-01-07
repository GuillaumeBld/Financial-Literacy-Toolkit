# Multi-stage Dockerfile for Next.js Application
# Stage 1: Dependencies
FROM node:18-alpine AS deps
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
FROM node:18-alpine AS builder
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
# With standalone output, Next.js creates a minimal server in .next/standalone
# The standalone directory structure mirrors the app structure
# Since we build from apps/web, standalone output is at .next/standalone/apps/web
# We need to copy the entire standalone directory structure

# Copy public assets
COPY --from=builder /app/apps/web/public ./public

# Copy standalone server files - copy entire standalone directory
# This preserves the directory structure that Next.js expects
# With standalone mode, if app is at apps/web, standalone is at .next/standalone/apps/web
COPY --from=builder /app/apps/web/.next/standalone ./

# Copy static files - these must be accessible at .next/static relative to server.js
# The standalone structure includes apps/web, so static files should be at apps/web/.next/static
# But we also copy them to root .next/static for direct access
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/.next/static ./.next/static

# Set correct permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

# Expose port
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the application
# With standalone mode, server.js location depends on app structure
# Try to find and run server.js from the correct location
CMD ["sh", "-c", "if [ -f apps/web/server.js ]; then cd apps/web && node server.js; elif [ -f server.js ]; then node server.js; else find . -name server.js -type f -exec sh -c 'cd $(dirname {}) && node $(basename {})' \\;; fi"]



