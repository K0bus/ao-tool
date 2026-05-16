export type PlotType = 
  | 'FARM' 
  | 'HERB_GARDEN' 
  | 'PASTURE' 
  | 'KENNEL' 
  | 'HOUSE' 
  | 'REFINING' 
  | 'CRAFTING' 
  | 'BUILDING'

export interface IslandProfitability {
  islandId: string
  name: string
  totalNetProfit: number
  plots: PlotProfitability[]
}

export interface PlotProfitability {
  position: number
  type: PlotType
  itemName: string
  netProfit: number
  roi: number
  taxAmount: number
  focusReturnRate?: number
}

export interface FoodOptimization {
  animalItemId: string
  cheapestFoodId: string
  cheapestFoodPrice: number
  foodItems: {
    itemId: string
    price: number
    nutritionPerItem: number
    costPerNutrition: number
  }[]
}

export interface IslandStatus {
  id: string
  plots: {
    position: number
    type: PlotType
    status: 'empty' | 'growing' | 'ready' | 'working'
    completionPercentage: number
    readyAt?: Date
    nutrition?: number
  }[]
}
