import { requireAdmin } from '~/server/utils/guards'
import { prisma } from '~/server/utils/prisma'
import { DEFAULT_RETURN_RATES } from '@albion-tool/database'

export default defineEventHandler(async (event) => {
  const admin = requireAdmin(event)

  await prisma.$transaction(async (tx) => {
    for (const rr of DEFAULT_RETURN_RATES) {
      await tx.returnRate.upsert({
        where: { tier_enchantmentLevel: { tier: rr.tier, enchantmentLevel: rr.enchantmentLevel } },
        update: rr,
        create: rr,
      })
    }
  })

  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: 'return-rate.seed',
      targetType: 'ReturnRate',
    },
  })

  return { success: true }
})
