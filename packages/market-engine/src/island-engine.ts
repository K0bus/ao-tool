import { prisma } from '@albion-tool/database'
import type { IslandProfitability, FoodOptimization } from '@albion-tool/types'

const TAX_RATE = 0.04
const FOCUS_EFFICIENCY_BONUS = 0.5 // Simplified, usually depends on spec

export class IslandEngine {
  async calculateIslandProfitability(islandId: string): Promise<IslandProfitability | null> {
    const island = await prisma.island.findUnique({
      where: { id: islandId },
      include: {
        buildings: {
          include: {
            resources: {
              include: {
                item: true
              }
            },
            building: true
          }
        },
        location: true
      }
    })

    if (!island) return null

    const parentCityId = island.locationId

    const buildingProfits = await Promise.all(island.buildings.map(async (buildingInstance) => {
      const resourceProfits = await Promise.all(buildingInstance.resources.map(async (resource) => {
        if (!resource.item) return null

        const marketPrice = await prisma.marketPrice.findFirst({
          where: { itemId: resource.itemId, locationId: parentCityId, quality: 1 }
        })

        const sellPrice = marketPrice?.sellPriceMin ?? 0
        const buyPrice = marketPrice?.buyPriceMax ?? 0

        const baseYield = 1.0
        const bonusYield = resource.isFocusUsed ? FOCUS_EFFICIENCY_BONUS : 0
        const totalYield = baseYield + bonusYield

        const revenue = (sellPrice * totalYield) * resource.count
        const tax = revenue * TAX_RATE
        const cost = buyPrice * resource.count
        const netProfit = revenue - tax - cost

        return {
          itemId: resource.itemId,
          itemName: resource.itemId, // Should be resolved by caller or via localized relation
          netProfit,
          roi: cost > 0 ? (netProfit / cost) * 100 : 0,
          taxAmount: tax,
          count: resource.count
        }
      }))

      const activeResources = resourceProfits.filter((r): r is NonNullable<typeof r> => r !== null)

      return {
        buildingId: buildingInstance.id,
        buildingName: buildingInstance.building?.name ?? 'Unknown',
        totalNetProfit: activeResources.reduce((sum, r) => sum + r.netProfit, 0),
        resources: activeResources
      }
    }))

    return {
      islandId: island.id,
      name: island.name,
      totalNetProfit: buildingProfits.reduce((sum, b) => sum + b.totalNetProfit, 0),
      buildings: buildingProfits as any // Types might need update in @albion-tool/types
    }
  }

  async findCheapestFood(animalItemId: string): Promise<FoodOptimization | null> {
    // 1. Identify food types for this animal (from game data stats in JSON)
    // For now, let's assume we fetch all "FARMABLE" items as potential food
    const foodItems = await prisma.item.findMany({
      where: {
        itemType: 'FARMABLE',
        marketPrices: { some: {} }
      },
      include: {
        marketPrices: {
          orderBy: { sellPriceMin: 'asc' },
          take: 1
        }
      }
    })

    const optimizedFoods = foodItems
      .map(item => {
        const price = item.marketPrices[0]?.sellPriceMin ?? 0
        // nutrition is a placeholder, should come from stats JSON
        const nutrition = 100 
        return {
          itemId: item.uniqueName,
          price,
          nutritionPerItem: nutrition,
          costPerNutrition: price / nutrition
        }
      })
      .filter(f => f.price > 0)
      .sort((a, b) => a.costPerNutrition - b.costPerNutrition)

    if (optimizedFoods.length === 0) return null

    return {
      animalItemId,
      cheapestFoodId: optimizedFoods[0]!.itemId,
      cheapestFoodPrice: optimizedFoods[0]!.price,
      foodItems: optimizedFoods
    }
  }
}

export const islandEngine = new IslandEngine()
