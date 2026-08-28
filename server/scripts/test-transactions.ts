import dotenv from "dotenv";
dotenv.config();

import {
  getDb,
  bankConnections,
  accounts,
  transactions,
  eq
} from "../src/db/index.js";
import { app } from "../src/index.js";
import { encrypt } from "../src/services/crypto.js";
import { createAuthToken } from "../src/services/jwt.js";

async function runTest(): Promise<void> {
  console.log("=== Testing Hito 5 Transactions Backend Endpoints ===");

  const testUserId = "test-user-tx";
  const testToken = await createAuthToken({ id: testUserId, email: "tx@example.com", name: "Tx User" });
  const authHeader = { Authorization: `Bearer ${testToken}` };

  const db = getDb();

  const connId = "conn-tx-test-1";
  const accId = "acc-tx-test-1";

  // Clean test fixtures
  await db.delete(transactions).where(eq(transactions.accountId, accId));
  await db.delete(accounts).where(eq(accounts.id, accId));
  await db.delete(bankConnections).where(eq(bankConnections.id, connId));

  // Setup connection and account
  const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const now = new Date().toISOString();

  await db.insert(bankConnections).values({
    id: connId,
    userId: testUserId,
    bankName: "Banco Santander",
    aspspName: "Santander",
    aspspCountry: "ES",
    sessionIdEnc: encrypt("mock-sess-tx"),
    validUntil: futureDate,
    status: "active",
    createdAt: now
  });

  await db.insert(accounts).values({
    id: accId,
    connectionId: connId,
    iban: "ES9121000418450200051332",
    alias: "Cuenta Principal",
    currency: "EUR",
    lastBalance: JSON.stringify([{ amount: "3450.00", currency: "EUR" }]),
    syncedAt: now
  });

  const mockTxs = [
    { id: "tx-1", amount: "-45.20", currency: "EUR", desc: "Mercadona", cat: "Groceries", date: "2025-08-26T10:15:00.000Z" },
    { id: "tx-2", amount: "2500.00", currency: "EUR", desc: "Nomina Empresa", cat: "Income", date: "2025-08-25T08:00:00.000Z" },
    { id: "tx-3", amount: "-12.99", currency: "EUR", desc: "Netflix Subscription", cat: "Entertainment", date: "2025-08-20T14:30:00.000Z" },
    { id: "tx-4", amount: "-60.00", currency: "EUR", desc: "Repsol Gasolinera", cat: "Transport", date: "2025-08-15T18:45:00.000Z" },
    { id: "tx-5", amount: "-3.50", currency: "EUR", desc: "Cafe Central", cat: "Dining", date: "2025-08-10T09:00:00.000Z" },
    { id: "tx-6", amount: "-120.00", currency: "EUR", desc: "Iberdrola Luz", cat: "Utilities", date: "2025-07-28T11:20:00.000Z" },
    { id: "tx-7", amount: "150.00", currency: "EUR", desc: "Bizum Juan", cat: "Transfer", date: "2025-07-25T16:10:00.000Z" },
    { id: "tx-8", amount: "-35.00", currency: "EUR", desc: "Farmacia San Rafael", cat: "Health", date: "2025-07-15T12:00:00.000Z" },
    { id: "tx-9", amount: "-80.50", currency: "EUR", desc: "Carrefour Market", cat: "Groceries", date: "2025-07-02T19:30:00.000Z" },
    { id: "tx-10", amount: "-15.00", currency: "EUR", desc: "Spotify Family", cat: "Entertainment", date: "2025-06-28T04:00:00.000Z" }
  ];

  for (let i = 11; i <= 25; i++) {
    mockTxs.push({
      id: `tx-${i}`,
      amount: `-${(i * 4.5).toFixed(2)}`,
      currency: "EUR",
      desc: `Historic Merchant ${i}`,
      cat: i % 2 === 0 ? "Groceries" : "Shopping",
      date: `2025-05-${String(i).padStart(2, "0")}T10:00:00.000Z`
    });
  }

  for (const tx of mockTxs) {
    await db.insert(transactions).values({
      id: tx.id,
      accountId: accId,
      amount: tx.amount,
      currency: tx.currency,
      description: tx.desc,
      category: tx.cat,
      bookedAt: tx.date,
      raw: JSON.stringify(tx)
    });
  }

  console.log(`✓ Inserted ${mockTxs.length} test transactions.`);

  // Test 1: Query without accountId -> 200 (all user transactions in global view)
  console.log("[1] Testing GET /transactions without accountId -> 200 (all user transactions)...");
  const resNoAcc = await app.request("/transactions", { method: "GET", headers: authHeader });
  if (resNoAcc.status !== 200) {
    throw new Error(`Expected 200 for global view, got ${resNoAcc.status}`);
  }
  const jsonNoAcc = (await resNoAcc.json()) as { total: number };
  if (jsonNoAcc.total !== 25) {
    throw new Error(`Expected 25 transactions in global view, got ${jsonNoAcc.total}`);
  }
  console.log("✓ Correctly returned all user transactions on global view without accountId");

  // Test 2: Nonexistent accountId -> 404
  console.log("[2] Testing GET /transactions with nonexistent accountId -> 404...");
  const resNonExistent = await app.request("/transactions?accountId=nonexistent-id", { method: "GET", headers: authHeader });
  if (resNonExistent.status !== 404) {
    throw new Error(`Expected 404 for nonexistent accountId, got ${resNonExistent.status}`);
  }
  console.log("✓ Correctly returned 404 on nonexistent accountId");

  // Test 3: Pagination defaults (limit=50, page=1)
  console.log("[3] Testing GET /transactions default pagination...");
  const resDefault = await app.request(`/transactions?accountId=${accId}`, { method: "GET", headers: authHeader });
  if (resDefault.status !== 200) {
    throw new Error(`Expected 200, got ${resDefault.status}`);
  }
  const jsonDefault = (await resDefault.json()) as { total: number; data: Array<{ id: string }>; hasMore: boolean };
  if (jsonDefault.total !== 25 || jsonDefault.data.length !== 25 || jsonDefault.hasMore !== false) {
    throw new Error(`Unexpected default pagination response: ${JSON.stringify(jsonDefault)}`);
  }
  console.log(`✓ Returned all ${jsonDefault.total} items when limit (50) > total`);

  // Test 4: Custom limit and pages
  console.log("[4] Testing pagination pages and limit (page=1&limit=5 vs page=2&limit=5)...");
  const resPage1 = await app.request(`/transactions?accountId=${accId}&page=1&limit=5`, { method: "GET", headers: authHeader });
  const jsonPage1 = (await resPage1.json()) as { total: number; data: Array<{ id: string }>; page: number; limit: number; hasMore: boolean };
  if (jsonPage1.data.length !== 5 || jsonPage1.page !== 1 || jsonPage1.limit !== 5 || !jsonPage1.hasMore) {
    throw new Error(`Page 1 pagination failed: ${JSON.stringify(jsonPage1)}`);
  }

  const resPage2 = await app.request(`/transactions?accountId=${accId}&page=2&limit=5`, { method: "GET", headers: authHeader });
  const jsonPage2 = (await resPage2.json()) as { total: number; data: Array<{ id: string }>; page: number; limit: number };
  if (jsonPage2.data.length !== 5 || jsonPage2.page !== 2 || jsonPage2.limit !== 5) {
    throw new Error(`Page 2 pagination failed: ${JSON.stringify(jsonPage2)}`);
  }

  const page1Ids = jsonPage1.data.map((d: { id: string }) => d.id);
  const page2Ids = jsonPage2.data.map((d: { id: string }) => d.id);
  const overlap = page1Ids.some((id: string) => page2Ids.includes(id));
  if (overlap) {
    throw new Error(`Page 1 and Page 2 contain duplicate IDs: ${page1Ids} vs ${page2Ids}`);
  }
  console.log("✓ Pages 1 & 2 return distinct sliced records without overlap.");

  // Test 5: Date filter (from & to)
  console.log("[5] Testing date range filter (2025-08-01 to 2025-08-31)...");
  const resAug = await app.request(`/transactions?accountId=${accId}&from=2025-08-01&to=2025-08-31`, { method: "GET", headers: authHeader });
  const jsonAug = (await resAug.json()) as { total: number; data: Array<{ id: string }> };
  if (jsonAug.total !== 5) {
    throw new Error(`Expected 5 transactions in August, got ${jsonAug.total}`);
  }
  console.log(`✓ Filter returned exactly ${jsonAug.total} August transactions.`);

  // Test 6: Category filter
  console.log("[6] Testing category filter (category=Groceries)...");
  const resCat = await app.request(`/transactions?accountId=${accId}&category=Groceries`, { method: "GET", headers: authHeader });
  const jsonCat = (await resCat.json()) as { total: number; data: Array<{ category: string }> };
  const nonGroceries = jsonCat.data.filter((d: { category: string }) => d.category !== "Groceries");
  if (nonGroceries.length > 0 || jsonCat.total === 0) {
    throw new Error(`Category filter returned invalid records: ${JSON.stringify(nonGroceries)}`);
  }
  console.log(`✓ Category filter returned ${jsonCat.total} records matching 'Groceries'.`);

  // Test 7: Alias endpoint GET /accounts/:id/transactions
  console.log("[7] Testing alias endpoint GET /accounts/:id/transactions...");
  const resAlias = await app.request(`/accounts/${accId}/transactions?limit=10`, { method: "GET", headers: authHeader });
  if (resAlias.status !== 200) {
    throw new Error(`Expected 200 on alias, got ${resAlias.status}`);
  }
  const jsonAlias = (await resAlias.json()) as { total: number; data: Array<{ id: string }> };
  if (jsonAlias.data.length !== 10 || jsonAlias.total !== 25) {
    throw new Error(`Alias failed: ${JSON.stringify(jsonAlias)}`);
  }
  console.log("✓ Alias /accounts/:id/transactions behaves identically.");

  // Test 8: Multi-account filter (accountIds=id1,id2) (Hito 13)
  console.log("[8] Testing multi-account filter GET /transactions?accountIds=...");
  const accId2 = "acc-tx-test-2";
  await db.delete(transactions).where(eq(transactions.accountId, accId2));
  await db.delete(accounts).where(eq(accounts.id, accId2));
  await db.insert(accounts).values({
    id: accId2,
    connectionId: connId,
    iban: "ES9121000418450200059999",
    alias: "Cuenta Secundaria",
    currency: "EUR",
    syncedAt: now
  });
  await db.insert(transactions).values({
    id: "tx-secondary-1",
    accountId: accId2,
    amount: "-100.00",
    currency: "EUR",
    description: "Compra Secundaria",
    category: "Shopping",
    bookedAt: "2025-08-20T10:00:00.000Z",
    raw: "{}"
  });

  const resMulti = await app.request(`/transactions?accountIds=${accId},${accId2}`, { method: "GET", headers: authHeader });
  if (resMulti.status !== 200) {
    throw new Error(`Expected 200 on multi-account query, got ${resMulti.status}`);
  }
  const jsonMulti = (await resMulti.json()) as { total: number };
  if (jsonMulti.total !== 26) {
    throw new Error(`Expected 26 transactions from both accounts, got ${jsonMulti.total}`);
  }

  const resSingleOnly = await app.request(`/transactions?accountIds=${accId2}`, { method: "GET", headers: authHeader });
  const jsonSingleOnly = (await resSingleOnly.json()) as { total: number };
  if (jsonSingleOnly.total !== 1) {
    throw new Error(`Expected 1 transaction for secondary account, got ${jsonSingleOnly.total}`);
  }
  console.log("✓ Multi-account filter accountIds correctly returned combined transactions.");

  // Test 9: Rich metadata parsing (Hito 14)
  console.log("[9] Testing rich transaction metadata extraction...");
  const rawEnableBankingPayload = {
    balance_after_transaction: {
      amount: "1450.50",
      currency: "EUR"
    },
    creditor: {
      name: "Mercadona S.A.",
      postal_address: {
        city: "Valencia",
        country: "ES"
      }
    },
    creditor_account: {
      iban: "ES9121000418450200051234"
    },
    merchant_category_code: "5411",
    bank_transaction_code: {
      code: "PMNT-POS",
      description: "Pago con tarjeta en comercio"
    },
    reference_number: "REF-2026-MERCADONA-99",
    booking_date: "2025-08-10",
    value_date: "2025-08-10",
    transaction_date: "2025-08-09T18:30:00Z"
  };

  await db.insert(transactions).values({
    id: "tx-rich-metadata-1",
    accountId: accId,
    amount: "-45.80",
    currency: "EUR",
    description: "MERCADONA COMPRA VALENCIA",
    category: "Alimentación",
    bookedAt: "2025-08-10T10:00:00.000Z",
    raw: JSON.stringify(rawEnableBankingPayload)
  });

  const resMeta = await app.request(`/transactions?limit=50`, { method: "GET", headers: authHeader });
  const jsonMeta = (await resMeta.json()) as { data: Array<{ id: string; metadata?: any }> };
  const richTx = jsonMeta.data.find((t) => t.id === "tx-rich-metadata-1");

  if (!richTx || !richTx.metadata) {
    throw new Error(`Expected metadata on tx-rich-metadata-1, got: ${JSON.stringify(richTx)}`);
  }

  if (richTx.metadata.balanceAfter?.amount !== "1450.50") {
    throw new Error(`Expected balanceAfter 1450.50, got ${richTx.metadata.balanceAfter?.amount}`);
  }
  if (richTx.metadata.counterparty?.name !== "Mercadona S.A." || richTx.metadata.counterparty?.city !== "Valencia") {
    throw new Error(`Counterparty parsing failed: ${JSON.stringify(richTx.metadata.counterparty)}`);
  }
  if (richTx.metadata.mcc !== "5411" || richTx.metadata.mccInfo?.name !== "Supermercados & Alimentación") {
    throw new Error(`MCC parsing failed: ${JSON.stringify(richTx.metadata.mccInfo)}`);
  }
  if (richTx.metadata.referenceNumber !== "REF-2026-MERCADONA-99") {
    throw new Error(`Reference number parsing failed: ${richTx.metadata.referenceNumber}`);
  }
  console.log("✓ Rich metadata (balanceAfter, counterparty, MCC, reference, dates) successfully parsed.");

  await db.delete(transactions).where(eq(transactions.id, "tx-rich-metadata-1"));

  // Clean test fixtures
  await db.delete(transactions).where(eq(transactions.accountId, accId));
  await db.delete(accounts).where(eq(accounts.id, accId));
  await db.delete(bankConnections).where(eq(bankConnections.id, connId));

  console.log("\n=== ALL HITO 5, 13 & 14 BACKEND TESTS PASSED SUCCESSFULLY ===");
}

runTest().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
