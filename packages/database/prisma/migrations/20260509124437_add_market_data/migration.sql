-- CreateEnum
CREATE TYPE "MarketSyncType" AS ENUM ('FULL', 'BATCH', 'PRIORITY');

-- CreateTable
CREATE TABLE "MarketPrice" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "quality" INTEGER NOT NULL DEFAULT 1,
    "sellPriceMin" INTEGER NOT NULL DEFAULT 0,
    "sellPriceMinDate" TIMESTAMP(3),
    "sellPriceMax" INTEGER NOT NULL DEFAULT 0,
    "sellPriceMaxDate" TIMESTAMP(3),
    "buyPriceMin" INTEGER NOT NULL DEFAULT 0,
    "buyPriceMinDate" TIMESTAMP(3),
    "buyPriceMax" INTEGER NOT NULL DEFAULT 0,
    "buyPriceMaxDate" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketPriceHistory" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "quality" INTEGER NOT NULL DEFAULT 1,
    "sellPriceMin" INTEGER NOT NULL,
    "buyPriceMax" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketPriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketSyncJob" (
    "id" TEXT NOT NULL,
    "type" "MarketSyncType" NOT NULL,
    "status" "ImportStatus" NOT NULL DEFAULT 'PENDING',
    "triggeredById" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "itemsRequested" INTEGER NOT NULL DEFAULT 0,
    "itemsUpdated" INTEGER NOT NULL DEFAULT 0,
    "itemsFailed" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketSyncJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MarketPrice_itemId_idx" ON "MarketPrice"("itemId");

-- CreateIndex
CREATE INDEX "MarketPrice_locationId_idx" ON "MarketPrice"("locationId");

-- CreateIndex
CREATE INDEX "MarketPrice_itemId_locationId_idx" ON "MarketPrice"("itemId", "locationId");

-- CreateIndex
CREATE INDEX "MarketPrice_updatedAt_idx" ON "MarketPrice"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MarketPrice_itemId_locationId_quality_key" ON "MarketPrice"("itemId", "locationId", "quality");

-- CreateIndex
CREATE INDEX "MarketPriceHistory_itemId_locationId_quality_idx" ON "MarketPriceHistory"("itemId", "locationId", "quality");

-- CreateIndex
CREATE INDEX "MarketPriceHistory_itemId_locationId_quality_timestamp_idx" ON "MarketPriceHistory"("itemId", "locationId", "quality", "timestamp");

-- CreateIndex
CREATE INDEX "MarketPriceHistory_timestamp_idx" ON "MarketPriceHistory"("timestamp");

-- CreateIndex
CREATE INDEX "MarketSyncJob_status_idx" ON "MarketSyncJob"("status");

-- CreateIndex
CREATE INDEX "MarketSyncJob_type_idx" ON "MarketSyncJob"("type");

-- CreateIndex
CREATE INDEX "MarketSyncJob_createdAt_idx" ON "MarketSyncJob"("createdAt");

-- AddForeignKey
ALTER TABLE "MarketPrice" ADD CONSTRAINT "MarketPrice_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketPrice" ADD CONSTRAINT "MarketPrice_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketSyncJob" ADD CONSTRAINT "MarketSyncJob_triggeredById_fkey" FOREIGN KEY ("triggeredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
