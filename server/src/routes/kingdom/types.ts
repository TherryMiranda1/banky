import { z } from "zod";

export const GetKingdomQuerySchema = z.object({
  period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Period must be in YYYY-MM format")
});

export type GetKingdomQuery = z.infer<typeof GetKingdomQuerySchema>;

export type BuildingType =
  | "treasury"
  | "house"
  | "granary"
  | "stable"
  | "tavern"
  | "windmill"
  | "library"
  | "watchtower"
  | "vault"
  | "market";

export type BuildingStatus = "healthy" | "burning" | "ruined";

export type KingdomHealth = "thriving" | "stable" | "struggling" | "crisis";

export interface Building {
  id: string;
  type: BuildingType;
  level: 1 | 2 | 3;
  status: BuildingStatus;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  spentAmount: number;
  budgetAmount: number;
  spentPercentage: number;
}

export type KingdomEvent =
  | { kind: "fire"; categoryName: string; severity: "low" | "high" }
  | { kind: "caravan"; count: number }
  | { kind: "enemy"; severity: "low" | "high" };

export interface KingdomSummary {
  totalIncome: number;
  totalSpent: number;
  netSavings: number;
  savingsRate: number;
  totalBudgeted: number;
  totalBalanceEur: number;
}

export interface KingdomState {
  period: string;
  health: KingdomHealth;
  summary: KingdomSummary;
  treasuryLevel: 1 | 2 | 3;
  buildings: Building[];
  events: KingdomEvent[];
}
