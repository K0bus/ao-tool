import { prisma } from "~/server/utils/prisma";
import { cached } from "~/server/utils/cache";

const MAX_DEPTH = 8;
const MAX_ITEMS = 500;

interface TreeNode {
  itemId: string;
  uniqueName: string;
  name: string;
  tier: number;
  enchantmentLevel: number;
  isCraftable: boolean;
  isRefinable: boolean;
  iconUrl: string | null;
  quantity: number;
  maxReturnRate: number | null;
  type: "craft" | "refine" | "raw";
  recipe: {
    resultCount: number;
    craftingFame: number;
    silverCost: number;
    stationId: string | null;
    ingredients: TreeNode[];
  } | null;
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id)
    throw createError({ statusCode: 400, statusMessage: "Item ID required" });

  const cacheKey = `item:tree:${id}`;

  const result = await cached(
    cacheKey,
    async () => {
      const rootItem = await prisma.item.findUnique({
        where: { uniqueName: id },
        select: { id: true },
      });
      if (!rootItem) return null;

      // ── BFS : collecter tous les itemIds nécessaires ────────────────
      const allItemIds = new Set<string>([rootItem.id]);
      const queue: string[] = [rootItem.id];
      const processedBFS = new Set<string>();

      while (queue.length > 0 && allItemIds.size < MAX_ITEMS) {
        const batch = queue.splice(0, 50);
        const toProcess = batch.filter((i) => !processedBFS.has(i));
        if (toProcess.length === 0) continue;
        toProcess.forEach((i) => processedBFS.add(i));

        const [craftRecipes, refineRecipes] = await Promise.all([
          prisma.craftingRecipe.findMany({
            where: { resultItemId: { in: toProcess } },
            select: {
              resultItemId: true,
              ingredients: { select: { itemId: true } },
            },
          }),
          prisma.refiningRecipe.findMany({
            where: { resultItemId: { in: toProcess } },
            select: {
              resultItemId: true,
              ingredients: { select: { itemId: true } },
            },
          }),
        ]);

        for (const r of [...craftRecipes, ...refineRecipes]) {
          for (const ing of r.ingredients) {
            if (!allItemIds.has(ing.itemId) && allItemIds.size < MAX_ITEMS) {
              allItemIds.add(ing.itemId);
              queue.push(ing.itemId);
            }
          }
        }
      }

      // ── Charger tous les items + recettes en une seule requête ───────
      const items = await prisma.item.findMany({
        where: { id: { in: Array.from(allItemIds) } },
        include: {
          localizations: {
            where: { locale: "FR-FR" },
            select: { name: true },
            take: 1,
          },
          marketPrices: {
            include: { location: true },
          },
          craftingRecipe: {
            select: {
              resultCount: true,
              craftingFame: true,
              silverCost: true,
              craftingStationId: true,
              ingredients: {
                select: { itemId: true, quantity: true, maxReturnRate: true },
              },
            },
          },
          refiningRecipe: {
            select: {
              resultCount: true,
              craftingStationId: true,
              ingredients: {
                select: { itemId: true, quantity: true, maxReturnRate: true },
              },
            },
          },
        },
      });

      const itemMap = new Map(items.map((i) => [i.id, i]));

      // ── Assembler l'arbre récursivement en mémoire ───────────────────
      function buildNode(
        itemId: string,
        quantity: number,
        maxReturnRate: number | null,
        depth: number,
        visited: Set<string>,
      ): TreeNode & { marketPrices: any[] } {
        const item = itemMap.get(itemId);

        // Fallback si item non trouvé ou cycle / profondeur max
        if (!item || depth > MAX_DEPTH || visited.has(itemId)) {
          return {
            itemId,
            uniqueName: item?.uniqueName ?? itemId,
            name: item?.localizations[0]?.name ?? itemId,
            tier: item?.tier ?? 1,
            enchantmentLevel: item?.enchantmentLevel ?? 0,
            isCraftable: false,
            isRefinable: false,
            iconUrl: item?.iconUrl ?? null,
            quantity,
            maxReturnRate,
            type: "raw",
            marketPrices: item?.marketPrices ?? [],
            recipe: null,
          };
        }

        const newVisited = new Set(visited);
        newVisited.add(itemId);

        const recipe = item.craftingRecipe ?? item.refiningRecipe;
        const type = item.craftingRecipe
          ? "craft"
          : item.refiningRecipe
            ? "refine"
            : "raw";

        return {
          itemId: item.id,
          uniqueName: item.uniqueName,
          name: item.localizations[0]?.name ?? item.uniqueName,
          tier: item.tier,
          enchantmentLevel: item.enchantmentLevel,
          isCraftable: item.isCraftable,
          isRefinable: item.isRefinable,
          iconUrl: item.iconUrl,
          quantity,
          maxReturnRate,
          type,
          marketPrices: item.marketPrices,
          recipe: recipe
            ? {
                resultCount: recipe.resultCount,
                craftingFame:
                  (recipe as { craftingFame?: number }).craftingFame ?? 0,
                silverCost: (recipe as { silverCost?: number }).silverCost ?? 0,
                stationId: recipe.craftingStationId,
                ingredients: recipe.ingredients.map((ing) =>
                  buildNode(
                    ing.itemId,
                    ing.quantity, // We store individual quantity per craft
                    ing.maxReturnRate,
                    depth + 1,
                    newVisited,
                  ),
                ),
              }
            : null,
        };
      }

      return buildNode(rootItem.id, 1, null, 0, new Set());
    },
    300, // 5 min — arbre inclut les marketPrices qui doivent rester frais après un sync
  );

  if (!result)
    throw createError({ statusCode: 404, statusMessage: "Item not found" });

  return { data: result };
});
