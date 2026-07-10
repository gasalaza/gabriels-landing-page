# Backend service — multi-stage build
FROM node:22-alpine@sha256:16e22a550f3863206a3f701448c45f7912c6896a62de43add43bb9c86130c3e2 AS builder

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/

RUN npm ci

COPY backend/tsconfig.json backend/
COPY backend/src/ backend/src/

RUN npm run build --workspace @gabriels-portfolio/backend
RUN npm prune --omit=dev

# --- Runner ---
FROM node:22-alpine@sha256:16e22a550f3863206a3f701448c45f7912c6896a62de43add43bb9c86130c3e2

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/backend/node_modules ./backend/node_modules
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/backend/package.json ./backend/

# schema.sql resolved at runtime: dist/db/../../src/db/schema.sql
COPY backend/src/db/schema.sql ./backend/src/db/schema.sql

RUN mkdir -p /app/backend/data && chown -R node:node /app/backend/data

ENV NODE_ENV=production
EXPOSE 3000

USER node

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", "backend/dist/server.js"]
