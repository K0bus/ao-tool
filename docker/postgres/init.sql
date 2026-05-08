-- Extensions requises

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Fuzzy search pour pg_trgm (LIKE insensible + distance)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Recherche insensible aux accents (café → cafe)
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- NOTE: Les index GIN pg_trgm sur ItemLocalization.name sont créés
-- après la migration Prisma via le script scripts/db/create-search-indexes.sql
