import { z } from "zod";

export const GetBudgetsQuerySchema = z.object({
  period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Period must be in YYYY-MM format (e.g. 2026-02)")
});

export const UpdateBudgetsBodySchema = z.object({
  period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Period must be in YYYY-MM format (e.g. 2026-02)"),
  budgets: z.array(
    z.object({
      categoryId: z.string().min(1, "categoryId is required"),
      amount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Amount must be a positive number with up to 2 decimal places")
    })
  )
});

export const GetAnalyticsQuerySchema = z.object({
  period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Period must be in YYYY-MM format (e.g. 2026-02)")
});

export interface BudgetItemResponse {
  id?: string;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  amount: string;
  isInherited: boolean;
  updatedAt?: string;
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
