#!/bin/sh
set -e

# Debug: Vérifier si la variable DATABASE_URL est bien transmise
echo "[debug] Checking environment..."
if [ -z "$DATABASE_URL" ]; then
  echo "[error] DATABASE_URL is NOT set. Please check your environment variables."
else
  echo "[info] DATABASE_URL is present."
fi

echo "[entrypoint] Listing migrations for debug..."
ls -R ./prisma/migrations

# Nettoyage préventif : on s'assure que seuls les dossiers de migration sont présents
# Prisma P3015 survient parfois si des fichiers comme migration_lock.toml sont mal interprétés
echo "[entrypoint] Cleaning up migrations directory..."
find ./prisma/migrations -maxdepth 1 -type f -not -name "migration.sql" -delete

echo "[entrypoint] Running database migrations..."
npx prisma migrate deploy --config=./prisma.config.mjs --schema=./prisma/schema.prisma

echo "[entrypoint] Starting Nuxt server..."
exec node server/index.mjs
