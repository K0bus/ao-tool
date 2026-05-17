import { cached } from "~/server/utils/cache";
import { computeTopProfitItems } from "@albion-tool/market-engine";

export default defineEventHandler(async () => {
  return cached("top-profit-items:v1", computeTopProfitItems, 1800);
});
