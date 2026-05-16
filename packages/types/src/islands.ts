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
  buildings: BuildingProfitability[]
}

export interface BuildingProfitability {
  buildingId: string
  buildingName: string
  totalNetProfit: number
  resources: ResourceProfitability[]
}

export interface ResourceProfitability {
  itemId: string
  itemName: string
  netProfit: number
  roi: number
  taxAmount: number
  count: number
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
  buildings: {
    id: string
    name: string
    resources: {
      itemId: string
      status: 'empty' | 'growing' | 'ready' | 'working'
      completionPercentage: number
      readyAt?: Date
    }[]
    nutrition?: number
  }[]
}
