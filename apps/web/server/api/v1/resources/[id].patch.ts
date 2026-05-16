import { prisma } from '~/server/utils/prisma'
import { requireAuth } from '~/server/utils/guards'
import { z } from 'zod'

const resourceSchema = z.object({
  count: z.number().int().min(1).max(9).optional(),
  plantedAt: z.string().datetime().nullable().optional(),
  isFocusUsed: z.boolean().optional(),
  itemId: z.string().optional()
})

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

  const body = await readBody(event)
  const result = resourceSchema.safeParse(body)

  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: result.error.message })
  }

  const updatedResource = await prisma.buildingResource.update({
    where: { id },
    data: {
      ...result.data,
      plantedAt: result.data.plantedAt ? new Date(result.data.plantedAt) : result.data.plantedAt
    }
  })

  return { data: updatedResource }
})
