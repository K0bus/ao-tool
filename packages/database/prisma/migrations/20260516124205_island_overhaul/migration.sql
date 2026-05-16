/*
  Warnings:

  - You are about to drop the column `plotId` on the `Laborer` table. All the data in the column will be lost.
  - You are about to drop the `Plot` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `buildingId` to the `Laborer` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Laborer" DROP CONSTRAINT "Laborer_plotId_fkey";

-- DropForeignKey
ALTER TABLE "Plot" DROP CONSTRAINT "Plot_buildingId_fkey";

-- DropForeignKey
ALTER TABLE "Plot" DROP CONSTRAINT "Plot_islandId_fkey";

-- DropForeignKey
ALTER TABLE "Plot" DROP CONSTRAINT "Plot_plantedItemId_fkey";

-- DropIndex
DROP INDEX "Laborer_plotId_idx";

-- AlterTable
ALTER TABLE "Laborer" DROP COLUMN "plotId",
ADD COLUMN     "buildingId" TEXT NOT NULL;

-- DropTable
DROP TABLE "Plot";

-- CreateTable
CREATE TABLE "IslandBuilding" (
    "id" TEXT NOT NULL,
    "islandId" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "nutrition" DOUBLE PRECISION,
    "metadata" JSONB,
    "buildingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IslandBuilding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuildingResource" (
    "id" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "plantedAt" TIMESTAMP(3),
    "isFocusUsed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuildingResource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IslandBuilding_islandId_idx" ON "IslandBuilding"("islandId");

-- CreateIndex
CREATE INDEX "BuildingResource_buildingId_idx" ON "BuildingResource"("buildingId");

-- CreateIndex
CREATE INDEX "BuildingResource_itemId_idx" ON "BuildingResource"("itemId");

-- CreateIndex
CREATE INDEX "Laborer_buildingId_idx" ON "Laborer"("buildingId");

-- AddForeignKey
ALTER TABLE "IslandBuilding" ADD CONSTRAINT "IslandBuilding_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "CraftingStation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IslandBuilding" ADD CONSTRAINT "IslandBuilding_islandId_fkey" FOREIGN KEY ("islandId") REFERENCES "Island"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuildingResource" ADD CONSTRAINT "BuildingResource_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "IslandBuilding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuildingResource" ADD CONSTRAINT "BuildingResource_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Laborer" ADD CONSTRAINT "Laborer_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "IslandBuilding"("id") ON DELETE CASCADE ON UPDATE CASCADE;
