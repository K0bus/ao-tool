import { prisma } from '~/server/utils/prisma'
import { requireAuth } from '~/server/utils/guards'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const id = getRouterParam(event, 'id')
  
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID required' })

  const resource = await prisma.buildingResource.findUnique({
    where: { id },
    include: { building: { include: { island: true } } }
  })

  if (!resource || resource.building.island.userId !== user.id) {
    throw createError({ statusCode: 404, statusMessage: 'Resource not found' })
  }

  await prisma.buildingResource.delete({
    where: { id }
  })

  return { success: true }
})
