#!/bin/sh
set -e

echo "[dev-entrypoint] Regenerating Prisma client..."
pnpm --filter @albion-tool/database db:generate

echo "[dev-entrypoint] Applying database migrations..."
pnpm --filter @albion-tool/database db:migrate:deploy

echo "[dev-entrypoint] Seeding database bootstrap data..."
pnpm --filter @albion-tool/database db:seed

echo "[dev-entrypoint] Clearing Nuxt build cache..."
mkdir -p /app/apps/web/.nuxt
find /app/apps/web/.nuxt -mindepth 1 -maxdepth 1 -exec rm -rf {} +

echo "[dev-entrypoint] Preparing Nuxt build artifacts..."
pnpm --filter web exec nuxi prepare

echo "[dev-entrypoint] Starting Nuxt dev server..."
exec pnpm --filter web dev --host 0.0.0.0
