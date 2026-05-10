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
  slotKey: string    // "Q", "W", "E", "P1", "P2"
  spell: SpellSummary
}

// ─── Builds ───────────────────────────────────────────────────────────────

export type BuildVisibility = 'PUBLIC' | 'UNLISTED' | 'PRIVATE'

export interface BuildSummary {
  id: string
  shareCode: string
  title: string
  gameMode?: string | null
  visibility: BuildVisibility
  equipment: BuildEquipment
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
}

export interface UpdateBuildInput {
  title?: string
  description?: string
  gameMode?: string
  visibility?: BuildVisibility
  equipment?: BuildEquipment
  spells?: Array<{ slotKey: string; spellId: string }>
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
}
