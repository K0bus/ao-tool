import { prisma } from '~/server/utils/prisma'
import { requireAuth } from '~/server/utils/guards'
import { z } from 'zod'

const plotSchema = z.object({
  type: z.enum(['FARM', 'HERB_GARDEN', 'PASTURE', 'KENNEL', 'HOUSE', 'REFINING', 'CRAFTING', 'BUILDING']).optional(),
  level: z.number().int().min(1).max(8).optional(),
  nutrition: z.number().min(0).max(100).optional(),
  plantedItemId: z.string().nullable().optional(),
  plantedAt: z.string().datetime().nullable().optional(),
  buildingId: z.string().nullable().optional()
})

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const id = getRouterParam(event, 'id')
  
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID required' })

  const plot = await prisma.plot.findUnique({
    where: { id },
    include: { island: true }
  })

  if (!plot || plot.island.userId !== user.id) {
    throw createError({ statusCode: 404, statusMessage: 'Plot not found' })
  }

  const body = await readBody(event)
  const result = plotSchema.safeParse(body)

  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: result.error.message })
  }

  const updatedPlot = await prisma.plot.update({
    where: { id },
    data: {
      ...result.data,
      plantedAt: result.data.plantedAt ? new Date(result.data.plantedAt) : result.data.plantedAt
    }
  })

  return { data: updatedPlot }
})
