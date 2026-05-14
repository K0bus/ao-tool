import { randomUUID } from 'node:crypto'
import { prisma, Prisma, PriceConfidence, DEFAULT_LOCATIONS } from '@albion-tool/database'
import { marketApiClient } from './api-client'

export interface MarketSyncItem {
  id: string
  uniqueName: string
  enchantmentLevel?: number
}

export interface MarketSyncProgress {
  processed: number
  updated: number
  failed: number
  total: number
}

interface MarketPriceRow {
  itemId: string
  locationId: string
  quality: number
  sellPriceMin: number
  sellPriceMinDate: Date | null
  sellPriceMax: number
  sellPriceMaxDate: Date | null
  buyPriceMin: number
  buyPriceMinDate: Date | null
  buyPriceMax: number
  buyPriceMaxDate: Date | null
  dataUpdatedAt: Date
}

interface ResolvedPriceRow {
  itemId: string
  locationId: string
  quality: number
  sellPrice: number
  buyPrice: number
  confidence: PriceConfidence
  source: string
  updatedAt: Date
}

export class MarketPriceService {
  private readonly cityNameMap: Record<string, string> = {
    'Fort Sterling': 'FortSterling',
    'Black Market': 'BlackMarket',
  }

  private readonly INCOHERENT_PRICES = [999999, 99999999]
  private readonly BULK_WRITE_SIZE = 1000
  private validLocationIds?: Set<string>

  /**
   * Syncs market prices for a given list of items.
   * Receives items with both DB id (for FK) and uniqueName (for API calls).
   */
  async syncMarketPrices(params: {
    items: MarketSyncItem[]
    locations?: string[]
    qualities?: number[]
    jobId?: string
    onProgress?: (progress: MarketSyncProgress) => void | Promise<void>
  }): Promise<{ itemsUpdated: number; itemsFailed: number }> {
    const { items, locations, qualities, jobId, onProgress } = params

    const apiItems = items.map(item => ({
      id: item.id,
      apiItemId: this.toMarketApiItemId(item.uniqueName, item.enchantmentLevel),
    }))
    const rawPrices = await marketApiClient.getPrices(
      apiItems.map(item => item.apiItemId),
      locations,
      qualities,
    )

    const itemIdResolver = this.buildItemIdResolver(items)

    const validLocationIds = await this.getValidLocationIds()

    let itemsUpdated = 0
    let itemsFailed = 0

    const rows: MarketPriceRow[] = []
    for (const raw of rawPrices) {
      const locationId = this.normalizeLocationId(raw.city)
      const itemId = itemIdResolver(raw.item_id)

      if (!itemId || !validLocationIds.has(locationId)) {
        continue
      }

      const sellPriceMinDate = this.parseSafeDate(raw.sell_price_min_date)
      const sellPriceMaxDate = this.parseSafeDate(raw.sell_price_max_date)
      const buyPriceMinDate = this.parseSafeDate(raw.buy_price_min_date)
      const buyPriceMaxDate = this.parseSafeDate(raw.buy_price_max_date)

      rows.push({
        itemId,
        locationId,
        quality: raw.quality,
        sellPriceMin: raw.sell_price_min,
        sellPriceMinDate,
        sellPriceMax: raw.sell_price_max,
        sellPriceMaxDate,
        buyPriceMin: raw.buy_price_min,
        buyPriceMinDate,
        buyPriceMax: raw.buy_price_max,
        buyPriceMaxDate,
        dataUpdatedAt: this.latestApiDate([
          sellPriceMinDate,
          sellPriceMaxDate,
          buyPriceMinDate,
          buyPriceMaxDate,
        ]),
      })
    }

    try {
      if (rows.length > 0) {
        await this.bulkPersistPrices(rows)
        itemsUpdated = rows.length
      }
    } catch (error) {
      console.error('[MarketPriceService] Failed to persist market price batch:', error)
      itemsFailed = rows.length
    }

    // Mark items from our batch as processed
    const itemsProcessed = items.length

    if (jobId) {
      await prisma.marketSyncJob.update({
        where: { id: jobId },
        data: {
          itemsUpdated: { increment: itemsUpdated },
          itemsFailed: { increment: itemsFailed },
          itemsProcessed: { increment: itemsProcessed },
        },
      })
    }

    if (onProgress) {
      await onProgress({
        processed: itemsProcessed,
        updated: itemsUpdated,
        failed: itemsFailed,
        total: items.length
      })
    }

    return { itemsUpdated, itemsFailed }
  }

  private async bulkPersistPrices(rows: MarketPriceRow[]) {
    const existingPrices = await this.getExistingPriceMap(rows)
    const historyRows = rows
      .filter(row => this.shouldWriteHistory(row, existingPrices.get(this.priceKey(row))))
      .map(row => ({
        itemId: row.itemId,
        locationId: row.locationId,
        quality: row.quality,
        sellPriceMin: row.sellPriceMin,
        buyPriceMax: row.buyPriceMax,
        timestamp: row.dataUpdatedAt,
      }))

    const [sellFallbacks, buyFallbacks] = await Promise.all([
      this.getLatestHistoryFallbacks(rows, 'sell'),
      this.getLatestHistoryFallbacks(rows, 'buy'),
    ])

    const resolvedRows = rows.map(row => this.toResolvedPriceRow(row, sellFallbacks, buyFallbacks))

    const rowBatches = this.chunkArray(rows, this.BULK_WRITE_SIZE)
    const resolvedBatches = this.chunkArray(resolvedRows, this.BULK_WRITE_SIZE)

    for (let i = 0; i < rowBatches.length; i++) {
      const batchRows = rowBatches[i]
      const batchResolvedRows = resolvedBatches[i]
      const batchKeys = new Set(batchRows.map(r => this.priceKey(r)))
      const batchHistoryRows = historyRows.filter(r => batchKeys.has(this.priceKey(r)))

      await prisma.$transaction(
        async (tx) => {
          await this.bulkUpsertMarketPrices(tx, batchRows)
          await this.bulkInsertHistory(tx, batchHistoryRows)
          await this.bulkUpsertResolvedPrices(tx, batchResolvedRows)
        },
        { timeout: 15000 },
      )
    }
  }

  private async getExistingPriceMap(rows: MarketPriceRow[]) {
    const itemIds = [...new Set(rows.map(row => row.itemId))]
    const locationIds = [...new Set(rows.map(row => row.locationId))]
    const qualities = [...new Set(rows.map(row => row.quality))]

    const existing = await prisma.marketPrice.findMany({
      where: {
        itemId: { in: itemIds },
        locationId: { in: locationIds },
        quality: { in: qualities },
      },
      select: {
        itemId: true,
        locationId: true,
        quality: true,
        sellPriceMin: true,
        buyPriceMax: true,
      },
    })

    return new Map(existing.map(row => [this.priceKey(row), row]))
  }

  private shouldWriteHistory(
    row: MarketPriceRow,
    existing?: { sellPriceMin: number; buyPriceMax: number },
  ) {
    if (row.sellPriceMin <= 0 && row.buyPriceMax <= 0) {
      return false
    }

    return (
      !existing ||
      existing.sellPriceMin !== row.sellPriceMin ||
      existing.buyPriceMax !== row.buyPriceMax
    )
  }

  private async getLatestHistoryFallbacks(rows: MarketPriceRow[], side: 'sell' | 'buy') {
    const needsFallback = rows.filter(row =>
      side === 'sell' ? !this.isPriceValid(row.sellPriceMin) : !this.isPriceValid(row.buyPriceMax)
    )

    if (needsFallback.length === 0) {
      return new Map<string, { price: number; timestamp: Date }>()
    }

    const keys = this.uniquePriceKeys(needsFallback)
    const valueRows = Prisma.join(
      keys.map(key => Prisma.sql`(${key.itemId}::text, ${key.locationId}::text, ${key.quality}::integer)`),
    )
    const invalidPrices = Prisma.join(this.INCOHERENT_PRICES)
    const priceColumn = side === 'sell' ? Prisma.sql`h."sellPriceMin"` : Prisma.sql`h."buyPriceMax"`

    const history = await prisma.$queryRaw<Array<{
      itemId: string
      locationId: string
      quality: number
      price: number
      timestamp: Date
    }>>(Prisma.sql`
      WITH requested("itemId", "locationId", "quality") AS (VALUES ${valueRows})
      SELECT DISTINCT ON (h."itemId", h."locationId", h."quality")
        h."itemId",
        h."locationId",
        h."quality",
        ${priceColumn} AS price,
        h."timestamp"
      FROM "MarketPriceHistory" h
      JOIN requested r
        ON r."itemId" = h."itemId"
        AND r."locationId" = h."locationId"
        AND r."quality" = h."quality"
      WHERE ${priceColumn} > 0
        AND ${priceColumn} NOT IN (${invalidPrices})
      ORDER BY h."itemId", h."locationId", h."quality", h."timestamp" DESC
    `)

    return new Map(history.map(row => [this.priceKey(row), {
      price: row.price,
      timestamp: row.timestamp,
    }]))
  }

  private toResolvedPriceRow(
    row: MarketPriceRow,
    sellFallbacks: Map<string, { price: number; timestamp: Date }>,
    buyFallbacks: Map<string, { price: number; timestamp: Date }>,
  ): ResolvedPriceRow {
    const key = this.priceKey(row)
    let sellPrice = row.sellPriceMin
    let sellSource = 'live'
    let sellConfidence: PriceConfidence = PriceConfidence.HIGH
    let sellUpdatedAt = row.sellPriceMinDate ?? row.dataUpdatedAt

    if (!this.isPriceValid(sellPrice)) {
      const fallback = sellFallbacks.get(key)
      sellPrice = fallback?.price ?? 0
      sellSource = sellPrice > 0 ? 'history' : 'none'
      sellConfidence = sellPrice > 0 ? PriceConfidence.MEDIUM : PriceConfidence.LOW
      sellUpdatedAt = fallback?.timestamp ?? row.dataUpdatedAt
    }

    let buyPrice = row.buyPriceMax
    let buySource = 'live'
    let buyConfidence: PriceConfidence = PriceConfidence.HIGH
    let buyUpdatedAt = row.buyPriceMaxDate ?? row.dataUpdatedAt

    if (!this.isPriceValid(buyPrice)) {
      const fallback = buyFallbacks.get(key)
      buyPrice = fallback?.price ?? 0
      buySource = buyPrice > 0 ? 'history' : 'none'
      buyConfidence = buyPrice > 0 ? PriceConfidence.MEDIUM : PriceConfidence.LOW
      buyUpdatedAt = fallback?.timestamp ?? row.dataUpdatedAt
    }

    return {
      itemId: row.itemId,
      locationId: row.locationId,
      quality: row.quality,
      sellPrice,
      buyPrice,
      confidence: this.getLowerConfidence(sellConfidence, buyConfidence),
      source: sellSource === buySource ? sellSource : `S:${sellSource}/B:${buySource}`,
      updatedAt: this.latestApiDate([sellUpdatedAt, buyUpdatedAt]),
    }
  }

  private async bulkUpsertMarketPrices(tx: Prisma.TransactionClient, rows: MarketPriceRow[]) {
    if (rows.length === 0) return

    const values = Prisma.join(rows.map(row => Prisma.sql`(
      ${randomUUID()},
      ${row.itemId},
      ${row.locationId},
      ${row.quality},
      ${row.sellPriceMin},
      ${row.sellPriceMinDate},
      ${row.sellPriceMax},
      ${row.sellPriceMaxDate},
      ${row.buyPriceMin},
      ${row.buyPriceMinDate},
      ${row.buyPriceMax},
      ${row.buyPriceMaxDate},
      ${row.dataUpdatedAt}
    )`))

    await tx.$executeRaw(Prisma.sql`
      INSERT INTO "MarketPrice" (
        "id",
        "itemId",
        "locationId",
        "quality",
        "sellPriceMin",
        "sellPriceMinDate",
        "sellPriceMax",
        "sellPriceMaxDate",
        "buyPriceMin",
        "buyPriceMinDate",
        "buyPriceMax",
        "buyPriceMaxDate",
        "updatedAt"
      )
      VALUES ${values}
      ON CONFLICT ("itemId", "locationId", "quality")
      DO UPDATE SET
        "sellPriceMin" = EXCLUDED."sellPriceMin",
        "sellPriceMinDate" = EXCLUDED."sellPriceMinDate",
        "sellPriceMax" = EXCLUDED."sellPriceMax",
        "sellPriceMaxDate" = EXCLUDED."sellPriceMaxDate",
        "buyPriceMin" = EXCLUDED."buyPriceMin",
        "buyPriceMinDate" = EXCLUDED."buyPriceMinDate",
        "buyPriceMax" = EXCLUDED."buyPriceMax",
        "buyPriceMaxDate" = EXCLUDED."buyPriceMaxDate",
        "updatedAt" = EXCLUDED."updatedAt"
    `)
  }

  private async bulkInsertHistory(
    tx: Prisma.TransactionClient,
    rows: Array<{
      itemId: string
      locationId: string
      quality: number
      sellPriceMin: number
      buyPriceMax: number
      timestamp: Date
    }>,
  ) {
    if (rows.length === 0) return

    const values = Prisma.join(rows.map(row => Prisma.sql`(
      ${randomUUID()},
      ${row.itemId},
      ${row.locationId},
      ${row.quality},
      ${row.sellPriceMin},
      ${row.buyPriceMax},
      ${row.timestamp}
    )`))

    await tx.$executeRaw(Prisma.sql`
      INSERT INTO "MarketPriceHistory" (
        "id",
        "itemId",
        "locationId",
        "quality",
        "sellPriceMin",
        "buyPriceMax",
        "timestamp"
      )
      VALUES ${values}
    `)
  }

  private async bulkUpsertResolvedPrices(tx: Prisma.TransactionClient, rows: ResolvedPriceRow[]) {
    if (rows.length === 0) return

    const values = Prisma.join(rows.map(row => Prisma.sql`(
      ${randomUUID()},
      ${row.itemId},
      ${row.locationId},
      ${row.quality},
      ${row.sellPrice},
      ${row.buyPrice},
      ${row.confidence}::"PriceConfidence",
      ${row.source},
      ${row.updatedAt}
    )`))

    await tx.$executeRaw(Prisma.sql`
      INSERT INTO "ResolvedPrice" (
        "id",
        "itemId",
        "locationId",
        "quality",
        "sellPrice",
        "buyPrice",
        "confidence",
        "source",
        "updatedAt"
      )
      VALUES ${values}
      ON CONFLICT ("itemId", "locationId", "quality")
      DO UPDATE SET
        "sellPrice" = EXCLUDED."sellPrice",
        "buyPrice" = EXCLUDED."buyPrice",
        "confidence" = EXCLUDED."confidence",
        "source" = EXCLUDED."source",
        "updatedAt" = EXCLUDED."updatedAt"
    `)
  }

  /**
   * Backfill: Resolves all existing MarketPrice records.
   */
  async resolveAllExistingPrices() {
    const marketPrices = await prisma.marketPrice.findMany()
    console.log(`[MarketPriceService] Resolving ${marketPrices.length} existing records...`)

    for (const mp of marketPrices) {
      await this.updateResolvedPrice(prisma, {
        itemId: mp.itemId,
        locationId: mp.locationId,
        quality: mp.quality,
        sellPriceMin: mp.sellPriceMin,
        buyPriceMax: mp.buyPriceMax,
        updatedAt: this.latestApiDate([
          mp.sellPriceMinDate,
          mp.sellPriceMaxDate,
          mp.buyPriceMinDate,
          mp.buyPriceMaxDate,
        ]),
      })
    }
  }

  /**
   * Updates ResolvedPrice based on live data or historical fallback.
   */
  private async updateResolvedPrice(
    tx: Prisma.TransactionClient | typeof prisma,
    params: {
      itemId: string
      locationId: string
      quality: number
      sellPriceMin: number
      buyPriceMax: number
      updatedAt?: Date
    }
  ) {
    const { itemId, locationId, quality, sellPriceMin, buyPriceMax, updatedAt = new Date() } = params
    let sellPrice = sellPriceMin
    let sellSource = 'live'
    let sellConfidence: PriceConfidence = PriceConfidence.HIGH

    // 1. Resolve Sell Price
    if (!this.isPriceValid(sellPrice)) {
      const history = await tx.marketPriceHistory.findFirst({
        where: {
          itemId,
          locationId,
          quality,
          sellPriceMin: { gt: 0, notIn: this.INCOHERENT_PRICES },
        },
        orderBy: { timestamp: 'desc' },
      })

      if (history) {
        sellPrice = history.sellPriceMin
        sellSource = 'history'
        sellConfidence = PriceConfidence.MEDIUM
      } else {
        sellPrice = 0
        sellSource = 'none'
        sellConfidence = PriceConfidence.LOW
      }
    }

    // 2. Resolve Buy Price
    let buyPrice = buyPriceMax
    let buySource = 'live'
    let buyConfidence: PriceConfidence = PriceConfidence.HIGH

    if (!this.isPriceValid(buyPrice)) {
      const history = await tx.marketPriceHistory.findFirst({
        where: {
          itemId,
          locationId,
          quality,
          buyPriceMax: { gt: 0, notIn: this.INCOHERENT_PRICES },
        },
        orderBy: { timestamp: 'desc' },
      })

      if (history) {
        buyPrice = history.buyPriceMax
        buySource = 'history'
        buyConfidence = PriceConfidence.MEDIUM
      } else {
        buyPrice = 0
        buySource = 'none'
        buyConfidence = PriceConfidence.LOW
      }
    }

    // Determine aggregate source and confidence
    const source = sellSource === buySource ? sellSource : `S:${sellSource}/B:${buySource}`
    const confidence = this.getLowerConfidence(sellConfidence, buyConfidence)

    await tx.resolvedPrice.upsert({
      where: {
        itemId_locationId_quality: {
          itemId,
          locationId,
          quality,
        },
      },
      update: {
        sellPrice,
        buyPrice,
        confidence,
        source,
        updatedAt,
      },
      create: {
        itemId,
        locationId,
        quality,
        sellPrice,
        buyPrice,
        confidence,
        source,
        updatedAt,
      },
    })
  }

  private isPriceValid(price: number): boolean {
    return price > 0 && !this.INCOHERENT_PRICES.includes(price)
  }

  private getLowerConfidence(c1: PriceConfidence, c2: PriceConfidence): PriceConfidence {
    const order: PriceConfidence[] = [PriceConfidence.LOW, PriceConfidence.MEDIUM, PriceConfidence.HIGH]
    const i1 = order.indexOf(c1)
    const i2 = order.indexOf(c2)
    return order[Math.min(i1, i2)] as PriceConfidence
  }

  private parseSafeDate(dateStr: string | null | undefined): Date | null {
    if (!dateStr || dateStr.startsWith('0001') || dateStr.startsWith('0000')) {
      return null
    }
    const d = new Date(dateStr)
    if (isNaN(d.getTime()) || d.getFullYear() < 1970) {
      return null
    }
    return d
  }

  private latestApiDate(dates: Array<Date | null>): Date {
    const timestamps = dates
      .map(date => date?.getTime() ?? 0)
      .filter(timestamp => timestamp > 0)

    return timestamps.length > 0 ? new Date(Math.max(...timestamps)) : new Date()
  }

  private normalizeLocationId(city: string): string {
    return this.cityNameMap[city] ?? city
  }

  private baseUniqueName(uniqueName: string): string {
    return uniqueName.replace(/@\d+$/, '')
  }

  private toMarketApiItemId(uniqueName: string, enchantmentLevel?: number): string {
    const baseUniqueName = this.baseUniqueName(uniqueName)
    const suffixMatch = uniqueName.match(/@(\d+)$/)
    const suffixEnchant = suffixMatch ? Number.parseInt(suffixMatch[1]!, 10) : 0

    if (enchantmentLevel && enchantmentLevel > 0) {
      return `${baseUniqueName}@${enchantmentLevel}`
    }

    if (suffixEnchant > 0) {
      return uniqueName
    }

    return baseUniqueName
  }

  private buildItemIdResolver(items: MarketSyncItem[]) {
    const byExactUniqueName = new Map<string, string>()
    const byBaseAndEnchant = new Map<string, string>()

    for (const item of items) {
      byExactUniqueName.set(item.uniqueName, item.id)
      const enchant = item.enchantmentLevel ?? 0
      byBaseAndEnchant.set(`${this.baseUniqueName(item.uniqueName)}@${enchant}`, item.id)
    }

    return (apiItemId: string): string | undefined => {
      // 1) Strict DB match first (handles rows that are really stored with @N)
      const exact = byExactUniqueName.get(apiItemId)
      if (exact) return exact

      // 2) Fallback by parsed base+enchant to support mixed naming in DB
      const match = apiItemId.match(/^(.*?)(?:@(\d+))?$/)
      if (!match) return undefined
      const base = match[1] ?? apiItemId
      const enchant = Number.parseInt(match[2] ?? '0', 10)
      return byBaseAndEnchant.get(`${base}@${Number.isNaN(enchant) ? 0 : enchant}`)
    }
  }

  private async getValidLocationIds(): Promise<Set<string>> {
    if (!this.validLocationIds) {
      let locations = await prisma.location.findMany({ select: { id: true } })

      if (locations.length === 0) {
        console.warn('[MarketPriceService] No locations found in database; bootstrapping default market locations.')
        for (const loc of DEFAULT_LOCATIONS) {
          await prisma.location.upsert({
            where: { id: loc.id },
            update: {},
            create: loc,
          })
        }
        locations = await prisma.location.findMany({ select: { id: true } })
      }

      this.validLocationIds = new Set(locations.map(location => location.id))
    }

    return this.validLocationIds
  }

  private priceKey(row: { itemId: string; locationId: string; quality: number }): string {
    return `${row.itemId}:${row.locationId}:${row.quality}`
  }

  private uniquePriceKeys(rows: MarketPriceRow[]) {
    const map = new Map<string, { itemId: string; locationId: string; quality: number }>()

    for (const row of rows) {
      map.set(this.priceKey(row), {
        itemId: row.itemId,
        locationId: row.locationId,
        quality: row.quality,
      })
    }

    return [...map.values()]
  }

  /**
   * Plans synchronization for all items.
   * Returns chunks of {id, uniqueName, enchantmentLevel} for correct API + DB usage.
   */
  async planFullSync(options: { triggeredById?: string } = {}) {
    const job = await prisma.marketSyncJob.create({
      data: {
        type: 'FULL',
        status: 'PENDING',
        triggeredById: options.triggeredById,
      },
    })

    // Fetch id (FK writes) + uniqueName/enchantmentLevel (API id generation)
    const items = await prisma.item.findMany({
      select: { id: true, uniqueName: true, enchantmentLevel: true },
    })

    const chunks = marketApiClient.chunkPriceItems(items)

    return { jobId: job.id, chunks, totalItems: items.length }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }
}

export const marketPriceService = new MarketPriceService()
