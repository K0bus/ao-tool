export interface TopProfitItem {
  uniqueName: string
  name: string
  tier: number
  enchantmentLevel: number
  iconUrl: string | null
  itemType: string | null
  shopCategory: string | null
  shopSubcategory: string | null
  avgMargin: number
  bestCity: string
  bestMargin: number
  bestProfit: number
  citiesCount: number
}

export function useTopProfit() {
  return useLazyFetch<TopProfitItem[]>('/api/v1/items/top-profit', {
    key: 'top-profit-items',
    default: () => [],
  })
}
