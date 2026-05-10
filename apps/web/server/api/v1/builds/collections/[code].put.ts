import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import { requireAuth } from '~/server/utils/guards'

const schema = z.object({
  title: z.string().min(1).max(120).optional(),
  description: z.string().max(2000).nullable().optional(),
  visibility: z.enum(['PUBLIC', 'UNLISTED', 'PRIVATE']).optional(),
  addBuildIds: z.array(z.string()).max(50).optional(),
  removeBuildIds: z.array(z.string()).max(50).optional(),
})

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const code = getRouterParam(event, 'code')
  if (!code) throw createError({ statusCode: 400, statusMessage: 'Missing collection code' })

  const body = await readValidatedBody(event, (b) => schema.safeParse(b))
  if (!body.success) {
    throw createError({ statusCode: 422, statusMessage: 'Invalid body', data: body.error.flatten() })
  }

  const coll = await prisma.buildCollection.findUnique({ where: { shareCode: code }, select: { id: true, userId: true } })
  if (!coll) throw createError({ statusCode: 404, statusMessage: 'Collection not found' })
  if (coll.userId !== user.id) throw createError({ statusCode: 403, statusMessage: 'Access denied' })

  const { addBuildIds, removeBuildIds, ...fields } = body.data

  const updated = await prisma.buildCollection.update({
    where: { id: coll.id },
    data: {
      ...fields,
      ...(removeBuildIds && removeBuildIds.length > 0
        ? { items: { deleteMany: { buildId: { in: removeBuildIds } } } }
        : {}),
    },
    include: { _count: { select: { items: true } } },
  })

  // addBuildIds séparé pour éviter conflit avec deleteMany
  if (addBuildIds && addBuildIds.length > 0) {
    const existing = await prisma.buildCollectionItem.findMany({
      where: { collectionId: coll.id },
      select: { buildId: true, sortOrder: true },
      orderBy: { sortOrder: 'desc' },
    })
    const existingIds = new Set(existing.map((e) => e.buildId))
    const maxOrder = existing[0]?.sortOrder ?? -1
    const toAdd = addBuildIds.filter((id) => !existingIds.has(id))

    if (toAdd.length > 0) {
      await prisma.buildCollectionItem.createMany({
        data: toAdd.map((buildId, i) => ({ collectionId: coll.id, buildId, sortOrder: maxOrder + 1 + i })),
        skipDuplicates: true,
      })
    }
  }

  return {
    data: {
      id: updated.id,
      shareCode: updated.shareCode,
      title: updated.title,
      description: updated.description,
      visibility: updated.visibility,
      buildCount: updated._count.items,
      updatedAt: updated.updatedAt.toISOString(),
    },
  }
})
