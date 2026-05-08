import { requireAdmin } from '~/server/utils/guards'
import { prisma } from '~/server/utils/prisma'
import { getImportQueue } from '@albion-tool/queue'
import type { ImportJobProgress } from '@albion-tool/queue'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const job = await prisma.importJob.findUnique({
    where: { id },
    select: {
      id: true,
      type: true,
      status: true,
      itemsProcessed: true,
      itemsCreated: true,
      itemsUpdated: true,
      itemsSkipped: true,
      itemsFailed: true,
      durationMs: true,
      errorMessage: true,
      sourceCommit: true,
      startedAt: true,
      completedAt: true,
      createdAt: true,
    },
  })

  if (!job) throw createError({ statusCode: 404, statusMessage: 'Job not found' })

  let progress: ImportJobProgress | null = null

  if (job.status === 'RUNNING' || job.status === 'PENDING') {
    try {
      const bullJob = await getImportQueue().getJob(id)
      if (bullJob?.progress && typeof bullJob.progress === 'object') {
        progress = bullJob.progress as ImportJobProgress
      }
    } catch { /* BullMQ unavailable — return DB state only */ }
  }

  return { data: { ...job, progress } }
})
