# Multi-stage Dockerfile for Next.js Application
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

# Build the application
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
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

# Copy public assets - copy to both root and apps/web locations
# Root level for direct URL access, apps/web for server.js relative paths
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder /app/apps/web/public ./apps/web/public

# Copy standalone server files - copy entire standalone directory
# With standalone mode, if app is at apps/web, standalone is at .next/standalone/apps/web
# Copying .next/standalone to root preserves the apps/web structure
COPY --from=builder /app/apps/web/.next/standalone ./

# Debug: Check standalone structure and find server.js location
RUN echo "=== Debug: Finding server.js ===" && \
    find . -name "server.js" -type f 2>/dev/null && \
    echo "=== Checking apps/web structure ===" && \
    ls -la apps/web/ 2>/dev/null | head -20 || echo "apps/web directory not found" && \
    echo "=== Checking root structure ===" && \
    ls -la . 2>/dev/null | head -20

# Copy static files - Next.js standalone server expects static files at .next/static
# relative to where server.js runs. Since server.js is at apps/web/server.js,
# static files should be at apps/web/.next/static
# Also copy to root level for URL path /_next/static/ to work
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
# With standalone mode from apps/web, server.js is at apps/web/server.js
# We need to run it from that directory so it can find .next/static relative to it
WORKDIR /app/apps/web
CMD ["node", "server.js"]



