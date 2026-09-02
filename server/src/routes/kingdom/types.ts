import { z } from "zod";

export const GetKingdomQuerySchema = z.object({
  period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Period must be in YYYY-MM format")
});

export type GetKingdomQuery = z.infer<typeof GetKingdomQuerySchema>;

export const GetCategoryTrendsQuerySchema = z.object({
  months: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 6))
    .refine((val) => !isNaN(val) && val >= 2 && val <= 24, "Months must be between 2 and 24")
});

export type GetCategoryTrendsQuery = z.infer<typeof GetCategoryTrendsQuerySchema>;

export interface CategoryTrendSeries {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  data: number[];
  total: number;
}

export interface CategoryTrendsResponse {
  months: string[];
  monthLabels: string[];
  series: CategoryTrendSeries[];
}

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
  realmSprite?: string | null;
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
