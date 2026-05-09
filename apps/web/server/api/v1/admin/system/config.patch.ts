import { z } from 'zod'
import { requireAdmin } from '~/server/utils/guards'
import { prisma, Prisma } from '~/server/utils/prisma'
import { cacheInvalidate } from '~/server/utils/cache'

const schema = z.object({
  key: z.string().min(1),
  value: z.any(),
})

export default defineEventHandler(async (event) => {
  const admin = requireAdmin(event)

  const body = await readValidatedBody(event, (b) => schema.safeParse(b))
  if (!body.success) throw createError({ statusCode: 422, statusMessage: 'Invalid input' })

  const existing = await prisma.systemConfig.findUnique({ where: { key: body.data.key } })
  if (!existing) throw createError({ statusCode: 404, statusMessage: 'Config key not found' })

  const updated = await prisma.systemConfig.update({
    where: { key: body.data.key },
    data: { value: body.data.value, updatedById: admin.id },
  })

  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: 'system.config.update',
      targetType: 'SystemConfig',
      targetId: body.data.key,
      before: existing.value === null ? Prisma.JsonNull : existing.value,
      after: body.data.value,
    },
  })

  // Invalider le cache stats qui peut dépendre des feature flags
  await cacheInvalidate('admin:stats')

  return { data: updated }
})
