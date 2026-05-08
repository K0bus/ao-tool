#!/bin/sh
set -e

echo "[entrypoint] Running database migrations..."
npx prisma migrate deploy --schema=./prisma/schema.prisma

echo "[entrypoint] Starting Nuxt server..."
exec node server/index.mjs
