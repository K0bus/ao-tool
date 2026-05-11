import { prisma } from '@albion-tool/database'
import { marketPriceService } from '@albion-tool/market-engine'

async function backfillResolvedPrices() {
  console.log('Starting ResolvedPrice backfill...')

  try {
    await marketPriceService.resolveAllExistingPrices()
    console.log('Backfill completed successfully.')
  } catch (error) {
    console.error('Backfill failed:', error)
    process.exit(1)
  }
}

backfillResolvedPrices()
  .finally(async () => {
    await prisma.$disconnect()
  })
