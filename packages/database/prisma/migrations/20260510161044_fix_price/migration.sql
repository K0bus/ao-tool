-- CreateEnum
CREATE TYPE "BuildVisibility" AS ENUM ('PUBLIC', 'UNLISTED', 'PRIVATE');

-- AlterEnum
ALTER TYPE "ImportType" ADD VALUE 'PARTIAL_SPELLS';

-- CreateTable
CREATE TABLE "Spell" (
    "id" TEXT NOT NULL,
    "icon" TEXT,
    "category" TEXT,
    "uiType" TEXT,
    "spellKind" TEXT NOT NULL DEFAULT 'active',
    "cooldown" DOUBLE PRECISION,
    "energyCost" DOUBLE PRECISION,
    "castTime" DOUBLE PRECISION,
    "channelDuration" DOUBLE PRECISION,
    "range" DOUBLE PRECISION,
    "nameLocaTag" TEXT,
    "descriptionLocaTag" TEXT,
    "rawData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Spell_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpellLocalization" (
    "id" TEXT NOT NULL,
    "spellId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "SpellLocalization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemSpell" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "spellId" TEXT NOT NULL,
    "slotNumber" INTEGER,
    "tag" TEXT,

    CONSTRAINT "ItemSpell_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Build" (
    "id" TEXT NOT NULL,
    "shareCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "gameMode" TEXT,
    "visibility" "BuildVisibility" NOT NULL DEFAULT 'PRIVATE',
    "userId" TEXT,
    "equipment" JSONB,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Build_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuildSpell" (
    "id" TEXT NOT NULL,
    "buildId" TEXT NOT NULL,
    "spellId" TEXT NOT NULL,
    "slotKey" TEXT NOT NULL,

    CONSTRAINT "BuildSpell_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuildCollection" (
    "id" TEXT NOT NULL,
    "shareCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "visibility" "BuildVisibility" NOT NULL DEFAULT 'PRIVATE',
    "userId" TEXT NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuildCollection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuildCollectionItem" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "buildId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,

    CONSTRAINT "BuildCollectionItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Spell_spellKind_idx" ON "Spell"("spellKind");

-- CreateIndex
CREATE INDEX "Spell_category_idx" ON "Spell"("category");

-- CreateIndex
CREATE INDEX "SpellLocalization_locale_idx" ON "SpellLocalization"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "SpellLocalization_spellId_locale_key" ON "SpellLocalization"("spellId", "locale");

-- CreateIndex
CREATE INDEX "ItemSpell_itemId_idx" ON "ItemSpell"("itemId");

-- CreateIndex
CREATE INDEX "ItemSpell_spellId_idx" ON "ItemSpell"("spellId");

-- CreateIndex
CREATE INDEX "ItemSpell_slotNumber_idx" ON "ItemSpell"("slotNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ItemSpell_itemId_spellId_key" ON "ItemSpell"("itemId", "spellId");

-- CreateIndex
CREATE UNIQUE INDEX "Build_shareCode_key" ON "Build"("shareCode");

-- CreateIndex
CREATE INDEX "Build_userId_idx" ON "Build"("userId");

-- CreateIndex
CREATE INDEX "Build_shareCode_idx" ON "Build"("shareCode");

-- CreateIndex
CREATE INDEX "Build_visibility_gameMode_idx" ON "Build"("visibility", "gameMode");

-- CreateIndex
CREATE INDEX "Build_createdAt_idx" ON "Build"("createdAt");

-- CreateIndex
CREATE INDEX "BuildSpell_buildId_idx" ON "BuildSpell"("buildId");

-- CreateIndex
CREATE UNIQUE INDEX "BuildSpell_buildId_slotKey_key" ON "BuildSpell"("buildId", "slotKey");

-- CreateIndex
CREATE UNIQUE INDEX "BuildCollection_shareCode_key" ON "BuildCollection"("shareCode");

-- CreateIndex
CREATE INDEX "BuildCollection_userId_idx" ON "BuildCollection"("userId");

-- CreateIndex
CREATE INDEX "BuildCollection_shareCode_idx" ON "BuildCollection"("shareCode");

-- CreateIndex
CREATE INDEX "BuildCollection_visibility_idx" ON "BuildCollection"("visibility");

-- CreateIndex
CREATE INDEX "BuildCollectionItem_collectionId_idx" ON "BuildCollectionItem"("collectionId");

-- CreateIndex
CREATE INDEX "BuildCollectionItem_buildId_idx" ON "BuildCollectionItem"("buildId");

-- CreateIndex
CREATE UNIQUE INDEX "BuildCollectionItem_collectionId_buildId_key" ON "BuildCollectionItem"("collectionId", "buildId");

-- AddForeignKey
ALTER TABLE "SpellLocalization" ADD CONSTRAINT "SpellLocalization_spellId_fkey" FOREIGN KEY ("spellId") REFERENCES "Spell"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemSpell" ADD CONSTRAINT "ItemSpell_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemSpell" ADD CONSTRAINT "ItemSpell_spellId_fkey" FOREIGN KEY ("spellId") REFERENCES "Spell"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Build" ADD CONSTRAINT "Build_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuildSpell" ADD CONSTRAINT "BuildSpell_buildId_fkey" FOREIGN KEY ("buildId") REFERENCES "Build"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuildSpell" ADD CONSTRAINT "BuildSpell_spellId_fkey" FOREIGN KEY ("spellId") REFERENCES "Spell"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuildCollection" ADD CONSTRAINT "BuildCollection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuildCollectionItem" ADD CONSTRAINT "BuildCollectionItem_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "BuildCollection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuildCollectionItem" ADD CONSTRAINT "BuildCollectionItem_buildId_fkey" FOREIGN KEY ("buildId") REFERENCES "Build"("id") ON DELETE CASCADE ON UPDATE CASCADE;
