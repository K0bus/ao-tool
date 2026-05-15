import { prisma } from '~/server/utils/prisma'
import { requireAdmin } from '~/server/utils/guards'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const configs = await prisma.systemConfig.findMany()
  
  // Return as a key-value object for easier frontend handling
  const settings: Record<string, any> = {}
  configs.forEach(c => {
    settings[c.key] = c.value
  })

  return { data: settings }
})
