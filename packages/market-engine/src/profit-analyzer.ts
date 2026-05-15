import { prisma } from '@albion-tool/database'

const EXCLUDED = ["blackmarket", "caerleon", "brecilien"]
const SILVER_PER_100_NUTRITION = 999
const TAX_RATE = 0.04
const LOCALE = "FR-FR"

export async function getTopProfitHighlight() {
  const allLocations = await prisma.location.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
  })

  const validLocations = allLocations.filter(
    (l) => !EXCLUDED.includes(l.name.toLowerCase())
  )
  if (validLocations.length === 0) return null

  const locationIds = validLocations.map((l) => l.id)

  const rawItems = await prisma.item.findMany({
    where: { 
      isCraftable: true, 
      craftingRecipe: { isNot: null }, 
      shopCategory: { not: "artefacts" } 
    },
    take: 500,
    orderBy: [{ tier: "desc" }, { enchantmentLevel: "asc" }],
    select: {
      uniqueName: true,
      tier: true,
      enchantmentLevel: true,
      iconUrl: true,
      localizations: {
        where: { locale: LOCALE },
        select: { name: true },
        take: 1,
      },
      craftingRecipe: {
        select: {
          resultCount: true,
          silverCost: true,
          ingredients: {
            select: {
              quantity: true,
              maxReturnRate: true,
              item: {
                select: {
                  marketPrices: {
                    where: { locationId: { in: locationIds }, quality: 1 },
                    select: { locationId: true, sellPriceMin: true },
                  },
                },
              },
            },
          },
        },
      },
      marketPrices: {
        where: { locationId: { in: locationIds }, quality: 1 },
        select: { locationId: true, sellPriceMin: true },
      },
      cityBonuses: {
        where: { locationId: { in: locationIds } },
        select: { locationId: true, craftingBonus: true },
      },
    },
  })

  // Get return rates
  const pairs = [...new Set(rawItems.map(i => `${i.tier}:${i.enchantmentLevel}`))].map(p => {
    const [t, e] = p.split(':')
    return { tier: parseInt(t!), enchantmentLevel: parseInt(e!) }
  })
  
  const returnRates = await prisma.returnRate.findMany({ where: { OR: pairs } })
  const rrMap = new Map(returnRates.map((r) => [`${r.tier}:${r.enchantmentLevel}`, r]))

  const results = []

  for (const item of rawItems) {
    const rr = rrMap.get(`${item.tier}:${item.enchantmentLevel}`)
    const baseRR = rr?.baseReturnRate ?? 0
    const name = item.localizations[0]?.name ?? item.uniqueName

    const sellByLoc = new Map(item.marketPrices.map((p) => [p.locationId, p.sellPriceMin]))

    let bestLocMargin = -Infinity
    let bestLocName = ""
    let bestLocProfit = 0
    let bestLocCost = 0

    for (const loc of validLocations) {
      let rawCost = 0
      let savings = 0
      let skip = false

      for (const ing of item.craftingRecipe!.ingredients) {
        const price = ing.item.marketPrices.find((p) => p.locationId === loc.id)?.sellPriceMin
        if (!price || price === 0) {
          skip = true
          break
        }
        const capRR = ing.maxReturnRate !== null ? Math.min(baseRR, ing.maxReturnRate) : baseRR
        rawCost += ing.quantity * price
        savings += ing.quantity * price * capRR
      }
      if (skip) continue

      const nutritionRequired = item.craftingRecipe!.silverCost ?? 0
      const netMat = rawCost - savings
      const stationFee = (nutritionRequired / 100) * SILVER_PER_100_NUTRITION
      const netCost = netMat + stationFee
      const sellPrice = sellByLoc.get(loc.id)
      if (!sellPrice || sellPrice === 0) continue

      const cityBonus = item.cityBonuses.find(b => b.locationId === loc.id)?.craftingBonus ?? 0
      const effectiveOutput = (item.craftingRecipe!.resultCount ?? 1) * (1 + cityBonus / 100)
      const revenue = sellPrice * effectiveOutput
      const profit = revenue - revenue * TAX_RATE - netCost
      const margin = netCost > 0 ? (profit / netCost) * 100 : 0

      if (margin > bestLocMargin) {
        bestLocMargin = margin
        bestLocName = loc.name
        bestLocProfit = profit
        bestLocCost = netCost
      }
    }

    if (bestLocMargin > 0) {
      results.push({
        name,
        uniqueName: item.uniqueName,
        iconUrl: item.iconUrl,
        margin: bestLocMargin,
        profit: bestLocProfit,
        city: bestLocName,
        cost: bestLocCost
      })
    }
  }

  results.sort((a, b) => b.profit - a.profit)
  return results[0] || null
}
