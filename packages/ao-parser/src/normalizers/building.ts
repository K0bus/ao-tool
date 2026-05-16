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

  const enName = nameMap[baseName] || baseName.charAt(0) + baseName.slice(1).toLowerCase().replace(/_/g, ' ')
  
  const requirements = []
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

  const descTag = raw['@descriptionlocatag']
  const description = descTag ? (localizations['EN-US']?.[descTag] || undefined) : undefined

  return {
    uniqueName,
    name: enName,
    type: categoryType,
    tier,
    description,
    iconUrl: raw['@iconSprite'] ? `https://render.albiononline.com/v1/item/${raw['@iconSprite']}.png` : undefined,
    nutritionStorage: raw['@nutritionstorage'] ? parseFloat(raw['@nutritionstorage']) : undefined,
    favoriteDishItemId: raw.favoritedish?.dish?.['@item'],
    favoriteDishBonus: raw.favoritedish?.dish?.['@bonus'] ? parseFloat(raw.favoritedish.dish['@bonus']) : undefined,
    nextTierBuildingId: raw['@upgradeableto'],
    requirements
  }
}
