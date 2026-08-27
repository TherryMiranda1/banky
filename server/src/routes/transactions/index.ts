import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { getDatabase } from "../../db/index.js";
import { BadRequestError, NotFoundError } from "../../errors/AppError.js";
import { requireAuth } from "../../middleware/auth.js";

export const TransactionSchema = z.object({
  id: z.string(),
  amount: z.string(),
  currency: z.string(),
  description: z.string().nullable(),
  category: z.string().nullable(),
  bookedAt: z.string()
});

export const TransactionsResponseSchema = z.object({
  data: z.array(TransactionSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  hasMore: z.boolean()
});

export type TransactionResponse = z.infer<typeof TransactionSchema>;
export type TransactionsPaginatedResponse = z.infer<typeof TransactionsResponseSchema>;

export const TransactionsQuerySchema = z.object({
  accountId: z.string({
    required_error: "accountId is required"
  }).min(1, "accountId is required"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  from: z.string().optional(),
  to: z.string().optional(),
  category: z.string().optional()
});

export interface RawTransactionRow {
  id: string;
  amount: string;
  currency: string;
  description: string | null;
  category: string | null;
  booked_at: string;
}

export async function queryTransactions(params: {
  accountId: string;
  userId?: string;
  page?: number;
  limit?: number;
  from?: string;
  to?: string;
  category?: string;
}): Promise<TransactionsPaginatedResponse> {
  const accountId = params.accountId;
  const page = params.page ?? 1;
  const limit = Math.min(Math.max(params.limit ?? 50, 1), 200);
  const offset = (page - 1) * limit;

  if (params.from && isNaN(Date.parse(params.from))) {
    throw new BadRequestError("Invalid 'from' date format. Expected ISO8601 string or YYYY-MM-DD.");
  }
  if (params.to && isNaN(Date.parse(params.to))) {
    throw new BadRequestError("Invalid 'to' date format. Expected ISO8601 string or YYYY-MM-DD.");
  }

  const db = getDatabase();

  const accountExists = await db.queryOne<{ id: string }>(
    params.userId
      ? `SELECT a.id FROM accounts a JOIN bank_connections bc ON a.connection_id = bc.id WHERE a.id = ? AND bc.user_id = ?`
      : `SELECT id FROM accounts WHERE id = ?`,
    params.userId ? [accountId, params.userId] : [accountId]
  );

  if (!accountExists) {
    throw new NotFoundError(`Account with id '${accountId}' not found`);
  }

  const fromVal = params.from ?? null;
  let toVal: string | null = null;
  if (params.to) {
    toVal = params.to.length === 10 ? `${params.to}T23:59:59.999Z` : params.to;
  }
  const rawToVal = params.to ? `${params.to}%` : null;
  const categoryVal = params.category ?? null;

  const countRow = await db.queryOne<{ count: number }>(
    `SELECT COUNT(*) as count
     FROM transactions
     WHERE account_id = ?
       AND (? IS NULL OR booked_at >= ?)
       AND (? IS NULL OR booked_at <= ? OR booked_at LIKE ?)
       AND (? IS NULL OR category = ?)`,
    [
      accountId,
      fromVal,
      fromVal,
      toVal,
      toVal,
      rawToVal,
      categoryVal,
      categoryVal
    ]
  );

  const total = countRow ? countRow.count : 0;

  const rows = await db.query<RawTransactionRow>(
    `SELECT id, amount, currency, description, category, booked_at
     FROM transactions
     WHERE account_id = ?
       AND (? IS NULL OR booked_at >= ?)
       AND (? IS NULL OR booked_at <= ? OR booked_at LIKE ?)
       AND (? IS NULL OR category = ?)
     ORDER BY booked_at DESC, id DESC
     LIMIT ? OFFSET ?`,
    [
      accountId,
      fromVal,
      fromVal,
      toVal,
      toVal,
      rawToVal,
      categoryVal,
      categoryVal,
      limit,
      offset
    ]
  );

  const data: TransactionResponse[] = rows.map((r) => ({
    id: r.id,
    amount: r.amount,
    currency: r.currency,
    description: r.description,
    category: r.category,
    bookedAt: r.booked_at
  }));

  const hasMore = offset + data.length < total;

  return {
    data,
    total,
    page,
    limit,
    hasMore
  };
}

export const transactionsRouter = new Hono();

transactionsRouter.use("*", requireAuth);

transactionsRouter.get(
  "/",
  zValidator("query", TransactionsQuerySchema, (result) => {
    if (!result.success) {
      const firstIssue = result.error.issues[0];
      const message = firstIssue ? `${firstIssue.path.join(".")}: ${firstIssue.message}` : "Invalid query parameters";
      throw new BadRequestError(message, result.error.issues);
    }
  }),
  async (c) => {
    const userId = c.get("userId");
    const query = c.req.valid("query");
    const result = await queryTransactions({
      userId,
      ...query
    });
    return c.json(result);
  }
);
