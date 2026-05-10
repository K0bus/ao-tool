export type ImportJobType =
  | 'FULL'
  | 'PARTIAL_ITEMS'
  | 'PARTIAL_RECIPES'
  | 'PARTIAL_SPELLS'
  | 'ICONS_SYNC'
  | 'REINDEX'

export interface ImportJobData {
  jobId: string       // = ID du ImportJob en DB (aussi utilisé comme BullMQ jobId)
  type: ImportJobType
  triggeredById?: string
}

export interface ImportJobResult {
  itemsProcessed: number
  itemsCreated: number
  itemsUpdated: number
  itemsSkipped: number
  itemsFailed: number
  durationMs: number
}

export interface ImportJobProgress {
  phase: 'fetching' | 'normalizing' | 'categories' | 'importing' | 'localizations' | 'variants' | 'recipes' | 'refining' | 'spells' | 'item_spells' | 'done'
  processed: number
  total: number
  percent: number
}

// ══════════════════════════════════════════════════════════════
// MARKET JOBS
// ══════════════════════════════════════════════════════════════

export type MarketJobType = 'FULL' | 'BATCH' | 'PRIORITY'

export interface MarketJobItem {
  id: string
  uniqueName: string
}

export interface MarketJobData {
  jobId: string
  type: MarketJobType
  items?: MarketJobItem[]
  locations?: string[]
  qualities?: number[]
  triggeredById?: string
}

export interface MarketJobResult {
  itemsRequested: number
  itemsUpdated: number
  itemsFailed: number
  durationMs: number
}
