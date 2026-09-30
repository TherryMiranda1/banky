import { Hono } from "hono";
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
import { NotFoundError } from "../../errors/AppError.js";
import { requireAuth } from "../../middleware/auth.js";
import { ConnectionParamSchema } from "./accounts-types.js";
import { mapAccountRow } from "./accounts-helpers.js";
import { getBankingAdapter } from "../../core/infra/adapterFactory.js";
import { decrypt } from "../../services/crypto.js";

export const connectionsRouter = new Hono();

connectionsRouter.use("*", requireAuth);

connectionsRouter.get("/", async (c) => {
  const userId = c.get("userId");
  const db = getDb();

  const userConnections = await db
    .select({
      id: bankConnections.id,
      bankName: bankConnections.bankName,
      aspspName: bankConnections.aspspName,
      aspspCountry: bankConnections.aspspCountry,
      logoUrl: bankConnections.logoUrl,
      status: bankConnections.status,
      validUntil: bankConnections.validUntil,
      createdAt: bankConnections.createdAt
    })
    .from(bankConnections)
    .where(eq(bankConnections.userId, userId))
    .orderBy(desc(bankConnections.createdAt));

  const allAccounts = await db
    .select({
      id: accounts.id,
      connectionId: accounts.connectionId,
      isActive: accounts.isActive
    })
    .from(accounts)
    .innerJoin(bankConnections, eq(accounts.connectionId, bankConnections.id))
    .where(eq(bankConnections.userId, userId));

  const result = userConnections.map((conn) => {
    const connAccounts = allAccounts.filter((a) => a.connectionId === conn.id);
    const activeCount = connAccounts.filter(
      (a) => a.isActive !== false
    ).length;

    return {
      id: conn.id,
      bankName: conn.bankName,
      aspspName: conn.aspspName,
      aspspCountry: conn.aspspCountry,
      logoUrl: conn.logoUrl,
      status: conn.status,
      validUntil: conn.validUntil,
      createdAt: conn.createdAt,
      accountsCount: connAccounts.length,
      activeAccountsCount: activeCount
    };
  });

  return c.json(result);
});

connectionsRouter.get("/:connectionId", zValidator("param", ConnectionParamSchema), async (c) => {
  const { connectionId } = c.req.valid("param");
  const userId = c.get("userId");
  const db = getDb();

  const [conn] = await db
    .select({
      id: bankConnections.id,
      bankName: bankConnections.bankName,
      aspspName: bankConnections.aspspName,
      logoUrl: bankConnections.logoUrl,
      status: bankConnections.status,
      validUntil: bankConnections.validUntil
    })
    .from(bankConnections)
    .where(and(eq(bankConnections.id, connectionId), eq(bankConnections.userId, userId)))
    .limit(1);

  if (!conn) {
    throw new NotFoundError(`Bank connection '${connectionId}' not found`);
  }

  const rows = await db
    .select({
      id: accounts.id,
      connectionId: accounts.connectionId,
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
    .where(and(eq(accounts.connectionId, connectionId), eq(bankConnections.userId, userId)))
    .orderBy(asc(accounts.position), desc(accounts.syncedAt), asc(accounts.id));

  return c.json({
    connection: conn,
    accounts: rows.map(mapAccountRow)
  });
});

connectionsRouter.delete("/:connectionId", zValidator("param", ConnectionParamSchema), async (c) => {
  const { connectionId } = c.req.valid("param");
  const userId = c.get("userId");
  const db = getDb();

  const [conn] = await db
    .select({
      id: bankConnections.id,
      sessionIdEnc: bankConnections.sessionIdEnc
    })
    .from(bankConnections)
    .where(and(eq(bankConnections.id, connectionId), eq(bankConnections.userId, userId)))
    .limit(1);

  if (!conn) {
    throw new NotFoundError(`Bank connection '${connectionId}' not found`);
  }

  try {
    const adapter = getBankingAdapter();
    const sessionId = decrypt(conn.sessionIdEnc);
    await adapter.deleteSession(sessionId);
  } catch (adapterErr) {
    console.warn(`[Connections] Could not delete session in adapter for connection ${connectionId}:`, adapterErr);
  }

  await db.delete(bankConnections).where(eq(bankConnections.id, connectionId));

  return c.json({
    success: true,
    connectionId
  });
});
