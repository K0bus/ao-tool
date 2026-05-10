import { prisma } from '~/server/utils/prisma'
import { requireAuth } from '~/server/utils/guards'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const code = getRouterParam(event, 'code')
  if (!code) throw createError({ statusCode: 400, statusMessage: 'Missing collection code' })

  const coll = await prisma.buildCollection.findUnique({ where: { shareCode: code }, select: { id: true, userId: true } })
  if (!coll) throw createError({ statusCode: 404, statusMessage: 'Collection not found' })
  if (coll.userId !== user.id) throw createError({ statusCode: 403, statusMessage: 'Access denied' })

  await prisma.buildCollection.delete({ where: { id: coll.id } })

  return { data: { deleted: true } }
})
