import crypto from "node:crypto";
import {
  getDb,
  categories,
  categoryBudgets,
  transactions,
  accounts,
  bankConnections,
  users,
  eq,
  and,
  lt,
  gte,
  lte,
  or,
  like,
  asc,
  desc
} from "../db/index.js";
import { BillingCycleService } from "../core/domain/billing-cycle.service.js";
import { BadRequestError, NotFoundError } from "../errors/AppError.js";
import { seedDefaultCategoriesIfEmpty } from "./categories-seed.js";
import type {
  BudgetItemResponse,
  CategoryAnalyticsItem,
  CategoryAnalyticsResponse,
  MacroSavingsSummary
} from "../routes/budgets/types.js";

export class BudgetAnalyticsService {
  /**
   * Retrieves budgets for all user categories for a given period,
   * applying historical inheritance from the most recent configured month.
   */
  public static async getBudgetsForPeriod(
    userId: string,
    period: string
  ): Promise<BudgetItemResponse[]> {
    const db = getDb();
    await seedDefaultCategoriesIfEmpty(db, userId);

    const userCategories = await db
      .select()
      .from(categories)
      .where(eq(categories.userId, userId))
      .orderBy(asc(categories.name));

    const explicitBudgets = await db
      .select()
      .from(categoryBudgets)
      .where(and(eq(categoryBudgets.userId, userId), eq(categoryBudgets.period, period)));

    const explicitMap = new Map(explicitBudgets.map((b) => [b.categoryId, b]));

    const pastBudgets = await db
      .select()
      .from(categoryBudgets)
      .where(and(eq(categoryBudgets.userId, userId), lt(categoryBudgets.period, period)))
      .orderBy(desc(categoryBudgets.period));

    const inheritedMap = new Map<string, typeof categoryBudgets.$inferSelect>();
    for (const pb of pastBudgets) {
      if (!inheritedMap.has(pb.categoryId)) {
        inheritedMap.set(pb.categoryId, pb);
      }
    }

    return userCategories.map((cat) => {
      const explicit = explicitMap.get(cat.id);
      if (explicit) {
        return {
          id: explicit.id,
          categoryId: cat.id,
          categoryName: cat.name,
          categoryColor: cat.color,
          categoryIcon: cat.icon,
          amount: parseFloat(explicit.amount).toFixed(2),
          isInherited: false,
          updatedAt: explicit.updatedAt
        };
      }

      const inherited = inheritedMap.get(cat.id);
      if (inherited) {
        return {
          categoryId: cat.id,
          categoryName: cat.name,
          categoryColor: cat.color,
          categoryIcon: cat.icon,
          amount: parseFloat(inherited.amount).toFixed(2),
          isInherited: true,
          updatedAt: inherited.updatedAt
        };
      }

      return {
        categoryId: cat.id,
        categoryName: cat.name,
        categoryColor: cat.color,
        categoryIcon: cat.icon,
        amount: "0.00",
        isInherited: false
      };
    });
  }

  /**
   * Upserts budgets for a given period and returns the refreshed budget list.
   */
  public static async updateBudgets(
    userId: string,
    period: string,
    budgetList: Array<{ categoryId: string; amount: string }>
  ): Promise<BudgetItemResponse[]> {
    const db = getDb();
    const userCategories = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.userId, userId));

    const validCategoryIds = new Set(userCategories.map((c) => c.id));
    for (const item of budgetList) {
      if (!validCategoryIds.has(item.categoryId)) {
        throw new NotFoundError(`Category '${item.categoryId}' not found for current user`);
      }
    }

    const now = new Date().toISOString();
    for (const item of budgetList) {
      const formattedAmount = parseFloat(item.amount).toFixed(2);
      const budgetId = crypto.randomUUID();

      await db
        .insert(categoryBudgets)
        .values({
          id: budgetId,
          userId,
          categoryId: item.categoryId,
          period,
          amount: formattedAmount,
          createdAt: now,
          updatedAt: now
        })
        .onConflictDoUpdate({
          target: [categoryBudgets.userId, categoryBudgets.categoryId, categoryBudgets.period],
          set: {
            amount: formattedAmount,
            updatedAt: now
          }
        });
    }

    return this.getBudgetsForPeriod(userId, period);
  }

  /**
   * Aggregates transactions and computes category analytics and macro savings metrics
   * based on the user's billing cutoff cycle.
   */
  public static async getCategoryAnalytics(
    userId: string,
    period: string
  ): Promise<CategoryAnalyticsResponse> {
    const db = getDb();
    const [userRow] = await db
      .select({ cutoffDay: users.cutoffDay })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    let cutoffDay = 1;
    if (userRow?.cutoffDay !== undefined && userRow?.cutoffDay !== null) {
      const parsed = typeof userRow.cutoffDay === "number" ? userRow.cutoffDay : parseInt(String(userRow.cutoffDay), 10);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 31) {
        cutoffDay = parsed;
      }
    }
    const cycleRange = BillingCycleService.getPeriodRange(period, cutoffDay);

    const fromDateOnly = cycleRange.from.split("T")[0];
    const toDateOnly = cycleRange.to.split("T")[0];
    const toVal = `${toDateOnly}T23:59:59.999Z`;

    const txRows = await db
      .select({
        id: transactions.id,
        amount: transactions.amount,
        category: transactions.category,
        bookedAt: transactions.bookedAt,
        isTransfer: transactions.isTransfer
      })
      .from(transactions)
      .innerJoin(accounts, eq(transactions.accountId, accounts.id))
      .innerJoin(bankConnections, eq(accounts.connectionId, bankConnections.id))
      .where(
        and(
          eq(bankConnections.userId, userId),
          eq(accounts.isActive, true),
          eq(transactions.isTransfer, false),
          gte(transactions.bookedAt, fromDateOnly),
          or(lte(transactions.bookedAt, toVal), lte(transactions.bookedAt, toDateOnly))
        )
      );

    let totalIncome = 0;
    let totalSpent = 0;
    const spentByCategoryName = new Map<string, number>();
    let uncategorizedSpent = 0;

    for (const tx of txRows) {
      if (tx.isTransfer || tx.category?.toLowerCase() === "traspasos" || tx.category?.toLowerCase() === "traspaso") {
        continue;
      }

      const amt = parseFloat(tx.amount);
      if (isNaN(amt)) continue;

      if (amt > 0) {
        totalIncome += amt;
      } else if (amt < 0) {
        const expense = Math.abs(amt);
        totalSpent += expense;

        if (tx.category && tx.category.trim() !== "") {
          const prev = spentByCategoryName.get(tx.category) ?? 0;
          spentByCategoryName.set(tx.category, prev + expense);
        } else {
          uncategorizedSpent += expense;
        }
      }
    }

    const budgets = await this.getBudgetsForPeriod(userId, period);
    let totalBudgeted = 0;

    const categoryAnalytics: CategoryAnalyticsItem[] = budgets.map((b) => {
      const budgetAmount = parseFloat(b.amount);
      totalBudgeted += budgetAmount;

      const spentAmount = spentByCategoryName.get(b.categoryName) ?? 0;
      const remainingAmount = budgetAmount - spentAmount;
      const spentPercentage = budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : (spentAmount > 0 ? 100 : 0);

      return {
        categoryId: b.categoryId,
        categoryName: b.categoryName,
        categoryColor: b.categoryColor,
        categoryIcon: b.categoryIcon,
        budgetAmount: Math.round(budgetAmount * 100) / 100,
        spentAmount: Math.round(spentAmount * 100) / 100,
        remainingAmount: Math.round(remainingAmount * 100) / 100,
        spentPercentage: Math.round(spentPercentage * 10) / 10,
        isInheritedBudget: b.isInherited
      };
    });

    const netSavings = totalIncome - totalSpent;
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalSpent) / totalIncome) * 100 : 0;

    const summary: MacroSavingsSummary = {
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalSpent: Math.round(totalSpent * 100) / 100,
      netSavings: Math.round(netSavings * 100) / 100,
      savingsRate: Math.round(savingsRate * 10) / 10,
      totalBudgeted: Math.round(totalBudgeted * 100) / 100
    };

    return {
      period,
      cycleRange: {
        from: cycleRange.from,
        to: cycleRange.to,
        label: cycleRange.label,
        dateRangeLabel: cycleRange.dateRangeLabel
      },
      categories: categoryAnalytics,
      uncategorized: {
        spentAmount: Math.round(uncategorizedSpent * 100) / 100
      },
      summary
    };
  }
}
