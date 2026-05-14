import { requireAdmin } from '~/server/utils/guards'
import { prisma } from '~/server/utils/prisma'
import { cached } from '~/server/utils/cache'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  return cached('admin:database-stats', async () => {
    const [
      // Users
      totalUsers,
      activeUsers,
      adminUsers,
      
      // Items
      totalItems,
      craftableItems,
      refinableItems,
      weaponItems,
      armorItems,
      mountItems,
      consumableItems,
      itemsWithIcon,

      // Builds
      totalBuilds,
      publicBuilds,
      privateBuilds,
      totalBuildCollections,

      // Market
      totalMarketPrices,
      totalResolvedPrices,
      totalPriceHistory,

      // Game Data
      totalSpells,
      totalCraftingRecipes,
      totalRefiningRecipes,
      totalLocations,
      totalReturnRates,
      totalTableSizes,
    ] = await Promise.all([
      // Users
      prisma.user.count(),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),

      // Items
      prisma.item.count(),
      prisma.item.count({ where: { isCraftable: true } }),
      prisma.item.count({ where: { isRefinable: true } }),
      prisma.item.count({ where: { itemType: 'WEAPON' } }),
      prisma.item.count({ where: { itemType: { in: ['ARMOR_HEAD', 'ARMOR_CHEST', 'ARMOR_SHOES'] } } }),
      prisma.item.count({ where: { itemType: 'MOUNT' } }),
      prisma.item.count({ where: { itemType: 'CONSUMABLE' } }),
      prisma.item.count({ where: { iconFetched: true } }),

      // Builds
      prisma.build.count(),
      prisma.build.count({ where: { visibility: 'PUBLIC' } }),
      prisma.build.count({ where: { visibility: 'PRIVATE' } }),
      prisma.buildCollection.count(),

      // Market
      prisma.marketPrice.count(),
      prisma.resolvedPrice.count(),
      prisma.marketPriceHistory.count(),

      // Game Data
      prisma.spell.count(),
      prisma.craftingRecipe.count(),
      prisma.refiningRecipe.count(),
      prisma.location.count(),
      prisma.returnRate.count(),
      
      // Table sizes
      prisma.$queryRaw`
        SELECT
          relname as "tableName",
          pg_total_relation_size(relid) as "totalBytes",
          pg_relation_size(relid) as "tableBytes",
          pg_total_relation_size(relid) - pg_relation_size(relid) as "indexBytes"
        FROM pg_catalog.pg_statio_user_tables
        ORDER BY pg_total_relation_size(relid) DESC;
      ` as Promise<any[]>
    ])

    const tableSizes = (totalTableSizes as any[]).map(row => ({
      tableName: String(row.tableName),
      totalBytes: Number(row.totalBytes),
      tableBytes: Number(row.tableBytes),
      indexBytes: Number(row.indexBytes)
    }))

    return {
      data: {
        users: { total: totalUsers, active: activeUsers, admins: adminUsers },
        items: {
          total: totalItems,
          craftable: craftableItems,
          refinable: refinableItems,
          weapons: weaponItems,
          armors: armorItems,
          mounts: mountItems,
          consumables: consumableItems,
          withIcon: itemsWithIcon,
        },
        builds: {
          total: totalBuilds,
          public: publicBuilds,
          private: privateBuilds,
          collections: totalBuildCollections,
        },
        market: {
          prices: totalMarketPrices,
          resolved: totalResolvedPrices,
          history: totalPriceHistory,
        },
        gameData: {
          spells: totalSpells,
          craftingRecipes: totalCraftingRecipes,
          refiningRecipes: totalRefiningRecipes,
          locations: totalLocations,
          returnRates: totalReturnRates,
        },
        tables: tableSizes
      }
    }
  }, 60) // Cache 1 minute
})
