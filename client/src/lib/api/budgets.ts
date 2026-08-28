import { apiFetch } from "./client";

export interface BudgetItem {
  id?: string;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  amount: string;
  isInherited: boolean;
  updatedAt?: string;
}

export interface BudgetsResponse {
  period: string;
  data: BudgetItem[];
}

export interface CategoryAnalyticsItem {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  budgetAmount: number;
  spentAmount: number;
  remainingAmount: number;
  spentPercentage: number;
  isInheritedBudget: boolean;
}

export interface MacroSavingsSummary {
  totalIncome: number;
  totalSpent: number;
  netSavings: number;
  savingsRate: number;
  totalBudgeted: number;
}

export interface CategoryAnalyticsResponse {
  period: string;
  cycleRange: {
    from: string;
    to: string;
    label: string;
    dateRangeLabel: string;
  };
  categories: CategoryAnalyticsItem[];
  uncategorized: {
    spentAmount: number;
  };
  summary: MacroSavingsSummary;
}

export async function getBudgets(period: string): Promise<BudgetsResponse> {
  return apiFetch<BudgetsResponse>(`/budgets?period=${encodeURIComponent(period)}`);
}

export async function updateBudgets(
  period: string,
  budgets: Array<{ categoryId: string; amount: string }>
): Promise<BudgetsResponse> {
  return apiFetch<BudgetsResponse>("/budgets", {
    method: "PUT",
    body: JSON.stringify({ period, budgets })
  });
}

export async function getCategoryAnalytics(period: string): Promise<CategoryAnalyticsResponse> {
  return apiFetch<CategoryAnalyticsResponse>(`/analytics/categories?period=${encodeURIComponent(period)}`);
}
