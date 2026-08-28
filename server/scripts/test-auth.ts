import { app } from "../src/app.js";
import { getDb, users, bankConnections, accounts, transactions } from "../src/db/index.js";
import assert from "node:assert";

async function runAuthTests() {
  console.log("=== Testing Authentication & Multi-Tenant Data Isolation ===");
  const db = getDb();

  await db.delete(transactions);
  await db.delete(accounts);
  await db.delete(bankConnections);
  await db.delete(users);

  // [1] Register validation errors
  console.log("[1] Testing Registration Validation...");
  const invalidEmailRes = await app.request("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "invalid-email", password: "password123", name: "Test User" })
  });
  assert.strictEqual(invalidEmailRes.status, 400, "Should reject invalid email");

  const shortPassRes = await app.request("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "user1@example.com", password: "123", name: "Test User" })
  });
  assert.strictEqual(shortPassRes.status, 400, "Should reject password < 8 chars");

  // [2] Successful User 1 Registration
  console.log("[2] Testing Successful Registration...");
  const reg1Res = await app.request("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "user1@example.com", password: "Password123!", name: "Alice Wonderland" })
  });
  assert.strictEqual(reg1Res.status, 201, "Registration should succeed with 201");
  const reg1Data = (await reg1Res.json()) as any;
  assert.ok(reg1Data.token, "Should return JWT token");
  assert.strictEqual(reg1Data.user.email, "user1@example.com");
  const user1Token = reg1Data.token;
  const user1Id = reg1Data.user.id;

  // [3] Duplicate Email Registration
  console.log("[3] Testing Duplicate Registration Prevention...");
  const dupRes = await app.request("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "user1@example.com", password: "AnotherPassword123!", name: "Alice Duplicate" })
  });
  assert.strictEqual(dupRes.status, 409, "Should reject duplicate email with 409 Conflict");

  // [4] User Login
  console.log("[4] Testing User Login...");
  const badLoginRes = await app.request("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "user1@example.com", password: "WrongPassword" })
  });
  assert.strictEqual(badLoginRes.status, 401, "Should reject invalid password with 401");

  const goodLoginRes = await app.request("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "user1@example.com", password: "Password123!" })
  });
  assert.strictEqual(goodLoginRes.status, 200, "Login should succeed with 200");
  const loginData = (await goodLoginRes.json()) as any;
  assert.ok(loginData.token, "Login should return JWT token");

  // [5] Protected Route /auth/me
  console.log("[5] Testing /auth/me Protected Endpoint...");
  const unauthMe = await app.request("/auth/me");
  assert.strictEqual(unauthMe.status, 401, "Should reject unauthenticated /auth/me");

  const badTokenMe = await app.request("/auth/me", {
    headers: { Authorization: "Bearer invalid.fake.token" }
  });
  assert.strictEqual(badTokenMe.status, 401, "Should reject invalid token");

  const authMe = await app.request("/auth/me", {
    headers: { Authorization: `Bearer ${user1Token}` }
  });
  assert.strictEqual(authMe.status, 200, "Should allow authenticated /auth/me");
  const meData = (await authMe.json()) as any;
  assert.strictEqual(meData.user.id, user1Id);

  // [6] Multi-tenant Data Isolation Test
  console.log("[6] Testing Multi-Tenant Data Isolation between User 1 and User 2...");
  const reg2Res = await app.request("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "user2@example.com", password: "Password123!", name: "Bob Builder" })
  });
  assert.strictEqual(reg2Res.status, 201);
  const reg2Data = (await reg2Res.json()) as any;
  const user2Token = reg2Data.token;

  // Insert Bank Connection and Account for User 1 directly into DB
  const conn1Id = "conn-user-1";
  const acc1Id = "acc-user-1";
  const now = new Date().toISOString();

  await db.insert(bankConnections).values({
    id: conn1Id,
    userId: user1Id,
    bankName: "Santander",
    aspspName: "Santander",
    aspspCountry: "ES",
    sessionIdEnc: "enc_session",
    validUntil: "2099-01-01T00:00:00.000Z",
    status: "active",
    createdAt: now
  });

  await db.insert(accounts).values({
    id: acc1Id,
    connectionId: conn1Id,
    iban: "ES1234567890",
    alias: "Alice Account",
    currency: "EUR",
    lastBalance: JSON.stringify([{ amount: "5000.00", currency: "EUR" }]),
    syncedAt: now
  });

  // User 1 queries accounts -> sees 1 account
  const u1AccountsRes = await app.request("/accounts", {
    headers: { Authorization: `Bearer ${user1Token}` }
  });
  assert.strictEqual(u1AccountsRes.status, 200);
  const u1Accounts = (await u1AccountsRes.json()) as any[];
  assert.strictEqual(u1Accounts.length, 1, "User 1 should see 1 account");
  assert.strictEqual(u1Accounts[0].id, acc1Id);

  // User 2 queries accounts -> sees 0 accounts (complete isolation!)
  const u2AccountsRes = await app.request("/accounts", {
    headers: { Authorization: `Bearer ${user2Token}` }
  });
  assert.strictEqual(u2AccountsRes.status, 200);
  const u2Accounts = (await u2AccountsRes.json()) as any[];
  assert.strictEqual(u2Accounts.length, 0, "User 2 should NOT see User 1's accounts");

  // User 2 tries to access User 1's account by direct ID -> gets 404
  const u2DirectAccountRes = await app.request(`/accounts/${acc1Id}`, {
    headers: { Authorization: `Bearer ${user2Token}` }
  });
  assert.strictEqual(u2DirectAccountRes.status, 404, "User 2 accessing User 1's account by ID must return 404");

  // Cleanup
  await db.delete(transactions);
  await db.delete(accounts);
  await db.delete(bankConnections);
  await db.delete(users);

  console.log("=== ALL AUTHENTICATION & MULTI-TENANT ISOLATION TESTS PASSED ===");
}

runAuthTests().catch((err) => {
  console.error("❌ Auth test failure:", err);
  process.exit(1);
});
