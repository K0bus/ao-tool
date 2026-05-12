import { z } from 'zod'
import { BUILD_CONTENT_TYPES, BUILD_GROUP_SCALES, BUILD_ROLES } from '@albion-tool/types'
import { prisma } from '~/server/utils/prisma'
import { serializeBuild } from '~/server/utils/builds'

const schema = z.object({
  gameMode: z.string().optional(),
  primaryContentType: z.enum(BUILD_CONTENT_TYPES).optional(),
  weaponSubcategory: z.string().optional(),
  roles: z.string().optional(),
  groupScales: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(48).default(24),
})

export default defineEventHandler(async (event) => {
  const query = await getValidatedQuery(event, (q) => schema.safeParse(q))
  if (!query.success) {
    throw createError({ statusCode: 422, statusMessage: 'Invalid query parameters' })
  }

  const { gameMode, primaryContentType, weaponSubcategory, roles, groupScales, cursor, limit } = query.data
  const roleList = roles
    ?.split(',')
    .map((value) => value.trim().toUpperCase())
    .filter((value): value is typeof BUILD_ROLES[number] => BUILD_ROLES.includes(value as typeof BUILD_ROLES[number]))
  const groupScaleList = groupScales
    ?.split(',')
    .map((value) => value.trim().toUpperCase())
    .filter((value): value is typeof BUILD_GROUP_SCALES[number] => BUILD_GROUP_SCALES.includes(value as typeof BUILD_GROUP_SCALES[number]))

  const where = {
    visibility: 'PUBLIC' as const,
    ...(gameMode ? { gameMode } : {}),
    ...(primaryContentType ? { primaryContentType } : {}),
    ...(weaponSubcategory ? { weaponSubcategory: weaponSubcategory.trim().toLowerCase() } : {}),
    ...(roleList?.length ? { roles: { hasSome: roleList } } : {}),
    ...(groupScaleList?.length ? { groupScales: { hasSome: groupScaleList } } : {}),
  }

  const builds = await prisma.build.findMany({
    where,
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      shareCode: true,
      title: true,
      gameMode: true,
      visibility: true,
      equipment: true,
      primaryContentType: true,
      contentTypes: true,
      roles: true,
      groupScales: true,
      playstyles: true,
      difficulty: true,
      budget: true,
      weaponCategory: true,
      weaponSubcategory: true,
      viewCount: true,
      createdAt: true,
      userId: true,
    },
  })

  const hasMore = builds.length > limit
  const page = hasMore ? builds.slice(0, limit) : builds

  return {
    data: page.map((b) => serializeBuild(b)),
    meta: { nextCursor: hasMore ? page[page.length - 1]?.id : undefined },
  }
})
