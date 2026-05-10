import { prisma } from '~/server/utils/prisma'

const DEFAULT_LOCALE = 'FR-FR'

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, 'code')
  if (!code) throw createError({ statusCode: 400, statusMessage: 'Missing build code' })

  const locale = getQuery(event).locale as string | undefined ?? DEFAULT_LOCALE

  const build = await prisma.build.findUnique({
    where: { shareCode: code },
    include: {
      spells: {
        include: {
          spell: {
            include: { localizations: { where: { locale }, take: 1 } },
          },
        },
        orderBy: { slotKey: 'asc' },
      },
    },
  })

  if (!build) throw createError({ statusCode: 404, statusMessage: 'Build not found' })

  const user = event.context.user
  if (build.visibility === 'PRIVATE' && build.userId !== user?.id) {
    throw createError({ statusCode: 403, statusMessage: 'Access denied' })
  }

  // Incrémente le compteur de vues (fire-and-forget)
  if (build.userId !== user?.id) {
    prisma.build.update({ where: { id: build.id }, data: { viewCount: { increment: 1 } } }).catch(() => {})
  }

  return {
    data: {
      id: build.id,
      shareCode: build.shareCode,
      title: build.title,
      description: build.description,
      gameMode: build.gameMode,
      visibility: build.visibility,
      equipment: (build.equipment ?? {}) as Record<string, string | null>,
      spells: build.spells.map((bs) => ({
        slotKey: bs.slotKey,
        spell: {
          id: bs.spell.id,
          spellKind: bs.spell.spellKind,
          icon: bs.spell.icon,
          category: bs.spell.category,
          uiType: bs.spell.uiType,
          cooldown: bs.spell.cooldown,
          energyCost: bs.spell.energyCost,
          range: bs.spell.range,
          name: bs.spell.localizations[0]?.name ?? bs.spell.id,
        },
      })),
      viewCount: build.viewCount,
      userId: build.userId,
      createdAt: build.createdAt.toISOString(),
      updatedAt: build.updatedAt.toISOString(),
    },
  }
})
