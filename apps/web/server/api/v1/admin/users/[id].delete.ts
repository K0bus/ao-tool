import { requireAdmin } from '~/server/utils/guards'
import { prisma } from '~/server/utils/prisma'
import { invalidateUserSessions } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const admin = requireAdmin(event)

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'User ID required' })

  if (id === admin.id) {
    throw createError({ statusCode: 403, statusMessage: 'Cannot delete your own account' })
  }

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, username: true, role: true },
  })
  if (!target) throw createError({ statusCode: 404, statusMessage: 'User not found' })

  // Empêcher la suppression d'un autre admin (sécurité)
  if (target.role === 'ADMIN') {
    throw createError({ statusCode: 403, statusMessage: 'Cannot delete an admin account' })
  }

  await invalidateUserSessions(id)
  await prisma.user.delete({ where: { id } })

  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: 'user.delete',
      targetType: 'User',
      targetId: id,
      before: target,
      ipAddress: getRequestIP(event),
    },
  })

  return { data: { message: `User ${target.username} deleted` } }
})
