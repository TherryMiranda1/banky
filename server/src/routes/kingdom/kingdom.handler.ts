import type { Context } from "hono";
import { KingdomService } from "../../core/domain/kingdom.service.js";

const kingdomService = new KingdomService();

export async function getKingdomHandler(c: Context) {
  const userId = c.get("userId") as string;
  const { period } = c.req.valid("query" as never) as { period: string };

  const kingdomState = await kingdomService.getKingdomState(userId, period);
  return c.json(kingdomState);
}

export async function getCategoryTrendsHandler(c: Context) {
  const userId = c.get("userId") as string;
  const { months } = c.req.valid("query" as never) as { months: number };

  const trends = await kingdomService.getCategoryTrends(userId, months || 6);
  return c.json(trends);
}
