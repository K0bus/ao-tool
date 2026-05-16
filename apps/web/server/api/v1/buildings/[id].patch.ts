import { prisma } from '~/server/utils/prisma'
import { requireAuth } from '~/server/utils/guards'
import { z } from 'zod'

const buildingSchema = z.object({
  level: z.number().int().min(1).max(8).optional(),
  nutrition: z.number().min(0).max(100).optional(),
  buildingId: z.string().optional()
})

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

  const body = await readBody(event)
  const result = buildingSchema.safeParse(body)

  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: result.error.message })
  }

  const updatedBuilding = await prisma.islandBuilding.update({
    where: { id },
    data: result.data
  })

  return { data: updatedBuilding }
})
