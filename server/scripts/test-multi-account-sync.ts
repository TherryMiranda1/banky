import dotenv from "dotenv";
dotenv.config();

import {
  getDb,
  bankConnections,
  accounts,
  transactions,
  eq,
  like
} from "../src/db/index.js";
import { encrypt } from "../src/services/crypto.js";
import { SyncService } from "../src/services/sync.js";
import {
  AspspInput,
  AspspItem,
  Balance,
  BankAccount,
  IBankingAdapter,
  SessionData,
  Transaction
} from "../src/core/ports/IBankingAdapter.js";

class MultiAccountCollisionMockAdapter implements IBankingAdapter {
  constructor(
    public accountsList: BankAccount[] = [
      { uid: "multi-acc-1", iban: "ES1111111111", currency: "EUR", name: "Cuenta 1" },
      { uid: "multi-acc-2", iban: "ES2222222222", currency: "EUR", name: "Cuenta 2" },
      { uid: "multi-acc-3", iban: "ES3333333333", currency: "EUR", name: "Cuenta 3" },
      { uid: "multi-acc-4", iban: "ES4444444444", currency: "EUR", name: "Cuenta 4 (Error)" }
    ],
    // All 3 healthy accounts return transactions that share the exact same transaction IDs ("tx-same-1", "tx-same-2")
    public txMap: Record<string, Transaction[]> = {
      "multi-acc-1": [
        { id: "tx-same-1", amount: "-10.00", currency: "EUR", bookedAt: "2025-08-01T10:00:00Z", description: "Acc 1 Tx 1" },
        { id: "tx-same-2", amount: "-20.00", currency: "EUR", bookedAt: "2025-08-02T10:00:00Z", description: "Acc 1 Tx 2" }
      ],
      "multi-acc-2": [
        { id: "tx-same-1", amount: "-30.00", currency: "EUR", bookedAt: "2025-08-01T11:00:00Z", description: "Acc 2 Tx 1 (Identical ID)" },
        { id: "tx-same-2", amount: "-40.00", currency: "EUR", bookedAt: "2025-08-02T11:00:00Z", description: "Acc 2 Tx 2 (Identical ID)" }
      ],
      "multi-acc-3": [
        { id: "tx-same-1", amount: "-50.00", currency: "EUR", bookedAt: "2025-08-01T12:00:00Z", description: "Acc 3 Tx 1 (Identical ID)" },
        { id: "tx-same-2", amount: "-60.00", currency: "EUR", bookedAt: "2025-08-02T12:00:00Z", description: "Acc 3 Tx 2 (Identical ID)" }
      ]
    }
  ) {}

  async getAspsps(_country?: string): Promise<AspspItem[]> { return []; }
  async startAuth(_input: AspspInput): Promise<{ url: string; authorizationId: string }> {
    return { url: "https://mock.bank/auth", authorizationId: "mock-auth-id" };
  }
  async completeAuth(_code: string): Promise<SessionData> {
    return { sessionId: "mock-session-id", validUntil: new Date(Date.now() + 86400000).toISOString(), accounts: this.accountsList };
  }
  async getAccounts(_sessionId: string): Promise<BankAccount[]> {
    return this.accountsList;
  }
  async getBalances(accountId: string, _sessionId: string): Promise<Balance[]> {
    if (accountId === "multi-acc-4") {
      throw new Error("404 Account not accessible on ASPSP");
    }
    return [{ amount: "100.00", currency: "EUR", type: "CLAV" }];
  }
  async getTransactions(accountId: string, _sessionId: string, _fromDate?: string): Promise<Transaction[]> {
    if (accountId === "multi-acc-4") {
      throw new Error("404 Account not accessible on ASPSP");
    }
    return this.txMap[accountId] || [];
  }
  async deleteSession(_sessionId: string): Promise<void> {}
}

async function runMultiAccountCollisionTest(): Promise<void> {
  console.log("=== Testing 4-Account Collision & Isolation Fix ===");

  const db = getDb();
  const connId = "conn-multi-acc-test";

  await db.delete(transactions).where(like(transactions.accountId, "multi-acc-%"));
  await db.delete(accounts).where(like(accounts.id, "multi-acc-%"));
  await db.delete(bankConnections).where(eq(bankConnections.id, connId));

  const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const now = new Date().toISOString();

  await db.insert(bankConnections).values({
    id: connId,
    bankName: "Banco Multi Cuentas",
    aspspName: "MultiBank",
    aspspCountry: "ES",
    sessionIdEnc: encrypt("mock-multi-session"),
    validUntil: futureDate,
    status: "active",
    createdAt: now
  });

  const adapter = new MultiAccountCollisionMockAdapter();
  const syncService = new SyncService(adapter, db);

  const result = await syncService.syncAll();
  console.log("Sync Result:", result);

  // Verification 1: Connection should be marked active and synced despite account 4 throwing 404
  if (result.synced !== 1) {
    throw new Error(`Expected connection to be synced, got synced=${result.synced}`);
  }

  // Verification 2: 3 accounts should have 2 transactions each = 6 total transactions saved
  if (result.transactions !== 6) {
    throw new Error(`Expected exactly 6 transactions across the 3 healthy accounts, got ${result.transactions}`);
  }

  // Verification 3: Check that all 3 accounts have their respective transactions in the DB
  for (const accId of ["multi-acc-1", "multi-acc-2", "multi-acc-3"]) {
    const accTxs = await db.select().from(transactions).where(eq(transactions.accountId, accId));
    if (accTxs.length !== 2) {
      throw new Error(`Expected account ${accId} to have 2 transactions, got ${accTxs.length}`);
    }
    console.log(`✓ Account ${accId} has ${accTxs.length} transactions with composite IDs:`, accTxs.map(t => t.id));
  }

  // Verification 4: Errors array should report the issue on account 4 without breaking the sync
  if (result.errors.length !== 1 || !result.errors[0].error.includes("multi-acc-4")) {
    throw new Error(`Expected error on multi-acc-4, got: ${JSON.stringify(result.errors)}`);
  }
  console.log("✓ Account 4 failure isolated safely:", result.errors[0]);

  // Clean up
  await db.delete(transactions).where(like(transactions.accountId, "multi-acc-%"));
  await db.delete(accounts).where(like(accounts.id, "multi-acc-%"));
  await db.delete(bankConnections).where(eq(bankConnections.id, connId));

  console.log("\n>>> ALL 4-ACCOUNT COLLISION & ISOLATION CHECKS PASSED! <<<");
}

runMultiAccountCollisionTest().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
