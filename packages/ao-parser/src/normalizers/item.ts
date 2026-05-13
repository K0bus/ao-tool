import { createHash } from 'node:crypto'
import type {
  RawBaseItem,
  RawEnchantment,
  RawCraftingRequirements,
  RawCraftingSpellList,
  RawLocalizationTable,
  NormalizedItem,
  NormalizedRecipe,
  NormalizedIngredient,
  NormalizedCraftSpell,
  ItemStats,
} from '../types'

const AO_ICON_BASE = 'https://render.albiononline.com/v1/item'

// ─── Refining detection ────────────────────────────────────────────────────
// On utilise la station de craft comme signal fiable (pas les noms d'ingrédients
// qui varient et donnent des faux positifs/négatifs).
const REFINING_STATION_PREFIXES = ['SMELTER', 'TANNER', 'WEAVER', 'LUMBERMILL', 'STONEMASON']

function isRefiningStation(stationId?: string): boolean {
  if (!stationId) return false
  const upper = stationId.toUpperCase()
  return REFINING_STATION_PREFIXES.some((prefix) => upper.startsWith(prefix))
}

// ─── Item type resolution ─────────────────────────────────────────────────
function resolveItemType(shopCategory?: string, shopSubcategory?: string, uniqueName?: string): string {
  const cat = (shopCategory ?? '').toLowerCase()
  const sub = (shopSubcategory ?? '').toLowerCase()
  const name = (uniqueName ?? '').toLowerCase()

  if (
    cat === 'melee' || cat === 'ranged' || cat === 'magic' ||
    cat === 'support' || cat === 'cursed' || cat.includes('weapon')
  ) {
    if (sub.includes('offhand') || name.includes('_off_')) return 'OFF_HAND'
    return 'WEAPON'
  }
  if (name.includes('_main_') || name.includes('_2h_')) return 'WEAPON'
  if (name.includes('_off_')) return 'OFF_HAND'

  if (cat === 'armor' || cat.includes('armor') || cat.includes('armour')) {
    if (sub.includes('head') || sub.includes('helmet') || name.includes('_head_') || name.includes('_helmet')) return 'ARMOR_HEAD'
    if (sub.includes('shoes') || sub.includes('boots') || sub.includes('sandal') || name.includes('_shoes_') || name.includes('_boot')) return 'ARMOR_SHOES'
    return 'ARMOR_CHEST'
  }

  if (cat === 'bags' || sub === 'bag') return 'BAG'
  if (cat === 'cape') return 'CAPE'
  if (cat === 'mount' || sub.includes('mount')) return 'MOUNT'
  if (
    cat === 'consumable' || cat.includes('food') || cat.includes('potion') ||
    sub.includes('potion') || sub.includes('food')
  ) return 'CONSUMABLE'

  if (cat.includes('resource') || cat.includes('material')) {
    if (
      sub.includes('refined') || sub.includes('cloth') || sub.includes('leather') ||
      sub.includes('metalbar') || sub.includes('planks') || sub.includes('block') || sub.includes('bar')
    ) return 'RESOURCE_REFINED'
    return 'RESOURCE_RAW'
  }

  if (cat.includes('furniture') || sub.includes('furniture')) return 'FURNITURE'
  if (cat.includes('journal') || sub.includes('journal')) return 'JOURNAL'
  if (cat.includes('laborer') || sub.includes('labor')) return 'LABORER'
  if (cat.includes('farm') || sub.includes('farm') || sub.includes('seed') || sub.includes('animal')) return 'FARMABLE'

  return 'OTHER'
}

// ─── Recipe helpers ───────────────────────────────────────────────────────
function normalizeIngredients(req: RawCraftingRequirements): NormalizedIngredient[] {
  const resources = req.craftresource
  if (!resources) return []
  const arr = Array.isArray(resources) ? resources : [resources]
  return arr
    .filter((r) => r['@uniquename'])
    .map((r) => ({
      uniqueName: r['@uniquename'],
      quantity: parseInt(r['@count'] ?? '1', 10),
      maxReturnRate: r['@maxreturnamount'] ? parseInt(r['@maxreturnamount'], 10) / 100 : undefined,
    }))
}

function normalizeRecipe(resultUniqueName: string, req: RawCraftingRequirements): NormalizedRecipe {
  return {
    resultUniqueName,
    resultCount: parseInt(req['@amountcrafted'] ?? '1', 10),
    craftingFame: parseFloat(req['@craftingfame'] ?? '0'),
    silverCost: parseFloat(req['@silver'] ?? '0'),
    craftingStationId: req['@craftingstation'] ?? undefined,
    ingredients: normalizeIngredients(req),
  }
}

function resolveRecipes(
  uniqueName: string,
  rawReqs: RawCraftingRequirements | RawCraftingRequirements[] | undefined,
): { crafting?: NormalizedRecipe; refining?: NormalizedRecipe } {
  if (!rawReqs) return {}

  const reqsArr = Array.isArray(rawReqs) ? rawReqs : [rawReqs]
  const result: { crafting?: NormalizedRecipe; refining?: NormalizedRecipe } = {}

  for (const req of reqsArr) {
    const recipe = normalizeRecipe(uniqueName, req)
    if (recipe.ingredients.length === 0) continue
    if (isRefiningStation(req['@craftingstation'])) {
      if (!result.refining) result.refining = recipe
    } else {
      if (!result.crafting) result.crafting = recipe
    }
  }

  return result
}

// ─── Craft spells ──────────────────────────────────────────────────────────
function normalizeCraftSpells(spellList?: RawCraftingSpellList): NormalizedCraftSpell[] {
  if (!spellList?.craftspell) return []
  const arr = Array.isArray(spellList.craftspell) ? spellList.craftspell : [spellList.craftspell]
  return arr.map((s) => ({
    uniqueName: s['@uniquename'],
    slots: s['@slots'] ?? undefined,
    tag: s['@tag'] ?? undefined,
  }))
}

function mergeCraftSpells(
  baseSpells: NormalizedCraftSpell[],
  overrideSpells: NormalizedCraftSpell[],
): NormalizedCraftSpell[] {
  const merged = new Map(baseSpells.map((spell) => [spell.uniqueName, spell]))

  for (const spell of overrideSpells) {
    merged.set(spell.uniqueName, spell)
  }

  return [...merged.values()]
}

function normalizeRemovedSpells(spellList?: RawCraftingSpellList): string[] {
  if (!spellList?.removespell) return []
  const arr = Array.isArray(spellList.removespell) ? spellList.removespell : [spellList.removespell]
  return arr
    .map((spell) => spell['@uniquename'])
    .filter((uniqueName): uniqueName is string => !!uniqueName)
}

function resolveCraftSpells(
  spellList: RawCraftingSpellList | undefined,
  itemIndex: Map<string, RawBaseItem>,
  visitedReferences = new Set<string>(),
): NormalizedCraftSpell[] {
  if (!spellList) return []

  const reference = spellList['@reference']
  const inheritedSpells =
    reference && !visitedReferences.has(reference)
      ? resolveCraftSpells(
          itemIndex.get(reference)?.craftingspelllist,
          itemIndex,
          new Set([...visitedReferences, reference]),
        )
      : []

  const removed = new Set(normalizeRemovedSpells(spellList))
  const filteredInherited = inheritedSpells.filter((spell) => !removed.has(spell.uniqueName))

  return mergeCraftSpells(filteredInherited, normalizeCraftSpells(spellList))
}

// ─── Stats extraction ─────────────────────────────────────────────────────
function extractStats(base: RawBaseItem, override?: RawEnchantment): ItemStats {
  const get = (key: string): string | undefined => {
    const fk = `@${key}`
    return (
      ((override as unknown as Record<string, unknown> | undefined)?.[fk] as string | undefined) ??
      ((base as unknown as Record<string, unknown>)[fk] as string | undefined)
    )
  }

  const stats: ItemStats = {}

  const num = (field: string, prop: keyof ItemStats) => {
    const val = get(field)
    if (val !== undefined && val !== '') (stats as Record<string, unknown>)[prop] = parseFloat(val)
  }

  num('itempower', 'itemPower')
  num('abilitypower', 'abilityPower')
  num('attackdamage', 'attackDamage')
  num('attackspeed', 'attackSpeed')
  num('attackrange', 'attackRange')
  num('durability', 'durability')
  num('healmodifier', 'healModifier')
  num('masterymodifier', 'masteryModifier')

  const slotType = get('slottype')
  const attackType = get('attacktype')
  const twoHanded = get('twohanded')
  const craftingCategory = get('craftingcategory')

  if (slotType) stats.slotType = slotType
  if (attackType) stats.attackType = attackType
  if (twoHanded !== undefined) stats.twoHanded = twoHanded === 'true'
  if (craftingCategory) stats.craftingCategory = craftingCategory

  return stats
}

// ─── Core builder ─────────────────────────────────────────────────────────
// Construit un NormalizedItem pour le tier de base OU pour une variante enchantée.
// `base` est toujours l'item racine ; `override` est l'objet enchantement quand applicable.
function buildVariant(
  uniqueName: string,
  tier: number,
  enchantmentLevel: number,
  base: RawBaseItem,
  override: RawEnchantment | undefined,
  localizations: RawLocalizationTable,
  itemIndex: Map<string, RawBaseItem>,
): NormalizedItem {
  const get = (key: string): string | undefined => {
    const fk = `@${key}`
    return (
      ((override as unknown as Record<string, unknown> | undefined)?.[fk] as string | undefined) ??
      ((base as unknown as Record<string, unknown>)[fk] as string | undefined)
    )
  }

  const shopCategory = get('shopcategory')
  const shopSubcategory = get('shopsubcategory1')
  const shopSubcategory2 = get('shopsubcategory2')
  const weightStr = get('weight')
  const stackStr = get('maxstacksize')

  const weight = weightStr !== undefined ? parseFloat(weightStr) : undefined
  const maxStackSize = stackStr !== undefined ? parseInt(stackStr, 10) : undefined
  const canBeOvercharged = get('canbeovercharged') === 'true'
  const itemType = resolveItemType(shopCategory, shopSubcategory, uniqueName)
  const stats = extractStats(base, override)

  const craftingReqs = override?.craftingrequirements ?? base.craftingrequirements
  const { crafting, refining } = resolveRecipes(uniqueName, craftingReqs)

  const spellList = override?.craftingspelllist ?? base.craftingspelllist
  const craftSpells = resolveCraftSpells(spellList, itemIndex)

  // Localizations : on lit les variables depuis l'item de base (elles ne changent pas par enchantement)
  const nameVar = base.LocalizationNameVariable ?? `@ITEMS_${base['@uniquename']}`
  const descVar = base.LocalizationDescriptionVariable ?? `@ITEMS_${base['@uniquename']}_DESC`

  const itemLocalizations: Array<{ locale: string; name: string; description?: string }> =
    Object.entries(localizations)
      .filter(([locale]) => locale !== 'ForceTranslationByKey')
      .map(([locale, table]) => ({
        locale,
        name: table[nameVar] ?? uniqueName,
        description: table[descVar] ?? undefined,
      }))
      .filter((l) => l.name !== uniqueName || l.locale === 'EN-US')

  if (itemLocalizations.length === 0) {
    itemLocalizations.push({ locale: 'EN-US', name: uniqueName })
  }

  const hasEnchantSuffix = /@\d+$/.test(uniqueName)
  const baseItemUniqueName =
    enchantmentLevel > 0 && hasEnchantSuffix ? uniqueName.replace(/@\d+$/, '') : undefined

  const hashSource = { uniqueName, tier, enchantmentLevel, craftingReqs, craftSpells, stats }

  return {
    uniqueName,
    tier,
    enchantmentLevel,
    itemType,
    shopCategory,
    shopSubcategory,
    shopSubcategory2,
    weight,
    maxStackSize,
    canBeOvercharged,
    isCraftable: !!crafting,
    isRefinable: !!refining,
    baseItemUniqueName,
    iconUrl: `${AO_ICON_BASE}/${uniqueName}.png`,
    dataHash: createHash('sha256').update(JSON.stringify(hashSource)).digest('hex'),
    stats,
    craftSpells,
    craftingRecipe: crafting,
    refiningRecipe: refining,
    localizations: itemLocalizations,
  }
}

// ─── Public API ───────────────────────────────────────────────────────────
// Retourne un tableau : [item_base, enchant@1, enchant@2, enchant@3, ...]
// Un tableau vide signifie que l'item est invalide et doit être ignoré.
export function normalizeItem(
  raw: RawBaseItem,
  localizations: RawLocalizationTable,
  itemIndex: Map<string, RawBaseItem> = new Map([[raw['@uniquename'], raw]]),
): NormalizedItem[] {
  if (!raw['@uniquename']) return []

  const baseUniqueName = raw['@uniquename']
  const baseTier = parseInt(raw['@tier'] ?? '1', 10)
  const rawBaseEnchantLevel = parseInt(raw['@enchantmentlevel'] ?? '0', 10)
  const baseEnchantLevel = Number.isNaN(rawBaseEnchantLevel)
    ? 0
    : Math.max(0, Math.min(4, rawBaseEnchantLevel))

  const results: NormalizedItem[] = []

  results.push(buildVariant(baseUniqueName, baseTier, baseEnchantLevel, raw, undefined, localizations, itemIndex))

  const enchantments = raw.enchantments?.enchantment
  if (enchantments) {
    const enchArr = Array.isArray(enchantments) ? enchantments : [enchantments]
    for (const ench of enchArr) {
      const enchLevel = parseInt(ench['@enchantmentlevel'], 10)
      if (isNaN(enchLevel) || enchLevel < 1 || enchLevel > 4) continue

      // @uniquename est parfois explicite dans le JSON, sinon on le calcule
      const enchUniqueName = ench['@uniquename'] ?? `${baseUniqueName}@${enchLevel}`
      const enchTier = ench['@tier'] ? parseInt(ench['@tier'], 10) : baseTier

      results.push(buildVariant(enchUniqueName, enchTier, enchLevel, raw, ench, localizations, itemIndex))
    }
  }

  return results
}
