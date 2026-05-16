import { z } from "zod";
import { prisma } from "~/server/utils/prisma";

const schema = z.object({
  type: z.string().optional(),
  q: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export default defineEventHandler(async (event) => {
  const query = await getValidatedQuery(event, (q) => schema.safeParse(q));

  if (!query.success) {
    throw createError({
      statusCode: 422,
      statusMessage: "Invalid query parameters",
    });
  }

  const { type, q, limit } = query.data;

  const where: any = {};
  if (type) {
    // Map internal plot types to game building categories if needed
    // or just pass the type directly if it matches 'craftbuilding', 'farmbuilding' etc.
    where.type = { contains: type, mode: "insensitive" };
  }
  
  if (q) {
    where.name = { contains: q, mode: "insensitive" };
  }

  const buildings = await prisma.craftingStation.findMany({
    where,
    take: limit,
    orderBy: [
      { tier: 'asc' },
      { name: 'asc' }
    ],
    select: {
      id: true,
      name: true,
      type: true,
      tier: true,
      description: true,
      capability: true,
      iconUrl: true,
    }
  });

  return {
    data: buildings
  };
});
