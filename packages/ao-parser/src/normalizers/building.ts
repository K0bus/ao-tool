import type { RawBuilding, NormalizedBuilding, RawLocalizationTable } from '../types'

export function normalizeBuilding(
  raw: RawBuilding,
  categoryType: string,
  localizations: RawLocalizationTable
): NormalizedBuilding {
  const uniqueName = raw['@uniquename']
  const tier = parseInt(raw['@tier'] ?? '1', 10)
  
  // Heuristic for name: extract the base name without tier (e.g., T4_WEAVINGMILL -> WEAVINGMILL)
  const baseName = uniqueName.replace(/^T\d+_/, '')
  
  // Mapping some known types for better naming if needed
  const nameMap: Record<string, string> = {
    'WEAVINGMILL': 'Weaver',
    'SMELTER': 'Smelter',
    'TANNERY': 'Tanner',
    'LUMBERMILL': 'Lumbermill',
    'STONEMASON': 'Stonemason',
    'TOOLMAKER': 'Toolmaker',
    'REPAIRSHOP': 'Repair Station',
    'FARMHOUSE': 'Farm',
    'HERBGARDEN': 'Herb Garden',
    'PASTURE': 'Pasture',
    'KENNEL': 'Kennel',
    'PLAYERHOUSE': 'House'
  }

  const enNameHeuristic = nameMap[baseName] || baseName.charAt(0) + baseName.slice(1).toLowerCase().replace(/_/g, ' ')
  
  const nameTag = `@BUILDINGS_${uniqueName}`
  const descTag = `@BUILDINGS_${uniqueName}_DESC`
  const capTag = `@BUILDING_CAPABILITY_${uniqueName}`
  
  const name = localizations['EN-US']?.[nameTag] || enNameHeuristic
  const description = localizations['EN-US']?.[descTag] || (raw['@descriptionlocatag'] ? localizations['EN-US']?.[raw['@descriptionlocatag']] : undefined)
  const capability = localizations['EN-US']?.[capTag] || undefined

  const localizationsList: Array<{ locale: string; name: string; description?: string }> = []
  for (const locale of Object.keys(localizations)) {
    if (locale === 'ForceTranslationByKey') continue
    const nameVal = localizations[locale]?.[nameTag]
    const descVal = localizations[locale]?.[descTag] || (raw['@descriptionlocatag'] ? localizations[locale]?.[raw['@descriptionlocatag']] : undefined)
    if (nameVal) {
      localizationsList.push({
        locale,
        name: nameVal,
        description: descVal
      })
    }
  }
  
  const requirements: Array<{ uniqueName: string; count: number }> = []
  if (raw.craftingrequirements?.craftresource) {
    const resources = Array.isArray(raw.craftingrequirements.craftresource) 
      ? raw.craftingrequirements.craftresource 
      : [raw.craftingrequirements.craftresource]
    
    for (const res of resources) {
      requirements.push({
        uniqueName: res['@uniquename'],
        count: parseInt(res['@count'] ?? '0', 10)
      })
    }
  }

  const permittedItemIds: string[] = []
  
  // 1. Extract from farmableitems (Farming buildings)
  if (raw.farmableitems?.farmableitem) {
    const items = Array.isArray(raw.farmableitems.farmableitem)
      ? raw.farmableitems.farmableitem
      : [raw.farmableitems.farmableitem]
    
    for (const item of items) {
      if (item['@uniquename']) {
        permittedItemIds.push(item['@uniquename'])
      }
    }
  }

  // 2. Extract from craftingitemlist (Crafting stations)
  if (raw.craftingitemlist?.craftitem) {
    const items = Array.isArray(raw.craftingitemlist.craftitem)
      ? raw.craftingitemlist.craftitem
      : [raw.craftingitemlist.craftitem]
    
    for (const item of items) {
      if (item['@uniquename']) {
        permittedItemIds.push(item['@uniquename'])
      }
    }
  }

  return {
    uniqueName,
    name,
    type: categoryType,
    tier,
    description,
    capability,
    iconUrl: raw['@iconSprite'] 
      ? (raw['@iconSprite'].startsWith('building_') 
          ? `/game_assets/gui/buildingicons/${raw['@iconSprite']}.png` 
          : `https://render.albiononline.com/v1/item/${raw['@iconSprite']}.png`)
      : undefined,
    nutritionStorage: raw['@nutritionstorage'] ? parseFloat(raw['@nutritionstorage']) : undefined,
    favoriteDishItemId: raw.favoritedish?.dish?.['@item'],
    favoriteDishBonus: raw.favoritedish?.dish?.['@bonus'] ? parseFloat(raw.favoritedish.dish['@bonus']) : undefined,
    nextTierBuildingId: raw['@upgradeableto'],
    uiSpriteName: raw['@uispritename'],
    uiBuildMenuTexture: raw['@uibuildmenutexture'],
    permittedItemIds: permittedItemIds.length > 0 ? [...new Set(permittedItemIds)] : undefined,
    requirements,
    localizations: localizationsList
  }
}
