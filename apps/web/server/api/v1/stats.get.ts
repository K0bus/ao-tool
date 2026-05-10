import { prisma } from '~/server/utils/prisma'
import { cached } from '~/server/utils/cache'

export default defineEventHandler(async () => {
  return cached('public:stats', async () => {
    const [totalItems, totalCraftingRecipes, totalRefiningRecipes, lastImport] = await Promise.all([
      prisma.item.count(),
      prisma.craftingRecipe.count(),
      prisma.refiningRecipe.count(),
      prisma.importJob.findFirst({
        where: { status: 'SUCCESS' },
        orderBy: { completedAt: 'desc' },
        select: { completedAt: true, itemsCreated: true, itemsUpdated: true, type: true },
      }),
    ])

    return {
      data: {
        totalItems,
        totalRecipes: totalCraftingRecipes + totalRefiningRecipes,
        lastImport,
      },
    }
  }, 120) // Cache 2 minutes
})
