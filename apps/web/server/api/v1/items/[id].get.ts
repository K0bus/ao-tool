import { prisma } from "~/server/utils/prisma";
import { cached } from "~/server/utils/cache";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id)
    throw createError({ statusCode: 400, statusMessage: "Item ID required" });

  const cacheKey = `item:detail:${id}`;

  // Cache stable item data (recipe, localizations) for 1h — prices are fetched live below
  const item = await cached(cacheKey, async () => {
    const raw = await prisma.item.findUnique({
      where: { uniqueName: id },
      include: {
        localizations: true,
        craftingRecipe: {
          include: {
            ingredients: {
              include: {
                item: {
                  include: {
                    localizations: { where: { locale: "FR-FR" }, take: 1 },
                  },
                },
              },
            },
            craftingStation: true,
          },
        },
        refiningRecipe: {
          include: {
            ingredients: {
              include: {
                item: {
                  include: {
                    localizations: { where: { locale: "FR-FR" }, take: 1 },
                  },
                },
              },
            },
            craftingStation: true,
          },
        },
        enchantVariants: {
          include: {
            localizations: { where: { locale: "FR-FR" }, take: 1 },
          },
          orderBy: { enchantmentLevel: "asc" },
        },
        baseItem: {
          include: {
            localizations: { where: { locale: "FR-FR" }, take: 1 },
          },
        },
        cityBonuses: {
          include: { location: true },
        },
      },
    });

    if (!raw) return null;

    return {
      id: raw.id,
      uniqueName: raw.uniqueName,
      tier: raw.tier,
      enchantmentLevel: raw.enchantmentLevel,
      itemType: raw.itemType,
      shopCategory: raw.shopCategory,
      shopSubcategory: raw.shopSubcategory,
      weight: raw.weight,
      maxStackSize: raw.maxStackSize,
      isCraftable: raw.isCraftable,
      isRefinable: raw.isRefinable,
      iconUrl: raw.iconUrl,
      name:
        raw.localizations.find((l) => l.locale === "FR-FR")?.name ??
        raw.uniqueName,
      localizations: raw.localizations,
      craftingRecipe: raw.craftingRecipe
        ? {
            ...raw.craftingRecipe,
            ingredients: raw.craftingRecipe.ingredients.map((ing) => ({
              ...ing,
              item: {
                ...ing.item,
                name: ing.item.localizations[0]?.name ?? ing.item.uniqueName,
              },
            })),
          }
        : null,
      refiningRecipe: raw.refiningRecipe
        ? {
            ...raw.refiningRecipe,
            ingredients: raw.refiningRecipe.ingredients.map((ing) => ({
              ...ing,
              item: {
                ...ing.item,
                name: ing.item.localizations[0]?.name ?? ing.item.uniqueName,
              },
            })),
          }
        : null,
      enchantVariants: raw.enchantVariants.map((v) => ({
        id: v.id,
        uniqueName: v.uniqueName,
        tier: v.tier,
        enchantmentLevel: v.enchantmentLevel,
        iconUrl: v.iconUrl,
        name: v.localizations[0]?.name ?? v.uniqueName,
      })),
      baseItem: raw.baseItem
        ? {
            id: raw.baseItem.id,
            uniqueName: raw.baseItem.uniqueName,
            tier: raw.baseItem.tier,
            enchantmentLevel: raw.baseItem.enchantmentLevel,
            iconUrl: raw.baseItem.iconUrl,
            name:
              raw.baseItem.localizations[0]?.name ?? raw.baseItem.uniqueName,
          }
        : null,
      cityBonuses: raw.cityBonuses,
    };
  });

  if (!item) {
    throw createError({ statusCode: 404, statusMessage: "Item not found" });
  }

  // Market prices are fetched live (not cached) so syncs are reflected immediately
  const marketPrices = await prisma.marketPrice.findMany({
    where: { item: { uniqueName: id }, sellPriceMin: { not: 999999 } },
    include: { location: true },
    orderBy: { quality: "asc" },
  });

  const resolvedPrices = await prisma.resolvedPrice.findMany({
    where: { item: { uniqueName: id } },
    include: { location: true },
    orderBy: { quality: "asc" },
  });

  return { data: { ...item, marketPrices, resolvedPrices } };
});
