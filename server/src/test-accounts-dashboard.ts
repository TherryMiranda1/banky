import dotenv from "dotenv";
dotenv.config();

import { getDatabase } from "./db/index.js";
import { app } from "./index.js";
import { encrypt } from "./services/crypto.js";
import { createAuthToken } from "./services/jwt.js";

async function runTest(): Promise<void> {
  console.log("=== Testing Hito 4 Backend Endpoints ===");

  const testUserId = "test-user-dash";
  const testToken = await createAuthToken({ id: testUserId, email: "dash@example.com", name: "Dash User" });
  const authHeader = { Authorization: `Bearer ${testToken}` };

  const db = getDatabase();

  const conn1Id = "conn-dash-test-1";
  const conn2Id = "conn-dash-test-2";
  const connExpiredId = "conn-dash-test-expired";

  await db.execute("DELETE FROM transactions WHERE account_id LIKE 'dash-acc-%'");
  await db.execute("DELETE FROM accounts WHERE id LIKE 'dash-acc-%'");
  await db.execute("DELETE FROM bank_connections WHERE id IN (?, ?, ?)", [conn1Id, conn2Id, connExpiredId]);

  console.log("[1] Testing GET /accounts with empty DB or no matched accounts...");
  const resEmpty = await app.request("/accounts", { method: "GET", headers: authHeader });
  if (resEmpty.status !== 200) {
    throw new Error(`Expected 200 on empty /accounts, got ${resEmpty.status}`);
  }
  const emptyJson = await resEmpty.json();
  if (!Array.isArray(emptyJson)) {
    throw new Error("Expected array response on /accounts");
  }
  console.log("✓ Empty GET /accounts returns 200 array:", emptyJson.length, "items.");

  console.log("[2] Populating mock bank_connections and accounts (EUR and GBP)...");
  const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  await db.execute(
    `INSERT INTO bank_connections (id, user_id, bank_name, aspsp_name, aspsp_country, session_id_enc, valid_until, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'active', datetime('now'))`,
    [conn1Id, testUserId, "Banco Santander", "Santander", "ES", encrypt("mock-sess-1"), futureDate]
  );

  await db.execute(
    `INSERT INTO bank_connections (id, user_id, bank_name, aspsp_name, aspsp_country, session_id_enc, valid_until, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'active', datetime('now'))`,
    [conn2Id, testUserId, "Revolut", "Revolut", "GB", encrypt("mock-sess-2"), futureDate]
  );

  await db.execute(
    `INSERT INTO bank_connections (id, user_id, bank_name, aspsp_name, aspsp_country, session_id_enc, valid_until, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'expired', datetime('now'))`,
    [connExpiredId, testUserId, "Old Bank", "OldBank", "ES", encrypt("mock-sess-3"), futureDate]
  );

  await db.execute(
    `INSERT INTO accounts (id, connection_id, iban, alias, currency, last_balance, synced_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      "dash-acc-1",
      conn1Id,
      "ES9121000418450200051332",
      "Cuenta Nómina",
      "EUR",
      JSON.stringify([{ amount: "2500.50", currency: "EUR", type: "CLAV" }]),
      new Date().toISOString()
    ]
  );

  await db.execute(
    `INSERT INTO accounts (id, connection_id, iban, alias, currency, last_balance, synced_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      "dash-acc-2",
      conn2Id,
      "GB29REVO00998812345678",
      "Revolut Main",
      "GBP",
      JSON.stringify([{ amount: "1250.75", currency: "GBP", type: "CLAV" }]),
      new Date().toISOString()
    ]
  );

  await db.execute(
    `INSERT INTO accounts (id, connection_id, iban, alias, currency, last_balance, synced_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      "dash-acc-3",
      connExpiredId,
      "ES0000000000000000000000",
      "Expired Account",
      "EUR",
      JSON.stringify([{ amount: "500.00", currency: "EUR", type: "CLAV" }]),
      new Date().toISOString()
    ]
  );

  console.log("[3] Testing GET /accounts with populated data...");
  const resAccounts = await app.request("/accounts", { method: "GET", headers: authHeader });
  if (resAccounts.status !== 200) {
    throw new Error(`Expected 200 on /accounts, got ${resAccounts.status}`);
  }
  const accountsJson = (await resAccounts.json()) as Array<{
    id: string;
    alias: string | null;
    bankName: string;
    iban: string | null;
    currency: string;
    lastBalance: { amount: string; currency: string } | null;
    syncedAt: string | null;
    status: string;
  }>;

  if (accountsJson.length < 3) {
    throw new Error(`Expected at least 3 accounts, got ${accountsJson.length}`);
  }

  const acc1 = accountsJson.find((a) => a.id === "dash-acc-1");
  if (!acc1 || acc1.bankName !== "Banco Santander" || acc1.lastBalance?.amount !== "2500.50" || acc1.status !== "active") {
    throw new Error(`Account 1 unexpected shape: ${JSON.stringify(acc1)}`);
  }
  console.log("✓ GET /accounts returns properly shaped accounts:", accountsJson.length);

  console.log("[4] Testing GET /accounts/:id...");
  const resAcc1 = await app.request("/accounts/dash-acc-1", { method: "GET", headers: authHeader });
  if (resAcc1.status !== 200) {
    throw new Error(`Expected 200 on /accounts/dash-acc-1, got ${resAcc1.status}`);
  }
  const acc1Data = (await resAcc1.json()) as { id: string };
  if (acc1Data.id !== "dash-acc-1") {
    throw new Error(`Account id mismatch: ${JSON.stringify(acc1Data)}`);
  }
  console.log("✓ GET /accounts/:id returns single account.");

  console.log("[5] Testing GET /accounts/:id with non-existent id (404)...");
  const resAcc404 = await app.request("/accounts/non-existent-id-999", { method: "GET", headers: authHeader });
  if (resAcc404.status !== 404) {
    throw new Error(`Expected 404 on non-existent account, got ${resAcc404.status}`);
  }
  console.log("✓ GET /accounts/non-existent returns 404 AppError.");

  console.log("[6] Testing GET /balance/total (active connections only)...");
  const resBalance = await app.request("/balance/total", { method: "GET", headers: authHeader });
  if (resBalance.status !== 200) {
    throw new Error(`Expected 200 on /balance/total, got ${resBalance.status}`);
  }
  const balanceJson = (await resBalance.json()) as Record<string, string>;
  console.log("Balance total response:", balanceJson);

  if (balanceJson.EUR !== "2500.50") {
    throw new Error(`Expected EUR balance 2500.50 (excluding expired account 500.00), got ${balanceJson.EUR}`);
  }
  if (balanceJson.GBP !== "1250.75") {
    throw new Error(`Expected GBP balance 1250.75, got ${balanceJson.GBP}`);
  }
  console.log("✓ GET /balance/total correctly calculates totals grouped by currency for active connections only.");

  await db.execute("DELETE FROM accounts WHERE id LIKE 'dash-acc-%'");
  await db.execute("DELETE FROM bank_connections WHERE id IN (?, ?, ?)", [conn1Id, conn2Id, connExpiredId]);

  console.log("\n>>> ALL BACKEND HITO 4 ENDPOINTS VERIFIED SUCCESSFULLY! <<<");
}

runTest().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
