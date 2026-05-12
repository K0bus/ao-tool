import { describe, it, expect } from 'vitest'
import { normalizeItem } from '../normalizers/item'
import {
  BAG_ITEM,
  CRAFTABLE_SWORD,
  SWORD_WITH_ENCHANTS,
  RAW_ORE,
  REFINABLE_METALBAR,
  ENCHANTED_BASE_NO_SUFFIX,
  LOCALIZATIONS,
} from './fixtures'

// normalizeItem retourne NormalizedItem[] — 1 entrée par niveau d'enchantement

describe('normalizeItem', () => {
  describe('basic properties', () => {
    it('returns empty array for items without @uniquename', () => {
      expect(normalizeItem({} as any, {})).toEqual([])
    })

    it('correctly parses tier as number', () => {
      const [item] = normalizeItem(BAG_ITEM, {})
      expect(item?.tier).toBe(4)
    })

    it('base item has enchantmentLevel 0', () => {
      const [item] = normalizeItem(BAG_ITEM, {})
      expect(item?.enchantmentLevel).toBe(0)
    })

    it('parses weight as float', () => {
      const [item] = normalizeItem(CRAFTABLE_SWORD, {})
      expect(item?.weight).toBe(3.5)
    })

    it('preserves uniqueName unchanged', () => {
      const [item] = normalizeItem(CRAFTABLE_SWORD, {})
      expect(item?.uniqueName).toBe('T4_MAIN_SWORD')
    })

    it('sets iconUrl with AO render URL', () => {
      const [item] = normalizeItem(CRAFTABLE_SWORD, {})
      expect(item?.iconUrl).toContain('render.albiononline.com')
      expect(item?.iconUrl).toContain('T4_MAIN_SWORD')
    })

    it('generates a SHA256 dataHash', () => {
      const [item] = normalizeItem(CRAFTABLE_SWORD, {})
      expect(item?.dataHash).toBeTruthy()
      expect(item?.dataHash).toHaveLength(64)
    })

    it('two calls with same data produce same hash', () => {
      const [a] = normalizeItem(CRAFTABLE_SWORD, {})
      const [b] = normalizeItem(CRAFTABLE_SWORD, {})
      expect(a?.dataHash).toBe(b?.dataHash)
    })

    it('dataHash changes when base enchantmentLevel changes', () => {
      const sameBase0 = { ...ENCHANTED_BASE_NO_SUFFIX, '@enchantmentlevel': '0' as const }
      const [base0] = normalizeItem(sameBase0, LOCALIZATIONS)
      const [base2] = normalizeItem(ENCHANTED_BASE_NO_SUFFIX, LOCALIZATIONS)
      expect(base0?.uniqueName).toBe(base2?.uniqueName)
      expect(base0?.enchantmentLevel).toBe(0)
      expect(base2?.enchantmentLevel).toBe(2)
      expect(base0?.dataHash).not.toBe(base2?.dataHash)
    })
  })

  describe('enchantment variants expansion', () => {
    it('returns base + enchanted variants as separate entries', () => {
      const items = normalizeItem(SWORD_WITH_ENCHANTS, {})
      expect(items).toHaveLength(3) // base @0, @1, @2
    })

    it('base variant has enchantmentLevel 0', () => {
      const [base] = normalizeItem(SWORD_WITH_ENCHANTS, {})
      expect(base?.enchantmentLevel).toBe(0)
      expect(base?.uniqueName).toBe('T4_MAIN_SWORD')
    })

    it('enchanted variants have correct enchantmentLevel', () => {
      const [, enc1, enc2] = normalizeItem(SWORD_WITH_ENCHANTS, {})
      expect(enc1?.enchantmentLevel).toBe(1)
      expect(enc2?.enchantmentLevel).toBe(2)
    })

    it('enchanted variants have correct uniqueName with @N suffix', () => {
      const [, enc1] = normalizeItem(SWORD_WITH_ENCHANTS, {})
      expect(enc1?.uniqueName).toBe('T4_MAIN_SWORD@1')
    })

    it('enchanted variants carry their tier from parent', () => {
      const [, enc1] = normalizeItem(SWORD_WITH_ENCHANTS, {})
      expect(enc1?.tier).toBe(4)
    })

    it('sets baseItemUniqueName for enchanted variants', () => {
      const [, enc1] = normalizeItem(SWORD_WITH_ENCHANTS, {})
      expect(enc1?.baseItemUniqueName).toBe('T4_MAIN_SWORD')
    })

    it('base item has no baseItemUniqueName', () => {
      const [base] = normalizeItem(SWORD_WITH_ENCHANTS, {})
      expect(base?.baseItemUniqueName).toBeUndefined()
    })

    it('item with no enchantments returns exactly 1 entry', () => {
      const items = normalizeItem(BAG_ITEM, {})
      expect(items).toHaveLength(1)
    })

    it('uses raw base @enchantmentlevel when present on base item', () => {
      const [item] = normalizeItem(ENCHANTED_BASE_NO_SUFFIX, LOCALIZATIONS)
      expect(item?.uniqueName).toBe('T4_CLOTH_LEVEL2')
      expect(item?.enchantmentLevel).toBe(2)
    })

    it('does not create baseItemUniqueName when enchant exists without @N suffix', () => {
      const [item] = normalizeItem(ENCHANTED_BASE_NO_SUFFIX, LOCALIZATIONS)
      expect(item?.baseItemUniqueName).toBeUndefined()
    })
  })

  describe('itemType resolution', () => {
    it('resolves melee weapon to WEAPON', () => {
      const [item] = normalizeItem(CRAFTABLE_SWORD, {})
      expect(item?.itemType).toBe('WEAPON')
    })

    it('resolves bag to BAG', () => {
      const [item] = normalizeItem(BAG_ITEM, {})
      expect(item?.itemType).toBe('BAG')
    })

    it('resolves raw ore to RESOURCE_RAW', () => {
      const [item] = normalizeItem(RAW_ORE, {})
      expect(item?.itemType).toBe('RESOURCE_RAW')
    })

    it('resolves metalbar to RESOURCE_REFINED', () => {
      const [item] = normalizeItem(REFINABLE_METALBAR, {})
      expect(item?.itemType).toBe('RESOURCE_REFINED')
    })
  })

  describe('localizations', () => {
    it('resolves EN-US localization', () => {
      const [item] = normalizeItem(CRAFTABLE_SWORD, LOCALIZATIONS)
      const enUs = item?.localizations.find((l) => l.locale === 'EN-US')
      expect(enUs?.name).toBe("Adept's Broadsword")
    })

    it('resolves FR-FR localization', () => {
      const [item] = normalizeItem(CRAFTABLE_SWORD, LOCALIZATIONS)
      const frFr = item?.localizations.find((l) => l.locale === 'FR-FR')
      expect(frFr?.name).toBe("Grande épée de l'Adepte")
    })

    it('falls back to uniqueName when no localization found', () => {
      const [item] = normalizeItem(CRAFTABLE_SWORD, {})
      const enUs = item?.localizations.find((l) => l.locale === 'EN-US')
      expect(enUs?.name).toBe('T4_MAIN_SWORD')
    })

    it('includes description when present', () => {
      const [item] = normalizeItem(BAG_ITEM, LOCALIZATIONS)
      const enUs = item?.localizations.find((l) => l.locale === 'EN-US')
      expect(enUs?.description).toBe('A bag for carrying items.')
    })
  })

  describe('crafting recipes', () => {
    it('marks craftable items correctly', () => {
      const [item] = normalizeItem(CRAFTABLE_SWORD, {})
      expect(item?.isCraftable).toBe(true)
    })

    it('marks non-craftable items correctly', () => {
      const [item] = normalizeItem(RAW_ORE, {})
      expect(item?.isCraftable).toBe(false)
    })

    it('parses ingredient uniqueNames', () => {
      const [item] = normalizeItem(CRAFTABLE_SWORD, {})
      expect(item?.craftingRecipe?.ingredients).toHaveLength(2)
      expect(item?.craftingRecipe?.ingredients[0]?.uniqueName).toBe('T4_METALBAR')
    })

    it('parses ingredient quantities as numbers', () => {
      const [item] = normalizeItem(CRAFTABLE_SWORD, {})
      expect(item?.craftingRecipe?.ingredients[0]?.quantity).toBe(12)
    })

    it('parses maxReturnRate as 0–1 fraction', () => {
      const [item] = normalizeItem(CRAFTABLE_SWORD, {})
      // @maxreturnamount: "50" → 0.50
      expect(item?.craftingRecipe?.ingredients[0]?.maxReturnRate).toBe(0.5)
    })

    it('parses craftingFame', () => {
      const [item] = normalizeItem(CRAFTABLE_SWORD, {})
      expect(item?.craftingRecipe?.craftingFame).toBe(1200)
    })

    it('parses craftingStationId', () => {
      const [item] = normalizeItem(CRAFTABLE_SWORD, {})
      expect(item?.craftingRecipe?.craftingStationId).toBe('ARMORSMITH_LEVEL1_BUILDING')
    })

    it('enchanted variant uses its own recipe (more ingredients)', () => {
      const [, enc1] = normalizeItem(SWORD_WITH_ENCHANTS, {})
      expect(enc1?.craftingRecipe?.ingredients).toHaveLength(3)
    })
  })

  describe('refining recipes', () => {
    it('marks refinable resource correctly', () => {
      const [item] = normalizeItem(REFINABLE_METALBAR, {})
      expect(item?.isRefinable).toBe(true)
    })

    it('refining recipe uses SMELTER station', () => {
      const [item] = normalizeItem(REFINABLE_METALBAR, {})
      expect(item?.refiningRecipe?.craftingStationId).toBe('SMELTER_LEVEL1_BUILDING')
    })

    it('crafting item is not refinable', () => {
      const [item] = normalizeItem(CRAFTABLE_SWORD, {})
      expect(item?.isRefinable).toBe(false)
    })

    it('refining item has no craftingRecipe', () => {
      const [item] = normalizeItem(REFINABLE_METALBAR, {})
      expect(item?.craftingRecipe).toBeUndefined()
    })
  })

  describe('stats extraction', () => {
    it('extracts itemPower as number', () => {
      const [item] = normalizeItem(CRAFTABLE_SWORD, {})
      expect(item?.stats.itemPower).toBe(800)
    })

    it('extracts attackDamage as number', () => {
      const [item] = normalizeItem(CRAFTABLE_SWORD, {})
      expect(item?.stats.attackDamage).toBe(122)
    })

    it('extracts attackSpeed as number', () => {
      const [item] = normalizeItem(CRAFTABLE_SWORD, {})
      expect(item?.stats.attackSpeed).toBe(1.2)
    })

    it('extracts twoHanded as boolean', () => {
      const [item] = normalizeItem(CRAFTABLE_SWORD, {})
      expect(item?.stats.twoHanded).toBe(false)
    })

    it('extracts attackType as string', () => {
      const [item] = normalizeItem(CRAFTABLE_SWORD, {})
      expect(item?.stats.attackType).toBe('MELEE')
    })

    it('returns empty stats object for items with no stats', () => {
      const [item] = normalizeItem(RAW_ORE, {})
      expect(item?.stats).toEqual({})
    })
  })

  describe('shop category', () => {
    it('preserves shopCategory', () => {
      const [item] = normalizeItem(CRAFTABLE_SWORD, {})
      expect(item?.shopCategory).toBe('melee')
    })

    it('preserves shopSubcategory', () => {
      const [item] = normalizeItem(CRAFTABLE_SWORD, {})
      expect(item?.shopSubcategory).toBe('sword')
    })
  })
})
