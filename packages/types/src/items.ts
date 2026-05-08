export type ItemType =
  | 'WEAPON' | 'OFF_HAND'
  | 'ARMOR_HEAD' | 'ARMOR_CHEST' | 'ARMOR_SHOES'
  | 'BAG' | 'CAPE' | 'MOUNT'
  | 'CONSUMABLE'
  | 'RESOURCE_RAW' | 'RESOURCE_REFINED' | 'PRODUCT'
  | 'FARMABLE' | 'FURNITURE' | 'JOURNAL' | 'LABORER'
  | 'OTHER'

export interface ItemLocalization {
  locale: string
  name: string
  description?: string | null
}

export interface ItemSummary {
  id: string
  uniqueName: string
  tier: number
  enchantmentLevel: number
  itemType: ItemType
  shopCategory?: string | null
  shopSubcategory?: string | null
  isCraftable: boolean
  isRefinable: boolean
  iconUrl?: string | null
  name: string
}

export interface CraftingIngredient {
  item: ItemSummary
  quantity: number
  maxReturnRate?: number | null
}

export interface CraftingRecipe {
  id: string
  resultCount: number
  craftingFame: number
  silverCost: number
  focusable: boolean
  craftingStationId?: string | null
  ingredients: CraftingIngredient[]
}

export interface RefiningRecipe {
  id: string
  resultCount: number
  craftingStationId?: string | null
  ingredients: CraftingIngredient[]
}

export interface ItemDetail extends ItemSummary {
  weight?: number | null
  maxStackSize?: number | null
  localizations: ItemLocalization[]
  craftingRecipe?: CraftingRecipe | null
  refiningRecipe?: RefiningRecipe | null
  enchantVariants: ItemSummary[]
  baseItem?: ItemSummary | null
}

export interface ItemSearchParams {
  q?: string
  tier?: number | number[]
  enchantment?: number | number[]
  category?: string
  type?: ItemType
  craftable?: boolean
  refinable?: boolean
  cursor?: string
  limit?: number
}
