import { prisma } from '~/server/utils/prisma'
import { requireAuth } from '~/server/utils/guards'
import { z } from 'zod'

const resourceSchema = z.object({
  itemId: z.string(),
  count: z.number().int().min(1).max(9).default(1),
  plantedAt: z.string().datetime().optional(),
  isFocusUsed: z.boolean().optional()
})

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const buildingId = getRouterParam(event, 'id')
  
  if (!buildingId) throw createError({ statusCode: 400, statusMessage: 'Building ID required' })

  const building = await prisma.islandBuilding.findUnique({
    where: { id: buildingId },
    include: { island: true }
  })

  if (!building || building.island.userId !== user.id) {
    throw createError({ statusCode: 404, statusMessage: 'Building not found' })
  }

  const body = await readBody(event)
  const result = resourceSchema.safeParse(body)

  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: result.error.message })
  }

  const resource = await prisma.buildingResource.create({
    data: {
      buildingId,
      itemId: result.data.itemId,
      count: result.data.count,
      plantedAt: result.data.plantedAt ? new Date(result.data.plantedAt) : new Date(),
      isFocusUsed: result.data.isFocusUsed ?? false
    }
  })

  return { data: resource }
})
