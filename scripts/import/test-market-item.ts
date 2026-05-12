import { prisma } from '@albion-tool/database'
import { marketApiClient } from '@albion-tool/market-engine'

function baseUniqueName(uniqueName: string): string {
  return uniqueName.replace(/@\d+$/, '')
}

function toApiItemId(uniqueName: string, enchantmentLevel?: number | null): string {
  const base = baseUniqueName(uniqueName)
  const suffixMatch = uniqueName.match(/@(\d+)$/)
  const suffixEnchant = suffixMatch ? Number.parseInt(suffixMatch[1]!, 10) : 0

  if (enchantmentLevel && enchantmentLevel > 0) {
    return `${base}@${enchantmentLevel}`
  }
  if (suffixEnchant > 0) return uniqueName
  return base
}

async function main() {
  const input = process.argv[2] ?? 'T4_CLOTH_LEVEL2'
  const quality = Number(process.argv[3] ?? '1')
  const location = process.argv[4] ?? 'Bridgewatch'
  const enchantOverride = process.argv[5] ? Number(process.argv[5]) : undefined

  const dbItems = await prisma.item.findMany({
    where: {
      OR: [
        { uniqueName: input },
        { uniqueName: `${baseUniqueName(input)}@1` },
        { uniqueName: `${baseUniqueName(input)}@2` },
        { uniqueName: `${baseUniqueName(input)}@3` },
        { uniqueName: `${baseUniqueName(input)}@4` },
      ],
    },
    select: { id: true, uniqueName: true, enchantmentLevel: true },
    orderBy: { enchantmentLevel: 'asc' },
  })

  if (dbItems.length === 0) {
    console.error(`[test-market-item] No DB item found for "${input}"`)
    process.exitCode = 1
    return
  }

  console.log('[test-market-item] DB candidates:')
  for (const item of dbItems) {
    console.log(`  - id=${item.id} uniqueName=${item.uniqueName} enchant=${item.enchantmentLevel}`)
  }

  const target = dbItems.find(i => i.uniqueName === input) ?? dbItems[0]
  const effectiveEnchantLevel =
    enchantOverride !== undefined && Number.isFinite(enchantOverride)
      ? enchantOverride
      : target.enchantmentLevel
  const apiItemId = toApiItemId(target.uniqueName, effectiveEnchantLevel)
  console.log(`\n[test-market-item] Target item: ${target.uniqueName} (id=${target.id})`)
  console.log(`[test-market-item] API item id used: ${apiItemId}`)
  console.log(`[test-market-item] effective enchantmentLevel=${effectiveEnchantLevel ?? 0}`)
  console.log(`[test-market-item] Query params: location=${location}, quality=${quality}`)

  const prices = await marketApiClient.getPrices([apiItemId], [location], [quality])
  console.log(`\n[test-market-item] prices rows=${prices.length}`)
  if (prices[0]) {
    console.log('[test-market-item] first price row:', {
      item_id: prices[0].item_id,
      city: prices[0].city,
      quality: prices[0].quality,
      sell_price_min: prices[0].sell_price_min,
      buy_price_max: prices[0].buy_price_max,
      sell_price_min_date: prices[0].sell_price_min_date,
      buy_price_max_date: prices[0].buy_price_max_date,
    })
  }

  const history = await marketApiClient.getHistory([apiItemId], [location], [quality], 24)
  console.log(`\n[test-market-item] history rows=${history.length}`)
  if (history[0]) {
    console.log('[test-market-item] first history row:', {
      item_id: history[0].item_id,
      location: history[0].location,
      quality: history[0].quality,
      data_points: history[0].data.length,
      first_point: history[0].data[0],
    })
  }

  const recentHistory = await prisma.marketPriceHistory.findMany({
    where: { itemId: target.id, quality },
    orderBy: { timestamp: 'desc' },
    take: 5,
    select: {
      locationId: true,
      quality: true,
      sellPriceMin: true,
      buyPriceMax: true,
      timestamp: true,
    },
  })
  console.log(`\n[test-market-item] DB MarketPriceHistory rows for target id=${recentHistory.length}`)
  for (const row of recentHistory) {
    console.log(
      `  - ${row.locationId} q${row.quality} sell=${row.sellPriceMin} buy=${row.buyPriceMax} ts=${row.timestamp.toISOString()}`,
    )
  }
}

main()
  .catch((error) => {
    console.error('[test-market-item] Failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
