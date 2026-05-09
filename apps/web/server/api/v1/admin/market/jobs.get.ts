import { requireAdmin } from '~/server/utils/guards'
import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const jobs = await prisma.marketSyncJob.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      triggeredBy: {
        select: {
          username: true,
        },
      },
    },
  })

  return {
    data: jobs,
  }
})
