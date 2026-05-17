#!/bin/sh
set -e

echo "[worker-dev-entrypoint] Regenerating Prisma client..."
pnpm --filter @albion-tool/database db:generate

echo "[worker-dev-entrypoint] Starting worker in dev (watch) mode..."
exec pnpm --filter @albion-tool/scripts worker:dev
