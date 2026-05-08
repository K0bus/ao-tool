import { Queue } from 'bullmq'
import { getConnection } from './connection'
import type { ImportJobData, ImportJobResult } from './types'

export const IMPORT_QUEUE_NAME = 'albion-import'

let _importQueue: Queue<ImportJobData, ImportJobResult> | null = null

export function getImportQueue(): Queue<ImportJobData, ImportJobResult> {
  if (!_importQueue) {
    _importQueue = new Queue<ImportJobData, ImportJobResult>(IMPORT_QUEUE_NAME, {
      connection: getConnection(),
      defaultJobOptions: {
        attempts: 2,
        backoff: { type: 'exponential', delay: 10_000 },
        removeOnComplete: { count: 50 },
        removeOnFail: { count: 25 },
      },
    })
  }
  return _importQueue
}
