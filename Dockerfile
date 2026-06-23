# =============================================================================
# Multi-stage Dockerfile for Project & Task Management API
# =============================================================================

# ----- Stage 1: Build -----
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies first to leverage Docker layer caching
COPY package.json package-lock.json* yarn.lock* ./
RUN npm install

# Copy source and compile TypeScript
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# Prune dev dependencies for the runtime image
RUN npm prune --production

# ----- Stage 2: Runtime -----
FROM node:22-alpine AS runtime

ENV NODE_ENV=production

WORKDIR /app

# Copy only what we need from the builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

# Create a non-root user for security and ensure writable app directories
RUN addgroup -S appgroup && adduser -S appuser -G appgroup \
  && mkdir -p /app/logs \
  && chown -R appuser:appgroup /app
USER appuser

EXPOSE 3000

# Healthcheck hits the /api/v1/health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/v1/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/server.js"]
