import { requireAdmin } from "~/server/utils/guards";
import { cacheInvalidate } from "~/server/utils/cache";

const PURGEABLE_KEYS: Record<string, string> = {
  "top-profit": "top-profit-items:v1",
};

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const body = await readBody(event);
  const key = body?.key as string | undefined;

  if (!key || !PURGEABLE_KEYS[key]) {
    throw createError({ statusCode: 400, statusMessage: "Unknown cache key" });
  }

  await cacheInvalidate(PURGEABLE_KEYS[key]);

  return { data: { message: `Cache "${key}" purgé avec succès.` } };
});
