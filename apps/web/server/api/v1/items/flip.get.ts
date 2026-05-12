import { z } from "zod";
import { prisma } from "~/server/utils/prisma";
import type { Prisma } from "@albion-tool/database";

const schema = z.object({
  buyCity: z.string().default("Caerleon"),
  sellCity: z.string().default("Bridgewatch"),
  quality: z.coerce.number().int().min(1).max(5).default(1),
  includeTax: z.enum(["true", "false"]).default("true"),
  sortBy: z.enum(["profit", "margin", "buyPrice", "sellPrice"]).default("profit"),
  tier: z.preprocess(
    (v) => {
      if (v === undefined) return undefined;
      const arr = Array.isArray(v) ? v : [v];
      return arr.map(Number).filter((n) => !isNaN(n));
    },
    z.array(z.number().int().min(1).max(8)).optional()
  ),
  categoryId: z.string().optional(),
  q: z.string().optional(),
  minProfit: z.coerce.number().min(0).default(0),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(96).default(48),
});

const LOCALE = "FR-FR";
const MAX_ITEMS = 3000;

export default defineEventHandler(async (event) => {
  const parsed = await getValidatedQuery(event, (q) => schema.safeParse(q));
  if (!parsed.success) {
    throw createError({ statusCode: 422, statusMessage: "Invalid query parameters" });
  }

  const {
    buyCity, sellCity, quality, includeTax: _includeTax,
    sortBy, tier, categoryId, q, minProfit, page, limit,
  } = parsed.data;

  const includeTax = _includeTax === "true";

  const [buyLocation, sellLocation] = await Promise.all([
    prisma.location.findFirst({
      where: { name: { equals: buyCity, mode: "insensitive" }, isActive: true },
      select: { id: true, name: true },
    }),
    prisma.location.findFirst({
      where: { name: { equals: sellCity, mode: "insensitive" }, isActive: true },
      select: { id: true, name: true },
    }),
  ]);

  if (!buyLocation) throw createError({ statusCode: 400, statusMessage: `Location "${buyCity}" not found` });
  if (!sellLocation) throw createError({ statusCode: 400, statusMessage: `Location "${sellCity}" not found` });

  const where: Prisma.ItemWhereInput = {
    resolvedPrices: {
      some: { locationId: buyLocation.id, quality, sellPrice: { gt: 0 } },
    },
  };

  if (tier !== undefined && tier.length > 0) {
    where.tier = tier.length === 1 ? tier[0] : { in: tier };
  }

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

  const rawItems = await prisma.item.findMany({
    where,
    take: MAX_ITEMS,
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
      resolvedPrices: {
        where: {
          locationId: { in: [buyLocation.id, sellLocation.id] },
          quality,
        },
        select: {
          locationId: true,
          sellPrice: true,
          updatedAt: true,
        },
      },
    },
  });

  const computed = rawItems
    .map((item) => {
      const name = item.localizations[0]?.name ?? item.uniqueName;
      const buyEntry  = item.resolvedPrices.find((p) => p.locationId === buyLocation.id);
      const sellEntry = item.resolvedPrices.find((p) => p.locationId === sellLocation.id);

      const buyPrice  = buyEntry?.sellPrice  && buyEntry.sellPrice  > 0 ? buyEntry.sellPrice  : null;
      const sellPrice = sellEntry?.sellPrice && sellEntry.sellPrice > 0 ? sellEntry.sellPrice : null;

      let profit: number | null = null;
      let margin: number | null = null;
      let tax = 0;

      if (buyPrice !== null && sellPrice !== null) {
        tax = includeTax ? sellPrice * 0.04 : 0;
        profit = sellPrice - tax - buyPrice;
        margin = buyPrice > 0 ? (profit / buyPrice) * 100 : null;
      }

      return {
        id: item.id,
        uniqueName: item.uniqueName,
        name,
        tier: item.tier,
        enchantmentLevel: item.enchantmentLevel,
        iconUrl: item.iconUrl,
        buyPrice,
        sellPrice,
        buyPriceDate:  buyEntry?.updatedAt  ?? null,
        sellPriceDate: sellEntry?.updatedAt ?? null,
        profit,
        margin,
        tax,
        calculable: profit !== null,
      };
    })
    .filter((item) => {
      if (!item.calculable) return false;
      if (minProfit > 0 && (item.profit ?? 0) < minProfit) return false;
      return true;
    });

  computed.sort((a, b) => {
    const av = a[sortBy as keyof typeof a] as number | null;
    const bv = b[sortBy as keyof typeof b] as number | null;
    if (av === null && bv === null) return a.name.localeCompare(b.name, "fr");
    if (av === null) return 1;
    if (bv === null) return -1;
    return (bv as number) - (av as number);
  });

  const total = computed.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const start = (page - 1) * limit;
  const pageItems = computed.slice(start, start + limit);

  return {
    data: pageItems,
    meta: { total, page, totalPages },
  };
});
