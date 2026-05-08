export type ImportJobType =
  | 'FULL'
  | 'PARTIAL_ITEMS'
  | 'PARTIAL_RECIPES'
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
  phase: 'fetching' | 'normalizing' | 'importing' | 'localizations' | 'variants' | 'recipes' | 'refining' | 'done'
  processed: number
  total: number
  percent: number
}
