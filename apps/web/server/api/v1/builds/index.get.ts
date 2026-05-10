import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'

const schema = z.object({
  gameMode: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(48).default(24),
})

export default defineEventHandler(async (event) => {
  const query = await getValidatedQuery(event, (q) => schema.safeParse(q))
  if (!query.success) {
    throw createError({ statusCode: 422, statusMessage: 'Invalid query parameters' })
  }

  const { gameMode, cursor, limit } = query.data

  const where = {
    visibility: 'PUBLIC' as const,
    ...(gameMode ? { gameMode } : {}),
  }

  const builds = await prisma.build.findMany({
    where,
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: 'desc' },
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
  })

  const hasMore = builds.length > limit
  const page = hasMore ? builds.slice(0, limit) : builds

  return {
    data: page.map((b) => ({
      ...b,
      equipment: (b.equipment ?? {}) as Record<string, string | null>,
      createdAt: b.createdAt.toISOString(),
    })),
    meta: { nextCursor: hasMore ? page[page.length - 1]?.id : undefined },
  }
})
