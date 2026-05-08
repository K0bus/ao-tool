import type { RawBaseItem, RawItemsJson, RawLocalizationTable } from './types'

// Source canonique : items.json (pas /formatted/ qui est une version appauvrie)
const AO_DATA_BASE = 'https://raw.githubusercontent.com/ao-data/ao-bin-dumps/refs/heads/master'

const URLS = {
  items: `${AO_DATA_BASE}/items.json`,
  localizations: `${AO_DATA_BASE}/localization.json`,
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
}

export async function fetchAoData(): Promise<AoRawData> {
  console.log('Fetching ao-bin-dumps data...')

  const [rawItemsJson, rawLocalizations] = await Promise.all([
    fetchJson<RawItemsJson>(URLS.items),
    fetchJson<TmxLocalization>(URLS.localizations).catch(() => {
      console.warn('Could not fetch localizations, continuing without')
      return null
    }),
  ])

  const items = flattenItemsJson(rawItemsJson)
  const localizations = rawLocalizations ? parseTmx(rawLocalizations) : {}

  console.log(`Fetched ${items.length} base items, ${Object.keys(localizations).length} locales`)
  return { items, localizations }
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
