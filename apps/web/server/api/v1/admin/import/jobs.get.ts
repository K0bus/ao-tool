import { requireAdmin } from '~/server/utils/guards'
import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const jobs = await prisma.importJob.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: {
      id: true,
      type: true,
      status: true,
      itemsProcessed: true,
      itemsCreated: true,
      itemsUpdated: true,
      itemsFailed: true,
      sourceCommit: true,
      durationMs: true,
      errorMessage: true,
      startedAt: true,
      completedAt: true,
      createdAt: true,
      triggeredBy: {
        select: { username: true },
      },
    },
  })

  return { data: jobs }
})
