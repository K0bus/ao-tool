import { prisma } from '@albion-tool/database'
import { Worker, getConnection, closeAllConnections, IMPORT_QUEUE_NAME, MARKET_QUEUE_NAME } from '@albion-tool/queue'
import type { ImportJobData, ImportJobProgress, ImportJobResult, MarketJobData, MarketJobResult, MarketJobItem, MarketJobProgress } from '@albion-tool/queue'
import { runImport } from '../import/run-import.js'
import { marketPriceService } from '@albion-tool/market-engine'

// ══════════════════════════════════════════════════════════════
// IMPORT WORKER
// ══════════════════════════════════════════════════════════════

const importWorker = new Worker<ImportJobData, ImportJobResult>(
  IMPORT_QUEUE_NAME,
  async (job) => {
    const { jobId, type } = job.data

    await prisma.importJob.update({
      where: { id: jobId },
      data: { status: 'RUNNING', startedAt: new Date() },
    })

    return runImport(jobId, type, async (progress: ImportJobProgress) => {
      await job.updateProgress(progress)
    })
  },
  {
    connection: getConnection(),
    concurrency: 1,
  },
)

// ══════════════════════════════════════════════════════════════
// MARKET WORKER
// ══════════════════════════════════════════════════════════════

const marketWorker = new Worker<MarketJobData, MarketJobResult>(
  MARKET_QUEUE_NAME,
  async (job) => {
    const { jobId, items, locations, qualities } = job.data

    if (!items || items.length === 0) {
      return { itemsRequested: 0, itemsProcessed: 0, itemsUpdated: 0, itemsFailed: 0, durationMs: 0 }
    }

    const start = Date.now()
    const result = await marketPriceService.syncMarketPrices({
      items,
      locations,
      qualities,
      jobId,
      onProgress: async (progress: MarketJobProgress) => {
        await job.updateProgress(progress)
      }
    })

    return {
      itemsRequested: items.length,
      itemsProcessed: items.length,
      itemsUpdated: result.itemsUpdated,
      itemsFailed: result.itemsFailed,
      durationMs: Date.now() - start,
    }
  },
  {
    connection: getConnection(),
    concurrency: 10, // Many jobs can be active, but limited by rate limiter
    limiter: {
      max: 300, // Albion Data Project limit: 300 requests
      duration: 300000, // per 5 minutes (also stays under 180/min)
    },
  },
)

// ══════════════════════════════════════════════════════════════
// EVENT HANDLERS
// ══════════════════════════════════════════════════════════════

importWorker.on('completed', (job, result) => {
  console.log(`[import-worker] Job ${job.id} completed — ${result.itemsProcessed} items in ${(result.durationMs / 1000).toFixed(1)}s`)
})

importWorker.on('failed', (job, err) => {
  console.error(`[import-worker] Job ${job?.id} failed:`, err.message)
})

marketWorker.on('completed', async (job, result) => {
  const { jobId } = job.data
  if (!jobId) return

  // Read current counters to evaluate completion and compute duration
  const dbJob = await prisma.marketSyncJob.findUnique({
    where: { id: jobId },
    select: { status: true, itemsUpdated: true, itemsFailed: true, itemsRequested: true, itemsProcessed: true, startedAt: true },
  })

  if (dbJob) {
    const progressPercent = ((dbJob.itemsProcessed / dbJob.itemsRequested) * 100).toFixed(1)
    console.log(`[market-worker] [Sync ${jobId.slice(-6)}] Batch ${job.id} done: ${result.itemsUpdated} items (${progressPercent}% — ${dbJob.itemsProcessed}/${dbJob.itemsRequested})`)
  }

  // Check if the whole MarketSyncJob is done — atomic updateMany to avoid TOCTOU race
  if (
    dbJob &&
    dbJob.status === 'RUNNING' &&
    dbJob.itemsProcessed >= dbJob.itemsRequested
  ) {
    // updateMany with WHERE status='RUNNING' ensures only one worker wins the race
    const updated = await prisma.marketSyncJob.updateMany({
      where: { id: jobId, status: 'RUNNING' },
      data: {
        status: 'SUCCESS',
        completedAt: new Date(),
        durationMs: dbJob.startedAt ? Date.now() - dbJob.startedAt.getTime() : null,
      },
    })
    if (updated.count === 1) {
      console.log(`[market-worker] Sync job ${jobId} finished (${dbJob.itemsUpdated} updated, ${dbJob.itemsFailed} failed)`)
    }
  }
})

marketWorker.on('failed', (job, err) => {
  console.error(`[market-worker] Job ${job?.id} failed:`, err.message)
})

async function shutdown() {
  console.log('[worker] Shutting down gracefully...')
  await importWorker.close()
  await marketWorker.close()
  await closeAllConnections()
  await prisma.$disconnect()
  process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

console.log(`[worker] Listening on queue "${IMPORT_QUEUE_NAME}"`)
console.log(`[worker] Listening on queue "${MARKET_QUEUE_NAME}"`)
