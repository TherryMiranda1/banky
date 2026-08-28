import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { requireAuth } from "../../middleware/auth.js";
import { BadRequestError } from "../../errors/AppError.js";
import { BudgetAnalyticsService } from "../../services/budget-analytics.service.js";
import {
  GetBudgetsQuerySchema,
  UpdateBudgetsBodySchema,
  GetAnalyticsQuerySchema
} from "./types.js";

export const budgetsRouter = new Hono();
budgetsRouter.use("*", requireAuth);

// GET /budgets?period=YYYY-MM - List category budgets with historical fallback inheritance
budgetsRouter.get(
  "/",
  zValidator("query", GetBudgetsQuerySchema, (result) => {
    if (!result.success) {
      const issue = result.error.issues[0];
      throw new BadRequestError(issue ? `${issue.path.join(".")}: ${issue.message}` : "Invalid query parameters");
    }
  }),
  async (c) => {
    const userId = c.get("userId");
    const { period } = c.req.valid("query");
    const data = await BudgetAnalyticsService.getBudgetsForPeriod(userId, period);
    return c.json({ period, data });
  }
);

// PUT /budgets - Upsert category budget amounts for a given period
budgetsRouter.put(
  "/",
  zValidator("json", UpdateBudgetsBodySchema, (result) => {
    if (!result.success) {
      const issue = result.error.issues[0];
      throw new BadRequestError(issue ? `${issue.path.join(".")}: ${issue.message}` : "Invalid body parameters");
    }
  }),
  async (c) => {
    const userId = c.get("userId");
    const { period, budgets } = c.req.valid("json");
    const data = await BudgetAnalyticsService.updateBudgets(userId, period, budgets);
    return c.json({ period, data });
  }
);

export const analyticsRouter = new Hono();
analyticsRouter.use("*", requireAuth);

// GET /analytics/categories?period=YYYY-MM - Compute category analytics and savings summary in Drizzle
analyticsRouter.get(
  "/categories",
  zValidator("query", GetAnalyticsQuerySchema, (result) => {
    if (!result.success) {
      const issue = result.error.issues[0];
      throw new BadRequestError(issue ? `${issue.path.join(".")}: ${issue.message}` : "Invalid query parameters");
    }
  }),
  async (c) => {
    const userId = c.get("userId");
    const { period } = c.req.valid("query");
    const analytics = await BudgetAnalyticsService.getCategoryAnalytics(userId, period);
    return c.json(analytics);
  }
);
