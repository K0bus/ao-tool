import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import { requireAuth } from '~/server/utils/guards'
import {
  buildMetadataUpdateSchema,
  normalizeBuildMetadata,
  resolveWeaponTagsFromEquipment,
  serializeBuild,
} from '~/server/utils/builds'

const schema = z.object({
  title: z.string().min(1).max(120).optional(),
  description: z.string().max(2000).nullable().optional(),
  gameMode: z.string().max(60).nullable().optional(),
  visibility: z.enum(['PUBLIC', 'UNLISTED', 'PRIVATE']).optional(),
  equipment: z.record(z.string().nullable()).optional(),
  spells: z.array(z.object({ slotKey: z.string().min(1).max(32), spellId: z.string().min(1) })).max(20).optional(),
}).merge(buildMetadataUpdateSchema)

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const code = getRouterParam(event, 'code')
  if (!code) throw createError({ statusCode: 400, statusMessage: 'Missing build code' })

  const body = await readValidatedBody(event, (b) => schema.safeParse(b))
  if (!body.success) {
    throw createError({ statusCode: 422, statusMessage: 'Invalid body', data: body.error.flatten() })
  }

  const build = await prisma.build.findUnique({
    where: { shareCode: code },
    select: { id: true, userId: true, equipment: true },
  })
  if (!build) throw createError({ statusCode: 404, statusMessage: 'Build not found' })
  if (build.userId !== user.id) throw createError({ statusCode: 403, statusMessage: 'Access denied' })

  const {
    spells,
    equipment,
    primaryContentType,
    contentTypes,
    roles,
    groupScales,
    playstyles,
    difficulty,
    budget,
    ...fields
  } = body.data
  const metadataProvided = (
    primaryContentType !== undefined
    || contentTypes !== undefined
    || roles !== undefined
    || groupScales !== undefined
    || playstyles !== undefined
    || difficulty !== undefined
    || budget !== undefined
  )

  const metadata = metadataProvided
    ? normalizeBuildMetadata({
        primaryContentType,
        contentTypes,
        roles,
        groupScales,
        playstyles,
        difficulty,
        budget,
      })
    : null

  const mergedEquipment = (equipment ?? (build.equipment as Record<string, string | null> | null) ?? {}) as Record<string, string | null>
  const weaponTags = await resolveWeaponTagsFromEquipment(mergedEquipment)

  const updated = await prisma.build.update({
    where: { id: build.id },
    data: {
      ...fields,
      ...(equipment !== undefined ? { equipment } : {}),
      ...(metadata ? metadata : {}),
      ...weaponTags,
      ...(spells !== undefined
        ? {
            spells: {
              deleteMany: {},
              create: spells.map((s) => ({ slotKey: s.slotKey, spellId: s.spellId })),
            },
          }
        : {}),
    },
    include: {
      spells: { include: { spell: { include: { localizations: { take: 1 } } } } },
    },
  })

  return {
    data: {
      ...serializeBuild(updated),
      spells: updated.spells.map((bs) => ({
        slotKey: bs.slotKey,
        spell: { id: bs.spell.id, name: bs.spell.localizations[0]?.name ?? bs.spell.id },
      })),
    },
  }
})
