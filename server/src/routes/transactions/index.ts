import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  getDb,
  transactions,
  accounts,
  bankConnections,
  categories,
  users,
  eq,
  ne,
  isNull,
  and,
  or,
  gte,
  lte,
  like,
  desc,
  count,
  inArray,
  sql
} from "../../db/index.js";
import { BadRequestError, NotFoundError } from "../../errors/AppError.js";
import { requireAuth } from "../../middleware/auth.js";
import { BillingCycleService } from "../../core/domain/billing-cycle.service.js";
import { extractSuggestedPattern } from "./pattern-helper.js";
import { getMccInfo } from "../../core/domain/mcc-dictionary.js";
import { TransferDetectionService } from "../../services/transfer-detection.js";
import {
  TransactionSchema,
  TransactionsResponseSchema,
  TransactionsQuerySchema,
  UpdateCategoryBodySchema,
  CreateManualTransactionSchema,
  UpdateManualTransactionSchema,
  type TransactionResponse,
  type TransactionsPaginatedResponse,
  type TransactionMetadata
} from "./types.js";

export {
  TransactionSchema,
  TransactionsResponseSchema,
  TransactionsQuerySchema,
  CreateManualTransactionSchema,
  UpdateManualTransactionSchema,
  type TransactionResponse,
  type TransactionsPaginatedResponse
};

export function parseTransactionMetadata(rawStr: string | null): TransactionMetadata {
  if (!rawStr) return null;
  try {
    const raw = JSON.parse(rawStr);
    if (!raw || typeof raw !== "object") return null;

    const t = raw.raw && typeof raw.raw === "object" ? raw.raw : raw;

    const balanceAfter = t.balance_after_transaction ? {
      amount: t.balance_after_transaction.amount || "0",
      currency: t.balance_after_transaction.currency || "EUR"
    } : null;

    const counterpartyObj = t.creditor || t.debtor || null;
    const counterpartyAcc = t.creditor_account || t.debtor_account || null;
    const counterparty = (counterpartyObj || counterpartyAcc) ? {
      name: counterpartyObj?.name || null,
      iban: counterpartyAcc?.iban || counterpartyAcc?.other?.identification || null,
      city: counterpartyObj?.postal_address?.city || null,
      country: counterpartyObj?.postal_address?.country || null
    } : null;

    const mcc = t.merchant_category_code ? String(t.merchant_category_code) : null;
    const mccInfo = mcc ? getMccInfo(mcc) : null;

    const bankTransactionCode = t.bank_transaction_code ? {
      code: t.bank_transaction_code.code || undefined,
      subCode: t.bank_transaction_code.sub_code || undefined,
      description: t.bank_transaction_code.description || undefined
    } : null;

    const exchangeRate = t.exchange_rate ? {
      rate: t.exchange_rate.rate ? String(t.exchange_rate.rate) : undefined,
      sourceCurrency: t.exchange_rate.source_currency || undefined,
      sourceAmount: t.exchange_rate.source_amount ? String(t.exchange_rate.source_amount) : undefined,
      unitCurrency: t.exchange_rate.unit_currency || undefined
    } : null;

    const txDate = t.transaction_date || t.transaction_date_time || t.booking_date_time || t.value_date_time || null;
    const dates = (t.booking_date || t.value_date || txDate) ? {
      bookingDate: t.booking_date || null,
      valueDate: t.value_date || null,
      transactionDate: txDate
    } : null;

    const referenceNumber = t.reference_number || t.entry_reference || null;
    const remittanceInformation = Array.isArray(t.remittance_information) ? t.remittance_information : null;
    const note = t.note || null;

    return {
      balanceAfter,
      counterparty,
      mcc,
      mccInfo,
      bankTransactionCode,
      exchangeRate,
      dates,
      referenceNumber,
      remittanceInformation,
      note
    };
  } catch {
    return null;
  }
}

export async function queryTransactions(params: {
  accountId?: string;
  accountIds?: string;
  userId?: string;
  page?: number;
  limit?: number;
  from?: string;
  to?: string;
  period?: string;
  category?: string;
  type?: "all" | "income" | "expense" | "transfer";
}): Promise<TransactionsPaginatedResponse> {
  const accountId = params.accountId === "all" ? undefined : params.accountId;
  const selectedAccountIds = params.accountIds
    ? params.accountIds.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  const page = params.page ?? 1;
  const limit = Math.min(Math.max(params.limit ?? 50, 1), 200);
  const offset = (page - 1) * limit;
  const db = getDb();

  let resolvedFrom = params.from;
  let resolvedTo = params.to;

  if (params.period) {
    let cutoffDay = 1;
    if (params.userId) {
      const [userRow] = await db
        .select({ cutoffDay: users.cutoffDay })
        .from(users)
        .where(eq(users.id, params.userId))
        .limit(1);
      if (userRow?.cutoffDay !== undefined && userRow?.cutoffDay !== null) {
        const parsed = typeof userRow.cutoffDay === "number" ? userRow.cutoffDay : parseInt(String(userRow.cutoffDay), 10);
        if (!isNaN(parsed) && parsed >= 1 && parsed <= 31) {
          cutoffDay = parsed;
        }
      }
    }
    const cycleRange = BillingCycleService.getPeriodRange(params.period, cutoffDay);
    if (!resolvedFrom) resolvedFrom = cycleRange.from;
    if (!resolvedTo) resolvedTo = cycleRange.to;
  }

  if (resolvedFrom && isNaN(Date.parse(resolvedFrom))) {
    throw new BadRequestError("Invalid 'from' date format. Expected ISO8601 string or YYYY-MM-DD.");
  }
  if (resolvedTo && isNaN(Date.parse(resolvedTo))) {
    throw new BadRequestError("Invalid 'to' date format. Expected ISO8601 string or YYYY-MM-DD.");
  }

  if (accountId) {
    let accountExists = false;
    if (params.userId) {
      const [acc] = await db
        .select({ id: accounts.id })
        .from(accounts)
        .innerJoin(bankConnections, eq(accounts.connectionId, bankConnections.id))
        .where(and(eq(accounts.id, accountId), eq(bankConnections.userId, params.userId)))
        .limit(1);
      accountExists = !!acc;
    } else {
      const [acc] = await db
        .select({ id: accounts.id })
        .from(accounts)
        .where(eq(accounts.id, accountId))
        .limit(1);
      accountExists = !!acc;
    }

    if (!accountExists) {
      throw new NotFoundError(`Account with id '${accountId}' not found`);
    }
  }

  const filters = [];

  if (accountId) {
    filters.push(eq(transactions.accountId, accountId));
  } else if (selectedAccountIds.length > 0) {
    filters.push(inArray(transactions.accountId, selectedAccountIds));
    if (params.userId) {
      filters.push(eq(bankConnections.userId, params.userId));
    }
  } else if (params.userId) {
    filters.push(eq(bankConnections.userId, params.userId));
  }

  if (resolvedFrom) {
    const fromDateOnly = resolvedFrom.split("T")[0];
    filters.push(gte(transactions.bookedAt, fromDateOnly));
  }

  if (resolvedTo) {
    const toDateOnly = resolvedTo.split("T")[0];
    const toVal = `${toDateOnly}T23:59:59.999Z`;
    filters.push(or(lte(transactions.bookedAt, toVal), lte(transactions.bookedAt, toDateOnly))!);
  }

  if (params.category) {
    if (
      params.category === "__uncategorized__" ||
      params.category === "uncategorized" ||
      params.category.toLowerCase() === "sin categoría" ||
      params.category.toLowerCase() === "sin categoria" ||
      params.category === "none"
    ) {
      filters.push(or(isNull(transactions.category), eq(transactions.category, ""))!);
    } else {
      filters.push(sql`lower(${transactions.category}) = ${params.category.toLowerCase()}`);
    }
  }

  if (params.type && params.type !== "all") {
    if (params.type === "income") {
      filters.push(
        sql`CAST(${transactions.amount} AS REAL) > 0 AND (${transactions.isTransfer} = 0 OR ${transactions.isTransfer} IS NULL) AND (${transactions.category} IS NULL OR ${transactions.category} != 'Traspasos')`
      );
    } else if (params.type === "expense") {
      filters.push(
        sql`CAST(${transactions.amount} AS REAL) < 0 AND (${transactions.isTransfer} = 0 OR ${transactions.isTransfer} IS NULL) AND (${transactions.category} IS NULL OR ${transactions.category} != 'Traspasos')`
      );
    } else if (params.type === "transfer") {
      filters.push(
        sql`(${transactions.isTransfer} = 1 OR ${transactions.category} = 'Traspasos')`
      );
    }
  }

  const whereCondition = filters.length > 0 ? and(...filters) : undefined;

  const countQuery = db
    .select({ total: count() })
    .from(transactions)
    .innerJoin(accounts, eq(transactions.accountId, accounts.id))
    .innerJoin(bankConnections, eq(accounts.connectionId, bankConnections.id));

  const [countRes] = whereCondition
    ? await countQuery.where(whereCondition)
    : await countQuery;

  const total = countRes?.total ?? 0;

  const selectQuery = db
    .select({
      id: transactions.id,
      accountId: transactions.accountId,
      amount: transactions.amount,
      currency: transactions.currency,
      description: transactions.description,
      category: transactions.category,
      bookedAt: transactions.bookedAt,
      isTransfer: transactions.isTransfer,
      transferMatchId: transactions.transferMatchId,
      raw: transactions.raw,
      accountAlias: accounts.alias,
      iban: accounts.iban,
      bankName: bankConnections.bankName
    })
    .from(transactions)
    .innerJoin(accounts, eq(transactions.accountId, accounts.id))
    .innerJoin(bankConnections, eq(accounts.connectionId, bankConnections.id));

  const rows = whereCondition
    ? await selectQuery
        .where(whereCondition)
        .orderBy(desc(transactions.bookedAt), desc(transactions.id))
        .limit(limit)
        .offset(offset)
    : await selectQuery
        .orderBy(desc(transactions.bookedAt), desc(transactions.id))
        .limit(limit)
        .offset(offset);

  const data: TransactionResponse[] = rows.map((r) => ({
    id: r.id,
    accountId: r.accountId,
    accountAlias: r.accountAlias,
    bankName: r.bankName,
    iban: r.iban,
    amount: r.amount,
    currency: r.currency,
    description: r.description,
    category: r.category,
    bookedAt: r.bookedAt,
    isTransfer: r.isTransfer === true || (r.isTransfer as unknown) === 1,
    transferMatchId: r.transferMatchId,
    metadata: parseTransactionMetadata(r.raw)
  }));

  return {
    data,
    total,
    page,
    limit,
    hasMore: offset + data.length < total
  };
}

async function recalculateAccountBalance(accountId: string, db = getDb()): Promise<void> {
  const [cashAcc] = await db
    .select({ id: accounts.id, currency: accounts.currency })
    .from(accounts)
    .innerJoin(bankConnections, eq(accounts.connectionId, bankConnections.id))
    .where(and(eq(accounts.id, accountId), eq(bankConnections.aspspName, "cash")))
    .limit(1);

  if (!cashAcc) return;

  const txs = await db
    .select({ amount: transactions.amount })
    .from(transactions)
    .where(eq(transactions.accountId, accountId));

  let total = 0;
  for (const t of txs) {
    const num = parseFloat(t.amount);
    if (!isNaN(num)) total += num;
  }

  const balanceJson = JSON.stringify([{ amount: total.toFixed(2), currency: cashAcc.currency }]);
  await db
    .update(accounts)
    .set({ lastBalance: balanceJson, syncedAt: new Date().toISOString() })
    .where(eq(accounts.id, accountId));
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

// POST /transactions - Create a manual transaction (e.g. cash or manual entry)
transactionsRouter.post(
  "/",
  zValidator("json", CreateManualTransactionSchema, (result) => {
    if (!result.success) {
      const firstIssue = result.error.issues[0];
      const message = firstIssue ? `${firstIssue.path.join(".")}: ${firstIssue.message}` : "Invalid request body";
      throw new BadRequestError(message, result.error.issues);
    }
  }),
  async (c) => {
    const userId = c.get("userId");
    const body = c.req.valid("json");
    const db = getDb();

    // Verify account ownership
    const [acc] = await db
      .select({ id: accounts.id, alias: accounts.alias, bankName: bankConnections.bankName })
      .from(accounts)
      .innerJoin(bankConnections, eq(accounts.connectionId, bankConnections.id))
      .where(and(eq(accounts.id, body.accountId), eq(bankConnections.userId, userId)))
      .limit(1);

    if (!acc) {
      throw new NotFoundError(`Account with id '${body.accountId}' not found`);
    }

    const txId = `manual_${crypto.randomUUID()}`;
    const rawData = {
      entry_reference: txId,
      booking_date: body.bookedAt.split("T")[0],
      transaction_amount: {
        amount: body.amount,
        currency: body.currency
      },
      remittance_information: [body.description]
    };

    await db.insert(transactions).values({
      id: txId,
      sourceId: txId,
      accountId: body.accountId,
      amount: parseFloat(body.amount).toFixed(2),
      currency: body.currency,
      description: body.description,
      category: body.category || null,
      bookedAt: body.bookedAt,
      isTransfer: false,
      raw: JSON.stringify(rawData)
    });

    await recalculateAccountBalance(body.accountId, db);

    // Run transfer detection in background if needed
    try {
      const transferDetector = new TransferDetectionService();
      await transferDetector.detectAndMatchTransfers(userId);
    } catch {
      // Non-blocking warning
    }

    const [created] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, txId))
      .limit(1);

    return c.json(
      {
        data: {
          id: created!.id,
          accountId: created!.accountId,
          accountAlias: acc.alias,
          bankName: acc.bankName,
          amount: created!.amount,
          currency: created!.currency,
          description: created!.description,
          category: created!.category,
          bookedAt: created!.bookedAt,
          isTransfer: created!.isTransfer === true || (created!.isTransfer as unknown) === 1,
          metadata: parseTransactionMetadata(created!.raw)
        }
      },
      201
    );
  }
);

// PATCH /transactions/:id - Edit manual transaction
transactionsRouter.patch(
  "/:id",
  zValidator("json", UpdateManualTransactionSchema, (result) => {
    if (!result.success) {
      const firstIssue = result.error.issues[0];
      const message = firstIssue ? `${firstIssue.path.join(".")}: ${firstIssue.message}` : "Invalid request body";
      throw new BadRequestError(message, result.error.issues);
    }
  }),
  async (c) => {
    const userId = c.get("userId");
    const transactionId = c.req.param("id");
    const body = c.req.valid("json");
    const db = getDb();

    const [txRow] = await db
      .select({
        id: transactions.id,
        accountId: transactions.accountId,
        amount: transactions.amount,
        currency: transactions.currency,
        description: transactions.description,
        category: transactions.category,
        bookedAt: transactions.bookedAt
      })
      .from(transactions)
      .innerJoin(accounts, eq(transactions.accountId, accounts.id))
      .innerJoin(bankConnections, eq(accounts.connectionId, bankConnections.id))
      .where(and(eq(transactions.id, transactionId), eq(bankConnections.userId, userId)))
      .limit(1);

    if (!txRow) {
      throw new NotFoundError(`Transaction with id '${transactionId}' not found`);
    }

    const updates: Record<string, unknown> = {};
    if (body.amount !== undefined) updates.amount = parseFloat(body.amount).toFixed(2);
    if (body.currency !== undefined) updates.currency = body.currency;
    if (body.description !== undefined) updates.description = body.description;
    if (body.category !== undefined) updates.category = body.category;
    if (body.bookedAt !== undefined) updates.bookedAt = body.bookedAt;

    if (Object.keys(updates).length > 0) {
      await db.update(transactions).set(updates).where(eq(transactions.id, transactionId));
      await recalculateAccountBalance(txRow.accountId, db);
    }

    const [updated] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, transactionId))
      .limit(1);

    return c.json({
      data: {
        id: updated!.id,
        accountId: updated!.accountId,
        amount: updated!.amount,
        currency: updated!.currency,
        description: updated!.description,
        category: updated!.category,
        bookedAt: updated!.bookedAt,
        isTransfer: updated!.isTransfer === true || (updated!.isTransfer as unknown) === 1
      }
    });
  }
);

// DELETE /transactions/:id - Delete a manual transaction
transactionsRouter.delete("/:id", async (c) => {
  const userId = c.get("userId");
  const transactionId = c.req.param("id");
  const db = getDb();

  const [txRow] = await db
    .select({
      id: transactions.id,
      accountId: transactions.accountId
    })
    .from(transactions)
    .innerJoin(accounts, eq(transactions.accountId, accounts.id))
    .innerJoin(bankConnections, eq(accounts.connectionId, bankConnections.id))
    .where(and(eq(transactions.id, transactionId), eq(bankConnections.userId, userId)))
    .limit(1);

  if (!txRow) {
    throw new NotFoundError(`Transaction with id '${transactionId}' not found`);
  }

  await db.delete(transactions).where(eq(transactions.id, transactionId));
  await recalculateAccountBalance(txRow.accountId, db);

  return c.json({ success: true, id: transactionId });
});

// PATCH /transactions/:id/category - Atomically update transaction category with userId scoping
transactionsRouter.patch(
  "/:id/category",
  zValidator("json", UpdateCategoryBodySchema, (result) => {
    if (!result.success) {
      const firstIssue = result.error.issues[0];
      const message = firstIssue ? `${firstIssue.path.join(".")}: ${firstIssue.message}` : "Invalid body parameters";
      throw new BadRequestError(message, result.error.issues);
    }
  }),
  async (c) => {
    const userId = c.get("userId");
    const transactionId = c.req.param("id");
    const { categoryId } = c.req.valid("json");
    const db = getDb();

    const [txRow] = await db
      .select({
        id: transactions.id,
        amount: transactions.amount,
        currency: transactions.currency,
        description: transactions.description,
        category: transactions.category,
        bookedAt: transactions.bookedAt
      })
      .from(transactions)
      .innerJoin(accounts, eq(transactions.accountId, accounts.id))
      .innerJoin(bankConnections, eq(accounts.connectionId, bankConnections.id))
      .where(and(eq(transactions.id, transactionId), eq(bankConnections.userId, userId)))
      .limit(1);

    if (!txRow) {
      throw new NotFoundError(`Transaction with id '${transactionId}' not found`);
    }

    let categoryName: string | null = null;
    if (categoryId) {
      const [categoryRow] = await db
        .select({ id: categories.id, name: categories.name })
        .from(categories)
        .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
        .limit(1);

      if (!categoryRow) {
        throw new NotFoundError(`Category with id '${categoryId}' not found`);
      }
      categoryName = categoryRow.name;
    }

    const isTransfer = categoryName?.toLowerCase() === "traspasos" || categoryName?.toLowerCase() === "traspaso";

    await db
      .update(transactions)
      .set({
        category: categoryName,
        isTransfer
      })
      .where(eq(transactions.id, transactionId));

    return c.json({
      data: {
        id: txRow.id,
        amount: txRow.amount,
        currency: txRow.currency,
        description: txRow.description,
        category: categoryName,
        bookedAt: txRow.bookedAt,
        isTransfer
      }
    });
  }
);

// POST /transactions/:id/suggest-rule - Generate suggested regex pattern from transaction description
transactionsRouter.post("/:id/suggest-rule", async (c) => {
  const userId = c.get("userId");
  const transactionId = c.req.param("id");
  const db = getDb();

  const [txRow] = await db
    .select({
      id: transactions.id,
      description: transactions.description,
      category: transactions.category
    })
    .from(transactions)
    .innerJoin(accounts, eq(transactions.accountId, accounts.id))
    .innerJoin(bankConnections, eq(accounts.connectionId, bankConnections.id))
    .where(and(eq(transactions.id, transactionId), eq(bankConnections.userId, userId)))
    .limit(1);

  if (!txRow) {
    throw new NotFoundError(`Transaction with id '${transactionId}' not found`);
  }

  const { pattern, merchantName } = extractSuggestedPattern(txRow.description);

  return c.json({
    data: {
      transactionId: txRow.id,
      pattern,
      merchantName,
      description: txRow.description
    }
  });
});
