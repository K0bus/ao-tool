import { prisma } from '~/server/utils/prisma'
import { requireAuth } from '~/server/utils/guards'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const id = getRouterParam(event, 'id')
  
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID required' })

  const building = await prisma.islandBuilding.findUnique({
    where: { id },
    include: { island: true }
  })

  if (!building || building.island.userId !== user.id) {
    throw createError({ statusCode: 404, statusMessage: 'Building not found' })
  }

  await prisma.islandBuilding.delete({
    where: { id }
  })

  return { success: true }
})
