/*
  Warnings:

  - You are about to drop the column `farmableItems` on the `CraftingStation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "CraftingStation" DROP COLUMN "farmableItems";

-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "harvestResultItemId" TEXT,
ADD COLUMN     "productResultItemId" TEXT;

-- CreateTable
CREATE TABLE "StationItem" (
    "stationId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,

    CONSTRAINT "StationItem_pkey" PRIMARY KEY ("stationId","itemId")
);

-- CreateTable
CREATE TABLE "LootTable" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "listType" TEXT,
    "rawData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LootTable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LootTableItem" (
    "id" TEXT NOT NULL,
    "lootTableId" TEXT NOT NULL,
    "itemUniqueName" TEXT,
    "itemId" TEXT,
    "referencedLootTableId" TEXT,
    "chance" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "amount" TEXT NOT NULL DEFAULT '1',
    "weight" INTEGER,
    "parentType" TEXT NOT NULL DEFAULT 'DIRECT',
    "useBlackMarket" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "LootTableItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StationItem_stationId_idx" ON "StationItem"("stationId");

-- CreateIndex
CREATE INDEX "StationItem_itemId_idx" ON "StationItem"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "LootTable_name_key" ON "LootTable"("name");

-- CreateIndex
CREATE INDEX "LootTableItem_lootTableId_idx" ON "LootTableItem"("lootTableId");

-- CreateIndex
CREATE INDEX "LootTableItem_itemId_idx" ON "LootTableItem"("itemId");

-- CreateIndex
CREATE INDEX "LootTableItem_referencedLootTableId_idx" ON "LootTableItem"("referencedLootTableId");

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_harvestLootList_fkey" FOREIGN KEY ("harvestLootList") REFERENCES "LootTable"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_productLootList_fkey" FOREIGN KEY ("productLootList") REFERENCES "LootTable"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_harvestResultItemId_fkey" FOREIGN KEY ("harvestResultItemId") REFERENCES "Item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_productResultItemId_fkey" FOREIGN KEY ("productResultItemId") REFERENCES "Item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StationItem" ADD CONSTRAINT "StationItem_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "CraftingStation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StationItem" ADD CONSTRAINT "StationItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LootTableItem" ADD CONSTRAINT "LootTableItem_lootTableId_fkey" FOREIGN KEY ("lootTableId") REFERENCES "LootTable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LootTableItem" ADD CONSTRAINT "LootTableItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LootTableItem" ADD CONSTRAINT "LootTableItem_referencedLootTableId_fkey" FOREIGN KEY ("referencedLootTableId") REFERENCES "LootTable"("id") ON DELETE SET NULL ON UPDATE CASCADE;
