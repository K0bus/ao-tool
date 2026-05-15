import { prisma } from "~/server/utils/prisma";
import { cached } from "~/server/utils/cache";

const EXCLUDED = ["blackmarket", "caerleon", "brecilien"];
const SILVER_PER_100_NUTRITION = 999; // default public station rate
const TAX_RATE = 0.04;
const LOCALE = "FR-FR";
const MIN_CITIES = 2; // item must be calculable in at least 2 cities

export default defineEventHandler(async () => {
  return cached("top-profit-items:v1", computeTopProfit, 1800);
});

async function computeTopProfit() {
  const allLocations = await prisma.location.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
  });

  const validLocations = allLocations.filter(
    (l) => !EXCLUDED.includes(l.name.toLowerCase())
  );
  if (validLocations.length === 0) return null;

  const locationIds = validLocations.map((l) => l.id);

  const rawItems = await prisma.item.findMany({
    where: { isCraftable: true, craftingRecipe: { isNot: null }, shopCategory: { not: "artefacts" } },
    take: 1000,
    orderBy: [{ tier: "desc" }, { enchantmentLevel: "asc" }, { id: "asc" }],
    select: {
      uniqueName: true,
      tier: true,
      enchantmentLevel: true,
      iconUrl: true,
      itemType: true,
      shopCategory: true,
      shopSubcategory: true,
      category: {
        select: {
          nameEn: true,
          localizations: {
            where: { locale: LOCALE },
            select: { name: true },
            take: 1,
          },
        },
      },
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
  });

  const pairs = [
    ...new Map(
      rawItems.map((i) => [
        `${i.tier}:${i.enchantmentLevel}`,
        { tier: i.tier, enchantmentLevel: i.enchantmentLevel },
      ])
    ).values(),
  ];
  const returnRates =
    pairs.length > 0
      ? await prisma.returnRate.findMany({ where: { OR: pairs } })
      : [];
  const rrMap = new Map(
    returnRates.map((r) => [`${r.tier}:${r.enchantmentLevel}`, r])
  );

  const results: ReturnType<typeof buildResult>[] = [];

  for (const item of rawItems) {
    const rr = rrMap.get(`${item.tier}:${item.enchantmentLevel}`);
    const baseRR = rr?.baseReturnRate ?? 0;
    const name = item.localizations[0]?.name ?? item.uniqueName;

    const sellByLoc = new Map(
      item.marketPrices.map((p) => [p.locationId, p.sellPriceMin])
    );

    const margins: number[] = [];
    let bestLocMargin = -Infinity;
    let bestLocName = "";
    let bestLocProfit = 0;

    for (const loc of validLocations) {
      let rawCost = 0;
      let savings = 0;
      let skip = false;

      for (const ing of item.craftingRecipe!.ingredients) {
        const price = ing.item.marketPrices.find(
          (p) => p.locationId === loc.id
        )?.sellPriceMin;
        if (!price || price === 0) {
          skip = true;
          break;
        }
        const capRR =
          ing.maxReturnRate !== null
            ? Math.min(baseRR, ing.maxReturnRate)
            : baseRR;
        rawCost += ing.quantity * price;
        savings += ing.quantity * price * capRR;
      }
      if (skip) continue;

      const nutritionRequired = item.craftingRecipe!.silverCost ?? 0;
      const netMat = rawCost - savings;
      // Station fee = (nutritionRequired / 100) × silverPer100Nutrition
      const stationFee = (nutritionRequired / 100) * SILVER_PER_100_NUTRITION;
      const netCost = netMat + stationFee;
      const sellPrice = sellByLoc.get(loc.id);
      if (!sellPrice || sellPrice === 0) continue;

      const cityBonus = item.cityBonuses.find(b => b.locationId === loc.id)?.craftingBonus ?? 0;
      const effectiveOutput = (item.craftingRecipe!.resultCount ?? 1) * (1 + cityBonus / 100);
      const revenue = sellPrice * effectiveOutput;
      const profit = revenue - revenue * TAX_RATE - netCost;
      const margin = netCost > 0 ? (profit / netCost) * 100 : 0;

      margins.push(margin);
      if (margin > bestLocMargin) {
        bestLocMargin = margin;
        bestLocName = loc.name;
        bestLocProfit = profit;
      }
    }

    if (margins.length < MIN_CITIES) continue;

    const avgMargin = margins.reduce((a, b) => a + b, 0) / margins.length;
    const categoryName = (item as any).category?.localizations[0]?.name ?? (item as any).category?.nameEn ?? null;
    results.push(buildResult(item, name, categoryName, avgMargin, bestLocName, bestLocMargin, bestLocProfit, margins.length));
  }

  results.sort((a, b) => b.avgMargin - a.avgMargin);
  return results.slice(0, 5);
}

function buildResult(
  item: { uniqueName: string; tier: number; enchantmentLevel: number; iconUrl: string | null; itemType: string | null; shopCategory: string | null; shopSubcategory: string | null },
  name: string,
  categoryName: string | null,
  avgMargin: number,
  bestCity: string,
  bestMargin: number,
  bestProfit: number,
  citiesCount: number
) {
  return {
    uniqueName: item.uniqueName,
    name,
    tier: item.tier,
    enchantmentLevel: item.enchantmentLevel,
    iconUrl: item.iconUrl,
    itemType: item.itemType,
    shopCategory: item.shopCategory,
    shopSubcategory: item.shopSubcategory,
    categoryName,
    avgMargin: Math.round(avgMargin * 10) / 10,
    bestCity,
    bestMargin: Math.round(bestMargin * 10) / 10,
    bestProfit: Math.round(bestProfit),
    citiesCount,
  };
}
