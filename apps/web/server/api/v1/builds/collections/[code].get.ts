import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, 'code')
  if (!code) throw createError({ statusCode: 400, statusMessage: 'Missing collection code' })

  const collection = await prisma.buildCollection.findUnique({
    where: { shareCode: code },
    include: {
      items: {
        orderBy: { sortOrder: 'asc' },
        include: {
          build: {
            select: {
              id: true,
              shareCode: true,
              title: true,
              gameMode: true,
              visibility: true,
              equipment: true,
              viewCount: true,
              createdAt: true,
              userId: true,
            },
          },
        },
      },
      _count: { select: { items: true } },
    },
  })

  if (!collection) throw createError({ statusCode: 404, statusMessage: 'Collection not found' })

  const user = event.context.user
  if (collection.visibility === 'PRIVATE' && collection.userId !== user?.id) {
    throw createError({ statusCode: 403, statusMessage: 'Access denied' })
  }

  if (collection.userId !== user?.id) {
    prisma.buildCollection.update({ where: { id: collection.id }, data: { viewCount: { increment: 1 } } }).catch(() => {})
  }

  return {
    data: {
      id: collection.id,
      shareCode: collection.shareCode,
      title: collection.title,
      description: collection.description,
      visibility: collection.visibility,
      buildCount: collection._count.items,
      viewCount: collection.viewCount,
      userId: collection.userId,
      createdAt: collection.createdAt.toISOString(),
      updatedAt: collection.updatedAt.toISOString(),
      builds: collection.items.map((ci) => ({
        note: ci.note,
        sortOrder: ci.sortOrder,
        build: {
          ...ci.build,
          equipment: (ci.build.equipment ?? {}) as Record<string, string | null>,
          createdAt: ci.build.createdAt.toISOString(),
        },
      })),
    },
  }
})
