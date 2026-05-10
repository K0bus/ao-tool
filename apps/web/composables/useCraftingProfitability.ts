import { ref } from 'vue'

export interface RecipeNode {
  itemId: string
  uniqueName: string
  name: string
  tier: number
  enchantmentLevel: number
  isCraftable: boolean
  isRefinable: boolean
  iconUrl?: string | null
  quantity: number
  maxReturnRate?: number | null
  type: 'craft' | 'refine' | 'raw'
  marketPrices: Array<{
    locationId: string
    sellPriceMin: number
    buyPriceMax: number
    quality: number
  }>
  recipe?: {
    resultCount: number
    craftingFame: number
    silverCost?: number
    stationId?: string | null
    ingredients: RecipeNode[]
  } | null
}

export function useCraftingProfitability() {
  // Map uniqueName -> boolean (true = craft, false = buy)
  const userDecisions = ref<Record<string, boolean>>({})
  const selectedLocation = ref('Caerleon')
  const taxRate = ref(0.04) // 4% market tax
  const silverPer100Nutrition = ref(999) // silver paid per 100 nutrition at station

  const setDecision = (uniqueName: string, craft: boolean) => {
    userDecisions.value[uniqueName] = craft
  }

  const getPrice = (node: RecipeNode, type: 'buy' | 'sell' = 'buy') => {
    if (!node?.marketPrices || !Array.isArray(node.marketPrices)) return 0
    const priceObj = node.marketPrices.find(p => p.locationId === selectedLocation.value && p.quality === 1)
    if (!priceObj) return 0
    // Use sellPriceMin for both buying ingredients and selling crafted items,
    // consistent with API endpoints (current market listing price)
    return type === 'buy' ? priceObj.sellPriceMin : priceObj.sellPriceMin
  }

  const calculateNodeCost = (node: RecipeNode, returnRate: number): number => {
    const isCrafting = userDecisions.value[node.uniqueName] ?? (node.type !== 'raw')

    if (!isCrafting || !node.recipe) {
      return getPrice(node, 'buy')
    }

    let ingredientsCost = 0
    for (const ing of node.recipe.ingredients) {
      const ingCost = calculateNodeCost(ing, returnRate)
      const effectiveQty = ing.quantity

      const actualReturnRate = ing.maxReturnRate != null ? Math.min(returnRate, ing.maxReturnRate) : returnRate
      const netQty = effectiveQty * (1 - actualReturnRate)

      ingredientsCost += ingCost * netQty
    }

    // Station fee: (nutritionRequired / 100) × silverPer100Nutrition
    const stationFee = ((node.recipe.silverCost ?? 0) / 100) * silverPer100Nutrition.value
    return ((ingredientsCost + stationFee) / node.recipe.resultCount) || 0
  }

  const getProfitData = (rootNode: RecipeNode | null, quantity: number, returnRate: number) => {
    if (!rootNode) return null

    const unitCost = calculateNodeCost(rootNode, returnRate)
    const totalCost = unitCost * quantity

    const sellPrice = getPrice(rootNode, 'sell')
    const revenueBeforeTax = sellPrice * quantity
    const taxAmount = revenueBeforeTax * taxRate.value
    const netRevenue = revenueBeforeTax - taxAmount

    const profit = netRevenue - totalCost
    const margin = totalCost > 0 ? (profit / totalCost) * 100 : 0

    return {
      unitCost,
      totalCost,
      sellPrice,
      netRevenue,
      profit,
      margin,
      taxAmount
    }
  }

  return {
    userDecisions,
    selectedLocation,
    taxRate,
    silverPer100Nutrition,
    setDecision,
    getPrice,
    getProfitData
  }
}
