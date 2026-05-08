import { z } from "zod";
import { prisma } from "~/server/utils/prisma";
import type { Prisma } from "@albion-tool/database";

const schema = z.object({
  q: z.string().optional(),
  tier: z.coerce.number().int().min(1).max(8).optional(),
  enchantment: z.coerce.number().int().min(0).max(3).optional(),
  category: z.string().optional(),
  craftable: z.enum(["true", "false"]).optional(),
  refinable: z.enum(["true", "false"]).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(96).default(48),
});

const DEFAULT_LOCALE = "FR-FR";

export default defineEventHandler(async (event) => {
  const query = await getValidatedQuery(event, (q) => schema.safeParse(q));

  if (!query.success) {
    throw createError({
      statusCode: 422,
      statusMessage: "Invalid query parameters",
    });
  }

  const {
    q,
    tier,
    enchantment,
    category,
    craftable,
    refinable,
    cursor,
    limit,
  } = query.data;

  const where: Prisma.ItemWhereInput = {};

  if (tier !== undefined) where.tier = tier;
  if (enchantment !== undefined) where.enchantmentLevel = enchantment;
  if (category)
    where.shopCategory = { contains: category, mode: "insensitive" };
  if (craftable === "true") where.isCraftable = true;
  if (refinable === "true") where.isRefinable = true;

  // Full-text search via pg_trgm sur le nom EN-US
  if (q && q.length >= 2) {
    where.localizations = {
      some: {
        locale: DEFAULT_LOCALE,
        name: { contains: q, mode: "insensitive" },
      },
    };
  }

  const [rawItems, total] = await Promise.all([
    prisma.item.findMany({
      where,
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: [{ tier: "asc" }, { enchantmentLevel: "asc" }, { id: "asc" }],
      select: {
        id: true,
        uniqueName: true,
        tier: true,
        enchantmentLevel: true,
        itemType: true,
        shopCategory: true,
        shopSubcategory: true,
        isCraftable: true,
        isRefinable: true,
        iconUrl: true,
        localizations: {
          where: { locale: DEFAULT_LOCALE },
          select: { name: true },
          take: 1,
        },
      },
    }),
    prisma.item.count({ where }),
  ]);

  const hasMore = rawItems.length > limit;
  const data = hasMore ? rawItems.slice(0, limit) : rawItems;
  const nextCursor = hasMore ? (data[data.length - 1]?.id ?? null) : null;

  const items = data.map((item) => ({
    id: item.id,
    uniqueName: item.uniqueName,
    tier: item.tier,
    enchantmentLevel: item.enchantmentLevel,
    itemType: item.itemType,
    shopCategory: item.shopCategory,
    shopSubcategory: item.shopSubcategory,
    isCraftable: item.isCraftable,
    isRefinable: item.isRefinable,
    iconUrl: item.iconUrl,
    name: item.localizations[0]?.name ?? item.uniqueName,
  }));

  return {
    data: items,
    meta: { total, nextCursor },
  };
});
