// ─── Spells ───────────────────────────────────────────────────────────────

export type SpellKind = 'active' | 'passive' | 'toggle'

export interface SpellLocalization {
  locale: string
  name: string
  description?: string | null
}

export interface SpellSummary {
  id: string
  spellKind: SpellKind
  icon?: string | null
  category?: string | null
  uiType?: string | null
  cooldown?: number | null
  energyCost?: number | null
  range?: number | null
  name: string // localized display name
}

export interface SpellDetail extends SpellSummary {
  castTime?: number | null
  channelDuration?: number | null
  nameLocaTag?: string | null
  descriptionLocaTag?: string | null
  localizations: SpellLocalization[]
}

// Spell disponible sur un item, avec info de slot
export interface ItemSpellOption {
  spell: SpellSummary
  slotNumber: number | null // null = passive, 1 = Q, 2 = W, 3 = E
  tag?: string | null       // identifiant de choix alternatif (A, B, C...)
}

// ─── Equipment d'un build ─────────────────────────────────────────────────

export interface BuildEquipment {
  weapon?: string | null    // Item.uniqueName
  offhand?: string | null
  helmet?: string | null
  armor?: string | null
  shoes?: string | null
  cape?: string | null
  bag?: string | null
  food?: string | null
  potion?: string | null
  mount?: string | null
}

// Spell sélectionné dans un slot de build
export interface BuildSpellSelection {
  slotKey: string    // ex: "weapon:q", "helmet:passive"
  spell: SpellSummary
}

// ─── Builds ───────────────────────────────────────────────────────────────

export type BuildVisibility = 'PUBLIC' | 'UNLISTED' | 'PRIVATE'
export type BuildContentType =
  | 'OPEN_WORLD'
  | 'MISTS_SOLO'
  | 'MISTS_DUO'
  | 'CORRUPTED_DUNGEON'
  | 'HELLGATE_2V2'
  | 'HELLGATE_5V5'
  | 'SMALL_SCALE'
  | 'ZVZ'
  | 'CRYSTAL_ARENA_1V1'
  | 'CRYSTAL_ARENA_5V5'
  | 'TRACKING_SOLO'
  | 'TRACKING_GROUP'
  | 'FAME_FARM_SOLO'
  | 'FAME_FARM_GROUP'
  | 'FAME_FARM_GROUP_AVALON'
  | 'GANK_SOLO'
  | 'GANK_GROUP'
  | 'ABYSSAL_DEPTHS_2V2'
  | 'ABYSSAL_DEPTHS_3V3'
  | 'GATHERING'
  | 'HCE'
  | 'ROADS'

export type BuildRole =
  | 'DPS'
  | 'BURST_DPS'
  | 'HEALER'
  | 'TANK'
  | 'SUPPORT'
  | 'DISRUPTOR'
  | 'MOBILITY'
  | 'ECONOMY'

export type BuildGroupScale =
  | 'SOLO'
  | 'DUO'
  | 'SMALL_GROUP'
  | 'PARTY'
  | 'RAID'
  | 'MASSIVE'

export type BuildPlaystyle =
  | 'SAFE_PVE'
  | 'PVE_PVP'
  | 'ONE_SHOT'
  | 'KITE'
  | 'BRAWL'
  | 'DIVE'
  | 'SUSTAIN'
  | 'ESCAPE'
  | 'CATCH'

export type BuildDifficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
export type BuildBudget = 'LOW' | 'MEDIUM' | 'HIGH' | 'LUXURY'

export interface BuildTagOption<T extends string> {
  value: T
  label: string
}

export const BUILD_CONTENT_TYPES = [
  'OPEN_WORLD',
  'MISTS_SOLO',
  'MISTS_DUO',
  'CORRUPTED_DUNGEON',
  'HELLGATE_2V2',
  'HELLGATE_5V5',
  'SMALL_SCALE',
  'ZVZ',
  'CRYSTAL_ARENA_1V1',
  'CRYSTAL_ARENA_5V5',
  'TRACKING_SOLO',
  'TRACKING_GROUP',
  'FAME_FARM_SOLO',
  'FAME_FARM_GROUP',
  'FAME_FARM_GROUP_AVALON',
  'GANK_SOLO',
  'GANK_GROUP',
  'ABYSSAL_DEPTHS_2V2',
  'ABYSSAL_DEPTHS_3V3',
  'GATHERING',
  'HCE',
  'ROADS',
] as const satisfies readonly BuildContentType[]

export const BUILD_ROLES = [
  'DPS',
  'BURST_DPS',
  'HEALER',
  'TANK',
  'SUPPORT',
  'DISRUPTOR',
  'MOBILITY',
  'ECONOMY',
] as const satisfies readonly BuildRole[]

export const BUILD_GROUP_SCALES = [
  'SOLO',
  'DUO',
  'SMALL_GROUP',
  'PARTY',
  'RAID',
  'MASSIVE',
] as const satisfies readonly BuildGroupScale[]

export const BUILD_PLAYSTYLES = [
  'SAFE_PVE',
  'PVE_PVP',
  'ONE_SHOT',
  'KITE',
  'BRAWL',
  'DIVE',
  'SUSTAIN',
  'ESCAPE',
  'CATCH',
] as const satisfies readonly BuildPlaystyle[]

export const BUILD_DIFFICULTIES = [
  'BEGINNER',
  'INTERMEDIATE',
  'ADVANCED',
] as const satisfies readonly BuildDifficulty[]

export const BUILD_BUDGETS = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'LUXURY',
] as const satisfies readonly BuildBudget[]

export const BUILD_CONTENT_TYPE_OPTIONS: BuildTagOption<BuildContentType>[] = [
  { value: 'OPEN_WORLD', label: 'Open World' },
  { value: 'MISTS_SOLO', label: 'Mists (Solo)' },
  { value: 'MISTS_DUO', label: 'Mists (Duo)' },
  { value: 'CORRUPTED_DUNGEON', label: 'Corrupted Dungeon' },
  { value: 'HELLGATE_2V2', label: 'Hellgate (2v2)' },
  { value: 'HELLGATE_5V5', label: 'Hellgate (5v5)' },
  { value: 'SMALL_SCALE', label: 'Small Scale' },
  { value: 'ZVZ', label: 'ZvZ' },
  { value: 'CRYSTAL_ARENA_1V1', label: 'Crystal Arena (1v1)' },
  { value: 'CRYSTAL_ARENA_5V5', label: 'Crystal Arena (5v5)' },
  { value: 'TRACKING_SOLO', label: 'Tracking (Solo)' },
  { value: 'TRACKING_GROUP', label: 'Tracking (Group)' },
  { value: 'FAME_FARM_SOLO', label: 'Fame Farm (Solo)' },
  { value: 'FAME_FARM_GROUP', label: 'Fame Farm (Group)' },
  { value: 'FAME_FARM_GROUP_AVALON', label: 'Fame Farm (Group Avalon)' },
  { value: 'GANK_SOLO', label: 'Gank (Solo)' },
  { value: 'GANK_GROUP', label: 'Gank (Group)' },
  { value: 'ABYSSAL_DEPTHS_2V2', label: 'Abyssal Depths (2v2)' },
  { value: 'ABYSSAL_DEPTHS_3V3', label: 'Abyssal Depths (3v3)' },
  { value: 'GATHERING', label: 'Gathering' },
  { value: 'HCE', label: 'HCE' },
  { value: 'ROADS', label: 'Roads of Avalon' },
]

export const BUILD_ROLE_OPTIONS: BuildTagOption<BuildRole>[] = [
  { value: 'DPS', label: 'DPS' },
  { value: 'BURST_DPS', label: 'Burst DPS' },
  { value: 'HEALER', label: 'Healer' },
  { value: 'TANK', label: 'Tank' },
  { value: 'SUPPORT', label: 'Support' },
  { value: 'DISRUPTOR', label: 'Disruptor' },
  { value: 'MOBILITY', label: 'Mobility' },
  { value: 'ECONOMY', label: 'Économie' },
]

export const BUILD_GROUP_SCALE_OPTIONS: BuildTagOption<BuildGroupScale>[] = [
  { value: 'SOLO', label: 'Solo' },
  { value: 'DUO', label: 'Duo' },
  { value: 'SMALL_GROUP', label: 'Petit groupe' },
  { value: 'PARTY', label: 'Party' },
  { value: 'RAID', label: 'Raid' },
  { value: 'MASSIVE', label: 'Massif' },
]

export const BUILD_PLAYSTYLE_OPTIONS: BuildTagOption<BuildPlaystyle>[] = [
  { value: 'SAFE_PVE', label: 'PvE safe' },
  { value: 'PVE_PVP', label: 'PvE / PvP' },
  { value: 'ONE_SHOT', label: 'One shot' },
  { value: 'KITE', label: 'Kite' },
  { value: 'BRAWL', label: 'Brawl' },
  { value: 'DIVE', label: 'Dive' },
  { value: 'SUSTAIN', label: 'Sustain' },
  { value: 'ESCAPE', label: 'Escape' },
  { value: 'CATCH', label: 'Catch' },
]

export const BUILD_DIFFICULTY_OPTIONS: BuildTagOption<BuildDifficulty>[] = [
  { value: 'BEGINNER', label: 'Débutant' },
  { value: 'INTERMEDIATE', label: 'Intermédiaire' },
  { value: 'ADVANCED', label: 'Avancé' },
]

export const BUILD_BUDGET_OPTIONS: BuildTagOption<BuildBudget>[] = [
  { value: 'LOW', label: 'Budget' },
  { value: 'MEDIUM', label: 'Standard' },
  { value: 'HIGH', label: 'Élevé' },
  { value: 'LUXURY', label: 'Luxe' },
]

export interface BuildTags {
  primaryContentType?: BuildContentType | null
  contentTypes: BuildContentType[]
  roles: BuildRole[]
  groupScales: BuildGroupScale[]
  playstyles: BuildPlaystyle[]
  difficulty?: BuildDifficulty | null
  budget?: BuildBudget | null
  weaponCategory?: string | null
  weaponSubcategory?: string | null
}

const BUILD_CONTENT_TYPE_LABEL_MAP = Object.fromEntries(
  BUILD_CONTENT_TYPE_OPTIONS.map((option) => [option.value, option.label]),
) as Record<BuildContentType, string>

const BUILD_ROLE_LABEL_MAP = Object.fromEntries(
  BUILD_ROLE_OPTIONS.map((option) => [option.value, option.label]),
) as Record<BuildRole, string>

const BUILD_GROUP_SCALE_LABEL_MAP = Object.fromEntries(
  BUILD_GROUP_SCALE_OPTIONS.map((option) => [option.value, option.label]),
) as Record<BuildGroupScale, string>

const BUILD_PLAYSTYLE_LABEL_MAP = Object.fromEntries(
  BUILD_PLAYSTYLE_OPTIONS.map((option) => [option.value, option.label]),
) as Record<BuildPlaystyle, string>

const BUILD_DIFFICULTY_LABEL_MAP = Object.fromEntries(
  BUILD_DIFFICULTY_OPTIONS.map((option) => [option.value, option.label]),
) as Record<BuildDifficulty, string>

const BUILD_BUDGET_LABEL_MAP = Object.fromEntries(
  BUILD_BUDGET_OPTIONS.map((option) => [option.value, option.label]),
) as Record<BuildBudget, string>

const PRIMARY_CONTENT_GAME_MODE_MAP: Partial<Record<BuildContentType, string>> = {
  OPEN_WORLD: 'Open World',
  MISTS_SOLO: 'Mists',
  MISTS_DUO: 'Mists',
  CORRUPTED_DUNGEON: 'Corrupted',
  HELLGATE_2V2: 'Hellgate',
  HELLGATE_5V5: 'Hellgate',
  SMALL_SCALE: 'Small Scale',
  ZVZ: 'ZvZ',
  CRYSTAL_ARENA_1V1: 'Crystal Arena',
  CRYSTAL_ARENA_5V5: 'Crystal Arena',
  TRACKING_SOLO: 'Tracking',
  TRACKING_GROUP: 'Tracking',
  FAME_FARM_SOLO: 'Fame Farm',
  FAME_FARM_GROUP: 'Fame Farm',
  FAME_FARM_GROUP_AVALON: 'Fame Farm',
  GANK_SOLO: 'Ganking',
  GANK_GROUP: 'Ganking',
  ABYSSAL_DEPTHS_2V2: 'Abyssal Depths',
  ABYSSAL_DEPTHS_3V3: 'Abyssal Depths',
  GATHERING: 'Gathering',
  HCE: 'HCE',
  ROADS: 'Roads',
}

export function buildTagLabel(
  kind: 'contentType',
  value?: BuildContentType | null,
): string | null
export function buildTagLabel(
  kind: 'role',
  value?: BuildRole | null,
): string | null
export function buildTagLabel(
  kind: 'groupScale',
  value?: BuildGroupScale | null,
): string | null
export function buildTagLabel(
  kind: 'playstyle',
  value?: BuildPlaystyle | null,
): string | null
export function buildTagLabel(
  kind: 'difficulty',
  value?: BuildDifficulty | null,
): string | null
export function buildTagLabel(
  kind: 'budget',
  value?: BuildBudget | null,
): string | null
export function buildTagLabel(
  kind: 'contentType' | 'role' | 'groupScale' | 'playstyle' | 'difficulty' | 'budget',
  value?: string | null,
): string | null {
  if (!value) return null

  const maps = {
    contentType: BUILD_CONTENT_TYPE_LABEL_MAP,
    role: BUILD_ROLE_LABEL_MAP,
    groupScale: BUILD_GROUP_SCALE_LABEL_MAP,
    playstyle: BUILD_PLAYSTYLE_LABEL_MAP,
    difficulty: BUILD_DIFFICULTY_LABEL_MAP,
    budget: BUILD_BUDGET_LABEL_MAP,
  } as const

  return (maps[kind] as Record<string, string>)[value] ?? value
}

export function buildGameModeFromContentType(contentType?: BuildContentType | null): string | null {
  if (!contentType) return null
  return PRIMARY_CONTENT_GAME_MODE_MAP[contentType] ?? BUILD_CONTENT_TYPE_LABEL_MAP[contentType] ?? contentType
}

export interface BuildSummary {
  id: string
  shareCode: string
  title: string
  gameMode?: string | null
  visibility: BuildVisibility
  equipment: BuildEquipment
  primaryContentType?: BuildContentType | null
  contentTypes: BuildContentType[]
  roles: BuildRole[]
  groupScales: BuildGroupScale[]
  playstyles: BuildPlaystyle[]
  difficulty?: BuildDifficulty | null
  budget?: BuildBudget | null
  weaponCategory?: string | null
  weaponSubcategory?: string | null
  viewCount: number
  createdAt: string
  userId?: string | null
}

export interface BuildDetail extends BuildSummary {
  description?: string | null
  spells: BuildSpellSelection[]
  updatedAt: string
}

export interface CreateBuildInput {
  title: string
  description?: string
  gameMode?: string
  visibility?: BuildVisibility
  equipment?: BuildEquipment
  spells?: Array<{ slotKey: string; spellId: string }>
  primaryContentType?: BuildContentType
  contentTypes: BuildContentType[]
  roles?: BuildRole[]
  groupScales?: BuildGroupScale[]
  playstyles?: BuildPlaystyle[]
  difficulty?: BuildDifficulty
  budget?: BuildBudget
}

export interface UpdateBuildInput {
  title?: string
  description?: string
  gameMode?: string
  visibility?: BuildVisibility
  equipment?: BuildEquipment
  spells?: Array<{ slotKey: string; spellId: string }>
  primaryContentType?: BuildContentType | null
  contentTypes?: BuildContentType[]
  roles?: BuildRole[]
  groupScales?: BuildGroupScale[]
  playstyles?: BuildPlaystyle[]
  difficulty?: BuildDifficulty | null
  budget?: BuildBudget | null
}

// ─── Collections ──────────────────────────────────────────────────────────

export interface CollectionSummary {
  id: string
  shareCode: string
  title: string
  visibility: BuildVisibility
  buildCount: number
  viewCount: number
  createdAt: string
  userId: string
}

export interface CollectionDetail extends CollectionSummary {
  description?: string | null
  builds: BuildSummary[]
  updatedAt: string
}

export interface CreateCollectionInput {
  title: string
  description?: string
  visibility?: BuildVisibility
}

export interface UpdateCollectionInput {
  title?: string
  description?: string
  visibility?: BuildVisibility
  addBuildIds?: string[]
  removeBuildIds?: string[]
}

// ─── Guest share ──────────────────────────────────────────────────────────

// Payload encodé en base64url pour le partage sans compte
export interface GuestBuildPayload {
  v: 1 // version du format
  title: string
  gameMode?: string
  equipment: BuildEquipment
  spells: Array<{ slot: string; id: string }>
  primaryContentType?: BuildContentType
  contentTypes?: BuildContentType[]
  roles?: BuildRole[]
  groupScales?: BuildGroupScale[]
  playstyles?: BuildPlaystyle[]
  difficulty?: BuildDifficulty
  budget?: BuildBudget
  weaponCategory?: string
  weaponSubcategory?: string
}
