import { prisma } from '@albion-tool/database'
import type { IslandProfitability, FoodOptimization } from '@albion-tool/types'

const TAX_RATE = 0.04
const FOCUS_EFFICIENCY_BONUS = 0.5 // Simplified, usually depends on spec

export class IslandEngine {
  async calculateIslandProfitability(islandId: string): Promise<IslandProfitability | null> {
    const island = await prisma.island.findUnique({
      where: { id: islandId },
      include: {
        plots: {
          include: {
            item: {
              include: {
                marketPrices: {
                  where: { locationId: islandId }, // Actually should be parent city
                  take: 1
                }
              }
            }
          }
        },
        location: true
      }
    })

    if (!island) return null

    // We need the parent city location ID to fetch prices
    const parentCityId = island.locationId

    const plotProfits = await Promise.all(island.plots.map(async (plot) => {
      if (!plot.plantedItemId || !plot.item) {
        return {
          position: plot.position,
          type: plot.type,
          itemName: 'Empty',
          netProfit: 0,
          roi: 0,
          taxAmount: 0
        }
      }

      // Fetch seed/baby cost (Item usually has a purchase price or market price)
      // For seeds, we often use the fixed vendor price if available, or market price
      const marketPrice = await prisma.marketPrice.findFirst({
        where: { itemId: plot.plantedItemId, locationId: parentCityId, quality: 1 }
      })

      const sellPrice = marketPrice?.sellPriceMin ?? 0
      const buyPrice = marketPrice?.buyPriceMax ?? 0 // Cost to buy seed

      // Yield calculation (Placeholder for complex Albion math)
      const baseYield = 1.0
      const bonusYield = plot.isFocusUsed ? FOCUS_EFFICIENCY_BONUS : 0
      const totalYield = baseYield + bonusYield

      const revenue = sellPrice * totalYield
      const tax = revenue * TAX_RATE
      const netProfit = revenue - tax - buyPrice

      return {
        position: plot.position,
        type: plot.type,
        itemName: plot.plantedItemId, // Should resolve localization
        netProfit,
        roi: buyPrice > 0 ? (netProfit / buyPrice) * 100 : 0,
        taxAmount: tax,
        focusReturnRate: plot.isFocusUsed ? 47.8 : 0 // Placeholder
      }
    }))

    return {
      islandId: island.id,
      name: island.name,
      totalNetProfit: plotProfits.reduce((sum, p) => sum + p.netProfit, 0),
      plots: plotProfits
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
