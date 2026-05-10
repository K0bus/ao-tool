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

  const builds = await prisma.build.findMany({
    where: { userId: user.id },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      shareCode: true,
      title: true,
      gameMode: true,
      visibility: true,
      equipment: true,
      viewCount: true,
      createdAt: true,
      updatedAt: true,
      userId: true,
    },
  })

  const hasMore = builds.length > limit
  const page = hasMore ? builds.slice(0, limit) : builds

  return {
    data: page.map((b) => ({
      ...b,
      equipment: (b.equipment ?? {}) as Record<string, string | null>,
      createdAt: b.createdAt.toISOString(),
      updatedAt: b.updatedAt.toISOString(),
    })),
    meta: { nextCursor: hasMore ? page[page.length - 1]?.id : undefined },
  }
})
