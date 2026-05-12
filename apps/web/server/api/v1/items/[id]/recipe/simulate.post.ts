import { z } from "zod";
import { prisma } from "~/server/utils/prisma";

const bodySchema = z.object({
  craftCity: z.string().default("Caerleon"),
  sellCity: z.string().default("Caerleon"),
  quality: z.coerce.number().int().min(1).max(5).default(1),
  useFocus: z.boolean().default(false),
  silverPer100Nutrition: z.coerce.number().min(0).max(10000).default(999),
  isPremium: z.boolean().default(false),
  quantity: z.coerce.number().int().min(1).max(9999).default(1),
});

interface ScenarioCalc {
  useFocus: boolean;
  rawMaterialsCost: number;
  returnedValue: number;
  netMaterialsCost: number;
  craftFee: number;
  totalCraftCost: number;
  effectiveOutput: number;
  grossRevenue: number;
  sellFee: number;
  netRevenue: number;
  profit: number;
  profitPerUnit: number;
  margin: number;
  roi: number;
  breakEvenSellPrice: number;
  missingPrices: boolean;
}

function computeScenario(
  recipe: {
    resultCount: number;
    silverCost: number;
    ingredients: Array<{
      quantity: number;
      maxReturnRate: number | null;
      itemId: string;
    }>;
  },
  sellPrice: number,
  quantity: number,
  silverPer100Nutrition: number,
  sellFeePercent: number,
  effectiveRR: number,
  cityOutputBonusPercent: number,
  priceMap: Map<string, number>,
  useFocus: boolean
): ScenarioCalc {
  const runs = quantity / recipe.resultCount;
  let rawCostPerRun = 0;
  let returnedPerRun = 0;
  let missingPrices = false;

  for (const ing of recipe.ingredients) {
    const ingPrice = priceMap.get(ing.itemId);
    if (!ingPrice || ingPrice === 0) { missingPrices = true; continue; }
    const ingGross = ing.quantity * ingPrice;
    const capRR = Math.min(effectiveRR, ing.maxReturnRate ?? effectiveRR);
    rawCostPerRun += ingGross;
    returnedPerRun += ingGross * capRR;
  }

  const netMatPerRun = rawCostPerRun - returnedPerRun;
  // Station fee = (nutritionRequired / 100) × silverPer100Nutrition
  // recipe.silverCost stores the nutrition units required per craft run
  const stationFeePerRun = ((recipe.silverCost ?? 0) / 100) * silverPer100Nutrition;

  const rawMaterialsCost = rawCostPerRun * runs;
  const returnedValue = returnedPerRun * runs;
  const netMaterialsCost = netMatPerRun * runs;
  const craftFee = stationFeePerRun * runs;
  const totalCraftCost = (netMatPerRun + stationFeePerRun) * runs;

  const effectiveOutput = quantity * (1 + cityOutputBonusPercent / 100);
  const grossRevenue = sellPrice > 0 ? sellPrice * effectiveOutput : 0;
  const sellFee = grossRevenue * (sellFeePercent / 100);
  const netRevenue = grossRevenue - sellFee;

  const profit = netRevenue - totalCraftCost;
  const profitPerUnit = effectiveOutput > 0 ? profit / effectiveOutput : 0;
  const margin = totalCraftCost > 0 ? (profit / totalCraftCost) * 100 : 0;
  const roi = margin;
  const sellFeeMultiplier = 1 - sellFeePercent / 100;
  const breakEvenSellPrice =
    effectiveOutput > 0 && sellFeeMultiplier > 0
      ? totalCraftCost / (effectiveOutput * sellFeeMultiplier)
      : 0;

  return {
    useFocus, rawMaterialsCost, returnedValue, netMaterialsCost, craftFee,
    totalCraftCost, effectiveOutput, grossRevenue, sellFee, netRevenue, profit, profitPerUnit,
    margin, roi, breakEvenSellPrice, missingPrices,
  };
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, statusMessage: "Item ID required" });

  const rawBody = await readBody(event).catch(() => ({}));
  const parsed = bodySchema.safeParse(rawBody ?? {});
  if (!parsed.success)
    throw createError({ statusCode: 422, statusMessage: "Paramètres invalides" });

  const params = parsed.data;

  const item = await prisma.item.findUnique({
    where: { uniqueName: id },
    include: {
      localizations: { where: { locale: "FR-FR" }, take: 1 },
      craftingRecipe: {
        include: {
          ingredients: {
            include: {
              item: {
                select: {
                  id: true, uniqueName: true, tier: true, enchantmentLevel: true,
                  iconUrl: true, isCraftable: true,
                  localizations: { where: { locale: "FR-FR" }, select: { name: true }, take: 1 },
                  craftingRecipe: { select: { resultCount: true, silverCost: true, focusable: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!item) throw createError({ statusCode: 404, statusMessage: "Item non trouvé" });
  if (!item.craftingRecipe)
    throw createError({ statusCode: 422, statusMessage: "Cet item n'a pas de recette de craft" });

  const [craftLocation, sellLocation] = await Promise.all([
    prisma.location.findFirst({
      where: { name: { equals: params.craftCity, mode: "insensitive" }, isActive: true },
      select: { id: true, name: true },
    }),
    prisma.location.findFirst({
      where: { name: { equals: params.sellCity, mode: "insensitive" }, isActive: true },
      select: { id: true, name: true },
    }),
  ]);

  if (!craftLocation)
    throw createError({ statusCode: 400, statusMessage: `Ville de craft "${params.craftCity}" introuvable` });
  if (!sellLocation)
    throw createError({ statusCode: 400, statusMessage: `Ville de vente "${params.sellCity}" introuvable` });

  const ingredientItemIds = item.craftingRecipe.ingredients.map((i) => i.itemId);
  const locationIds = [...new Set([craftLocation.id, sellLocation.id])];

  const [resolvedPrices, cityBonus, returnRate] = await Promise.all([
    prisma.resolvedPrice.findMany({
      where: { itemId: { in: [...ingredientItemIds, item.id] }, locationId: { in: locationIds } },
      select: { itemId: true, locationId: true, quality: true, sellPrice: true, buyPrice: true },
    }),
    prisma.cityItemBonus.findFirst({
      where: { locationId: craftLocation.id, itemId: item.id },
      select: { craftingBonus: true },
    }),
    prisma.returnRate.findFirst({
      where: { tier: item.tier, enchantmentLevel: item.enchantmentLevel },
    }),
  ]);

  // Ingredient buy prices: craftCity, quality 1
  const craftPriceMap = new Map<string, number>();
  for (const p of resolvedPrices) {
    if (p.locationId === craftLocation.id && p.quality === 1 && p.sellPrice > 0)
      craftPriceMap.set(p.itemId, p.sellPrice);
  }

  const sellPriceEntry = resolvedPrices.find(
    (p) => p.itemId === item.id && p.locationId === sellLocation.id && p.quality === params.quality
  );
  const sellPriceMin = sellPriceEntry?.sellPrice ?? null;
  const buyPriceMax = sellPriceEntry?.buyPrice ?? null;

  const cityOutputBonus = cityBonus?.craftingBonus ?? 0;
  const baseRR = returnRate?.baseReturnRate ?? 0;
  const focusRR = returnRate?.focusReturnRate ?? 0;
  const isFocusable = item.craftingRecipe.focusable;

  const recipe = {
    resultCount: item.craftingRecipe.resultCount,
    silverCost: item.craftingRecipe.silverCost,
    focusable: isFocusable,
    ingredients: item.craftingRecipe.ingredients.map((ing) => ({
      itemId: ing.itemId,
      quantity: ing.quantity,
      maxReturnRate: ing.maxReturnRate,
    })),
  };

  const sellPrice = sellPriceMin ?? 0;
  const totalSellFeePercent = (params.isPremium ? 4 : 8) + 2.5;

  const noFocusScenario = computeScenario(
    recipe, sellPrice, params.quantity, params.silverPer100Nutrition, totalSellFeePercent,
    baseRR, cityOutputBonus, craftPriceMap, false
  );
  const focusScenario = isFocusable
    ? computeScenario(
        recipe, sellPrice, params.quantity, params.silverPer100Nutrition, totalSellFeePercent,
        focusRR, cityOutputBonus, craftPriceMap, true
      )
    : null;

  const runs = params.quantity / recipe.resultCount;
  const ingredients = item.craftingRecipe.ingredients.map((ing) => {
    const price = craftPriceMap.get(ing.itemId) ?? 0;
    const capRRBase = Math.min(baseRR, ing.maxReturnRate ?? baseRR);
    const capRRFocus = Math.min(focusRR, ing.maxReturnRate ?? focusRR);
    const totalQty = ing.quantity * runs;
    const grossCost = price * totalQty;
    return {
      itemId: ing.item.id,
      uniqueName: ing.item.uniqueName,
      name: ing.item.localizations[0]?.name ?? ing.item.uniqueName,
      tier: ing.item.tier,
      enchantmentLevel: ing.item.enchantmentLevel,
      iconUrl: ing.item.iconUrl,
      isCraftable: ing.item.isCraftable,
      hasCraftingRecipe: !!ing.item.craftingRecipe,
      quantityPerRun: ing.quantity,
      totalQuantity: totalQty,
      maxReturnRate: ing.maxReturnRate,
      marketPrice: price,
      grossCost,
      returnedValueBase: grossCost * capRRBase,
      returnedValueFocus: grossCost * capRRFocus,
      netCostBase: grossCost * (1 - capRRBase),
      netCostFocus: grossCost * (1 - capRRFocus),
    };
  });

  const recommendFocus = isFocusable && focusScenario !== null && focusScenario.profit > noFocusScenario.profit;
  const bestScenario = recommendFocus ? focusScenario! : noFocusScenario;

  const reasoning: string[] = [];
  if (sellPrice === 0) {
    reasoning.push("Prix de vente non disponible — impossible de calculer le profit réel.");
  } else if (bestScenario.profit > 0) {
    reasoning.push(
      `Profit estimé : +${Math.round(bestScenario.profit).toLocaleString("fr-FR")} ◇ (marge ${bestScenario.margin.toFixed(1)}%).`
    );
    if (recommendFocus && focusScenario) {
      const diff = Math.round(focusScenario.profit - noFocusScenario.profit);
      reasoning.push(`Le focus améliore le profit de +${diff.toLocaleString("fr-FR")} ◇.`);
    }
    if (cityOutputBonus > 0)
      reasoning.push(`Bonus cité ${craftLocation.name} : +${cityOutputBonus}% d'output.`);
    if (bestScenario.missingPrices)
      reasoning.push("Certains prix de matières sont manquants — simulation partielle.");
  } else {
    reasoning.push("Craft non rentable aux prix actuels.");
    reasoning.push(
      bestScenario.missingPrices
        ? "Certains prix de matières manquants — vérifiez les données de marché."
        : "Essayez de réduire les frais ou de choisir une meilleure ville de vente."
    );
  }

  return {
    data: {
      item: {
        id: item.id,
        uniqueName: item.uniqueName,
        name: item.localizations[0]?.name ?? item.uniqueName,
        tier: item.tier,
        enchantmentLevel: item.enchantmentLevel,
        iconUrl: item.iconUrl,
        isFocusable,
        nutritionRequired: item.craftingRecipe.silverCost,
      },
      params,
      returnRates: { base: baseRR, focus: focusRR, cityBonusOnRR: returnRate?.cityBonusRate ?? 0 },
      cityOutputBonus,
      marketData: {
        craftCity: craftLocation.name,
        sellCity: sellLocation.name,
        sellPriceMin,
        buyPriceMax,
        quality: params.quality,
      },
      ingredients,
      scenarios: { noFocus: noFocusScenario, focus: focusScenario },
      recommendation: {
        useFocus: recommendFocus,
        decision: bestScenario.profit > 0 ? "PROFITABLE" : "UNPROFITABLE",
        reasoning,
      },
    },
  };
});
