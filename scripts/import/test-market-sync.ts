import { prisma } from '@albion-tool/database'
import { marketPriceService } from '@albion-tool/market-engine'

async function main() {
  const itemUniqueName = 'T8_MEAL_STEW_FISH'
  
  // Find item in DB
  const dbItem = await prisma.item.findUnique({
    where: { uniqueName: itemUniqueName }
  })
  
  if (!dbItem) {
    console.error(`Item ${itemUniqueName} not found in DB!`)
    return
  }
  
  console.log(`Found item: ${dbItem.uniqueName} (${dbItem.id})`)
  
  console.log('Running syncMarketPrices...')
  const result = await marketPriceService.syncMarketPrices({
    items: [{
      id: dbItem.id,
      uniqueName: dbItem.uniqueName,
      enchantmentLevel: dbItem.enchantmentLevel
    }],
    locations: ['Bridgewatch', 'Caerleon', 'BlackMarket', 'Lymhurst'],
    qualities: [1, 2]
  })
  
  console.log('Sync completed. Results:', result)
  
  // Query DB to see if MarketHistory has been populated
  const history = await prisma.marketHistory.findMany({
    where: { itemId: dbItem.id },
    orderBy: [{ timeScale: 'asc' }, { timestamp: 'desc' }],
    take: 10,
    include: { location: true }
  })
  
  console.log(`\nFound ${history.length} MarketHistory records:`)
  for (const h of history) {
    console.log(`  - City=${h.location.name} Quality=${h.quality} Scale=${h.timeScale} Count=${h.itemCount} AvgPrice=${h.avgPrice} Ts=${h.timestamp.toISOString()}`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
