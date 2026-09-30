import { Hono } from "hono";
import crypto from "node:crypto";
import {
  getDb,
  accounts,
  bankConnections,
  eq,
  and
} from "../../db/index.js";
import { requireAuth } from "../../middleware/auth.js";
import { encrypt } from "../../services/crypto.js";
import { mapAccountRow } from "./accounts-helpers.js";

export const cashRouter = new Hono();

cashRouter.use("*", requireAuth);

cashRouter.post("/", async (c) => {
  const userId = c.get("userId");
  const db = getDb();

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
      sessionIdEnc: encrypt("manual-cash-vault"),
      validUntil: "2099-12-31T23:59:59Z",
      status: "active"
    });
    cashConn = { id: connId };
  }

  let [cashAccount] = await db
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
      connectionId: cashConn.id,
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
