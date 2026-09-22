FROM node:24-bookworm-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
FROM base AS build
COPY package.json package-lock.json ./
RUN npm ci
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN DATABASE_URL=postgresql://build:build@localhost:5432/build npx prisma generate
COPY server ./server
COPY src ./src
COPY public ./public
COPY index.html tsconfig*.json vite.config.ts ./
ARG VITE_WHATSAPP_NUMBER=5511989266321
ENV VITE_WHATSAPP_NUMBER=$VITE_WHATSAPP_NUMBER VITE_API_URL=/api
RUN npm run api:build && npm run build
FROM base AS api
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3001
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/server/dist ./server/dist
COPY --from=build --chown=node:node /app/prisma ./prisma
COPY --from=build --chown=node:node /app/prisma.config.ts /app/package.json ./
USER node
CMD ["node", "server/dist/main.js"]
FROM caddy:2-alpine AS web
COPY --from=build /app/dist /srv
COPY deploy/Caddyfile /etc/caddy/Caddyfile
