import { z } from "zod";
import { prisma } from "~/server/utils/prisma";
import type { Prisma } from "@albion-tool/database";

const schema = z.object({
  location: z.string().default("Caerleon"),
  quality: z.coerce.number().int().min(1).max(5).default(1),
  useFocus: z.enum(["true", "false"]).default("true"),
  useCityBonus: z.enum(["true", "false"]).default("true"),
  craftFeePercent: z.coerce.number().min(0).max(25).default(8.5),
  includeTax: z.enum(["true", "false"]).default("true"),
  sortBy: z.enum(["profit", "margin", "sellRevenue", "ingredientCost"]).default("profit"),
  tier: z.coerce.number().int().min(1).max(8).optional(),
  enchantment: z.coerce.number().int().min(0).max(4).optional(),
  categoryId: z.string().optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(96).default(48),
});

const LOCALE = "FR-FR";
const MAX_TOTAL_ITEMS = 2000;

export default defineEventHandler(async (event) => {
  const parsed = await getValidatedQuery(event, (q) => schema.safeParse(q));
  if (!parsed.success) {
    throw createError({ statusCode: 422, statusMessage: "Invalid query parameters" });
  }

  const {
    location: locationName, quality,
    useFocus: _useFocus, useCityBonus: _useCityBonus, includeTax: _includeTax,
    craftFeePercent, sortBy, tier, enchantment, categoryId, q, page, limit,
  } = parsed.data;

  const useFocus = _useFocus === "true";
  const useCityBonus = _useCityBonus === "true";
  const includeTax = _includeTax === "true";

  const location = await prisma.location.findFirst({
    where: { name: { equals: locationName, mode: "insensitive" }, isActive: true },
    select: { id: true, name: true },
  });

  if (!location) {
    throw createError({ statusCode: 400, statusMessage: `Location "${locationName}" not found` });
  }

  const where: Prisma.ItemWhereInput = {
    isCraftable: true,
    craftingRecipe: { isNot: null },
  };

  if (tier !== undefined) where.tier = tier;
  if (enchantment !== undefined) where.enchantmentLevel = enchantment;

  if (categoryId) {
    const allCats = await prisma.category.findMany({ select: { id: true, parentId: true } });
    const childrenOf = new Map<string, string[]>();
    for (const c of allCats) {
      if (c.parentId) {
        const arr = childrenOf.get(c.parentId) ?? [];
        arr.push(c.id);
        childrenOf.set(c.parentId, arr);
      }
    }
    function descendants(id: string): string[] {
      const kids = childrenOf.get(id) ?? [];
      return [id, ...kids.flatMap(descendants)];
    }
    where.categoryId = { in: descendants(categoryId) };
  }

  if (q && q.length >= 2) {
    where.localizations = {
      some: { locale: LOCALE, name: { contains: q, mode: "insensitive" } },
    };
  }

  // Fetch all matching items (up to MAX_TOTAL_ITEMS) for global server-side sort
  const rawItems = await prisma.item.findMany({
    where,
    take: MAX_TOTAL_ITEMS,
    orderBy: [{ tier: "asc" }, { enchantmentLevel: "asc" }, { id: "asc" }],
    select: {
      id: true,
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
          focusable: true,
          ingredients: {
            select: {
              quantity: true,
              maxReturnRate: true,
              item: {
                select: {
                  uniqueName: true,
                  marketPrices: {
                    where: { locationId: location.id, quality: 1 },
                    select: { sellPriceMin: true },
                  },
                },
              },
            },
          },
        },
      },
      marketPrices: {
        where: { locationId: location.id, quality },
        select: { sellPriceMin: true },
      },
      cityBonuses: {
        where: { locationId: location.id },
        select: { craftingBonus: true },
      },
    },
  });

  // Batch-load return rates for all tier+enchantment combos in the result set
  const pairs = [
    ...new Map(
      rawItems.map((i) => [`${i.tier}:${i.enchantmentLevel}`, { tier: i.tier, enchantmentLevel: i.enchantmentLevel }])
    ).values(),
  ];
  const returnRates = pairs.length > 0 ? await prisma.returnRate.findMany({ where: { OR: pairs } }) : [];
  const rrMap = new Map(returnRates.map((r) => [`${r.tier}:${r.enchantmentLevel}`, r]));

  // Compute profit server-side for every item
  const computed = rawItems.map((item) => {
    const rr = rrMap.get(`${item.tier}:${item.enchantmentLevel}`);
    const cityBonus = item.cityBonuses[0]?.craftingBonus ?? 0;
    const name = item.localizations[0]?.name ?? item.uniqueName;

    let effectiveRR = useFocus ? (rr?.focusReturnRate ?? 0) : (rr?.baseReturnRate ?? 0);
    if (useCityBonus && rr?.cityBonusRate) effectiveRR += rr.cityBonusRate;

    let rawCost = 0;
    let savings = 0;
    let missingPrices = false;

    if (item.craftingRecipe) {
      for (const ing of item.craftingRecipe.ingredients) {
        const price = ing.item.marketPrices[0]?.sellPriceMin;
        if (!price || price === 0) {
          missingPrices = true;
          continue;
        }
        const capRR =
          ing.maxReturnRate !== null ? Math.min(effectiveRR, ing.maxReturnRate) : effectiveRR;
        const gross = ing.quantity * price;
        rawCost += gross;
        savings += gross * capRR;
      }
    }

    const ingredientCost = rawCost - savings;
    const craftFee = rawCost * (craftFeePercent / 100);
    const netCost = ingredientCost + craftFee;

    const effectiveOutput =
      useCityBonus && cityBonus > 0
        ? (item.craftingRecipe?.resultCount ?? 1) * (1 + cityBonus / 100)
        : (item.craftingRecipe?.resultCount ?? 1);

    const sellPriceRaw = item.marketPrices[0]?.sellPriceMin;
    const sellRevenue = sellPriceRaw && sellPriceRaw > 0 ? sellPriceRaw * effectiveOutput : null;

    let profit: number | null = null;
    let margin: number | null = null;
    let tax = 0;

    // Only compute profit when all prices are available
    if (sellRevenue !== null && !missingPrices) {
      tax = includeTax ? sellRevenue * 0.04 : 0;
      profit = sellRevenue - tax - netCost;
      margin = netCost > 0 ? (profit / netCost) * 100 : 0;
    }

    return {
      id: item.id,
      uniqueName: item.uniqueName,
      name,
      tier: item.tier,
      enchantmentLevel: item.enchantmentLevel,
      iconUrl: item.iconUrl,
      sellPrice: sellPriceRaw ?? null,
      cityBonus,
      calc: {
        ingredientCost,
        returnSavings: savings,
        craftFee,
        netCost,
        sellRevenue,
        tax,
        profit,
        margin,
        missingPrices,
      },
    };
  });

  // Sort: calculable items first (sorted by chosen key desc), non-calculable after (sorted by name)
  computed.sort((a, b) => {
    const av = a.calc[sortBy as keyof typeof a.calc] as number | null;
    const bv = b.calc[sortBy as keyof typeof b.calc] as number | null;
    if (av === null && bv === null) return a.name.localeCompare(b.name, "fr");
    if (av === null) return 1;
    if (bv === null) return -1;
    return bv - av;
  });

  const total = computed.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const pageItems = computed.slice(start, start + limit);

  return {
    data: pageItems,
    meta: {
      total,
      page,
      totalPages,
      capped: rawItems.length >= MAX_TOTAL_ITEMS,
    },
  };
});
