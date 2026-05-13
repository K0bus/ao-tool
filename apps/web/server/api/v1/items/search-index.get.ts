import { prisma } from '~/server/utils/prisma'
import { cached } from '~/server/utils/cache'

export default defineEventHandler(async () => {
  return cached('public:items:search-index', async () => {
    const items = await prisma.item.findMany({
      where: {
        // We only want base items (enchantment 0) for the search index to keep it small
        // or maybe all items? Usually searching for "Knight Armor" should show the base one.
        // If they want specific enchantment, they can filter on the item page.
        // Actually, many items don't have enchantment (resources, consumables).
        enchantmentLevel: 0,
      },
      select: {
        uniqueName: true,
        tier: true,
        localizations: {
          where: { locale: 'FR-FR' },
          select: { name: true },
          take: 1,
        },
      },
      orderBy: { uniqueName: 'asc' },
    })

    return items.map((item) => ({
      u: item.uniqueName,
      n: item.localizations[0]?.name ?? item.uniqueName,
      t: item.tier,
    }))
  }, 3600) // Cache 1 hour
})
