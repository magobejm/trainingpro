# syntax=docker/dockerfile:1.7
ARG NODE_VERSION=22-alpine

FROM node:${NODE_VERSION} AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/api/package.json ./apps/api/package.json
COPY packages/config/package.json ./packages/config/package.json
RUN pnpm install --frozen-lockfile=false

FROM node:${NODE_VERSION} AS build
WORKDIR /app
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/api ./apps/api
COPY packages/config ./packages/config
COPY prisma ./prisma
RUN pnpm --filter @trainerpro/api db:generate \
  && pnpm --filter @trainerpro/api build \
  && pnpm --filter @trainerpro/api deploy --prod /prod-api

FROM node:${NODE_VERSION} AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
COPY --from=build /prod-api/node_modules ./node_modules
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/prisma ./prisma
EXPOSE 8080
CMD ["node", "dist/main.js"]
