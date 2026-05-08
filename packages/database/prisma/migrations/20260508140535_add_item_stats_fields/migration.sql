-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "craftSpells" JSONB,
ADD COLUMN     "shopSubcategory2" TEXT,
ADD COLUMN     "stats" JSONB;

-- CreateIndex
CREATE INDEX "Item_shopSubcategory2_idx" ON "Item"("shopSubcategory2");
