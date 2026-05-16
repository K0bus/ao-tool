import { prisma } from '~/server/utils/prisma'
import { requireAuth } from '~/server/utils/guards'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  
  const islands = await prisma.island.findMany({
    where: { userId: user.id },
    include: {
      location: true,
      _count: { select: { buildings: true } }
    },
    orderBy: { createdAt: 'desc' }
  })
  
  return { data: islands }
})
