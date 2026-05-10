import { prisma } from '~/server/utils/prisma'
import { requireAuth } from '~/server/utils/guards'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const code = getRouterParam(event, 'code')
  if (!code) throw createError({ statusCode: 400, statusMessage: 'Missing build code' })

  const build = await prisma.build.findUnique({ where: { shareCode: code }, select: { id: true, userId: true } })
  if (!build) throw createError({ statusCode: 404, statusMessage: 'Build not found' })
  if (build.userId !== user.id) throw createError({ statusCode: 403, statusMessage: 'Access denied' })

  await prisma.build.delete({ where: { id: build.id } })

  return { data: { deleted: true } }
})
