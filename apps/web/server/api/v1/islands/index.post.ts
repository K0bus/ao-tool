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

  return { data: island }
})
