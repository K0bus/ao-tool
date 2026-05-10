import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing item id' })

  const locale = getQuery(event).locale as string | undefined ?? 'FR-FR'

  const itemSpells = await prisma.itemSpell.findMany({
    where: { itemId: id },
    include: {
      spell: {
        include: { localizations: { where: { locale }, take: 1 } },
      },
    },
    orderBy: [{ slotNumber: 'asc' }, { tag: 'asc' }],
  })

  if (itemSpells.length === 0) {
    // Vérifie si l'item existe
    const exists = await prisma.item.findUnique({ where: { id }, select: { id: true } })
    if (!exists) throw createError({ statusCode: 404, statusMessage: 'Item not found' })
  }

  return {
    data: itemSpells.map((is) => ({
      slotNumber: is.slotNumber,
      tag: is.tag,
      spell: {
        id: is.spell.id,
        spellKind: is.spell.spellKind,
        icon: is.spell.icon,
        category: is.spell.category,
        uiType: is.spell.uiType,
        cooldown: is.spell.cooldown,
        energyCost: is.spell.energyCost,
        range: is.spell.range,
        name: is.spell.localizations[0]?.name ?? is.spell.id,
      },
    })),
  }
})
