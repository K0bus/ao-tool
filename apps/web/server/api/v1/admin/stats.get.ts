import { requireAdmin } from '~/server/utils/guards'
import { prisma } from '~/server/utils/prisma'
import { cached } from '~/server/utils/cache'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  return cached('admin:stats', async () => {
    const [totalItems, craftableItems, totalUsers, lastImport] = await Promise.all([
      prisma.item.count(),
      prisma.item.count({ where: { isCraftable: true } }),
      prisma.user.count(),
      prisma.importJob.findFirst({
        where: { status: 'SUCCESS' },
        orderBy: { completedAt: 'desc' },
        select: { completedAt: true, sourceCommit: true, itemsCreated: true, itemsUpdated: true },
      }),
    ])

    return {
      data: {
        totalItems,
        craftableItems,
        totalUsers,
        lastImport,
      },
    }
  }, 60) // Cache 1 minute
})
