import { prisma } from '@albion-tool/database'
import { marketApiClient, type RawMarketPrice } from './api-client'

export interface MarketSyncItem {
  id: string
  uniqueName: string
}

export class MarketPriceService {
  private readonly cityNameMap: Record<string, string> = {
    'Fort Sterling': 'FortSterling',
    'Black Market': 'BlackMarket',
  }

  /**
   * Syncs market prices for a given list of items.
   * Receives items with both DB id (for FK) and uniqueName (for API calls).
   */
  async syncMarketPrices(params: {
    items: MarketSyncItem[]
    locations?: string[]
    qualities?: number[]
    jobId?: string
  }): Promise<{ itemsUpdated: number; itemsFailed: number }> {
    const { items, locations, qualities, jobId } = params

    // API receives uniqueNames (e.g. "T4_SWORD"), not internal CUIDs
    const uniqueNames = items.map(i => i.uniqueName)
    const rawPrices = await marketApiClient.getPrices(uniqueNames, locations, qualities)

    // Build reverse map uniqueName → DB id for FK writes
    const uniqueNameToId = new Map(items.map(i => [i.uniqueName, i.id]))

    // Pre-load all valid location IDs once — never inside the loop
    const validLocationIds = new Set(
      (await prisma.location.findMany({ select: { id: true } })).map(l => l.id)
    )

    let itemsUpdated = 0
    let itemsFailed = 0

    for (const raw of rawPrices) {
      try {
        const locationId = this.normalizeLocationId(raw.city)

        if (!validLocationIds.has(locationId)) {
          console.warn(`[MarketPriceService] Skipping unknown location: ${raw.city} (mapped: ${locationId})`)
          continue
        }

        const itemDbId = uniqueNameToId.get(raw.item_id)
        if (!itemDbId) {
          console.warn(`[MarketPriceService] Skipping unknown item uniqueName: ${raw.item_id}`)
          continue
        }

        await this.upsertMarketPrice(raw, itemDbId, locationId)
        itemsUpdated++
      } catch (error) {
        console.error(`[MarketPriceService] Failed to upsert price for ${raw.item_id} in ${raw.city}:`, error)
        itemsFailed++
      }
    }

    if (jobId) {
      await prisma.marketSyncJob.update({
        where: { id: jobId },
        data: {
          itemsUpdated: { increment: itemsUpdated },
          itemsFailed: { increment: itemsFailed },
        },
      })
    }

    return { itemsUpdated, itemsFailed }
  }

  private async upsertMarketPrice(raw: RawMarketPrice, itemDbId: string, locationId: string) {
    const data = {
      itemId: itemDbId,  // CUID — correct FK reference to Item.id
      locationId,
      quality: raw.quality,
      sellPriceMin: raw.sell_price_min,
      sellPriceMinDate: this.parseSafeDate(raw.sell_price_min_date),
      sellPriceMax: raw.sell_price_max,
      sellPriceMaxDate: this.parseSafeDate(raw.sell_price_max_date),
      buyPriceMin: raw.buy_price_min,
      buyPriceMinDate: this.parseSafeDate(raw.buy_price_min_date),
      buyPriceMax: raw.buy_price_max,
      buyPriceMaxDate: this.parseSafeDate(raw.buy_price_max_date),
    }

    await prisma.$transaction(async (tx) => {
      await tx.marketPrice.upsert({
        where: {
          itemId_locationId_quality: {
            itemId: itemDbId,
            locationId,
            quality: raw.quality,
          },
        },
        update: data,
        create: data,
      })

      // Only write history if price data is present and has changed
      if (raw.sell_price_min > 0 || raw.buy_price_max > 0) {
        const lastHistory = await tx.marketPriceHistory.findFirst({
          where: { itemId: itemDbId, locationId, quality: raw.quality },
          orderBy: { timestamp: 'desc' },
          select: { sellPriceMin: true, buyPriceMax: true },
        })

        const priceChanged =
          !lastHistory ||
          lastHistory.sellPriceMin !== raw.sell_price_min ||
          lastHistory.buyPriceMax !== raw.buy_price_max

        if (priceChanged) {
          await tx.marketPriceHistory.create({
            data: {
              itemId: itemDbId,
              locationId,
              quality: raw.quality,
              sellPriceMin: raw.sell_price_min,
              buyPriceMax: raw.buy_price_max,
              timestamp: this.parseSafeDate(raw.sell_price_min_date) ?? new Date(),
            },
          })
        }
      }
    })
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

  private normalizeLocationId(city: string): string {
    return this.cityNameMap[city] ?? city
  }

  /**
   * Plans synchronization for all items.
   * Returns chunks of {id, uniqueName} pairs for correct API + DB usage.
   */
  async planFullSync(options: { triggeredById?: string } = {}) {
    const job = await prisma.marketSyncJob.create({
      data: {
        type: 'FULL',
        status: 'PENDING',
        triggeredById: options.triggeredById,
      },
    })

    // Fetch both id (for FK writes) and uniqueName (for API calls)
    const items = await prisma.item.findMany({
      select: { id: true, uniqueName: true },
    })

    const CHUNK_SIZE = 50
    const chunks = this.chunkArray(items, CHUNK_SIZE)

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
