# ============================================
# Unified Multi-Platform Dockerfile
# ============================================
# Optimized multi-stage build using Debian slim and Next.js standalone output
#
# Optimization Features:
# - Debian slim images for native binary compatibility (glibc)
# - Next.js standalone output (bundles only required dependencies, 123MB vs 901MB)
# - No webpack build cache copied (saves ~297MB)
# - Ownership set during COPY (prevents layer duplication, saves ~328MB)
# - Minimal runtime scripts (only turso-migrate.js + unified-entrypoint.sh)
#
# Platform Support:
# - Unified entrypoint with auto-detection
# - Render.com, Cloudflare Containers, Fly.io, Google Cloud Run
#
# Database Support:
# - SQLite (file:) - Standard Prisma migrations
# - Turso (libsql:) - Native libsql client with Prisma adapter
# - PostgreSQL/MySQL - Standard Prisma migrations
#
# Image Size: ~385MB (Debian slim base provides better native binary compatibility)
# ============================================

# Multi-stage build for optimized production image
# Stage 1: Builder
FROM node:24-slim AS builder
# Install OpenSSL for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Copy package files and install all dependencies (including dev)
COPY package.json package-lock.json ./
RUN npm ci && \
    npm cache clean --force

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the Next.js application
# Set dummy DATABASE_URL for build time (will be overridden at runtime)
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="file:./db/dummy.db"
RUN npm run build

# Stage 2: Runner (production image)
# Using Debian slim for native binary compatibility (libsql, Prisma engines)
FROM node:24-slim AS runner
# Install OpenSSL for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Create non-root user for security (Debian syntax)
RUN groupadd -g 1001 nodejs && \
    useradd -u 1001 -g nodejs -m nextjs

# Set environment to production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PRISMA_SKIP_CLIENT_VALIDATION=true

# Copy necessary files from builder stage with proper ownership
# Note: .next/standalone already includes node_modules with all runtime dependencies
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Create empty cache directory for runtime (don't copy build cache - it's not needed)
# Next.js will regenerate cache as needed during runtime
RUN mkdir -p ./.next/cache && \
    chown -R nextjs:nodejs ./.next/cache && \
    chmod -R 755 ./.next/cache

# Clean up build artifacts to reduce size
RUN find /app -name "*.map" -delete && \
    find /app -name "*.d.ts" -delete && \
    find /app -name "README*" -delete && \
    rm -rf /tmp/* /var/tmp/* 2>/dev/null || true

# Copy Prisma schema and migrations for runtime
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Copy only required runtime scripts (not dev/setup scripts)
COPY --from=builder --chown=nextjs:nodejs /app/scripts/turso-migrate.js ./scripts/turso-migrate.js
COPY --from=builder --chown=nextjs:nodejs /app/scripts/unified-entrypoint.sh ./scripts/unified-entrypoint.sh
RUN chmod +x ./scripts/unified-entrypoint.sh

# Copy email templates for runtime
COPY --from=builder --chown=nextjs:nodejs /app/templates ./templates

# Copy database files if they exist (for SQLite databases)
# External databases (PostgreSQL, MySQL, Turso) use different DATABASE_URL formats
# Database location is always ./db/prod.db from project root
RUN --mount=from=builder,source=/app,target=/tmp/builder \
    mkdir -p /app/db && \
    chown -R nextjs:nodejs /app/db && \
    chmod -R 755 /app/db && \
    if [ -d "/tmp/builder/db" ] && [ "$(ls -A /tmp/builder/db 2>/dev/null)" ]; then \
        cp -r /tmp/builder/db/* /app/db/ 2>/dev/null || true; \
        chown -R nextjs:nodejs /app/db; \
        echo "✓ Copied database files from ./db/"; \
    else \
        echo "ℹ️  No database files found in ./db/"; \
    fi

# Copy CLI tools (.bin) from builder stage for Prisma migrations
# Standalone output doesn't include .bin directory since Next.js doesn't need CLI tools
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.bin ./node_modules/.bin

# Copy Prisma generated client and engines from builder stage
# Note: node_modules base packages are already included in .next/standalone copy above
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

# Copy libsql/Turso modules for native database connections
# These are dynamically required and not included in standalone output
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@libsql ./node_modules/@libsql
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma/adapter-libsql ./node_modules/@prisma/adapter-libsql

# Switch to non-root user (using numeric UID for Kubernetes security compliance)
# This satisfies runAsNonRoot: true requirements by using numeric user ID
USER 1001:1001

# Expose port range (Render auto-assigns port via PORT env var)
EXPOSE 3000 10000

# Environment variables will be read from external environment at runtime
# The following are common variables that should be set:
# DATABASE_URL - Database connection string (SQLite: file:../db/prod.db, Turso: libsql://...)
# TURSO_AUTH_TOKEN - Required for Turso/libSQL databases (obtain from Turso dashboard)
# AUTH_SECRET - Secret key for JWT tokens (required by Auth.js v5)
# NEXTAUTH_SECRET - Must match AUTH_SECRET for compatibility
# NEXT_PUBLIC_APP_URL - Public URL of the application
# EMAIL_FROM - Default from email address

# Use unified entrypoint script for database initialization and platform detection
ENTRYPOINT ["/app/scripts/unified-entrypoint.sh"]

# Start the application
CMD ["node", "server.js"]
