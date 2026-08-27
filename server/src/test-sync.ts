import dotenv from "dotenv";
dotenv.config();

import { getDatabase } from "./db/index.js";
import { encrypt } from "./services/crypto.js";
import { createAuthToken } from "./services/jwt.js";
import { SyncService } from "./services/sync.js";
import { app } from "./index.js";
import {
  AspspInput,
  AspspItem,
  Balance,
  BankAccount,
  IBankingAdapter,
  SessionData,
  Transaction
} from "./core/ports/IBankingAdapter.js";
import { UnauthorizedError } from "./errors/AppError.js";

class MockBankingAdapter implements IBankingAdapter {
  constructor(
    public shouldFailAuth: boolean = false,
    public accounts: BankAccount[] = [
      { uid: "mock-acc-1", iban: "ES1234567890", currency: "EUR", name: "Cuenta Corriente" },
      { uid: "mock-acc-2", iban: "ES0987654321", currency: "EUR", name: "Cuenta Ahorro" }
    ],
    public balances: Record<string, Balance[]> = {
      "mock-acc-1": [{ amount: "1500.50", currency: "EUR", type: "expected" }],
      "mock-acc-2": [{ amount: "1500.50", currency: "EUR", type: "expected" }]
    },
    public transactions: Record<string, Transaction[]> = {
      "mock-acc-1": [
        { id: "tx-1", amount: "-50.00", currency: "EUR", bookedAt: "2025-08-01T10:00:00Z", description: "Supermarket" },
        { id: "tx-2", amount: "1000.00", currency: "EUR", bookedAt: "2025-08-02T12:00:00Z", description: "Payroll" }
      ],
      "mock-acc-2": [
        { id: "tx-3", amount: "-15.00", currency: "EUR", bookedAt: "2025-08-03T14:00:00Z", description: "Coffee" },
        { id: "tx-4", amount: "200.00", currency: "EUR", bookedAt: "2025-08-04T16:00:00Z", description: "Transfer" }
      ]
    }
  ) {}

  async getAspsps(_country?: string): Promise<AspspItem[]> {
    return [];
  }

  async startAuth(_input: AspspInput): Promise<{ url: string; authorizationId: string }> {
    return { url: "https://mock.bank/auth", authorizationId: "mock-auth-id" };
  }

  async completeAuth(_code: string): Promise<SessionData> {
    return {
      sessionId: "mock-session-id",
      validUntil: new Date(Date.now() + 86400000).toISOString(),
      accounts: this.accounts
    };
  }

  async getAccounts(_sessionId: string): Promise<BankAccount[]> {
    if (this.shouldFailAuth) {
      throw new UnauthorizedError("Session expired on bank server");
    }
    return this.accounts;
  }

  async getBalances(accountId: string, _sessionId: string): Promise<Balance[]> {
    if (this.shouldFailAuth) {
      throw new UnauthorizedError("Session expired on bank server");
    }
    return this.balances[accountId] || [{ amount: "0.00", currency: "EUR" }];
  }

  async getTransactions(accountId: string, _sessionId: string, _fromDate?: string): Promise<Transaction[]> {
    if (this.shouldFailAuth) {
      throw new UnauthorizedError("Session expired on bank server");
    }
    return this.transactions[accountId] || [];
  }

  async deleteSession(_sessionId: string): Promise<void> {}
}

async function runVerification(): Promise<void> {
  console.log("=== Starting Hito 3 Sync & Cache Verification ===");

  const db = getDatabase();

  const conn1Id = "conn-sync-test-1";
  const conn2Id = "conn-sync-test-expired";
  const conn3Id = "conn-sync-test-unauthorized";

  await db.execute("DELETE FROM transactions");
  await db.execute("DELETE FROM accounts");
  await db.execute("DELETE FROM bank_connections");

  const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const pastDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();

  await db.execute(
    `INSERT INTO bank_connections (id, bank_name, aspsp_name, aspsp_country, session_id_enc, valid_until, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'active', datetime('now'))`,
    [conn1Id, "Banco Santander", "Santander", "ES", encrypt("mock-active-session-id"), futureDate]
  );

  await db.execute(
    `INSERT INTO bank_connections (id, bank_name, aspsp_name, aspsp_country, session_id_enc, valid_until, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'active', datetime('now'))`,
    [conn2Id, "Banco Pasado", "Pasado", "ES", encrypt("mock-past-session-id"), pastDate]
  );

  console.log("[1] Testing SyncService.syncAll() with active & expired connections...");
  const mockAdapter = new MockBankingAdapter();
  const syncService = new SyncService(mockAdapter, db);

  const result1 = await syncService.syncAll();
  console.log("Sync result 1:", result1);

  if (result1.synced !== 1) {
    throw new Error(`Expected 1 active synced connection, got ${result1.synced}`);
  }
  if (result1.accounts !== 2) {
    throw new Error(`Expected 2 accounts, got ${result1.accounts}`);
  }
  if (result1.transactions !== 4) {
    throw new Error(`Expected 4 transactions (2 per account), got ${result1.transactions}`);
  }

  const expiredConn = await db.queryOne<{ status: string }>(
    "SELECT status FROM bank_connections WHERE id = ?",
    [conn2Id]
  );
  if (!expiredConn || expiredConn.status !== "expired") {
    throw new Error(`Expected past connection to be marked expired, got: ${expiredConn?.status}`);
  }
  console.log("✓ Past connection marked as expired automatically.");

  console.log("[2] Testing Idempotency (second sync run should not duplicate transactions)...");
  const countBefore = (await db.queryOne<{ count: number }>("SELECT COUNT(*) as count FROM transactions"))?.count ?? 0;

  const result2 = await syncService.syncAll();
  console.log("Sync result 2:", result2);

  const countAfter = (await db.queryOne<{ count: number }>("SELECT COUNT(*) as count FROM transactions"))?.count ?? 0;

  if (countBefore !== countAfter) {
    throw new Error(`Idempotency failure: transaction count changed from ${countBefore} to ${countAfter}`);
  }
  if (result2.transactions !== 0) {
    throw new Error(`Expected 0 newly inserted transactions on second run, got ${result2.transactions}`);
  }
  console.log("✓ Idempotency verified: duplicate transactions were ignored.");

  console.log("[3] Testing balance & synced_at persistence...");
  const accRows = await db.query<{ id: string; last_balance: string | null; synced_at: string | null }>(
    "SELECT id, last_balance, synced_at FROM accounts WHERE id IN ('mock-acc-1', 'mock-acc-2')"
  );
  for (const acc of accRows) {
    if (!acc.last_balance || !acc.synced_at) {
      throw new Error(`Account ${acc.id} has missing last_balance or synced_at`);
    }
    const parsedBalance = JSON.parse(acc.last_balance);
    if (!Array.isArray(parsedBalance) || parsedBalance[0].amount !== "1500.50") {
      throw new Error(`Account ${acc.id} balance data unexpected: ${acc.last_balance}`);
    }
  }
  console.log("✓ Account balances and timestamps verified.");

  console.log("[4] Testing 401/403 handling (session expired on bank)...");
  await db.execute(
    `INSERT INTO bank_connections (id, bank_name, aspsp_name, aspsp_country, session_id_enc, valid_until, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'active', datetime('now'))`,
    [conn3Id, "Banco Error", "ErrorBank", "ES", encrypt("mock-error-session-id"), futureDate]
  );

  const failingAdapter = new MockBankingAdapter(true);
  const failingSyncService = new SyncService(failingAdapter, db);
  const failResult = await failingSyncService.syncAll();
  console.log("Fail sync result:", failResult);

  const errorConn = await db.queryOne<{ status: string }>(
    "SELECT status FROM bank_connections WHERE id = ?",
    [conn3Id]
  );
  if (!errorConn || errorConn.status !== "expired") {
    throw new Error(`Expected connection with 401 to be marked expired, got: ${errorConn?.status}`);
  }
  if (failResult.errors.length === 0) {
    throw new Error("Expected errors array to contain failed connection details");
  }
  console.log("✓ Unauthorized 401 connection marked expired and error collected without crashing.");

  console.log("[5] Testing POST /sync endpoint via Hono request...");
  const testToken = await createAuthToken({ id: "test-user-sync", email: "test-sync@example.com", name: "Sync User" });
  const httpRes = await app.request("/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${testToken}` },
    body: JSON.stringify({})
  });

  if (httpRes.status !== 200) {
    throw new Error(`Expected status 200 on POST /sync, got ${httpRes.status}`);
  }
  const httpBody = (await httpRes.json()) as {
    synced: unknown;
    accounts: unknown;
    transactions: unknown;
    errors: unknown;
  };
  if (typeof httpBody.synced !== "number" || typeof httpBody.accounts !== "number" || !Array.isArray(httpBody.errors)) {
    throw new Error(`Unexpected POST /sync response structure: ${JSON.stringify(httpBody)}`);
  }
  console.log("✓ POST /sync response validated:", httpBody);

  await db.execute("DELETE FROM transactions WHERE account_id LIKE 'mock-acc-%'");
  await db.execute("DELETE FROM accounts WHERE id LIKE 'mock-acc-%'");
  await db.execute("DELETE FROM bank_connections WHERE id IN (?, ?, ?)", [conn1Id, conn2Id, conn3Id]);

  console.log("\n>>> ALL CRITERIA FOR HITO 3 VERIFIED SUCCESSFULLY! <<<");
}

runVerification().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
