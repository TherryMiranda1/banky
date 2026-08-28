import { Hono } from "hono";
import { z } from "zod";
import {
  getDb,
  accounts,
  bankConnections,
  eq,
  and,
  isNotNull
} from "../../db/index.js";
import { requireAuth } from "../../middleware/auth.js";

export const TotalBalanceResponseSchema = z.record(z.string(), z.string());

export const balanceRouter = new Hono();

balanceRouter.use("*", requireAuth);

balanceRouter.get("/total", async (c) => {
  const userId = c.get("userId");
  const db = getDb();

  const rows = await db
    .select({
      currency: accounts.currency,
      lastBalance: accounts.lastBalance
    })
    .from(accounts)
    .innerJoin(bankConnections, eq(accounts.connectionId, bankConnections.id))
    .where(
      and(
        eq(bankConnections.status, "active"),
        eq(bankConnections.userId, userId),
        eq(accounts.isActive, true),
        isNotNull(accounts.lastBalance)
      )
    );

  const totals: Record<string, number> = {};

  for (const row of rows) {
    if (!row.lastBalance) {
      continue;
    }

    try {
      const parsed: unknown = JSON.parse(row.lastBalance);
      let amountNum: number | null = null;
      let currency = row.currency;

      if (Array.isArray(parsed) && parsed.length > 0) {
        const item = parsed[0] as { amount?: unknown; currency?: unknown };
        if (typeof item.amount === "string") {
          amountNum = parseFloat(item.amount);
          if (typeof item.currency === "string") {
            currency = item.currency;
          }
        }
      } else if (typeof parsed === "object" && parsed !== null) {
        const obj = parsed as { amount?: unknown; currency?: unknown };
        if (typeof obj.amount === "string") {
          amountNum = parseFloat(obj.amount);
          if (typeof obj.currency === "string") {
            currency = obj.currency;
          }
        }
      }

      if (amountNum !== null && !isNaN(amountNum)) {
        totals[currency] = (totals[currency] ?? 0) + amountNum;
      }
    } catch {
      continue;
    }
  }

  const formattedTotals: Record<string, string> = {};
  for (const [curr, sum] of Object.entries(totals)) {
    formattedTotals[curr] = sum.toFixed(2);
  }

  return c.json(formattedTotals);
});
