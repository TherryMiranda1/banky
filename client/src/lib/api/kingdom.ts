import { apiFetch } from "./client.js";

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

export async function getKingdomState(period: string): Promise<KingdomState> {
  return apiFetch<KingdomState>(`/kingdom?period=${encodeURIComponent(period)}`);
}

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

export async function getCategoryTrends(months = 6): Promise<CategoryTrendsResponse> {
  return apiFetch<CategoryTrendsResponse>(`/kingdom/category-trends?months=${months}`);
}
