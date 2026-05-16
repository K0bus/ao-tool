/*
  Warnings:

  - You are about to drop the column `maxLevel` on the `CraftingStation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "CraftingStation" DROP COLUMN "maxLevel",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "favoriteDishBonus" DOUBLE PRECISION,
ADD COLUMN     "favoriteDishItemId" TEXT,
ADD COLUMN     "iconUrl" TEXT,
ADD COLUMN     "nextTierBuildingId" TEXT,
ADD COLUMN     "nutritionStorage" DOUBLE PRECISION,
ADD COLUMN     "tier" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "favoriteFoodItemId" TEXT,
ADD COLUMN     "growTime" INTEGER,
ADD COLUMN     "grownItemUniqueName" TEXT,
ADD COLUMN     "harvestLootList" TEXT,
ADD COLUMN     "harvestSeedChance" DOUBLE PRECISION,
ADD COLUMN     "nutritionMax" DOUBLE PRECISION,
ADD COLUMN     "offspringChance" DOUBLE PRECISION,
ADD COLUMN     "productLootList" TEXT,
ADD COLUMN     "productProductionTime" INTEGER;

-- CreateTable
CREATE TABLE "BuildingRequirement" (
    "id" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "count" INTEGER NOT NULL,

    CONSTRAINT "BuildingRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BuildingRequirement_buildingId_idx" ON "BuildingRequirement"("buildingId");

-- CreateIndex
CREATE INDEX "BuildingRequirement_itemId_idx" ON "BuildingRequirement"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "BuildingRequirement_buildingId_itemId_key" ON "BuildingRequirement"("buildingId", "itemId");

-- CreateIndex
CREATE INDEX "CraftingStation_favoriteDishItemId_idx" ON "CraftingStation"("favoriteDishItemId");

-- AddForeignKey
ALTER TABLE "CraftingStation" ADD CONSTRAINT "CraftingStation_favoriteDishItemId_fkey" FOREIGN KEY ("favoriteDishItemId") REFERENCES "Item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CraftingStation" ADD CONSTRAINT "CraftingStation_nextTierBuildingId_fkey" FOREIGN KEY ("nextTierBuildingId") REFERENCES "CraftingStation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuildingRequirement" ADD CONSTRAINT "BuildingRequirement_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "CraftingStation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuildingRequirement" ADD CONSTRAINT "BuildingRequirement_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
