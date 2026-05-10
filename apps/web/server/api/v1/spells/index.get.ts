import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'

const schema = z.object({
  q: z.string().optional(),
  kind: z.enum(['active', 'passive', 'toggle']).optional(),
  category: z.string().optional(),
  locale: z.string().default('FR-FR'),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(100),
})

export default defineEventHandler(async (event) => {
  const query = await getValidatedQuery(event, (q) => schema.safeParse(q))
  if (!query.success) {
    throw createError({ statusCode: 422, statusMessage: 'Invalid query parameters' })
  }

  const { q, kind, category, locale, cursor, limit } = query.data

  type SpellWhere = NonNullable<Parameters<typeof prisma.spell.findMany>[0]>['where']
  const where: SpellWhere = {
    ...(kind ? { spellKind: kind } : {}),
    ...(category ? { category: { contains: category, mode: 'insensitive' as const } } : {}),
    ...(q
      ? {
          OR: [
            { id: { contains: q, mode: 'insensitive' as const } },
            { localizations: { some: { locale, name: { contains: q, mode: 'insensitive' as const } } } },
          ],
        }
      : {}),
  }

  const spells = await prisma.spell.findMany({
    where,
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { id: 'asc' },
    include: {
      localizations: { where: { locale }, take: 1 },
    },
  })

  const hasMore = spells.length > limit
  const page = hasMore ? spells.slice(0, limit) : spells
  const nextCursor = hasMore ? page[page.length - 1]?.id : undefined

  return {
    data: page.map((spell) => ({
      id: spell.id,
      spellKind: spell.spellKind,
      icon: spell.icon,
      category: spell.category,
      uiType: spell.uiType,
      cooldown: spell.cooldown,
      energyCost: spell.energyCost,
      range: spell.range,
      name: spell.localizations[0]?.name ?? spell.id,
    })),
    meta: { nextCursor },
  }
})
