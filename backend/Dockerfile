# ─── Stage 1: Builder ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install deps first (better layer caching)
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

# Copy source and build
COPY . .
RUN npx prisma generate
RUN npm run build

# ─── Stage 2: Production ───────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser  -u 1001 -S nodejs -G nodejs

# Copy only what's needed for production
COPY --from=builder --chown=nodejs:nodejs /app/dist          ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules  ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json  ./
COPY --from=builder --chown=nodejs:nodejs /app/prisma        ./prisma
COPY --chown=nodejs:nodejs docker-entrypoint.sh              ./

RUN chmod +x docker-entrypoint.sh

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/server.js"]
