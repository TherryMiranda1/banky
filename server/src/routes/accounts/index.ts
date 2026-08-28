import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import {
  getDb,
  accounts,
  bankConnections,
  eq,
  and,
  desc,
  asc
} from "../../db/index.js";
import { NotFoundError, BadRequestError } from "../../errors/AppError.js";
import { queryTransactions } from "../transactions/index.js";
import { requireAuth } from "../../middleware/auth.js";

export const AccountBalanceSchema = z.object({
  amount: z.string(),
  currency: z.string(),
  type: z.string().optional(),
  bookedAmount: z.string().optional(),
  heldAmount: z.string().optional()
});

export const AccountSchema = z.object({
  id: z.string(),
  alias: z.string().nullable(),
  nickname: z.string().nullable().optional(),
  bankName: z.string(),
  logoUrl: z.string().nullable().optional(),
  iban: z.string().nullable(),
  currency: z.string(),
  lastBalance: AccountBalanceSchema.nullable(),
  syncedAt: z.string().nullable(),
  status: z.string().optional(),
  isActive: z.boolean().default(true),
  position: z.number().default(0)
});

export type AccountResponse = z.infer<typeof AccountSchema>;

const AccountParamSchema = z.object({
  id: z.string().min(1)
});

const UpdateAccountSchema = z.object({
  nickname: z.string().trim().max(50).nullable().optional(),
  isActive: z.boolean().optional()
});

const ReorderAccountsSchema = z.object({
  accountIds: z.array(z.string().min(1)).min(1, "accountIds must contain at least one ID")
});

const AccountTransactionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  from: z.string().optional(),
  to: z.string().optional(),
  category: z.string().optional()
});

interface AccountRawRow {
  id: string;
  alias: string | null;
  nickname: string | null;
  bankName: string;
  logoUrl: string | null;
  iban: string | null;
  currency: string;
  lastBalance: string | null;
  syncedAt: string | null;
  status: string;
  isActive: number | boolean | null;
  position?: number | null;
}

function parseLastBalance(rawJson: string | null, fallbackCurrency: string): z.infer<typeof AccountBalanceSchema> | null {
  if (!rawJson) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(rawJson);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const availableItem = parsed.find(
        (b: any) =>
          b.type === "CLAV" ||
          b.type === "interimAvailable" ||
          b.balance_type === "CLAV" ||
          b.balance_type === "interimAvailable"
      ) || parsed[0];

      const bookedItem = parsed.find(
        (b: any) =>
          b.type === "CLBD" ||
          b.type === "interimBooked" ||
          b.balance_type === "CLBD" ||
          b.balance_type === "interimBooked"
      );

      const availAmt = parseFloat(availableItem.amount || "0");
      const bookedAmt = bookedItem ? parseFloat(bookedItem.amount || "0") : null;
      const heldAmt = bookedAmt !== null && !isNaN(bookedAmt) && !isNaN(availAmt) && Math.abs(bookedAmt - availAmt) > 0.001
        ? Math.abs(bookedAmt - availAmt).toFixed(2)
        : undefined;

      return {
        amount: String(availableItem.amount || "0"),
        currency: typeof availableItem.currency === "string" ? availableItem.currency : fallbackCurrency,
        type: typeof availableItem.type === "string" ? availableItem.type : undefined,
        bookedAmount: bookedItem?.amount ? String(bookedItem.amount) : undefined,
        heldAmount: heldAmt
      };
    } else if (typeof parsed === "object" && parsed !== null) {
      const obj = parsed as { amount?: unknown; currency?: unknown; type?: unknown };
      if (typeof obj.amount === "string" || typeof obj.amount === "number") {
        return {
          amount: String(obj.amount),
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

function mapAccountRow(row: AccountRawRow): AccountResponse {
  return {
    id: row.id,
    alias: row.alias,
    nickname: row.nickname,
    bankName: row.bankName,
    logoUrl: row.logoUrl,
    iban: row.iban,
    currency: row.currency,
    lastBalance: parseLastBalance(row.lastBalance, row.currency),
    syncedAt: row.syncedAt,
    status: row.status,
    isActive: row.isActive === 1 || row.isActive === true || row.isActive === null,
    position: typeof row.position === "number" ? row.position : 0
  };
}

export const accountsRouter = new Hono();

accountsRouter.use("*", requireAuth);

accountsRouter.get("/", async (c) => {
  const userId = c.get("userId");
  const db = getDb();

  const rows = await db
    .select({
      id: accounts.id,
      alias: accounts.alias,
      nickname: accounts.nickname,
      bankName: bankConnections.bankName,
      logoUrl: bankConnections.logoUrl,
      iban: accounts.iban,
      currency: accounts.currency,
      lastBalance: accounts.lastBalance,
      syncedAt: accounts.syncedAt,
      status: bankConnections.status,
      isActive: accounts.isActive,
      position: accounts.position
    })
    .from(accounts)
    .innerJoin(bankConnections, eq(accounts.connectionId, bankConnections.id))
    .where(eq(bankConnections.userId, userId))
    .orderBy(asc(accounts.position), desc(accounts.syncedAt), asc(accounts.id));

  const accountList = rows.map(mapAccountRow);
  return c.json(accountList);
});

accountsRouter.put(
  "/reorder",
  zValidator("json", ReorderAccountsSchema, (result) => {
    if (!result.success) {
      const issue = result.error.issues[0];
      throw new BadRequestError(issue ? `${issue.path.join(".")}: ${issue.message}` : "Invalid body");
    }
  }),
  async (c) => {
    const userId = c.get("userId");
    const { accountIds } = c.req.valid("json");
    const db = getDb();

    // Verify user accounts
    const userAccs = await db
      .select({ id: accounts.id })
      .from(accounts)
      .innerJoin(bankConnections, eq(accounts.connectionId, bankConnections.id))
      .where(eq(bankConnections.userId, userId));

    const userAccIdSet = new Set(userAccs.map((a) => a.id));

    for (let i = 0; i < accountIds.length; i++) {
      const accId = accountIds[i];
      if (userAccIdSet.has(accId)) {
        await db
          .update(accounts)
          .set({ position: i })
          .where(eq(accounts.id, accId));
      }
    }

    const rows = await db
      .select({
        id: accounts.id,
        alias: accounts.alias,
        nickname: accounts.nickname,
        bankName: bankConnections.bankName,
        logoUrl: bankConnections.logoUrl,
        iban: accounts.iban,
        currency: accounts.currency,
        lastBalance: accounts.lastBalance,
        syncedAt: accounts.syncedAt,
        status: bankConnections.status,
        isActive: accounts.isActive,
        position: accounts.position
      })
      .from(accounts)
      .innerJoin(bankConnections, eq(accounts.connectionId, bankConnections.id))
      .where(eq(bankConnections.userId, userId))
      .orderBy(asc(accounts.position), desc(accounts.syncedAt), asc(accounts.id));

    return c.json(rows.map(mapAccountRow));
  }
);


accountsRouter.post("/cash", async (c) => {
  const userId = c.get("userId");
  const db = getDb();

  // Find or create cash connection
  let [cashConn] = await db
    .select({ id: bankConnections.id })
    .from(bankConnections)
    .where(and(eq(bankConnections.userId, userId), eq(bankConnections.aspspName, "cash")))
    .limit(1);

  if (!cashConn) {
    const connId = `cash_conn_${crypto.randomUUID()}`;
    await db.insert(bankConnections).values({
      id: connId,
      userId,
      bankName: "Efectivo",
      aspspName: "cash",
      aspspCountry: "ES",
      sessionIdEnc: "manual-cash-vault",
      validUntil: "2099-12-31T23:59:59Z",
      status: "active"
    });
    cashConn = { id: connId };
  }

  // Find or create cash account
  let [cashAccount] = await db
    .select({
      id: accounts.id,
      alias: accounts.alias,
      nickname: accounts.nickname,
      bankName: bankConnections.bankName,
      logoUrl: bankConnections.logoUrl,
      iban: accounts.iban,
      currency: accounts.currency,
      lastBalance: accounts.lastBalance,
      syncedAt: accounts.syncedAt,
      status: bankConnections.status,
      isActive: accounts.isActive
    })
    .from(accounts)
    .innerJoin(bankConnections, eq(accounts.connectionId, bankConnections.id))
    .where(and(eq(accounts.connectionId, cashConn.id), eq(bankConnections.userId, userId)))
    .limit(1);

  if (!cashAccount) {
    const accId = `cash_acc_${crypto.randomUUID()}`;
    const initialBalance = JSON.stringify([{ amount: "0.00", currency: "EUR" }]);
    const now = new Date().toISOString();

    await db.insert(accounts).values({
      id: accId,
      connectionId: cashConn.id,
      alias: "Efectivo",
      nickname: "Efectivo",
      currency: "EUR",
      lastBalance: initialBalance,
      syncedAt: now,
      isActive: true
    });

    cashAccount = {
      id: accId,
      alias: "Efectivo",
      nickname: "Efectivo",
      bankName: "Efectivo",
      logoUrl: null,
      iban: null,
      currency: "EUR",
      lastBalance: initialBalance,
      syncedAt: now,
      status: "active",
      isActive: true
    };
  }

  return c.json(mapAccountRow(cashAccount));
});

accountsRouter.patch("/:id", zValidator("param", AccountParamSchema), zValidator("json", UpdateAccountSchema), async (c) => {
  const { id } = c.req.valid("param");
  const body = c.req.valid("json");
  const userId = c.get("userId");
  const db = getDb();

  // Verify ownership
  const [existing] = await db
    .select({ id: accounts.id })
    .from(accounts)
    .innerJoin(bankConnections, eq(accounts.connectionId, bankConnections.id))
    .where(and(eq(accounts.id, id), eq(bankConnections.userId, userId)))
    .limit(1);

  if (!existing) {
    throw new NotFoundError(`Account with id '${id}' not found`);
  }

  const updateFields: Record<string, unknown> = {};
  if (body.nickname !== undefined) {
    updateFields.nickname = body.nickname;
  }
  if (body.isActive !== undefined) {
    updateFields.isActive = body.isActive;
  }

  if (Object.keys(updateFields).length > 0) {
    await db.update(accounts).set(updateFields).where(eq(accounts.id, id));
  }

  const [updatedRow] = await db
    .select({
      id: accounts.id,
      alias: accounts.alias,
      nickname: accounts.nickname,
      bankName: bankConnections.bankName,
      logoUrl: bankConnections.logoUrl,
      iban: accounts.iban,
      currency: accounts.currency,
      lastBalance: accounts.lastBalance,
      syncedAt: accounts.syncedAt,
      status: bankConnections.status,
      isActive: accounts.isActive
    })
    .from(accounts)
    .innerJoin(bankConnections, eq(accounts.connectionId, bankConnections.id))
    .where(eq(accounts.id, id))
    .limit(1);

  return c.json(mapAccountRow(updatedRow!));
});

accountsRouter.get("/:id", zValidator("param", AccountParamSchema), async (c) => {
  const { id } = c.req.valid("param");
  const userId = c.get("userId");
  const db = getDb();

  const [row] = await db
    .select({
      id: accounts.id,
      alias: accounts.alias,
      nickname: accounts.nickname,
      bankName: bankConnections.bankName,
      logoUrl: bankConnections.logoUrl,
      iban: accounts.iban,
      currency: accounts.currency,
      lastBalance: accounts.lastBalance,
      syncedAt: accounts.syncedAt,
      status: bankConnections.status,
      isActive: accounts.isActive
    })
    .from(accounts)
    .innerJoin(bankConnections, eq(accounts.connectionId, bankConnections.id))
    .where(and(eq(accounts.id, id), eq(bankConnections.userId, userId)))
    .limit(1);

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
