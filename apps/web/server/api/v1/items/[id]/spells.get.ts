import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing item id' })

  const locale = getQuery(event).locale as string | undefined ?? 'FR-FR'
  const item = await prisma.item.findUnique({
    where: { id },
    select: { id: true, craftSpells: true, shopCategory: true },
  })

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
    if (!item) throw createError({ statusCode: 404, statusMessage: 'Item not found' })
  }

  const craftSpellOrder = new Map<string, number>()
  const rawCraftSpells = Array.isArray(item?.craftSpells) ? item.craftSpells : []
  for (const [index, entry] of rawCraftSpells.entries()) {
    const spellId = typeof entry === 'object' && entry && 'uniqueName' in entry
      ? (entry as { uniqueName?: string }).uniqueName
      : undefined
    if (spellId) craftSpellOrder.set(spellId, index)
  }

  const sortedItemSpells = [...itemSpells].sort((a, b) => {
    const rankA = craftSpellOrder.get(a.spellId) ?? Number.MAX_SAFE_INTEGER
    const rankB = craftSpellOrder.get(b.spellId) ?? Number.MAX_SAFE_INTEGER
    return rankA - rankB
  })

  const isHelmet = item?.shopCategory === 'head'
  let nextActiveSlot = 1
  const inferredSlotNumber = new Map<string, number | null>()
  for (const itemSpell of sortedItemSpells) {
    if (itemSpell.slotNumber !== null) {
      inferredSlotNumber.set(itemSpell.id, itemSpell.slotNumber)
      continue
    }

    if (itemSpell.spell.spellKind === 'passive') {
      inferredSlotNumber.set(itemSpell.id, null)
      continue
    }

    if (isHelmet) {
      inferredSlotNumber.set(itemSpell.id, 1)
      continue
    }

    inferredSlotNumber.set(itemSpell.id, nextActiveSlot <= 3 ? nextActiveSlot++ : null)
  }

  return {
    data: sortedItemSpells.map((is) => ({
      slotNumber: inferredSlotNumber.get(is.id) ?? is.slotNumber,
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
        description: is.spell.localizations[0]?.description ?? null,
      },
    })),
  }
})
