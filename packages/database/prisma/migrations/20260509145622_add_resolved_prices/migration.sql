-- CreateEnum
CREATE TYPE "PriceConfidence" AS ENUM ('HIGH', 'MEDIUM', 'LOW', 'ESTIMATED', 'MANUAL');

-- CreateTable
CREATE TABLE "ResolvedPrice" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "quality" INTEGER NOT NULL DEFAULT 1,
    "sellPrice" INTEGER NOT NULL DEFAULT 0,
    "buyPrice" INTEGER NOT NULL DEFAULT 0,
    "confidence" "PriceConfidence" NOT NULL DEFAULT 'LOW',
    "source" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResolvedPrice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ResolvedPrice_itemId_locationId_quality_idx" ON "ResolvedPrice"("itemId", "locationId", "quality");

-- CreateIndex
CREATE INDEX "ResolvedPrice_updatedAt_idx" ON "ResolvedPrice"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ResolvedPrice_itemId_locationId_quality_key" ON "ResolvedPrice"("itemId", "locationId", "quality");

-- AddForeignKey
ALTER TABLE "ResolvedPrice" ADD CONSTRAINT "ResolvedPrice_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResolvedPrice" ADD CONSTRAINT "ResolvedPrice_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;
