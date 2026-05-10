import type { NormalizedSpell, RawLocalizationTable } from '../types'

const FALLBACK_LOCALE = 'EN-US'

function parseFloat_(s?: string): number | undefined {
  if (!s) return undefined
  const n = parseFloat(s)
  return isNaN(n) ? undefined : n
}

function resolveLocalizations(
  nameKey: string | undefined,
  descKey: string | undefined,
  locaTable: RawLocalizationTable,
): NormalizedSpell['localizations'] {
  const result: NormalizedSpell['localizations'] = []

  for (const [locale, table] of Object.entries(locaTable)) {
    if (locale === 'ForceTranslationByKey') continue

    const name = nameKey ? table[nameKey] : undefined
    const description = descKey ? table[descKey] : undefined

    if (name || locale === FALLBACK_LOCALE) {
      result.push({ locale, name: name ?? nameKey ?? '', description })
    }
  }

  // Garantit qu'EN-US est toujours présent
  if (!result.find((r) => r.locale === FALLBACK_LOCALE)) {
    result.push({ locale: FALLBACK_LOCALE, name: nameKey ?? '' })
  }

  return result
}

export function normalizeSpell(
  raw: Record<string, unknown>,
  kind: 'active' | 'passive' | 'toggle',
  localizations: RawLocalizationTable,
): NormalizedSpell {
  const uniqueName = raw['@uniquename'] as string
  const nameKey = raw['@namelocatag'] as string | undefined
  const descKey = (raw['@descriptionlocatag'] ?? raw['@spelleffectlocatag']) as string | undefined

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
    localizations: resolveLocalizations(nameKey, descKey, localizations),
  }
}
