import { requireAdmin } from '~/server/utils/guards'
import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing job id' })
  }

  const logs = await prisma.importLog.findMany({
    where: { jobId: id },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      level: true,
      message: true,
      context: true,
      createdAt: true,
    },
  })

  return { data: logs }
})
