import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  getDb,
  accounts,
  bankConnections,
  deletedAccounts,
  eq,
  and,
  desc,
  asc
} from "../../db/index.js";
import { NotFoundError, BadRequestError } from "../../errors/AppError.js";
import { queryTransactions } from "../transactions/index.js";
import { requireAuth } from "../../middleware/auth.js";
import {
  AccountBalanceSchema,
  AccountSchema,
  AccountResponse,
  AccountParamSchema,
  UpdateAccountSchema,
  ToggleVisibilitySchema,
  ReorderAccountsSchema,
  AccountTransactionsQuerySchema
} from "./accounts-types.js";
import { mapAccountRow, accountSelectFields } from "./accounts-helpers.js";
import { connectionsRouter } from "./connections.js";
import { cashRouter } from "./cash.js";

export { AccountBalanceSchema, AccountSchema, type AccountResponse };

export const accountsRouter = new Hono();

accountsRouter.use("*", requireAuth);

// Mount sub-routers
accountsRouter.route("/connections", connectionsRouter);
accountsRouter.route("/connection", connectionsRouter);
accountsRouter.route("/cash", cashRouter);

// GET /accounts - List all accounts for user
accountsRouter.get("/", async (c) => {
  const userId = c.get("userId");
  const db = getDb();

  const rows = await db
    .select(accountSelectFields)
    .from(accounts)
    .innerJoin(bankConnections, eq(accounts.connectionId, bankConnections.id))
    .where(eq(bankConnections.userId, userId))
    .orderBy(asc(accounts.position), desc(accounts.syncedAt), asc(accounts.id));

  return c.json(rows.map(mapAccountRow));
});

// PUT /accounts/reorder - Reorder accounts
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
      .select(accountSelectFields)
      .from(accounts)
      .innerJoin(bankConnections, eq(accounts.connectionId, bankConnections.id))
      .where(eq(bankConnections.userId, userId))
      .orderBy(asc(accounts.position), desc(accounts.syncedAt), asc(accounts.id));

    return c.json(rows.map(mapAccountRow));
  }
);

// PATCH /accounts/:id/visibility - Toggle account visibility specifically
accountsRouter.patch(
  "/:id/visibility",
  zValidator("param", AccountParamSchema),
  zValidator("json", ToggleVisibilitySchema),
  async (c) => {
    const { id } = c.req.valid("param");
    const { isActive } = c.req.valid("json");
    const userId = c.get("userId");
    const db = getDb();

    const [existing] = await db
      .select({ id: accounts.id })
      .from(accounts)
      .innerJoin(bankConnections, eq(accounts.connectionId, bankConnections.id))
      .where(and(eq(accounts.id, id), eq(bankConnections.userId, userId)))
      .limit(1);

    if (!existing) {
      throw new NotFoundError(`Account with id '${id}' not found`);
    }

    await db.update(accounts).set({ isActive }).where(eq(accounts.id, id));

    const [updatedRow] = await db
      .select(accountSelectFields)
      .from(accounts)
      .innerJoin(bankConnections, eq(accounts.connectionId, bankConnections.id))
      .where(eq(accounts.id, id))
      .limit(1);

    return c.json(mapAccountRow(updatedRow!));
  }
);

// PATCH /accounts/:id - General update (nickname, isActive)
accountsRouter.patch(
  "/:id",
  zValidator("param", AccountParamSchema),
  zValidator("json", UpdateAccountSchema),
  async (c) => {
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");
    const userId = c.get("userId");
    const db = getDb();

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
      .select(accountSelectFields)
      .from(accounts)
      .innerJoin(bankConnections, eq(accounts.connectionId, bankConnections.id))
      .where(eq(accounts.id, id))
      .limit(1);

    return c.json(mapAccountRow(updatedRow!));
  }
);

// GET /accounts/:id - Get account detail
accountsRouter.get("/:id", zValidator("param", AccountParamSchema), async (c) => {
  const { id } = c.req.valid("param");
  const userId = c.get("userId");
  const db = getDb();

  const [row] = await db
    .select(accountSelectFields)
    .from(accounts)
    .innerJoin(bankConnections, eq(accounts.connectionId, bankConnections.id))
    .where(and(eq(accounts.id, id), eq(bankConnections.userId, userId)))
    .limit(1);

  if (!row) {
    throw new NotFoundError(`Account with id '${id}' not found`);
  }

  return c.json(mapAccountRow(row));
});

// DELETE /accounts/:id - Delete an account and its transactions
accountsRouter.delete("/:id", zValidator("param", AccountParamSchema), async (c) => {
  const { id } = c.req.valid("param");
  const userId = c.get("userId");
  const db = getDb();

  const [existing] = await db
    .select({
      id: accounts.id,
      iban: accounts.iban,
      identificationHash: accounts.identificationHash
    })
    .from(accounts)
    .innerJoin(bankConnections, eq(accounts.connectionId, bankConnections.id))
    .where(and(eq(accounts.id, id), eq(bankConnections.userId, userId)))
    .limit(1);

  if (!existing) {
    throw new NotFoundError(`Account with id '${id}' not found`);
  }

  await db.insert(deletedAccounts).values({
    id: `del_${crypto.randomUUID()}`,
    userId,
    iban: existing.iban || null,
    identificationHash: existing.identificationHash || null
  });

  await db.delete(accounts).where(eq(accounts.id, id));

  return c.json({ success: true, id });
});

// GET /accounts/:id/transactions - Get transactions for account
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
