import type { RawBaseItem, RawItemsJson, RawLocalizationTable, RawSpellsJson, NormalizedSpell, RawBuildingsJson, RawBuilding, RawLootItem, RawLootList } from './types'
import { normalizeSpell } from './normalizers/spell'

// Source canonique : items.json (pas /formatted/ qui est une version appauvrie)
const AO_DATA_BASE = 'https://raw.githubusercontent.com/ao-data/ao-bin-dumps/refs/heads/master'

const URLS = {
  items: `${AO_DATA_BASE}/items.json`,
  localizations: `${AO_DATA_BASE}/localization.json`,
  spells: `${AO_DATA_BASE}/spells.json`,
  buildings: `${AO_DATA_BASE}/buildings.json`,
  loot: `${AO_DATA_BASE}/loot.json`,
} as const

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`)
  }
  return res.json() as Promise<T>
}

// items.json est structuré par type d'item : { items: { Weapon: [...], EquipmentItem: [...], ... } }
// On aplatit en un tableau unique de RawBaseItem.
function flattenItemsJson(json: RawItemsJson): RawBaseItem[] {
  const result: RawBaseItem[] = []
  for (const value of Object.values(json.items)) {
    if (!value) continue
    const arr = Array.isArray(value) ? value : [value]
    for (const item of arr) {
      if (item['@uniquename']) result.push(item)
    }
  }
  return result
}

function flattenBuildingsJson(json: RawBuildingsJson): Array<RawBuilding & { category: string }> {
  const result: Array<RawBuilding & { category: string }> = []
  for (const [category, value] of Object.entries(json.buildings)) {
    if (!value) continue
    const arr = Array.isArray(value) ? value : [value]
    for (const b of arr) {
      if (b['@uniquename']) result.push({ ...b, category })
    }
  }
  return result
}

interface TmxTuv {
  '@xml:lang': string
  seg: string
}

interface TmxTu {
  '@tuid': string
  tuv: TmxTuv | TmxTuv[]
}

interface TmxLocalization {
  tmx: {
    body: {
      tu: TmxTu[]
    }
  }
}

function parseTmx(raw: TmxLocalization): RawLocalizationTable {
  const table: RawLocalizationTable = {}
  const tus = raw?.tmx?.body?.tu ?? []

  for (const tu of tus) {
    const key = tu['@tuid']
    if (!key) continue

    const tuvs = Array.isArray(tu.tuv) ? tu.tuv : tu.tuv ? [tu.tuv] : []
    for (const tuv of tuvs) {
      if (!tuv) continue
      const locale = tuv['@xml:lang']
      const seg = tuv.seg
      if (!locale || !seg) continue

      if (!table[locale]) table[locale] = {}
      table[locale]![key] = seg
    }
  }

  return table
}

export interface AoRawData {
  items: RawBaseItem[]
  localizations: RawLocalizationTable
  buildings: Array<RawBuilding & { category: string }>
  loot: Map<string, string> // LootList Name -> First Item UniqueName
  rawLootLists: RawLootList[]
}

export async function fetchAoData(): Promise<AoRawData> {
  console.log('Fetching ao-bin-dumps data...')

  const [rawItemsJson, rawBuildingsJson, rawLocalizations, rawLootJson] = await Promise.all([
    fetchJson<RawItemsJson>(URLS.items),
    fetchJson<RawBuildingsJson>(URLS.buildings).catch(() => ({ buildings: {} })),
    fetchJson<TmxLocalization>(URLS.localizations).catch(() => {
      console.warn('Could not fetch localizations, continuing without')
      return null
    }),
    fetchJson<any>(URLS.loot).catch(() => ({ lootlist: [] })),
  ])

  const items = flattenItemsJson(rawItemsJson)
  const buildings = flattenBuildingsJson(rawBuildingsJson as RawBuildingsJson)
  const localizations = rawLocalizations ? parseTmx(rawLocalizations) : {}

  // Parse loot
  const lootMap = new Map<string, string>()
  const rawLootList = rawLootJson?.LootDefinition?.Lootlist
  const lootLists = Array.isArray(rawLootList) ? rawLootList : (rawLootList ? [rawLootList] : [])
  for (const list of lootLists) {
    if (!list['@name']) continue
    const loots = Array.isArray(list.Item) ? list.Item : (list.Item ? [list.Item] : [])
    const firstItem = loots.find((l: RawLootItem) => l['@type'])
    if (firstItem) {
      lootMap.set(list['@name'], firstItem['@type'])
    }
  }

  console.log(`Fetched ${items.length} base items, ${buildings.length} buildings, ${lootMap.size} loot lists, ${Object.keys(localizations).length} locales`)
  return { items, buildings, localizations, loot: lootMap, rawLootLists: lootLists }
}

export async function fetchSpells(localizations: RawLocalizationTable): Promise<NormalizedSpell[]> {
  console.log('Fetching spells.json...')
  const raw = await fetchJson<RawSpellsJson>(URLS.spells)
  const spells = raw.spells

  const toArray = <T>(v: T | T[] | undefined): T[] => {
    if (!v) return []
    return Array.isArray(v) ? v : [v]
  }

  const passives = toArray(spells.passivespell)
  const actives = toArray(spells.activespell)
  const toggles = toArray(spells.togglespell)

  const result: NormalizedSpell[] = []
  for (const sp of passives) result.push(normalizeSpell(sp, 'passive', localizations))
  for (const sp of actives) result.push(normalizeSpell(sp, 'active', localizations))
  for (const sp of toggles) result.push(normalizeSpell(sp, 'toggle', localizations))

  console.log(`Fetched ${result.length} spells (${passives.length} passive, ${actives.length} active, ${toggles.length} toggle)`)
  return result
}

export async function fetchLatestCommit(): Promise<string> {
  const url = 'https://api.github.com/repos/ao-data/ao-bin-dumps/commits/master'
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/vnd.github.v3+json' },
    })
    if (!res.ok) return 'unknown'
    const data = (await res.json()) as { sha: string }
    return data.sha.substring(0, 8)
  } catch {
    return 'unknown'
  }
}
