import {
  getDb,
  users,
  bankConnections,
  accounts,
  transactions,
  categories,
  eq,
  and,
  sql
} from "../src/db/index.js";
import { app } from "../src/app.js";
import { TransferDetectionService } from "../src/services/transfer-detection.js";

async function runTests() {
  console.log("=== Testing Internal Transfers, Accounts Management, Cash Account & Analytics ===");

  const db = getDb();
  const testEmail = `transfers_test_${Date.now()}@banky.local`;

  // 1. Setup test user
  const registerRes = await app.request("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: testEmail,
      password: "Password123!",
      name: "Feature Tester"
    })
  });
  const regJson = (await registerRes.json()) as { token: string; user: { id: string } };
  const token = regJson.token;
  const userId = regJson.user.id;
  const authHeader = { Authorization: `Bearer ${token}` };

  console.log("[1] User registered with token:", !!token);

  // 2. Setup 2 bank connections and accounts (Santander + Revolut)
  const connSantanderId = `conn_santander_${Date.now()}`;
  const connRevolutId = `conn_revolut_${Date.now()}`;
  const accSantanderId = `acc_santander_${Date.now()}`;
  const accRevolutId = `acc_revolut_${Date.now()}`;

  await db.insert(bankConnections).values([
    {
      id: connSantanderId,
      userId,
      bankName: "Banco Santander",
      aspspName: "santander_es",
      aspspCountry: "ES",
      sessionIdEnc: "dummy_enc_1",
      validUntil: "2099-12-31T23:59:59Z",
      status: "active"
    },
    {
      id: connRevolutId,
      userId,
      bankName: "Revolut",
      aspspName: "revolut_eu",
      aspspCountry: "GB",
      sessionIdEnc: "dummy_enc_2",
      validUntil: "2099-12-31T23:59:59Z",
      status: "active"
    }
  ]);

  await db.insert(accounts).values([
    {
      id: accSantanderId,
      connectionId: connSantanderId,
      iban: "ES9121000418450200051332",
      alias: "Cuenta Santander",
      currency: "EUR",
      lastBalance: JSON.stringify([{ amount: "1000.00", currency: "EUR" }]),
      isActive: true,
      syncedAt: "2026-08-20T10:00:00Z"
    },
    {
      id: accRevolutId,
      connectionId: connRevolutId,
      iban: "LT323250012345678901",
      alias: "Revolut Principal",
      currency: "EUR",
      lastBalance: JSON.stringify([{ amount: "500.00", currency: "EUR" }]),
      isActive: true,
      syncedAt: "2026-08-20T10:00:00Z"
    }
  ]);

  console.log("[2] Bank connections and accounts seeded.");

  // 3. Test GET /accounts -> Verify accounts returned with isActive=true and nickname=null
  const accountsRes = await app.request("/accounts", { method: "GET", headers: authHeader });
  const accountsList = (await accountsRes.json()) as Array<{ id: string; isActive: boolean; nickname: string | null }>;
  if (accountsList.length < 2 || !accountsList[0]!.isActive) {
    throw new Error(`Expected at least 2 active accounts, got ${JSON.stringify(accountsList)}`);
  }
  console.log("✓ GET /accounts returned correctly:", accountsList.length, "accounts.");

  // 4. Test PATCH /accounts/:id -> Update nickname & deactivate account
  const patchRes = await app.request(`/accounts/${accSantanderId}`, {
    method: "PATCH",
    headers: { ...authHeader, "Content-Type": "application/json" },
    body: JSON.stringify({
      nickname: "Santander Nómina",
      isActive: false
    })
  });
  const patchedAcc = (await patchRes.json()) as { id: string; nickname: string; isActive: boolean };
  if (patchedAcc.nickname !== "Santander Nómina" || patchedAcc.isActive !== false) {
    throw new Error(`PATCH /accounts/:id failed: ${JSON.stringify(patchedAcc)}`);
  }
  console.log("✓ PATCH /accounts/:id updated nickname and deactivated account successfully.");

  // 5. Test Total Balance excludes deactivated accounts
  const balRes1 = await app.request("/balance/total", { method: "GET", headers: authHeader });
  const balJson1 = (await balRes1.json()) as { EUR: string };
  if (balJson1.EUR !== "500.00") {
    throw new Error(`Expected EUR 500.00 (only Revolut active), got ${balJson1.EUR}`);
  }
  console.log("✓ GET /balance/total accurately excludes inactive accounts (Total EUR:", balJson1.EUR, ")");

  // Re-activate Santander account
  await app.request(`/accounts/${accSantanderId}`, {
    method: "PATCH",
    headers: { ...authHeader, "Content-Type": "application/json" },
    body: JSON.stringify({ isActive: true })
  });

  const balRes2 = await app.request("/balance/total", { method: "GET", headers: authHeader });
  const balJson2 = (await balRes2.json()) as { EUR: string };
  if (balJson2.EUR !== "1500.00") {
    throw new Error(`Expected EUR 1500.00 when both active, got ${balJson2.EUR}`);
  }
  console.log("✓ Reactivated account reflected in total balance:", balJson2.EUR);

  // 6. Test POST /accounts/cash -> Initialize Cash Account
  const cashRes = await app.request("/accounts/cash", { method: "POST", headers: authHeader });
  const cashAcc = (await cashRes.json()) as { id: string; bankName: string; lastBalance: { amount: string } };
  if (cashAcc.bankName !== "Efectivo" || cashAcc.lastBalance.amount !== "0.00") {
    throw new Error(`POST /accounts/cash failed: ${JSON.stringify(cashAcc)}`);
  }
  console.log("✓ POST /accounts/cash created cash account:", cashAcc.id);

  // 7. Test POST /transactions -> Manual Cash Transactions
  const manualTxRes1 = await app.request("/transactions", {
    method: "POST",
    headers: { ...authHeader, "Content-Type": "application/json" },
    body: JSON.stringify({
      accountId: cashAcc.id,
      amount: "50.00",
      currency: "EUR",
      description: "Extracción cajero / Efectivo disponible",
      category: null,
      bookedAt: "2026-08-25T12:00:00Z"
    })
  });
  if (manualTxRes1.status !== 201) {
    throw new Error(`POST /transactions failed: ${await manualTxRes1.text()}`);
  }

  const manualTxRes2 = await app.request("/transactions", {
    method: "POST",
    headers: { ...authHeader, "Content-Type": "application/json" },
    body: JSON.stringify({
      accountId: cashAcc.id,
      amount: "-12.50",
      currency: "EUR",
      description: "Cafetería y panadería",
      category: "Alimentación",
      bookedAt: "2026-08-25T14:30:00Z"
    })
  });
  if (manualTxRes2.status !== 201) {
    throw new Error(`POST /transactions failed: ${await manualTxRes2.text()}`);
  }

  // Verify updated Cash Balance
  const updatedCashAccRes = await app.request(`/accounts/${cashAcc.id}`, { method: "GET", headers: authHeader });
  const updatedCashAcc = (await updatedCashAccRes.json()) as { lastBalance: { amount: string } };
  if (updatedCashAcc.lastBalance.amount !== "37.50") {
    throw new Error(`Expected cash balance 37.50, got ${updatedCashAcc.lastBalance.amount}`);
  }
  console.log("✓ Manual cash transactions updated cash account balance automatically to:", updatedCashAcc.lastBalance.amount);

  // 8. Test Automatic Transfer Detection between Santander & Revolut
  const txOutId = `tx_out_${Date.now()}`;
  const txInId = `tx_in_${Date.now()}`;

  await db.insert(transactions).values([
    {
      id: txOutId,
      sourceId: "src_1",
      accountId: accSantanderId,
      amount: "-100.00",
      currency: "EUR",
      description: "Transferencia a Revolut LT323250012345678901",
      category: null,
      bookedAt: "2026-08-26T09:00:00Z",
      isTransfer: false,
      raw: JSON.stringify({
        booking_date: "2026-08-26",
        transaction_amount: { amount: "-100.00", currency: "EUR" }
      })
    },
    {
      id: txInId,
      sourceId: "src_2",
      accountId: accRevolutId,
      amount: "100.00",
      currency: "EUR",
      description: "Recarga de fondos desde Santander",
      category: null,
      bookedAt: "2026-08-26T09:05:00Z",
      isTransfer: false,
      raw: JSON.stringify({
        booking_date: "2026-08-26",
        transaction_amount: { amount: "100.00", currency: "EUR" }
      })
    }
  ]);

  const transferDetector = new TransferDetectionService();
  const detectionResult = await transferDetector.detectAndMatchTransfers(userId);
  if (detectionResult.matchedPairs < 1 || detectionResult.totalTransfersMarked < 2) {
    throw new Error(`Expected at least 1 matched pair, got ${JSON.stringify(detectionResult)}`);
  }
  console.log("✓ TransferDetectionService matched internal transfers pair successfully.");

  // Verify transactions in DB are marked isTransfer=true and category="Traspasos"
  const matchedTxs = await db
    .select({
      id: transactions.id,
      isTransfer: transactions.isTransfer,
      category: transactions.category,
      transferMatchId: transactions.transferMatchId
    })
    .from(transactions)
    .where(sql`${transactions.id} IN (${txOutId}, ${txInId})`);

  for (const tx of matchedTxs) {
    if (tx.isTransfer !== true || tx.category !== "Traspasos" || !tx.transferMatchId) {
      throw new Error(`Transaction ${tx.id} was not properly marked as transfer: ${JSON.stringify(tx)}`);
    }
  }
  console.log("✓ Both transactions categorized as 'Traspasos' and linked with transferMatchId.");

  // 9. Test Analytics Excludes Internal Transfers
  const analyticsRes = await app.request("/analytics/categories?period=2026-08", { method: "GET", headers: authHeader });
  const analytics = (await analyticsRes.json()) as { summary: { totalSpent: number } };
  // Expected total spent: only the 12.50 cash expense (the 100.00 transfer is excluded)
  if (analytics.summary.totalSpent !== 12.5) {
    throw new Error(`Expected totalSpent to be 12.50 (excluding transfer), got ${analytics.summary.totalSpent}`);
  }
  console.log("✓ /analytics/categories correctly excludes internal transfers from totalSpent:", analytics.summary.totalSpent);

  console.log("\n ALL TESTS PASSED SUCCESSFULLY! \n");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
