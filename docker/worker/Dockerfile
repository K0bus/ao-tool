ARG NODE_VERSION=22

FROM node:${NODE_VERSION}-alpine AS base
RUN npm install -g pnpm@9
WORKDIR /app

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/database/package.json packages/database/
COPY packages/types/package.json packages/types/
COPY packages/ao-parser/package.json packages/ao-parser/
COPY packages/queue/package.json packages/queue/
COPY apps/web/package.json apps/web/
COPY scripts/package.json scripts/
RUN pnpm install --frozen-lockfile

FROM deps AS worker
COPY . .
RUN pnpm --filter @albion-tool/database db:generate

CMD ["pnpm", "--filter", "@albion-tool/scripts", "worker"]
