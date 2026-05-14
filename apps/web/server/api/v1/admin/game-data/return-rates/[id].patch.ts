import { z } from 'zod'
import { requireAdmin } from '~/server/utils/guards'
import { prisma } from '~/server/utils/prisma'

const schema = z.object({
  baseReturnRate: z.number().min(0).max(1).optional(),
  focusReturnRate: z.number().min(0).max(1).optional(),
  cityBonusRate: z.number().min(0).max(1).optional(),
})

export default defineEventHandler(async (event) => {
  const admin = requireAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing ID' })

  const body = await readValidatedBody(event, (b) => schema.safeParse(b))
  if (!body.success) throw createError({ statusCode: 422, statusMessage: 'Invalid input' })

  const existing = await prisma.returnRate.findUnique({ where: { id } })
  if (!existing) throw createError({ statusCode: 404, statusMessage: 'ReturnRate not found' })

  const updated = await prisma.returnRate.update({
    where: { id },
    data: body.data,
  })

  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: 'return-rate.update',
      targetType: 'ReturnRate',
      targetId: id,
      before: existing as any,
      after: updated as any,
    },
  })

  return { data: updated }
})
