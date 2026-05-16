-- CreateEnum
CREATE TYPE "IslandType" AS ENUM ('PERSONAL', 'GUILD');

-- CreateEnum
CREATE TYPE "PlotType" AS ENUM ('FARM', 'PASTURE', 'KENNEL', 'BUILDING');

-- CreateTable
CREATE TABLE "Island" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "IslandType" NOT NULL DEFAULT 'PERSONAL',
    "locationId" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Island_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plot" (
    "id" TEXT NOT NULL,
    "islandId" TEXT NOT NULL,
    "type" "PlotType" NOT NULL,
    "position" INTEGER NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "plantedItemId" TEXT,
    "plantedAt" TIMESTAMP(3),
    "isFocusUsed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Plot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Laborer" (
    "id" TEXT NOT NULL,
    "plotId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "happiness" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isWorking" BOOLEAN NOT NULL DEFAULT false,
    "returnAt" TIMESTAMP(3),

    CONSTRAINT "Laborer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Island_userId_idx" ON "Island"("userId");

-- CreateIndex
CREATE INDEX "Island_locationId_idx" ON "Island"("locationId");

-- CreateIndex
CREATE INDEX "Plot_islandId_idx" ON "Plot"("islandId");

-- CreateIndex
CREATE UNIQUE INDEX "Plot_islandId_position_key" ON "Plot"("islandId", "position");

-- CreateIndex
CREATE INDEX "Laborer_plotId_idx" ON "Laborer"("plotId");

-- AddForeignKey
ALTER TABLE "Island" ADD CONSTRAINT "Island_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Island" ADD CONSTRAINT "Island_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plot" ADD CONSTRAINT "Plot_islandId_fkey" FOREIGN KEY ("islandId") REFERENCES "Island"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plot" ADD CONSTRAINT "Plot_plantedItemId_fkey" FOREIGN KEY ("plantedItemId") REFERENCES "Item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Laborer" ADD CONSTRAINT "Laborer_plotId_fkey" FOREIGN KEY ("plotId") REFERENCES "Plot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
