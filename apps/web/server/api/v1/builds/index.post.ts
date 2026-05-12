import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import { generateShareCode } from '~/server/utils/buildShare'
import {
  buildMetadataCreateSchema,
  normalizeBuildMetadata,
  resolveWeaponTagsFromEquipment,
  serializeBuild,
} from '~/server/utils/builds'

const equipmentSchema = z.object({
  weapon: z.string().nullable().optional(),
  offhand: z.string().nullable().optional(),
  helmet: z.string().nullable().optional(),
  armor: z.string().nullable().optional(),
  shoes: z.string().nullable().optional(),
  cape: z.string().nullable().optional(),
  bag: z.string().nullable().optional(),
  food: z.string().nullable().optional(),
  potion: z.string().nullable().optional(),
  mount: z.string().nullable().optional(),
})

const spellSchema = z.object({
  slotKey: z.string().min(1).max(32),
  spellId: z.string().min(1),
})

const schema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
  gameMode: z.string().max(60).optional(),
  visibility: z.enum(['PUBLIC', 'UNLISTED', 'PRIVATE']).default('PRIVATE'),
  equipment: equipmentSchema.optional(),
  spells: z.array(spellSchema).max(20).optional(),
}).merge(buildMetadataCreateSchema)

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, (b) => schema.safeParse(b))
  if (!body.success) {
    throw createError({ statusCode: 422, statusMessage: 'Invalid body', data: body.error.flatten() })
  }

  const user = event.context.user
  const {
    title,
    description,
    gameMode,
    visibility,
    equipment,
    spells,
    ...metadataInput
  } = body.data
  const metadata = normalizeBuildMetadata(metadataInput)
  const weaponTags = await resolveWeaponTagsFromEquipment((equipment ?? {}) as Record<string, string | null>)

  let shareCode = generateShareCode()
  // Collision retry (astronomiquement rare)
  while (await prisma.build.findUnique({ where: { shareCode }, select: { id: true } })) {
    shareCode = generateShareCode()
  }

  const build = await prisma.build.create({
    data: {
      shareCode,
      title,
      description,
      gameMode,
      visibility: user ? visibility : 'PRIVATE',
      userId: user?.id ?? null,
      equipment: equipment ?? {},
      ...metadata,
      ...weaponTags,
      ...(spells && spells.length > 0
        ? {
            spells: {
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
      ...serializeBuild(build),
      spells: build.spells.map((bs) => ({
        slotKey: bs.slotKey,
        spell: {
          id: bs.spell.id,
          spellKind: bs.spell.spellKind,
          icon: bs.spell.icon,
          name: bs.spell.localizations[0]?.name ?? bs.spell.id,
        },
      })),
    }
  }
})
