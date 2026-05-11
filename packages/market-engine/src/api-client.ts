import axios from 'axios'

export interface RawMarketPrice {
  item_id: string
  city: string
  quality: number
  sell_price_min: number
  sell_price_min_date: string
  sell_price_max: number
  sell_price_max_date: string
  buy_price_min: number
  buy_price_min_date: string
  buy_price_max: number
  buy_price_max_date: string
}

export interface RawHistoryPrice {
  item_id: string
  location: string
  quality: number
  data: Array<{
    avg_price: number
    timestamp: string
    item_count: number
  }>
}

export class MarketApiClient {
  private readonly baseUrl = 'https://www.albion-online-data.com/api/v2/stats/prices'
  private readonly historyUrl = 'https://www.albion-online-data.com/api/v2/stats/history'
  private readonly maxBatchSize = 200
  
  /**
   * Fetches prices for a list of items.
   */
  async getPrices(
    itemIds: string[],
    locations: string[] = [],
    qualities: number[] = []
  ): Promise<RawMarketPrice[]> {
    const batches = this.chunkArray(itemIds, this.maxBatchSize)
    const allPrices: RawMarketPrice[] = []

    for (const batch of batches) {
      const prices = await this.fetchBatch(batch, locations, qualities)
      allPrices.push(...prices)
    }

    return allPrices
  }

  /**
   * Fetches history for a list of items.
   */
  async getHistory(
    itemIds: string[],
    locations: string[] = [],
    qualities: number[] = [],
    timeScale: number = 24
  ): Promise<RawHistoryPrice[]> {
    const batches = this.chunkArray(itemIds, this.maxBatchSize)
    const allHistory: RawHistoryPrice[] = []

    for (const batch of batches) {
      const history = await this.fetchHistoryBatch(batch, locations, qualities, timeScale)
      allHistory.push(...history)
    }

    return allHistory
  }

  private async fetchBatch(
    itemIds: string[],
    locations: string[],
    qualities: number[]
  ): Promise<RawMarketPrice[]> {
    const itemsParam = itemIds.join(',')
    const url = `${this.baseUrl}/${itemsParam}`
    
    try {
      const response = await axios.get<RawMarketPrice[]>(url, {
        params: {
          locations: locations.join(',') || undefined,
          qualities: qualities.join(',') || undefined,
        },
        timeout: 30000,
      })
      return response.data
    } catch (error) {
      console.error(`[MarketApiClient] Error fetching price batch:`, error)
      return []
    }
  }

  private async fetchHistoryBatch(
    itemIds: string[],
    locations: string[],
    qualities: number[],
    timeScale: number
  ): Promise<RawHistoryPrice[]> {
    const itemsParam = itemIds.join(',')
    const url = `${this.historyUrl}/${itemsParam}`
    
    try {
      const response = await axios.get<RawHistoryPrice[]>(url, {
        params: {
          locations: locations.join(',') || undefined,
          qualities: qualities.join(',') || undefined,
          'time-scale': timeScale,
        },
        timeout: 30000,
      })
      return response.data
    } catch (error) {
      console.error(`[MarketApiClient] Error fetching history batch:`, error)
      return []
    }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }
}

export const marketApiClient = new MarketApiClient()
