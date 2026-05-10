import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'

const schema = z.object({
  locale: z.string().default('FR-FR'),
})

interface CatNode {
  id: string
  slug: string
  name: string
  count: number
  children: CatNode[]
}

type DbCat = {
  id: string
  slug: string
  nameEn: string
  parentId: string | null
  localizations: { name: string }[]
}

function buildTree(cats: DbCat[], countMap: Map<string, number>, parentId: string | null): CatNode[] {
  return cats
    .filter((c) => c.parentId === parentId)
    .map((c) => {
      const children = buildTree(cats, countMap, c.id)
      const directCount = countMap.get(c.id) ?? 0
      const totalCount = directCount + children.reduce((s, ch) => s + ch.count, 0)
      return {
        id: c.id,
        slug: c.slug,
        name: c.localizations[0]?.name ?? c.nameEn,
        count: totalCount,
        children: children.sort((a, b) => a.name.localeCompare(b.name)),
      }
    })
    .filter((c) => c.count > 0)
    .sort((a, b) => a.name.localeCompare(b.name))
}

export default defineEventHandler(async (event) => {
  const query = await getValidatedQuery(event, (q) => schema.safeParse(q))
  const locale = query.success ? query.data.locale : 'FR-FR'

  const [cats, grouped] = await Promise.all([
    prisma.category.findMany({
      select: {
        id: true,
        slug: true,
        nameEn: true,
        parentId: true,
        localizations: {
          where: { locale },
          select: { name: true },
          take: 1,
        },
      },
    }),
    prisma.item.groupBy({
      by: ['categoryId'],
      _count: { id: true },
      where: { categoryId: { not: null } },
    }),
  ])

  const countMap = new Map<string, number>()
  for (const row of grouped) {
    if (row.categoryId) countMap.set(row.categoryId, row._count.id)
  }

  return buildTree(cats, countMap, null)
})
