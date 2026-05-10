import { prisma } from '~/server/utils/prisma'
import { cached } from '~/server/utils/cache'

export default defineEventHandler(async () => {
  return cached('public:activity', async () => {
    const jobs = await prisma.importJob.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: {
        id: true,
        type: true,
        status: true,
        itemsCreated: true,
        itemsUpdated: true,
        itemsProcessed: true,
        durationMs: true,
        completedAt: true,
        createdAt: true,
      },
    })

    return { data: jobs }
  }, 60) // Cache 1 minute
})
