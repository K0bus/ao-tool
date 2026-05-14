import { requireAdmin } from '~/server/utils/guards'
import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const locations = await prisma.location.findMany({
    orderBy: { type: 'asc' },
  })
  return { data: locations }
})
