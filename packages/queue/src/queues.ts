import { Queue } from 'bullmq'
import { getConnection } from './connection'
import type { ImportJobData, ImportJobResult, MarketJobData, MarketJobResult } from './types'

export const IMPORT_QUEUE_NAME = 'albion-import'
export const MARKET_QUEUE_NAME = 'albion-market'
export const SCHEDULER_QUEUE_NAME = 'scheduler'

let _importQueue: Queue<ImportJobData, ImportJobResult> | null = null
let _marketQueue: Queue<MarketJobData, MarketJobResult> | null = null
let _schedulerQueue: Queue<any, any> | null = null

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

export function getMarketQueue(): Queue<MarketJobData, MarketJobResult> {
  if (!_marketQueue) {
    _marketQueue = new Queue<MarketJobData, MarketJobResult>(MARKET_QUEUE_NAME, {
      connection: getConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 30_000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
      },
    })
  }
  return _marketQueue
}

export function getSchedulerQueue(): Queue<any, any> {
  if (!_schedulerQueue) {
    _schedulerQueue = new Queue(SCHEDULER_QUEUE_NAME, {
      connection: getConnection(),
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: true,
      },
    })
  }
  return _schedulerQueue
}
