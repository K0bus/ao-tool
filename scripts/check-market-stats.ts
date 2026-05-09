import { prisma } from '@albion-tool/database'

async function main() {
  const count = await prisma.marketPrice.count()
  const historyCount = await prisma.marketPriceHistory.count()
  const jobs = await prisma.marketSyncJob.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' }
  })
  
  console.log('--- Market Data Stats ---')
  console.log('MarketPrice count:', count)
  console.log('MarketPriceHistory count:', historyCount)
  console.log('Recent Jobs:')
  console.table(jobs.map(j => ({
    id: j.id,
    status: j.status,
    requested: j.itemsRequested,
    updated: j.itemsUpdated,
    failed: j.itemsFailed,
    created: j.createdAt
  })))
}

main().finally(() => prisma.$disconnect())
