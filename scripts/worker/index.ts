import { prisma } from '@albion-tool/database'
import { Worker, getConnection, closeAllConnections, IMPORT_QUEUE_NAME } from '@albion-tool/queue'
import type { ImportJobData, ImportJobProgress, ImportJobResult } from '@albion-tool/queue'
import { runImport } from '../import/run-import.js'

const worker = new Worker<ImportJobData, ImportJobResult>(
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

worker.on('completed', (job, result) => {
  console.log(`[worker] Job ${job.id} completed — ${result.itemsProcessed} items in ${(result.durationMs / 1000).toFixed(1)}s`)
})

worker.on('failed', (job, err) => {
  console.error(`[worker] Job ${job?.id} failed:`, err.message)
})

worker.on('progress', (job, progress) => {
  const p = progress as ImportJobProgress
  console.log(`[worker] ${job.id} [${p.phase}] ${p.percent}% (${p.processed}/${p.total})`)
})

async function shutdown() {
  console.log('[worker] Shutting down gracefully...')
  await worker.close()
  await closeAllConnections()
  await prisma.$disconnect()
  process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

console.log(`[worker] Listening on queue "${IMPORT_QUEUE_NAME}"`)
