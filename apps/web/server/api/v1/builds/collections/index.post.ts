import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import { requireAuth } from '~/server/utils/guards'
import { generateShareCode } from '~/server/utils/buildShare'

const schema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
  visibility: z.enum(['PUBLIC', 'UNLISTED', 'PRIVATE']).default('PRIVATE'),
  buildIds: z.array(z.string()).max(50).optional(),
})

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const body = await readValidatedBody(event, (b) => schema.safeParse(b))
  if (!body.success) {
    throw createError({ statusCode: 422, statusMessage: 'Invalid body', data: body.error.flatten() })
  }

  const { title, description, visibility, buildIds } = body.data

  let shareCode = generateShareCode()
  while (await prisma.buildCollection.findUnique({ where: { shareCode }, select: { id: true } })) {
    shareCode = generateShareCode()
  }

  const collection = await prisma.buildCollection.create({
    data: {
      shareCode,
      title,
      description,
      visibility,
      userId: user.id,
      ...(buildIds && buildIds.length > 0
        ? {
            items: {
              create: buildIds.map((buildId, i) => ({ buildId, sortOrder: i })),
            },
          }
        : {}),
    },
    include: { _count: { select: { items: true } } },
  })

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
    },
  }
})
