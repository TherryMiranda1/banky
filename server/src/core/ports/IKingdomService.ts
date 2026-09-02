import type { KingdomState, CategoryTrendsResponse } from "../../routes/kingdom/types.js";

export interface IKingdomService {
  getKingdomState(userId: string, period: string): Promise<KingdomState>;
  getCategoryTrends(userId: string, months: number): Promise<CategoryTrendsResponse>;
}
