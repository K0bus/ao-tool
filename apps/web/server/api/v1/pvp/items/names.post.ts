import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import { cached } from '~/server/utils/cache'

const schema = z.object({
  ids: z.array(z.string()).min(1).max(50),
  locale: z.string().default('FR-FR'),
})

export default defineEventHandler(async (event) => {
  const result = await readValidatedBody(event, (b) => schema.safeParse(b))
  if (!result.success) throw createError({ statusCode: 422, statusMessage: 'Invalid body' })

  const { ids, locale } = result.data
  const key = `pvp:item-names:${locale}:${ids.sort().join(',')}`

  return cached(key, async () => {
    const items = await prisma.item.findMany({
      where: { uniqueName: { in: ids } },
      select: {
        uniqueName: true,
        localizations: {
          where: { locale },
          select: { name: true },
          take: 1,
        },
      },
    })

    const map: Record<string, string> = {}
    for (const item of items) {
      map[item.uniqueName] = item.localizations[0]?.name ?? item.uniqueName
    }
    return { data: map }
  }, 3600) // noms statiques, cache 1h
})
