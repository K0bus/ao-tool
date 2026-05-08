import { requireAdmin } from '~/server/utils/guards'
import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const configs = await prisma.systemConfig.findMany({
    orderBy: { key: 'asc' },
  })

  return { data: configs }
})
