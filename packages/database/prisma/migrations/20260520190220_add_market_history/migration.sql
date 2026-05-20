-- CreateTable
CREATE TABLE "MarketHistory" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "quality" INTEGER NOT NULL DEFAULT 1,
    "timeScale" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "itemCount" INTEGER NOT NULL DEFAULT 0,
    "avgPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "MarketHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MarketHistory_itemId_locationId_quality_timeScale_idx" ON "MarketHistory"("itemId", "locationId", "quality", "timeScale");

-- CreateIndex
CREATE INDEX "MarketHistory_timestamp_idx" ON "MarketHistory"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "MarketHistory_itemId_locationId_quality_timeScale_timestamp_key" ON "MarketHistory"("itemId", "locationId", "quality", "timeScale", "timestamp");

-- AddForeignKey
ALTER TABLE "MarketHistory" ADD CONSTRAINT "MarketHistory_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketHistory" ADD CONSTRAINT "MarketHistory_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;
