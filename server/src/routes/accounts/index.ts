import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { getDatabase } from "../../db/index.js";
import { NotFoundError, BadRequestError } from "../../errors/AppError.js";
import { queryTransactions } from "../transactions/index.js";
import { requireAuth } from "../../middleware/auth.js";

export const AccountBalanceSchema = z.object({
  amount: z.string(),
  currency: z.string(),
  type: z.string().optional()
});

export const AccountSchema = z.object({
  id: z.string(),
  alias: z.string().nullable(),
  bankName: z.string(),
  iban: z.string().nullable(),
  currency: z.string(),
  lastBalance: AccountBalanceSchema.nullable(),
  syncedAt: z.string().nullable(),
  status: z.string().optional()
});

export type AccountResponse = z.infer<typeof AccountSchema>;

const AccountParamSchema = z.object({
  id: z.string().min(1)
});

const AccountTransactionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  from: z.string().optional(),
  to: z.string().optional(),
  category: z.string().optional()
});

interface RawAccountRow {
  id: string;
  alias: string | null;
  bank_name: string;
  iban: string | null;
  currency: string;
  last_balance: string | null;
  synced_at: string | null;
  status: string;
}

function parseLastBalance(rawJson: string | null, fallbackCurrency: string): z.infer<typeof AccountBalanceSchema> | null {
  if (!rawJson) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(rawJson);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const item = parsed[0] as { amount?: unknown; currency?: unknown; type?: unknown };
      if (typeof item.amount === "string") {
        return {
          amount: item.amount,
          currency: typeof item.currency === "string" ? item.currency : fallbackCurrency,
          type: typeof item.type === "string" ? item.type : undefined
        };
      }
    } else if (typeof parsed === "object" && parsed !== null) {
      const obj = parsed as { amount?: unknown; currency?: unknown; type?: unknown };
      if (typeof obj.amount === "string") {
        return {
          amount: obj.amount,
          currency: typeof obj.currency === "string" ? obj.currency : fallbackCurrency,
          type: typeof obj.type === "string" ? obj.type : undefined
        };
      }
    }
  } catch {
    return null;
  }

  return null;
}

function mapAccountRow(row: RawAccountRow): AccountResponse {
  return {
    id: row.id,
    alias: row.alias,
    bankName: row.bank_name,
    iban: row.iban,
    currency: row.currency,
    lastBalance: parseLastBalance(row.last_balance, row.currency),
    syncedAt: row.synced_at,
    status: row.status
  };
}

export const accountsRouter = new Hono();

accountsRouter.use("*", requireAuth);

accountsRouter.get("/", async (c) => {
  const userId = c.get("userId");
  const db = getDatabase();
  const rows = await db.query<RawAccountRow>(
    `SELECT
      a.id,
      a.alias,
      bc.bank_name,
      a.iban,
      a.currency,
      a.last_balance,
      a.synced_at,
      bc.status
    FROM accounts a
    JOIN bank_connections bc ON a.connection_id = bc.id
    WHERE bc.user_id = ?
    ORDER BY a.synced_at DESC, a.id ASC`,
    [userId]
  );

  const accounts = rows.map(mapAccountRow);
  return c.json(accounts);
});

accountsRouter.get("/:id", zValidator("param", AccountParamSchema), async (c) => {
  const { id } = c.req.valid("param");
  const userId = c.get("userId");
  const db = getDatabase();

  const row = await db.queryOne<RawAccountRow>(
    `SELECT
       a.id,
       a.alias,
       bc.bank_name,
       a.iban,
       a.currency,
       a.last_balance,
       a.synced_at,
       bc.status
     FROM accounts a
     JOIN bank_connections bc ON a.connection_id = bc.id
     WHERE a.id = ? AND bc.user_id = ?`,
    [id, userId]
  );

  if (!row) {
    throw new NotFoundError(`Account with id '${id}' not found`);
  }

  return c.json(mapAccountRow(row));
});

accountsRouter.get(
  "/:id/transactions",
  zValidator("param", AccountParamSchema),
  zValidator("query", AccountTransactionsQuerySchema, (result) => {
    if (!result.success) {
      const firstIssue = result.error.issues[0];
      const message = firstIssue ? `${firstIssue.path.join(".")}: ${firstIssue.message}` : "Invalid query parameters";
      throw new BadRequestError(message, result.error.issues);
    }
  }),
  async (c) => {
    const { id } = c.req.valid("param");
    const userId = c.get("userId");
    const query = c.req.valid("query");
    const result = await queryTransactions({
      accountId: id,
      userId,
      ...query
    });
    return c.json(result);
  }
);
