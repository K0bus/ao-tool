import type { RawBaseItem, RawLocalizationTable } from '../types'

// Item simple sans recipe (sac)
export const BAG_ITEM: RawBaseItem = {
  '@uniquename': 'T4_BAG',
  '@tier': '4',
  '@shopcategory': 'bags',
  '@shopsubcategory1': 'bag',
  '@weight': '0',
  '@maxstacksize': '1',
  LocalizationNameVariable: '@ITEMS_T4_BAG',
  LocalizationDescriptionVariable: '@ITEMS_T4_BAG_DESC',
}

// Arme craftable avec recette complète
export const CRAFTABLE_SWORD: RawBaseItem = {
  '@uniquename': 'T4_MAIN_SWORD',
  '@tier': '4',
  '@shopcategory': 'melee',
  '@shopsubcategory1': 'sword',
  '@weight': '3.5',
  '@itempower': '800',
  '@attackdamage': '122',
  '@attackspeed': '1.2',
  '@attackrange': '2',
  '@twohanded': 'false',
  '@attacktype': 'MELEE',
  LocalizationNameVariable: '@ITEMS_T4_MAIN_SWORD',
  craftingrequirements: {
    '@craftingfame': '1200',
    '@amountcrafted': '1',
    '@craftingstation': 'ARMORSMITH_LEVEL1_BUILDING',
    craftresource: [
      { '@uniquename': 'T4_METALBAR', '@count': '12', '@maxreturnamount': '50' },
      { '@uniquename': 'T4_LEATHER', '@count': '12', '@maxreturnamount': '50' },
    ],
  },
}

// Arme avec variantes enchantées (simule le vrai format items.json)
export const SWORD_WITH_ENCHANTS: RawBaseItem = {
  '@uniquename': 'T4_MAIN_SWORD',
  '@tier': '4',
  '@shopcategory': 'melee',
  '@shopsubcategory1': 'sword',
  '@weight': '3.5',
  '@itempower': '800',
  LocalizationNameVariable: '@ITEMS_T4_MAIN_SWORD',
  craftingrequirements: {
    '@craftingfame': '1200',
    '@amountcrafted': '1',
    '@craftingstation': 'ARMORSMITH_LEVEL1_BUILDING',
    craftresource: [
      { '@uniquename': 'T4_METALBAR', '@count': '12', '@maxreturnamount': '50' },
      { '@uniquename': 'T4_LEATHER', '@count': '12', '@maxreturnamount': '50' },
    ],
  },
  enchantments: {
    enchantment: [
      {
        '@enchantmentlevel': '1',
        '@uniquename': 'T4_MAIN_SWORD@1',
        craftingrequirements: {
          '@craftingfame': '2400',
          '@amountcrafted': '1',
          '@craftingstation': 'ARMORSMITH_LEVEL1_BUILDING',
          craftresource: [
            { '@uniquename': 'T4_METALBAR', '@count': '12', '@maxreturnamount': '50' },
            { '@uniquename': 'T4_LEATHER', '@count': '12', '@maxreturnamount': '50' },
            { '@uniquename': 'RUNE', '@count': '8' },
          ],
        },
      },
      {
        '@enchantmentlevel': '2',
        '@uniquename': 'T4_MAIN_SWORD@2',
        craftingrequirements: {
          '@craftingfame': '3600',
          '@amountcrafted': '1',
          '@craftingstation': 'ARMORSMITH_LEVEL1_BUILDING',
          craftresource: [
            { '@uniquename': 'T4_METALBAR', '@count': '12' },
            { '@uniquename': 'T4_LEATHER', '@count': '12' },
            { '@uniquename': 'SOUL', '@count': '8' },
          ],
        },
      },
    ],
  },
}

// Ressource brute (minerai, pas de recipe)
export const RAW_ORE: RawBaseItem = {
  '@uniquename': 'T4_ORE',
  '@tier': '4',
  '@shopcategory': 'resource',
  '@shopsubcategory1': 'ore',
  LocalizationNameVariable: '@ITEMS_T4_ORE',
}

// Ressource raffinée — recette de refining via SMELTER
export const REFINABLE_METALBAR: RawBaseItem = {
  '@uniquename': 'T4_METALBAR',
  '@tier': '4',
  '@shopcategory': 'resource',
  '@shopsubcategory1': 'metalbar',
  LocalizationNameVariable: '@ITEMS_T4_METALBAR',
  craftingrequirements: {
    '@craftingfame': '0',
    '@amountcrafted': '1',
    '@craftingstation': 'SMELTER_LEVEL1_BUILDING',
    craftresource: [
      { '@uniquename': 'T4_ORE', '@count': '4', '@maxreturnamount': '50' },
      { '@uniquename': 'T3_METALBAR', '@count': '1', '@maxreturnamount': '50' },
    ],
  },
}

// Item dont le niveau d'enchantement est porté par l'entrée de base
// (cas observé sur certaines ressources du dump).
export const ENCHANTED_BASE_NO_SUFFIX: RawBaseItem = {
  '@uniquename': 'T4_CLOTH_LEVEL2',
  '@tier': '4',
  '@enchantmentlevel': '2',
  '@shopcategory': 'resource',
  '@shopsubcategory1': 'cloth',
  LocalizationNameVariable: '@ITEMS_T4_CLOTH_LEVEL2',
}

export const LOCALIZATIONS: RawLocalizationTable = {
  'EN-US': {
    '@ITEMS_T4_BAG': "Adept's Bag",
    '@ITEMS_T4_BAG_DESC': 'A bag for carrying items.',
    '@ITEMS_T4_MAIN_SWORD': "Adept's Broadsword",
    '@ITEMS_T4_ORE': 'Titanium Ore',
    '@ITEMS_T4_METALBAR': 'Titanium Bar',
    '@ITEMS_T4_CLOTH_LEVEL2': "Adept's Cloth (Level 2)",
  },
  'FR-FR': {
    '@ITEMS_T4_BAG': "Sac de l'Adepte",
    '@ITEMS_T4_MAIN_SWORD': "Grande épée de l'Adepte",
    '@ITEMS_T4_ORE': 'Minerai de titane',
    '@ITEMS_T4_METALBAR': 'Lingot de titane',
  },
}
