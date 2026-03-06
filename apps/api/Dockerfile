FROM node:20-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/package.json
COPY packages/config/package.json ./packages/config/package.json

RUN corepack enable && pnpm install --frozen-lockfile=false

COPY . .

RUN corepack enable \
  && pnpm --filter @trainerpro/api db:generate \
  && pnpm --filter @trainerpro/api build

ENV NODE_ENV=production
ENV PORT=8080

WORKDIR /app/apps/api
EXPOSE 8080

CMD ["node", "dist/main.js"]
