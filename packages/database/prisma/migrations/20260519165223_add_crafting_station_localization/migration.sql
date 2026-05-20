-- CreateTable
CREATE TABLE "CraftingStationLocalization" (
    "id" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "CraftingStationLocalization_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CraftingStationLocalization_stationId_idx" ON "CraftingStationLocalization"("stationId");

-- CreateIndex
CREATE INDEX "CraftingStationLocalization_locale_idx" ON "CraftingStationLocalization"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "CraftingStationLocalization_stationId_locale_key" ON "CraftingStationLocalization"("stationId", "locale");

-- AddForeignKey
ALTER TABLE "CraftingStationLocalization" ADD CONSTRAINT "CraftingStationLocalization_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "CraftingStation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
