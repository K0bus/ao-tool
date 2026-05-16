import { prisma } from '~/server/utils/prisma'
import { requireAuth } from '~/server/utils/guards'
import { z } from 'zod'

const islandSchema = z.object({
  name: z.string().min(1).max(50),
  locationId: z.string(),
  type: z.enum(['PERSONAL', 'GUILD']),
  level: z.number().int().min(1).max(6)
})

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const body = await readBody(event)
  const result = islandSchema.safeParse(body)

  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: result.error.message })
  }

  const island = await prisma.island.create({
    data: {
      ...result.data,
      userId: user.id
    }
  })

  // Basic plot initialization (Albion personal island plots)
  // Level 1: 0 plots
  // Level 2: 1 farm plot + 1 building plot
  // Level 3-6: +1 farm plot per level
  const plots = []
  if (result.data.level >= 2) {
    plots.push({ islandId: island.id, type: 'FARM' as const, position: 0, level: 1 })
    plots.push({ islandId: island.id, type: 'BUILDING' as const, position: 1, level: 1 })
  }
  
  if (result.data.level >= 3) {
    for (let i = 2; i < result.data.level; i++) {
      plots.push({ islandId: island.id, type: 'FARM' as const, position: i, level: 1 })
    }
  }

  if (plots.length > 0) {
    await prisma.plot.createMany({
      data: plots
    })
  }

  return { data: island }
})
