-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PlotType" ADD VALUE 'HERB_GARDEN';
ALTER TYPE "PlotType" ADD VALUE 'HOUSE';
ALTER TYPE "PlotType" ADD VALUE 'REFINING';
ALTER TYPE "PlotType" ADD VALUE 'CRAFTING';

-- AlterTable
ALTER TABLE "Plot" ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "nutrition" DOUBLE PRECISION;
