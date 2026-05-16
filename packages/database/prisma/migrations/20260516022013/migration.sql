-- AlterTable
ALTER TABLE "Plot" ADD COLUMN     "buildingId" TEXT;

-- AddForeignKey
ALTER TABLE "Plot" ADD CONSTRAINT "Plot_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "CraftingStation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
