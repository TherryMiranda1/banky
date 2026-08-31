import type { KingdomState } from "../../routes/kingdom/types.js";

export interface IKingdomService {
  getKingdomState(userId: string, period: string): Promise<KingdomState>;
}
