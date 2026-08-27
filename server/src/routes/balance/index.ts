import { Hono } from "hono";
import { z } from "zod";
import { getDatabase } from "../../db/index.js";
import { requireAuth } from "../../middleware/auth.js";

export const TotalBalanceResponseSchema = z.record(z.string(), z.string());

interface RawBalanceRow {
  currency: string;
  last_balance: string | null;
}

export const balanceRouter = new Hono();

balanceRouter.use("*", requireAuth);

balanceRouter.get("/total", async (c) => {
  const userId = c.get("userId");
  const db = getDatabase();
  const rows = await db.query<RawBalanceRow>(
    `SELECT a.currency, a.last_balance
     FROM accounts a
     JOIN bank_connections bc ON a.connection_id = bc.id
     WHERE bc.status = 'active' AND bc.user_id = ? AND a.last_balance IS NOT NULL`,
    [userId]
  );

  const totals: Record<string, number> = {};

  for (const row of rows) {
    if (!row.last_balance) {
      continue;
    }

    try {
      const parsed: unknown = JSON.parse(row.last_balance);
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
