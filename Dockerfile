# PortfolioCMS — production Dockerfile (Next.js standalone output).
# Multi-stage: tiny final image (~150MB), runs as non-root user.
# NOTE: JSON data lives in /app/data (and uploads in /app/public/uploads).
# These MUST be persistent volumes/disks, or portfolios reset on redeploy.

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Writable dirs for the JSON "database" + uploads (owned by app user).
RUN mkdir -p /app/data /app/public/uploads && chown -R nextjs:nodejs /app/data /app/public/uploads
USER nextjs
VOLUME ["/app/data", "/app/public/uploads"]
EXPOSE 3000
# Standalone server.js reads PORT + HOSTNAME env (Render injects $PORT).
# Do NOT pass --port/--hostname flags — server.js ignores them and would
# bind localhost:3000, causing Render health-check 502.
CMD ["node", "server.js"]
