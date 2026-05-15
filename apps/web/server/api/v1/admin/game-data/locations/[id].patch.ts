import { z } from 'zod'
import { requireAdmin } from '~/server/utils/guards'
import { prisma } from '~/server/utils/prisma'

const schema = z.object({
  name: z.string().optional(),
  isActive: z.boolean().optional(),
})

export default defineEventHandler(async (event) => {
  const admin = requireAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing ID' })

  const body = await readValidatedBody(event, (b) => schema.safeParse(b))
  if (!body.success) throw createError({ statusCode: 422, statusMessage: 'Invalid input' })

  const existing = await prisma.location.findUnique({ where: { id } })
  if (!existing) throw createError({ statusCode: 404, statusMessage: 'Location not found' })

  const updated = await prisma.location.update({
    where: { id },
    data: body.data,
  })

  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: 'location.update',
      targetType: 'Location',
      targetId: id,
      before: existing as any,
      after: updated as any,
    },
  })

  return { data: updated }
})
