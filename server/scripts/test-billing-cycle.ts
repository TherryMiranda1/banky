import dotenv from "dotenv";
dotenv.config();

import assert from "node:assert";
import {
  getDb,
  users,
  bankConnections,
  accounts,
  transactions,
  eq
} from "../src/db/index.js";
import { app } from "../src/index.js";
import { BillingCycleService } from "../src/core/domain/billing-cycle.service.js";
import { createAuthToken } from "../src/services/jwt.js";

async function runTest(): Promise<void> {
  console.log("=== Testing Hito 11 Billing Cycles & Cutoff Day ===");

  // --- 1. Test Unitario de BillingCycleService ---
  console.log("\n1. Testing BillingCycleService domain calculations...");

  // Cutoff = 1 (Calendar Month)
  const rangeFebCutoff1 = BillingCycleService.getPeriodRange("2026-02", 1);
  assert.strictEqual(rangeFebCutoff1.from, "2026-02-01T00:00:00.000Z");
  assert.strictEqual(rangeFebCutoff1.to, "2026-02-28T23:59:59.999Z");
  console.log("✓ Cutoff 1 (2026-02):", rangeFebCutoff1.from, "to", rangeFebCutoff1.to);

  // Leap Year Feb
  const rangeLeapYear = BillingCycleService.getPeriodRange("2024-02", 1);
  assert.strictEqual(rangeLeapYear.from, "2024-02-01T00:00:00.000Z");
  assert.strictEqual(rangeLeapYear.to, "2024-02-29T23:59:59.999Z");
  console.log("✓ Cutoff 1 leap year (2024-02):", rangeLeapYear.from, "to", rangeLeapYear.to);

  // Cutoff = 20 (Custom cycle: 21-Jul to 20-Aug for 2026-08)
  const rangeAugCutoff20 = BillingCycleService.getPeriodRange("2026-08", 20);
  assert.strictEqual(rangeAugCutoff20.from, "2026-07-21T00:00:00.000Z");
  assert.strictEqual(rangeAugCutoff20.to, "2026-08-20T23:59:59.999Z");
  console.log("✓ Cutoff 20 (2026-08):", rangeAugCutoff20.from, "to", rangeAugCutoff20.to);

  // Cutoff = 21 (Custom cycle)
  const rangeFebCutoff21 = BillingCycleService.getPeriodRange("2026-02", 21);
  assert.strictEqual(rangeFebCutoff21.from, "2026-01-22T00:00:00.000Z");
  assert.strictEqual(rangeFebCutoff21.to, "2026-02-21T23:59:59.999Z");
  console.log("✓ Cutoff 21 (2026-02):", rangeFebCutoff21.from, "to", rangeFebCutoff21.to);

  // Year transition (2026-01 with Cutoff = 15 starts on 2025-12-16 and ends on 2026-01-15)
  const rangeJanCutoff15 = BillingCycleService.getPeriodRange("2026-01", 15);
  assert.strictEqual(rangeJanCutoff15.from, "2025-12-16T00:00:00.000Z");
  assert.strictEqual(rangeJanCutoff15.to, "2026-01-15T23:59:59.999Z");
  console.log("✓ Cutoff 15 year transition (2026-01):", rangeJanCutoff15.from, "to", rangeJanCutoff15.to);

  // Current period detection
  const curPeriodA = BillingCycleService.getCurrentPeriod(20, new Date("2026-08-25T10:00:00Z"));
  assert.strictEqual(curPeriodA, "2026-09"); // Day 25 > 20 => Cycle ending Sep 2026
  const curPeriodB = BillingCycleService.getCurrentPeriod(20, new Date("2026-08-15T10:00:00Z"));
  assert.strictEqual(curPeriodB, "2026-08"); // Day 15 <= 20 => Cycle ending Aug 2026
  const curPeriodC = BillingCycleService.getCurrentPeriod(20, new Date("2026-08-20T23:00:00Z"));
  assert.strictEqual(curPeriodC, "2026-08"); // Day 20 <= 20 => Last day of cycle ending Aug 2026
  console.log("✓ getCurrentPeriod correctly detects active financial cycle");

  // Adjacent periods
  const adjacent = BillingCycleService.getAdjacentPeriods("2026-02", 2, 1);
  assert.deepStrictEqual(adjacent, ["2025-12", "2026-01", "2026-02", "2026-03"]);
  console.log("✓ getAdjacentPeriods:", adjacent);

  // --- 2. Test Endpoints: User Preferences ---
  console.log("\n2. Testing /users/preferences endpoints...");
  const db = getDb();
  const testUserId = "user-cycle-test-1";
  const testToken = await createAuthToken({ id: testUserId, email: "cycle@example.com", name: "Cycle User" });
  const authHeader = { Authorization: `Bearer ${testToken}`, "Content-Type": "application/json" };

  // Setup test user
  await db.delete(users).where(eq(users.id, testUserId));
  const now = new Date().toISOString();
  await db.insert(users).values({
    id: testUserId,
    email: "cycle@example.com",
    passwordHash: "dummyhash",
    name: "Cycle User",
    cutoffDay: 1,
    createdAt: now,
    updatedAt: now
  });

  // GET preferences
  const getPrefRes = await app.request("/users/preferences", {
    method: "GET",
    headers: authHeader
  });
  assert.strictEqual(getPrefRes.status, 200);
  const getPrefJson = (await getPrefRes.json()) as any;
  assert.strictEqual(getPrefJson.data.cutoffDay, 1);
  console.log("✓ Initial cutoffDay is 1");

  // PATCH preferences invalid (0, 32)
  const invalidPatch1 = await app.request("/users/preferences", {
    method: "PATCH",
    headers: authHeader,
    body: JSON.stringify({ cutoffDay: 0 })
  });
  assert.strictEqual(invalidPatch1.status, 400);

  const invalidPatch2 = await app.request("/users/preferences", {
    method: "PATCH",
    headers: authHeader,
    body: JSON.stringify({ cutoffDay: 32 })
  });
  assert.strictEqual(invalidPatch2.status, 400);
  console.log("✓ Validation rejects invalid cutoffDay (<1 or >31)");

  // PATCH preferences valid (21)
  const patchPrefRes = await app.request("/users/preferences", {
    method: "PATCH",
    headers: authHeader,
    body: JSON.stringify({ cutoffDay: 21 })
  });
  assert.strictEqual(patchPrefRes.status, 200);
  const patchPrefJson = (await patchPrefRes.json()) as any;
  assert.strictEqual(patchPrefJson.data.cutoffDay, 21);
  console.log("✓ Updated cutoffDay to 21");

  // Verify GET /auth/me returns updated cutoffDay
  const meRes = await app.request("/auth/me", {
    method: "GET",
    headers: authHeader
  });
  assert.strictEqual(meRes.status, 200);
  const meJson = (await meRes.json()) as any;
  assert.strictEqual(meJson.user.cutoffDay, 21);
  console.log("✓ /auth/me reflects cutoffDay = 21");

  // --- 3. Test GET /transactions?period=YYYY-MM with Cutoff Filter ---
  console.log("\n3. Testing GET /transactions with period and cutoffDay filter...");
  const connId = "conn-cycle-test-1";
  const accId = "acc-cycle-test-1";

  await db.delete(transactions).where(eq(transactions.accountId, accId));
  await db.delete(accounts).where(eq(accounts.id, accId));
  await db.delete(bankConnections).where(eq(bankConnections.id, connId));

  await db.insert(bankConnections).values({
    id: connId,
    userId: testUserId,
    bankName: "Santander",
    aspspName: "Santander",
    aspspCountry: "ES",
    sessionIdEnc: "dummy",
    validUntil: "2099-01-01T00:00:00.000Z",
    status: "active",
    createdAt: now
  });

  await db.insert(accounts).values({
    id: accId,
    connectionId: connId,
    iban: "ES1234567890",
    currency: "EUR"
  });

  // Insert 3 transactions:
  // Tx 1: 2026-01-20T10:00:00Z (Belongs to period 2026-01 under cutoff 21, NOT period 2026-02)
  // Tx 2: 2026-01-22T10:00:00Z (Belongs to period 2026-02 under cutoff 21)
  // Tx 3: 2026-02-18T10:00:00Z (Belongs to period 2026-02 under cutoff 21)
  // Tx 4: 2026-02-22T10:00:00Z (Belongs to period 2026-03 under cutoff 21)
  await db.insert(transactions).values([
    {
      id: "tx-cycle-1",
      accountId: accId,
      amount: "-10.00",
      currency: "EUR",
      description: "Coffee Shop",
      category: "Restauración",
      bookedAt: "2026-01-20T10:00:00.000Z",
      raw: "{}"
    },
    {
      id: "tx-cycle-2",
      accountId: accId,
      amount: "-50.00",
      currency: "EUR",
      description: "Supermercado Mercadona",
      category: "Alimentación",
      bookedAt: "2026-01-22T10:00:00.000Z",
      raw: "{}"
    },
    {
      id: "tx-cycle-3",
      accountId: accId,
      amount: "-30.00",
      currency: "EUR",
      description: "Gasolinera Repsol",
      category: "Transporte",
      bookedAt: "2026-02-18T10:00:00.000Z",
      raw: "{}"
    },
    {
      id: "tx-cycle-4",
      accountId: accId,
      amount: "-15.00",
      currency: "EUR",
      description: "Cinema",
      category: "Ocio",
      bookedAt: "2026-02-22T10:00:00.000Z",
      raw: "{}"
    }
  ]);

  // Query transactions for period 2026-02 (Cutoff 21: 2026-01-21 to 2026-02-20)
  const txRes = await app.request(`/transactions?accountId=${accId}&period=2026-02`, {
    method: "GET",
    headers: authHeader
  });
  assert.strictEqual(txRes.status, 200);
  const txJson = (await txRes.json()) as any;
  assert.strictEqual(txJson.total, 2);
  const txIds = txJson.data.map((t: any) => t.id);
  assert.ok(txIds.includes("tx-cycle-2"));
  assert.ok(txIds.includes("tx-cycle-3"));
  assert.ok(!txIds.includes("tx-cycle-1"));
  assert.ok(!txIds.includes("tx-cycle-4"));
  console.log("✓ GET /transactions?period=2026-02 correctly returns only transactions within 2026-01-21 to 2026-02-20");

  // Query transactions for period 2026-01 (Cutoff 21: 2025-12-21 to 2026-01-20)
  const txJanRes = await app.request(`/transactions?accountId=${accId}&period=2026-01`, {
    method: "GET",
    headers: authHeader
  });
  assert.strictEqual(txJanRes.status, 200);
  const txJanJson = (await txJanRes.json()) as any;
  assert.strictEqual(txJanJson.total, 1);
  assert.strictEqual(txJanJson.data[0].id, "tx-cycle-1");
  console.log("✓ GET /transactions?period=2026-01 correctly returns tx-cycle-1");

  // Cleanup
  await db.delete(transactions).where(eq(transactions.accountId, accId));
  await db.delete(accounts).where(eq(accounts.id, accId));
  await db.delete(bankConnections).where(eq(bankConnections.id, connId));
  await db.delete(users).where(eq(users.id, testUserId));

  console.log("\n=== All Hito 11 Backend & Billing Cycle Tests Passed Successfully! ===");
}

runTest().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
