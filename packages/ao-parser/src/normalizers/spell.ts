import type { NormalizedSpell, RawLocalizationTable } from '../types'

const FALLBACK_LOCALE = 'EN-US'

function parseFloat_(s?: string): number | undefined {
  if (!s) return undefined
  const n = parseFloat(s)
  return isNaN(n) ? undefined : n
}

function uniqueDefined(values: Array<string | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))]
}

function resolveFirstValue(keys: string[], table: Record<string, string> | undefined): string | undefined {
  if (!table) return undefined
  for (const key of keys) {
    const value = table[key]
    if (value) return value
  }
  return undefined
}

function resolveExistingKey(keys: string[], locaTable: RawLocalizationTable): string | undefined {
  for (const key of keys) {
    for (const table of Object.values(locaTable)) {
      if (table?.[key]) return key
    }
  }
  return undefined
}

function resolveLocalizations(
  uniqueName: string,
  nameKeys: string[],
  descKeys: string[],
  locaTable: RawLocalizationTable,
): NormalizedSpell['localizations'] {
  const result: NormalizedSpell['localizations'] = []

  for (const [locale, table] of Object.entries(locaTable)) {
    if (locale === 'ForceTranslationByKey') continue

    const name = resolveFirstValue(nameKeys, table)
    const description = resolveFirstValue(descKeys, table)

    if (name || locale === FALLBACK_LOCALE) {
      result.push({ locale, name: name ?? uniqueName, description })
    }
  }

  // Garantit qu'EN-US est toujours présent
  if (!result.find((r) => r.locale === FALLBACK_LOCALE)) {
    result.push({ locale: FALLBACK_LOCALE, name: uniqueName })
  }

  return result
}

export function normalizeSpell(
  raw: Record<string, unknown>,
  kind: 'active' | 'passive' | 'toggle',
  localizations: RawLocalizationTable,
): NormalizedSpell {
  const uniqueName = raw['@uniquename'] as string
  const nameKeys = uniqueDefined([
    raw['@namelocatag'] as string | undefined,
    `@SPELLS_${uniqueName}`,
  ])
  const descKeys = uniqueDefined([
    raw['@descriptionlocatag'] as string | undefined,
    raw['@spelleffectlocatag'] as string | undefined,
    `@SPELLS_${uniqueName}_DESC`,
    `@SPELLS_${uniqueName}_EFFECT`,
  ])
  const nameKey = resolveExistingKey(nameKeys, localizations) ?? nameKeys[0]
  const descKey = resolveExistingKey(descKeys, localizations) ?? descKeys[0]

  return {
    uniqueName,
    spellKind: kind,
    icon: raw['@uisprite'] as string | undefined,
    category: raw['@category'] as string | undefined,
    uiType: raw['@uitype'] as string | undefined,
    cooldown: parseFloat_(raw['@recastdelay'] as string | undefined),
    energyCost: parseFloat_(raw['@energyusage'] as string | undefined),
    castTime: parseFloat_(raw['@castingtime'] as string | undefined),
    channelDuration: parseFloat_(raw['@channelduration'] as string | undefined),
    range: parseFloat_(raw['@castrange'] as string | undefined),
    nameLocaTag: nameKey,
    descriptionLocaTag: descKey,
    rawData: raw as Record<string, unknown>,
    localizations: resolveLocalizations(uniqueName, nameKeys, descKeys, localizations),
  }
}
