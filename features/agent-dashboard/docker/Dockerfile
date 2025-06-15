# Multi-stage Docker build for Agent Dashboard
# Production-ready deployment configuration from agent_dashboard_plan.md

# === BUILD STAGE ===
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git \
    openssh-client

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Generate Prisma client
RUN npx prisma generate

# === RUNTIME STAGE ===
FROM node:20-alpine AS runtime

# Install runtime dependencies
RUN apk add --no-cache \
    dumb-init \
    curl \
    postgresql-client

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S dashboard -u 1001

# Set working directory
WORKDIR /app

# Copy built application
COPY --from=builder --chown=dashboard:nodejs /app/dist ./dist
COPY --from=builder --chown=dashboard:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=dashboard:nodejs /app/package*.json ./
COPY --from=builder --chown=dashboard:nodejs /app/prisma ./prisma

# Copy startup scripts
COPY --chown=dashboard:nodejs docker/entrypoint.sh ./
COPY --chown=dashboard:nodejs docker/healthcheck.sh ./
RUN chmod +x entrypoint.sh healthcheck.sh

# Create data directories
RUN mkdir -p /app/data /app/logs && \
    chown -R dashboard:nodejs /app/data /app/logs

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV PROMETHEUS_PORT=9090
ENV DATABASE_URL="postgresql://dashboard:password@postgres:5432/agent_dashboard"
ENV JWT_SECRET=""
ENV ANTHROPIC_API_KEY=""

# Expose ports
EXPOSE 3000 9090

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD ./healthcheck.sh

# Switch to non-root user
USER dashboard

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["./entrypoint.sh"]

# Labels
LABEL maintainer="Agent Dashboard Team"
LABEL version="1.0.0"
LABEL description="Revolutionary AI development dashboard with Claude Code orchestration"