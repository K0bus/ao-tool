import { z } from "zod";
import { prisma } from "~/server/utils/prisma";

const querySchema = z.object({
  location: z.string().optional(),
  quality: z.coerce.number().optional().default(1),
  days: z.coerce.number().optional().default(30),
});

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, statusMessage: "Item ID required" });

  const query = await getValidatedQuery(event, (q) => querySchema.safeParse(q));
  if (!query.success) throw createError({ statusCode: 400, statusMessage: "Invalid query parameters" });

  const { location, quality, days } = query.data;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const history = await prisma.marketPriceHistory.findMany({
    where: {
      itemId: id,
      locationId: location,
      quality: quality,
      timestamp: {
        gte: startDate,
      },
    },
    orderBy: {
      timestamp: "asc",
    },
    select: {
      sellPriceMin: true,
      buyPriceMax: true,
      timestamp: true,
    },
  });

  return { data: history };
});
