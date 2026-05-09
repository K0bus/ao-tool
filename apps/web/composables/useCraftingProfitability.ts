import { ref, computed } from 'vue'

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
    stationId?: string | null
    ingredients: RecipeNode[]
  } | null
}

export function useCraftingProfitability() {
  // Map uniqueName -> boolean (true = craft, false = buy)
  const userDecisions = ref<Record<string, boolean>>({})
  const selectedLocation = ref('Caerleon')
  const taxRate = ref(0.08) // 8% default tax

  const setDecision = (uniqueName: string, craft: boolean) => {
    userDecisions.value[uniqueName] = craft
  }

  const getPrice = (node: RecipeNode, type: 'buy' | 'sell' = 'buy') => {
    if (!node?.marketPrices || !Array.isArray(node.marketPrices)) return 0
    const priceObj = node.marketPrices.find(p => p.locationId === selectedLocation.value && p.quality === 1)
    if (!priceObj) return 0
    return type === 'buy' ? priceObj.sellPriceMin : priceObj.buyPriceMax
  }

  const calculateNodeCost = (node: RecipeNode, returnRate: number): number => {
    const isCrafting = userDecisions.value[node.uniqueName] ?? (node.type !== 'raw')

    if (!isCrafting || !node.recipe) {
      // If buying, return the market price
      return getPrice(node, 'buy')
    }

    // If crafting, recursively calculate ingredient costs
    let ingredientsCost = 0
    for (const ing of node.recipe.ingredients) {
      const ingCost = calculateNodeCost(ing, returnRate)
      const effectiveQty = ing.quantity
      
      // Apply return rate if applicable
      const actualReturnRate = ing.maxReturnRate != null ? Math.min(returnRate, ing.maxReturnRate) : returnRate
      const netQty = effectiveQty * (1 - actualReturnRate)
      
      ingredientsCost += ingCost * netQty
    }

    // Cost per result item
    return (ingredientsCost / node.recipe.resultCount) || 0
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
    const margin = netRevenue > 0 ? (profit / netRevenue) * 100 : 0

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
    setDecision,
    getPrice,
    getProfitData
  }
}
