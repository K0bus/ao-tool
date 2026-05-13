import { prisma } from '~/server/utils/prisma'

function isNonEmpty(value?: string | null): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

const SPELL_NAME_OVERRIDES: Record<string, string> = {
  SACRIFICE_HEAL: 'Sacrifice',
  SACRIFICE_HEAL_EFFECT: 'Sacrifice',
}

function humanizeSpellId(id: string): string {
  if (SPELL_NAME_OVERRIDES[id]) return SPELL_NAME_OVERRIDES[id]
  return id
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function resolveLocalization(
  localizations: Array<{ locale: string; name: string; description: string | null }>,
  locale: string,
) {
  const name =
    localizations.find((l) => l.locale === locale && isNonEmpty(l.name))?.name
    ?? localizations.find((l) => l.locale === 'EN-US' && isNonEmpty(l.name))?.name
    ?? localizations.find((l) => isNonEmpty(l.name))?.name
    ?? null

  const description =
    localizations.find((l) => l.locale === locale && isNonEmpty(l.description))?.description
    ?? localizations.find((l) => l.locale === 'EN-US' && isNonEmpty(l.description))?.description
    ?? localizations.find((l) => isNonEmpty(l.description))?.description
    ?? null

  return { name, description }
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing spell id' })

  const locale = getQuery(event).locale as string | undefined ?? 'FR-FR'

  const spell = await prisma.spell.findUnique({
    where: { id },
    include: { localizations: true },
  })

  if (!spell) throw createError({ statusCode: 404, statusMessage: 'Spell not found' })

  let resolved = resolveLocalization(spell.localizations, locale)

  if (!resolved.name) {
    const siblingSpells = await prisma.spell.findMany({
      where: {
        OR: [
          { id: { startsWith: `${id}_` } },
          { nameLocaTag: { contains: id, mode: 'insensitive' } },
          { descriptionLocaTag: { contains: id, mode: 'insensitive' } },
        ],
      },
      include: { localizations: true },
      take: 25,
    })

    for (const candidate of siblingSpells) {
      const candidateLoc = resolveLocalization(candidate.localizations, locale)
      if (candidateLoc.name) {
        resolved = {
          name: candidateLoc.name,
          description: resolved.description ?? candidateLoc.description,
        }
        break
      }
    }
  }

  return {
    data: {
      id: spell.id,
      spellKind: spell.spellKind,
      icon: spell.icon,
      category: spell.category,
      uiType: spell.uiType,
      cooldown: spell.cooldown,
      energyCost: spell.energyCost,
      castTime: spell.castTime,
      channelDuration: spell.channelDuration,
      range: spell.range,
      nameLocaTag: spell.nameLocaTag,
      descriptionLocaTag: spell.descriptionLocaTag,
      name: resolved.name ?? humanizeSpellId(spell.id),
      description: resolved.description,
      localizations: spell.localizations,
    },
  }
})
