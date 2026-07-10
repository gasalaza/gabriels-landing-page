FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package.json package-lock.json* ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
RUN npm install
COPY backend backend
RUN npm run build --workspace @gabriels-portfolio/backend
RUN npm prune --omit=dev --workspace @gabriels-portfolio/backend

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package.json ./
COPY backend/package.json backend/package.json
COPY --from=builder /app/node_modules node_modules
COPY --from=builder /app/backend/node_modules backend/node_modules
COPY --from=builder /app/backend/dist backend/dist
COPY --from=builder /app/backend/src/db/schema.sql backend/src/db/schema.sql
EXPOSE 3000
CMD ["node", "backend/dist/server.js"]
