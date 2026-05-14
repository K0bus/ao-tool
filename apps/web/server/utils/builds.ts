import { z } from 'zod'
import {
  BUILD_BUDGETS,
  BUILD_CONTENT_TYPES,
  BUILD_DIFFICULTIES,
  BUILD_GROUP_SCALES,
  BUILD_PLAYSTYLES,
  BUILD_ROLES,
  buildGameModeFromContentType,
  type BuildBudget,
  type BuildContentType,
  type BuildDifficulty,
  type BuildGroupScale,
  type BuildPlaystyle,
  type BuildRole,
} from '@albion-tool/types'
import { prisma } from '~/server/utils/prisma'

export const buildContentTypeSchema = z.enum(BUILD_CONTENT_TYPES)
export const buildRoleSchema = z.enum(BUILD_ROLES)
export const buildGroupScaleSchema = z.enum(BUILD_GROUP_SCALES)
export const buildPlaystyleSchema = z.enum(BUILD_PLAYSTYLES)
export const buildDifficultySchema = z.enum(BUILD_DIFFICULTIES)
export const buildBudgetSchema = z.enum(BUILD_BUDGETS)

const buildTagArraySchema = <T extends [string, ...string[]]>(schema: z.ZodEnum<T>) =>
  z.array(schema).max(12).default([])

export const buildMetadataCreateSchema = z.object({
  primaryContentType: buildContentTypeSchema.optional(),
  contentTypes: z.array(buildContentTypeSchema).min(1).max(12),
  roles: buildTagArraySchema(buildRoleSchema).optional(),
  groupScales: buildTagArraySchema(buildGroupScaleSchema).optional(),
  playstyles: buildTagArraySchema(buildPlaystyleSchema).optional(),
  difficulty: buildDifficultySchema.optional(),
  budget: buildBudgetSchema.optional(),
})

export const buildMetadataUpdateSchema = z.object({
  primaryContentType: buildContentTypeSchema.nullable().optional(),
  contentTypes: buildTagArraySchema(buildContentTypeSchema).optional(),
  roles: buildTagArraySchema(buildRoleSchema).optional(),
  groupScales: buildTagArraySchema(buildGroupScaleSchema).optional(),
  playstyles: buildTagArraySchema(buildPlaystyleSchema).optional(),
  difficulty: buildDifficultySchema.nullable().optional(),
  budget: buildBudgetSchema.nullable().optional(),
})

function uniqueValues<T extends string>(values: T[]): T[] {
  return [...new Set(values)]
}

export function normalizeBuildMetadata<T extends {
  primaryContentType?: BuildContentType | null
  contentTypes?: BuildContentType[]
  roles?: BuildRole[]
  groupScales?: BuildGroupScale[]
  playstyles?: BuildPlaystyle[]
  difficulty?: BuildDifficulty | null
  budget?: BuildBudget | null
}>(input: T) {
  const normalizedContentTypes = uniqueValues(input.contentTypes ?? [])
  const primaryContentType = input.primaryContentType
    ?? normalizedContentTypes[0]
    ?? null
  const contentTypes = uniqueValues([
    ...normalizedContentTypes,
    ...(primaryContentType ? [primaryContentType] : []),
  ])

  return {
    primaryContentType,
    contentTypes,
    roles: uniqueValues(input.roles ?? []),
    groupScales: uniqueValues(input.groupScales ?? []),
    playstyles: uniqueValues(input.playstyles ?? []),
    difficulty: input.difficulty ?? null,
    budget: input.budget ?? null,
  }
}

export async function resolveWeaponTagsFromEquipment(
  equipment?: Record<string, string | null> | null,
) {
  const weaponUniqueName = equipment?.weapon
  if (!weaponUniqueName) {
    return {
      weaponCategory: null,
      weaponSubcategory: null,
    }
  }

  const weapon = await prisma.item.findUnique({
    where: { uniqueName: weaponUniqueName },
    select: {
      shopCategory: true,
      shopSubcategory: true,
    },
  })

  return {
    weaponCategory: weapon?.shopCategory?.trim().toLowerCase() ?? null,
    weaponSubcategory: weapon?.shopSubcategory?.trim().toLowerCase() ?? null,
  }
}

export function buildGameModeFallback(
  gameMode?: string | null,
  primaryContentType?: BuildContentType | null,
) {
  return gameMode ?? buildGameModeFromContentType(primaryContentType) ?? null
}

export function serializeBuild<T extends {
  id: string
  shareCode: string
  title: string
  description?: string | null
  gameMode?: string | null
  visibility: string
  equipment?: unknown
  viewCount: number
  createdAt: Date
  updatedAt?: Date
  userId?: string | null
  primaryContentType?: BuildContentType | null
  contentTypes?: BuildContentType[]
  roles?: BuildRole[]
  groupScales?: BuildGroupScale[]
  playstyles?: BuildPlaystyle[]
  difficulty?: BuildDifficulty | null
  budget?: BuildBudget | null
  weaponCategory?: string | null
  weaponSubcategory?: string | null
  user?: {
    id?: string
    username: string
  } | null
}>(build: T) {
  return {
    id: build.id,
    shareCode: build.shareCode,
    title: build.title,
    description: build.description ?? null,
    gameMode: buildGameModeFallback(build.gameMode, build.primaryContentType),
    visibility: build.visibility,
    equipment: (build.equipment ?? {}) as Record<string, string | null>,
    primaryContentType: build.primaryContentType ?? null,
    contentTypes: build.contentTypes ?? [],
    roles: build.roles ?? [],
    groupScales: build.groupScales ?? [],
    playstyles: build.playstyles ?? [],
    difficulty: build.difficulty ?? null,
    budget: build.budget ?? null,
    weaponCategory: build.weaponCategory ?? null,
    weaponSubcategory: build.weaponSubcategory ?? null,
    viewCount: build.viewCount,
    createdAt: build.createdAt.toISOString(),
    ...(build.updatedAt ? { updatedAt: build.updatedAt.toISOString() } : {}),
    ...(build.userId !== undefined ? { userId: build.userId } : {}),
    ...(build.user !== undefined ? { user: build.user } : {}),
  }
}
