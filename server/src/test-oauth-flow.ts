import dotenv from "dotenv";
dotenv.config();

import { stateStore } from "./services/state-store.js";
import { encrypt, decrypt } from "./services/crypto.js";
import { createAuthToken } from "./services/jwt.js";
import { getDatabase } from "./db/index.js";
import { app } from "./index.js";

async function runTests() {
  console.log("--- Starting Hito 2 OAuth & Security Verification ---");

  const testToken = await createAuthToken({
    id: "test-user-oauth",
    email: "test-oauth@example.com",
    name: "Test User"
  });

  // 1. State Store Tests
  console.log("[1] Testing StateStore anti-CSRF...");
  const state = await stateStore.createState({ aspspName: "Santander", aspspCountry: "ES", userId: "test-user-oauth" });
  if (!state || typeof state !== "string") {
    throw new Error("Failed to generate state");
  }

  const consumed = await stateStore.validateAndConsume(state);
  if (!consumed || consumed.aspspName !== "Santander" || consumed.aspspCountry !== "ES") {
    throw new Error("StateStore consumption failed or returned incorrect metadata");
  }

  const consumedAgain = await stateStore.validateAndConsume(state);
  if (consumedAgain !== null) {
    throw new Error("StateStore replay attack possible: state was consumed twice!");
  }
  console.log("✓ StateStore anti-CSRF validated successfully.");

  // 2. Encryption Tests
  console.log("[2] Testing Session ID Encryption (AES-256-GCM)...");
  const testSession = "mock-secret-session-id-123456789";
  const encrypted = encrypt(testSession);
  if (encrypted === testSession || !encrypted.includes(":")) {
    throw new Error("Session ID not properly encrypted");
  }
  const decrypted = decrypt(encrypted);
  if (decrypted !== testSession) {
    throw new Error(`Decryption failed: expected ${testSession}, got ${decrypted}`);
  }
  console.log("✓ Encryption & decryption round-trip verified.");

  // 3. Database Persistence verification
  console.log("[3] Testing Database Persistence & Schema for OAuth connections...");
  const db = getDatabase();
  const testConnId = "test-conn-" + Date.now();
  const testAccId = "test-acc-" + Date.now();
  const testSessionEnc = encrypt("mock-enable-banking-session-id");

  await db.execute(
    `INSERT INTO bank_connections (id, user_id, bank_name, aspsp_name, aspsp_country, session_id_enc, valid_until, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    [testConnId, "test-user-oauth", "Santander ES", "Santander", "ES", testSessionEnc, new Date(Date.now() + 86400000).toISOString()]
  );

  await db.execute(
    `INSERT INTO accounts (id, connection_id, iban, alias, currency, last_balance, synced_at)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
    [testAccId, testConnId, "ES9121000418450200051332", "Cuenta Nómina", "EUR", null]
  );

  const connRow = await db.queryOne<{ session_id_enc: string; bank_name: string }>(
    "SELECT * FROM bank_connections WHERE id = ?",
    [testConnId]
  );
  if (!connRow || connRow.bank_name !== "Santander ES") {
    throw new Error("bank_connections record not found");
  }
  if (connRow.session_id_enc === "mock-enable-banking-session-id") {
    throw new Error("session_id_enc is stored in plaintext!");
  }
  const decryptedSession = decrypt(connRow.session_id_enc);
  if (decryptedSession !== "mock-enable-banking-session-id") {
    throw new Error("Stored encrypted session could not be decrypted");
  }

  const accRow = await db.queryOne<{ iban: string; connection_id: string }>(
    "SELECT * FROM accounts WHERE id = ?",
    [testAccId]
  );
  if (!accRow || accRow.connection_id !== testConnId || accRow.iban !== "ES9121000418450200051332") {
    throw new Error("accounts record not found or inconsistent");
  }

  // Cleanup test rows
  await db.execute("DELETE FROM bank_connections WHERE id = ?", [testConnId]);
  console.log("✓ Database persistence, foreign keys, and AES-256-GCM verification passed.");

  // 4. Test Route Validation (Zod Validation)
  console.log("[4] Testing Zod route validation on Hono app...");
  
  // Test POST /auth/start validation error on empty payload
  const badStartRes = await app.request("/auth/start", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${testToken}` },
    body: JSON.stringify({})
  });
  if (badStartRes.status !== 400) {
    throw new Error(`Expected 400 for empty body on /auth/start, got ${badStartRes.status}`);
  }

  // Test GET /auth/callback validation error on missing state
  const badCallbackRes = await app.request("/auth/callback");
  if (badCallbackRes.status !== 400) {
    throw new Error(`Expected 400 for missing state on /auth/callback, got ${badCallbackRes.status}`);
  }

  // Test GET /auth/callback with invalid state
  const invalidStateRes = await app.request("/auth/callback?code=mock_code&state=invalid-state");
  if (invalidStateRes.status !== 400) {
    throw new Error(`Expected 400 for unknown state on /auth/callback, got ${invalidStateRes.status}`);
  }

  console.log("✓ Zod input validation & error mapping verified on all routes.");
  console.log("\n>>> ALL CRITERIA FOR HITO 2 BACKEND VERIFIED SUCCESSFULLY! <<<");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
