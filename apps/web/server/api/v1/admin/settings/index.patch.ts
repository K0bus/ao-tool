import { prisma } from '~/server/utils/prisma'
import { requireAdmin } from '~/server/utils/guards'
import { z } from 'zod'

const settingsSchema = z.record(z.any())

export default defineEventHandler(async (event) => {
  const user = requireAdmin(event)
  const body = await readBody(event)
  
  const payload = settingsSchema.parse(body)

  for (const [key, value] of Object.entries(payload)) {
    await prisma.systemConfig.upsert({
      where: { key },
      update: { 
        value,
        updatedById: user.id
      },
      create: { 
        key, 
        value,
        updatedById: user.id
      }
    })
  }

  return { data: { success: true } }
})
