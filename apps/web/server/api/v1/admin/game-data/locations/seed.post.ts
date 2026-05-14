import { requireAdmin } from '~/server/utils/guards'
import { prisma } from '~/server/utils/prisma'
import { DEFAULT_LOCATIONS } from '@albion-tool/database/src/bootstrap-data'

export default defineEventHandler(async (event) => {
  const admin = requireAdmin(event)

  await prisma.$transaction(async (tx) => {
    for (const loc of DEFAULT_LOCATIONS) {
      await tx.location.upsert({
        where: { id: loc.id },
        update: { type: loc.type, name: loc.name }, // Force update on seed
        create: loc,
      })
    }
  })

  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: 'location.seed',
      targetType: 'Location',
    },
  })

  return { success: true }
})
