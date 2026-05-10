import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing spell id' })

  const locale = getQuery(event).locale as string | undefined ?? 'FR-FR'

  const spell = await prisma.spell.findUnique({
    where: { id },
    include: { localizations: true },
  })

  if (!spell) throw createError({ statusCode: 404, statusMessage: 'Spell not found' })

  const loc = spell.localizations.find((l) => l.locale === locale)
    ?? spell.localizations.find((l) => l.locale === 'EN-US')

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
      name: loc?.name ?? spell.id,
      localizations: spell.localizations,
    },
  }
})
