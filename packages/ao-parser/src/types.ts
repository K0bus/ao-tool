// Types pour items.json (ao-bin-dumps) — attributs XML préfixés @

export interface RawCraftResource {
  '@uniquename': string
  '@count': string
  '@maxreturnamount'?: string
  '@forcequantity'?: string
  '@enchantmentlevel'?: string
}

export interface RawCraftingRequirements {
  '@silver'?: string
  '@craftingfame'?: string
  '@craftingstation'?: string
  '@time'?: string
  '@amountcrafted'?: string
  craftresource?: RawCraftResource | RawCraftResource[]
}

export interface RawCraftSpell {
  '@uniquename': string
  '@slots'?: string
  '@tag'?: string
}

export interface RawRemoveSpell {
  '@uniquename': string
}

export interface RawCraftingSpellList {
  '@reference'?: string
  removespell?: RawRemoveSpell | RawRemoveSpell[]
  craftspell?: RawCraftSpell | RawCraftSpell[]
}

export interface RawEnchantment {
  '@enchantmentlevel': string
  '@uniquename'?: string
  '@tier'?: string
  '@shopcategory'?: string
  '@shopsubcategory1'?: string
  '@shopsubcategory2'?: string
  '@weight'?: string
  '@itempower'?: string
  '@abilitypower'?: string
  '@attackdamage'?: string
  '@attackspeed'?: string
  '@attackrange'?: string
  '@healmodifier'?: string
  '@masterymodifier'?: string
  '@canbeovercharged'?: string
  craftingrequirements?: RawCraftingRequirements | RawCraftingRequirements[]
  craftingspelllist?: RawCraftingSpellList
}

export interface RawEnchantments {
  enchantment?: RawEnchantment | RawEnchantment[]
}

export interface RawBaseItem {
  '@uniquename': string
  '@tier'?: string
  '@enchantmentlevel'?: string
  '@shopcategory'?: string
  '@shopsubcategory1'?: string
  '@shopsubcategory2'?: string
  '@weight'?: string
  '@maxstacksize'?: string
  '@itempower'?: string
  '@abilitypower'?: string
  '@attackdamage'?: string
  '@attackspeed'?: string
  '@attackrange'?: string
  '@durability'?: string
  '@durabilityloss_attack'?: string
  '@durabilityloss_receivedattack'?: string
  '@durabilityloss_spelluse'?: string
  '@durabilityloss_receivedspell'?: string
  '@healmodifier'?: string
  '@masterymodifier'?: string
  '@canbeovercharged'?: string
  '@craftingcategory'?: string
  '@slottype'?: string
  '@attacktype'?: string
  '@twohanded'?: string
  LocalizationNameVariable?: string
  LocalizationDescriptionVariable?: string
  craftingrequirements?: RawCraftingRequirements | RawCraftingRequirements[]
  craftingspelllist?: RawCraftingSpellList
  enchantments?: RawEnchantments
}

// items.json racine : { items: { Weapon: [...], EquipmentItem: [...], ... } }
export type RawItemsJson = {
  items: Record<string, RawBaseItem | RawBaseItem[] | undefined>
}

export interface RawLocalizationTable {
  [locale: string]: Record<string, string>
}

// ─── Types bruts pour spells.json ──────────────────────────────────────────

export interface RawPassiveSpell {
  '@uniquename': string
  '@namelocatag'?: string
  '@descriptionlocatag'?: string
  '@uisprite'?: string
  '@unlockedtoequip'?: string
  [key: string]: unknown
}

export interface RawActiveSpell {
  '@uniquename': string
  '@namelocatag'?: string
  '@descriptionlocatag'?: string
  '@spelleffectlocatag'?: string
  '@uisprite'?: string
  '@castingtime'?: string
  '@energyusage'?: string
  '@recastdelay'?: string
  '@castrange'?: string
  '@category'?: string
  '@uitype'?: string
  '@channelduration'?: string
  [key: string]: unknown
}

export interface RawToggleSpell {
  '@uniquename': string
  '@namelocatag'?: string
  '@descriptionlocatag'?: string
  '@uisprite'?: string
  '@castingtime'?: string
  '@energyusage'?: string
  '@recastdelay'?: string
  '@castrange'?: string
  '@category'?: string
  '@uitype'?: string
  [key: string]: unknown
}

export interface RawSpellsJson {
  spells: {
    passivespell?: RawPassiveSpell | RawPassiveSpell[]
    activespell?: RawActiveSpell | RawActiveSpell[]
    togglespell?: RawToggleSpell | RawToggleSpell[]
    [key: string]: unknown
  }
}

// ─── Types normalisés pour spells ──────────────────────────────────────────

export interface NormalizedSpell {
  uniqueName: string
  spellKind: 'active' | 'passive' | 'toggle'
  icon?: string
  category?: string
  uiType?: string
  cooldown?: number
  energyCost?: number
  castTime?: number
  channelDuration?: number
  range?: number
  nameLocaTag?: string
  descriptionLocaTag?: string
  rawData: Record<string, unknown>
  localizations: Array<{
    locale: string
    name: string
    description?: string
  }>
}

// Association item → spell (issu du craftingspelllist)
export interface NormalizedItemSpellLink {
  itemUniqueName: string
  spellUniqueName: string
  slotNumber: number | null // null = passive, 1 = Q, 2 = W, 3 = E
  tag?: string
}

// ─── Types normalisés pour import DB ───────────────────────────────────────

export interface NormalizedIngredient {
  uniqueName: string
  quantity: number
  maxReturnRate?: number
}

export interface NormalizedRecipe {
  resultUniqueName: string
  resultCount: number
  craftingFame: number
  silverCost: number
  craftingStationId?: string
  ingredients: NormalizedIngredient[]
}

export interface NormalizedCraftSpell {
  uniqueName: string
  slots?: string
  tag?: string
}

export interface ItemStats {
  itemPower?: number
  abilityPower?: number
  attackDamage?: number
  attackSpeed?: number
  attackRange?: number
  durability?: number
  healModifier?: number
  masteryModifier?: number
  slotType?: string
  attackType?: string
  twoHanded?: boolean
  craftingCategory?: string
}

export interface NormalizedItem {
  uniqueName: string
  tier: number
  enchantmentLevel: number
  itemType: string
  shopCategory?: string
  shopSubcategory?: string
  shopSubcategory2?: string
  weight?: number
  maxStackSize?: number
  canBeOvercharged: boolean
  isCraftable: boolean
  isRefinable: boolean
  baseItemUniqueName?: string
  iconUrl: string
  dataHash: string
  stats: ItemStats
  craftSpells: NormalizedCraftSpell[]
  craftingRecipe?: NormalizedRecipe
  refiningRecipe?: NormalizedRecipe
  localizations: Array<{
    locale: string
    name: string
    description?: string
  }>
}
