#!/bin/sh
set -e

# Debug: Vérifier si la variable DATABASE_URL est bien transmise par Portainer
echo "[debug] Checking environment..."
if [ -z "$DATABASE_URL" ]; then
  echo "[error] DATABASE_URL is NOT set. Please check your Portainer environment variables."
else
  echo "[info] DATABASE_URL is present."
fi

echo "[entrypoint] Running database migrations..."
npx prisma migrate deploy --config=./prisma.config.mjs --schema=./prisma/schema.prisma

echo "[entrypoint] Starting Nuxt server..."
exec node server/index.mjs
