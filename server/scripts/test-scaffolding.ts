import dotenv from "dotenv";
dotenv.config();
process.env.NODE_ENV = "test";

import { encrypt, decrypt } from "../src/services/crypto.js";
import { generateEnableBankingJwt } from "../src/services/jwt.js";
import { getDb, sql } from "../src/db/index.js";
import { EnableBankingAdapter } from "../src/core/infra/enable-banking/EnableBankingAdapter.js";
import { app } from "../src/index.js";

async function runVerification(): Promise<void> {
  console.log("--- Starting Hito 1 Scaffolding Verification ---");

  const samplePlaintext = "secret_session_token_123456789";
  const encrypted = encrypt(samplePlaintext);
  const decrypted = decrypt(encrypted);
  if (decrypted !== samplePlaintext) {
    throw new Error(`Crypto verification failed: expected '${samplePlaintext}', got '${decrypted}'`);
  }
  console.log("✓ Crypto service (AES-256-GCM encrypt/decrypt): OK");

  const jwt = generateEnableBankingJwt();
  const parts = jwt.split(".");
  if (parts.length !== 3) {
    throw new Error(`JWT format invalid: expected 3 parts, got ${parts.length}`);
  }
  const header = JSON.parse(Buffer.from(parts[0]!, "base64url").toString("utf8"));
  const payload = JSON.parse(Buffer.from(parts[1]!, "base64url").toString("utf8"));

  if (header.alg !== "RS256" || header.typ !== "JWT" || !header.kid) {
    throw new Error(`JWT header invalid: ${JSON.stringify(header)}`);
  }
  if (payload.iss !== "enablebanking.com" || payload.aud !== "api.enablebanking.com" || !payload.exp) {
    throw new Error(`JWT payload invalid: ${JSON.stringify(payload)}`);
  }
  console.log("✓ JWT service (RS256 with KID and Enable Banking claims): OK");

  const db = getDb();
  const tables = await db.all<{ name: string }>(sql`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;`);
  const tableNames = tables.map((t) => t.name);

  const requiredTables = ["users", "bank_connections", "accounts", "transactions"];
  for (const table of requiredTables) {
    if (!tableNames.includes(table)) {
      throw new Error(`Missing expected SQLite table: ${table}`);
    }
  }
  console.log("✓ SQLite Database schema & auto-migrations: OK (tables:", tableNames.filter((t) => !t.startsWith("sqlite_")).join(", "), ")");

  const adapter = new EnableBankingAdapter();
  if (typeof adapter.startAuth !== "function" || typeof adapter.completeAuth !== "function" || typeof adapter.getAccounts !== "function") {
    throw new Error("EnableBankingAdapter is missing required IBankingAdapter methods");
  }
  console.log("✓ EnableBankingAdapter implementation: OK");

  const res = await app.request("/health");
  const healthData = (await res.json()) as { ok?: boolean };
  if (res.status !== 200 || !healthData.ok) {
    throw new Error(`Health endpoint failed: status ${res.status}, body ${JSON.stringify(healthData)}`);
  }
  console.log("✓ Health endpoint GET /health -> status 200, body:", JSON.stringify(healthData));

  console.log("--- All Hito 1 Core Services Verified Successfully ---");
}

runVerification().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
