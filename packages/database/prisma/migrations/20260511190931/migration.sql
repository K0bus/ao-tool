-- AddForeignKey
ALTER TABLE "MarketPriceHistory" ADD CONSTRAINT "MarketPriceHistory_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
