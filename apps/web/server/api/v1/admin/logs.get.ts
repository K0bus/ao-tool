import { requireAdmin } from '~/server/utils/guards'
import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const logs = await prisma.importLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 60,
    select: {
      id: true,
      level: true,
      message: true,
      createdAt: true,
      job: { select: { id: true, type: true } },
    },
  })

  return { data: logs }
})
