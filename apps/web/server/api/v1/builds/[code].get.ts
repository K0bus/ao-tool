import { prisma } from '~/server/utils/prisma'
import { serializeBuild } from '~/server/utils/builds'

const DEFAULT_LOCALE = 'FR-FR'

function isNonEmpty(value?: string | null): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function resolveSpellLocalization(
  localizations: Array<{ locale: string; name: string; description: string | null }>,
  locale: string,
) {
  const preferred = localizations.find((entry) => entry.locale === locale && isNonEmpty(entry.name))
  const enUs = localizations.find((entry) => entry.locale === 'EN-US' && isNonEmpty(entry.name))
  const anyNamed = localizations.find((entry) => isNonEmpty(entry.name))

  const nameSource = preferred ?? enUs ?? anyNamed ?? null

  const descriptionSource =
    localizations.find((entry) => entry.locale === locale && isNonEmpty(entry.description))
    ?? localizations.find((entry) => entry.locale === 'EN-US' && isNonEmpty(entry.description))
    ?? localizations.find((entry) => isNonEmpty(entry.description))
    ?? null

  return {
    name: nameSource?.name?.trim() ?? null,
    description: descriptionSource?.description?.trim() ?? null,
  }
}

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, 'code')
  if (!code) throw createError({ statusCode: 400, statusMessage: 'Missing build code' })

  const locale = getQuery(event).locale as string | undefined ?? DEFAULT_LOCALE

  const build = await prisma.build.findUnique({
    where: { shareCode: code },
    include: {
      user: {
        select: {
          id: true,
          username: true,
        },
      },
      spells: {
        include: {
          spell: {
            include: { localizations: true },
          },
        },
        orderBy: { slotKey: 'asc' },
      },
    },
  })

  if (!build) throw createError({ statusCode: 404, statusMessage: 'Build not found' })

  const user = event.context.user
  if (build.visibility === 'PRIVATE') {
    if (!user) {
      throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
    }
    if (build.userId !== user.id) {
      throw createError({ statusCode: 403, statusMessage: 'Access denied' })
    }
  }

  // Incrémente le compteur de vues (fire-and-forget)
  if (build.userId !== user?.id) {
    prisma.build.update({ where: { id: build.id }, data: { viewCount: { increment: 1 } } }).catch(() => {})
  }

  return {
    data: {
      ...serializeBuild(build),
      spells: build.spells.map((bs) => ({
        ...(function () {
          const loc = resolveSpellLocalization(bs.spell.localizations, locale)

          return {
            slotKey: bs.slotKey,
            spell: {
              id: bs.spell.id,
              spellKind: bs.spell.spellKind,
              icon: bs.spell.icon,
              category: bs.spell.category,
              uiType: bs.spell.uiType,
              cooldown: bs.spell.cooldown,
              energyCost: bs.spell.energyCost,
              castTime: bs.spell.castTime,
              channelDuration: bs.spell.channelDuration,
              range: bs.spell.range,
              description: loc.description,
              name: loc.name ?? bs.spell.id,
            },
          }
        })(),
      })),
    },
  }
})
