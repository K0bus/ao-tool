-- À exécuter UNE FOIS après la première migration Prisma
-- Ces index ne peuvent pas être gérés par Prisma (tsvector / GIN)

-- Index GIN pour la recherche fuzzy sur les noms d'items
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_item_loc_name_trgm
  ON "ItemLocalization" USING GIN (name gin_trgm_ops);

-- Index pour la recherche insensible à la casse
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_item_loc_name_lower
  ON "ItemLocalization" (lower(name));

-- Index GIN sur uniqueName pour search rapide par préfixe
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_item_unique_name_trgm
  ON "Item" USING GIN ("uniqueName" gin_trgm_ops);
