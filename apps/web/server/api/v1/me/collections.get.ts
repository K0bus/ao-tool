import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import { requireAuth } from '~/server/utils/guards'

const schema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(48).default(24),
})

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const query = await getValidatedQuery(event, (q) => schema.safeParse(q))
  if (!query.success) {
    throw createError({ statusCode: 422, statusMessage: 'Invalid query parameters' })
  }

  const { cursor, limit } = query.data

  const collections = await prisma.buildCollection.findMany({
    where: { userId: user.id },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { updatedAt: 'desc' },
    include: { _count: { select: { items: true } } },
  })

  const hasMore = collections.length > limit
  const page = hasMore ? collections.slice(0, limit) : collections

  return {
    data: page.map((c) => ({
      id: c.id,
      shareCode: c.shareCode,
      title: c.title,
      description: c.description,
      visibility: c.visibility,
      buildCount: c._count.items,
      viewCount: c.viewCount,
      userId: c.userId,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    })),
    meta: { nextCursor: hasMore ? page[page.length - 1]?.id : undefined },
  }
})
