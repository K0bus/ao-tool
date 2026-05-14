import { requireAdmin } from '~/server/utils/guards'
import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const returnRates = await prisma.returnRate.findMany({
    orderBy: [
      { tier: 'asc' },
      { enchantmentLevel: 'asc' },
    ],
  })
  return { data: returnRates }
})
