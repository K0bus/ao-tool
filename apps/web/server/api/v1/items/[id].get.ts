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
        harvestResultItem: {
          include: {
            localizations: { where: { locale: "FR-FR" }, take: 1 },
          },
        },
        productResultItem: {
          include: {
            localizations: { where: { locale: "FR-FR" }, take: 1 },
          },
        },
      },
    });

    if (!raw) return null;

    // Resolve other related items if they exist
    let grownItemName = null;
    if (raw.grownItemUniqueName) {
      const grown = await prisma.item.findUnique({
        where: { uniqueName: raw.grownItemUniqueName },
        include: { localizations: { where: { locale: "FR-FR" }, take: 1 } },
      });
      grownItemName = grown?.localizations[0]?.name ?? raw.grownItemUniqueName;
    }

    let favoriteFoodName = null;
    if (raw.favoriteFoodItemId) {
      const food = await prisma.item.findUnique({
        where: { uniqueName: raw.favoriteFoodItemId },
        include: { localizations: { where: { locale: "FR-FR" }, take: 1 } },
      });
      favoriteFoodName = food?.localizations[0]?.name ?? raw.favoriteFoodItemId;
    }

    let harvestResultItem = raw.harvestResultItem;
    if (!harvestResultItem && raw.harvestLootList) {
      const resolvedUniqueName = raw.harvestLootList.replace('_LOOT', '');
      const dbHarvest = await prisma.item.findUnique({
        where: { uniqueName: resolvedUniqueName },
        include: { localizations: { where: { locale: "FR-FR" }, take: 1 } },
      });
      if (dbHarvest) {
        harvestResultItem = dbHarvest;
      }
    }

    const PRODUCT_LOOT_MAP: Record<string, string> = {
      'T3_CHICKEN_LOOT': 'T3_EGG',
      'T4_GOAT_LOOT': 'T4_MILK',
      'T5_GOOSE_LOOT': 'T5_EGG',
      'T6_SHEEP_LOOT': 'T6_MILK',
      'T8_COW_LOOT': 'T8_MILK',
    };

    let productResultItem = raw.productResultItem;
    if (!productResultItem && raw.productLootList) {
      const resolvedUniqueName = PRODUCT_LOOT_MAP[raw.productLootList];
      if (resolvedUniqueName) {
        const dbProduct = await prisma.item.findUnique({
          where: { uniqueName: resolvedUniqueName },
          include: { localizations: { where: { locale: "FR-FR" }, take: 1 } },
        });
        if (dbProduct) {
          productResultItem = dbProduct;
        }
      }
    }

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
      maxQuality: raw.maxQuality,
      stats: raw.stats,
      itemPower: (raw.stats as Record<string, unknown> | null)?.itemPower ?? null,
      twoHanded: Boolean((raw.stats as Record<string, unknown> | null)?.twoHanded),
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
      growTime: raw.growTime,
      harvestLootList: raw.harvestLootList,
      harvestSeedChance: raw.harvestSeedChance,
      grownItemUniqueName: raw.grownItemUniqueName,
      grownItemName,
      offspringChance: raw.offspringChance,
      productLootList: raw.productLootList,
      productProductionTime: raw.productProductionTime,
      favoriteFoodItemId: raw.favoriteFoodItemId,
      favoriteFoodName,
      nutritionMax: raw.nutritionMax,
      harvestResultItemId: raw.harvestResultItemId,
      harvestResultItem: harvestResultItem ? {
        id: harvestResultItem.id,
        uniqueName: harvestResultItem.uniqueName,
        name: harvestResultItem.localizations[0]?.name ?? harvestResultItem.uniqueName,
      } : null,
      productResultItemId: raw.productResultItemId,
      productResultItem: productResultItem ? {
        id: productResultItem.id,
        uniqueName: productResultItem.uniqueName,
        name: productResultItem.localizations[0]?.name ?? productResultItem.uniqueName,
      } : null,
    };
  });

  if (!item) {
    throw createError({ statusCode: 404, statusMessage: "Item not found" });
  }

  // Resolved prices are fetched live (not cached) so syncs are reflected immediately.
  const resolvedPrices = await prisma.resolvedPrice.findMany({
    where: { item: { uniqueName: id } },
    include: { location: true },
    orderBy: { quality: "asc" },
  });

  return { data: { ...item, resolvedPrices } };
});
