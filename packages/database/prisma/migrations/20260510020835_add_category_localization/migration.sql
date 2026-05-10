-- CreateTable
CREATE TABLE "CategoryLocalization" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "CategoryLocalization_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CategoryLocalization_locale_idx" ON "CategoryLocalization"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryLocalization_categoryId_locale_key" ON "CategoryLocalization"("categoryId", "locale");

-- AddForeignKey
ALTER TABLE "CategoryLocalization" ADD CONSTRAINT "CategoryLocalization_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
