import { z } from "zod";
import { prisma } from "~/server/utils/prisma";
import type { Prisma } from "@albion-tool/database";

const VALID_ITEM_TYPES = [
  "WEAPON","OFF_HAND","ARMOR_HEAD","ARMOR_CHEST","ARMOR_SHOES",
  "BAG","CAPE","MOUNT","CONSUMABLE","RESOURCE_RAW","RESOURCE_REFINED",
  "PRODUCT","FARMABLE","FURNITURE","JOURNAL","LABORER","OTHER",
] as const

const schema = z.object({
  q: z.string().optional(),
  tier: z.coerce.number().int().min(1).max(8).optional(),
  tiers: z.string().optional(), // comma-separated: "4,5,6"
  enchantment: z.coerce.number().int().min(0).max(3).optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  categoryId: z.string().optional(),
  itemType: z.string().optional(), // comma-separated ItemType values
  craftable: z.enum(["true", "false"]).optional(),
  refinable: z.enum(["true", "false"]).optional(),
  excludeShopCategories: z.string().optional(), // comma-separated
  excludeShopSubcategories: z.string().optional(), // comma-separated
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(96).default(48),
});

const DEFAULT_LOCALE = "FR-FR";
function toWhereArray(value: Prisma.ItemWhereInput | Prisma.ItemWhereInput[] | undefined) {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

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
    tiers,
    enchantment,
    category,
    subcategory,
    categoryId,
    itemType,
    craftable,
    refinable,
    excludeShopCategories,
    excludeShopSubcategories,
    cursor,
    limit,
  } = query.data;

  const where: Prisma.ItemWhereInput = {};

  // Tier filter: single or multi (tiers takes precedence)
  if (tiers) {
    const tierNums = tiers.split(',').map(Number).filter(n => Number.isInteger(n) && n >= 1 && n <= 8);
    if (tierNums.length === 1) where.tier = tierNums[0];
    else if (tierNums.length > 1) where.tier = { in: tierNums };
  } else if (tier !== undefined) {
    where.tier = tier;
  }

  if (enchantment !== undefined) where.enchantmentLevel = enchantment;

  if (itemType) {
    const types = itemType.split(",")
      .map((t) => t.trim().toUpperCase())
      .filter((t): t is typeof VALID_ITEM_TYPES[number] => VALID_ITEM_TYPES.includes(t as any))
    if (types.length === 1) where.itemType = types[0] as any
    else if (types.length > 1) where.itemType = { in: types as any[] }
  }

  if (categoryId) {
    // Résoudre tous les IDs descendants (N niveaux) en mémoire
    const allCats = await prisma.category.findMany({ select: { id: true, parentId: true } })
    const childrenOf = new Map<string, string[]>()
    for (const c of allCats) {
      if (c.parentId) {
        const arr = childrenOf.get(c.parentId) ?? []
        arr.push(c.id)
        childrenOf.set(c.parentId, arr)
      }
    }
    function descendants(id: string): string[] {
      const kids = childrenOf.get(id) ?? []
      return [id, ...kids.flatMap(descendants)]
    }
    where.categoryId = { in: descendants(categoryId) }
  } else {
    if (category) {
      const categories = category.split(',').map((value) => value.trim()).filter(Boolean)
      if (categories.length === 1) where.shopCategory = { equals: categories[0], mode: "insensitive" }
      else if (categories.length > 1) {
        where.OR = [
          ...toWhereArray(where.OR),
          ...categories.map((value) => ({ shopCategory: { equals: value, mode: "insensitive" as const } })),
        ]
      }
    }
    if (subcategory) {
      const subcategories = subcategory.split(',').map((value) => value.trim()).filter(Boolean)
      if (subcategories.length === 1) where.shopSubcategory = { equals: subcategories[0], mode: "insensitive" }
      else if (subcategories.length > 1) {
        where.AND = [
          ...toWhereArray(where.AND),
          {
            OR: subcategories.map((value) => ({
              shopSubcategory: { equals: value, mode: "insensitive" as const },
            })),
          },
        ]
      }
    }
  }

  // Exclusions
  if (excludeShopCategories) {
    const cats = excludeShopCategories.split(",").map(c => c.trim())
    if (cats.length > 0) {
      where.shopCategory = { ...(where.shopCategory as any), notIn: cats, mode: "insensitive" }
    }
  }
  if (excludeShopSubcategories) {
    const subs = excludeShopSubcategories.split(",").map(s => s.trim())
    if (subs.length > 0) {
      where.shopSubcategory = { ...(where.shopSubcategory as any), notIn: subs, mode: "insensitive" }
    }
  }

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
        stats: true,
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
    itemPower: Number((item.stats as Record<string, unknown> | null)?.itemPower ?? 0) || null,
    twoHanded: Boolean((item.stats as Record<string, unknown> | null)?.twoHanded),
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
