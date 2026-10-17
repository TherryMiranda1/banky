import assert from "node:assert";
import { app } from "../src/app.js";
import {
  getDb,
  users,
  bankConnections,
  accounts,
  transactions,
  apiKeys
} from "../src/db/index.js";

async function runApiKeysTests() {
  console.log("=== Testing API Keys Architecture & Scoped Access ===");
  const db = getDb();

  await db.delete(apiKeys);
  await db.delete(transactions);
  await db.delete(accounts);
  await db.delete(bankConnections);
  await db.delete(users);

  // [1] Register test user to obtain session JWT
  console.log("[1] Registering user for JWT session...");
  const regRes = await app.request("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "apikey-test@example.com", password: "Password123!", name: "Key Master" })
  });
  assert.strictEqual(regRes.status, 201, "Registration must succeed");
  const regData = (await regRes.json()) as { token: string; user: { id: string } };
  const userJwt = regData.token;
  const userId = regData.user.id;

  // Setup sample cash account
  const cashRes = await app.request("/accounts/cash", {
    method: "POST",
    headers: { Authorization: `Bearer ${userJwt}` }
  });
  assert.strictEqual(cashRes.status, 200, "Cash account creation must succeed");
  const cashAcc = (await cashRes.json()) as { id: string };

  // [2] Create API Key with read-only scopes
  console.log("[2] Creating read-only API Key...");
  const createKeyRes = await app.request("/api-keys", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${userJwt}`
    },
    body: JSON.stringify({
      name: "Read Only Automation",
      scopes: ["accounts:read", "balance:read", "transactions:read"],
      expiresInDays: 30
    })
  });
  assert.strictEqual(createKeyRes.status, 201, "API Key creation must return 201");
  const createdKey = (await createKeyRes.json()) as {
    id: string;
    name: string;
    key: string;
    keyPrefix: string;
    scopes: string[];
  };
  assert.ok(createdKey.key.startsWith("bky_live_"), "Raw key must have bky_live_ prefix");
  assert.strictEqual(createdKey.keyPrefix, createdKey.key.slice(0, 16));
  assert.deepStrictEqual(createdKey.scopes, ["accounts:read", "balance:read", "transactions:read"]);
  const readOnlyKey = createdKey.key;
  const readOnlyKeyId = createdKey.id;

  // [3] List API keys
  console.log("[3] Listing API keys...");
  const listRes = await app.request("/api-keys", {
    headers: { Authorization: `Bearer ${userJwt}` }
  });
  assert.strictEqual(listRes.status, 200);
  const keysList = (await listRes.json()) as Array<{ id: string; keyPrefix: string; key_hash?: unknown }>;
  assert.strictEqual(keysList.length, 1);
  assert.strictEqual(keysList[0].key_hash, undefined, "Hash must never be exposed");
  assert.strictEqual(keysList[0].keyPrefix, createdKey.keyPrefix);

  // [4] Test API Key access to authorized endpoints
  console.log("[4] Testing authorized endpoints with API key...");
  const accountsRes = await app.request("/accounts", {
    headers: { Authorization: `Bearer ${readOnlyKey}` }
  });
  assert.strictEqual(accountsRes.status, 200, "Should allow /accounts with accounts:read scope");

  const balanceRes = await app.request("/balance/total", {
    headers: { Authorization: `Bearer ${readOnlyKey}` }
  });
  assert.strictEqual(balanceRes.status, 200, "Should allow /balance/total with balance:read scope");

  const txRes = await app.request("/transactions", {
    headers: { Authorization: `Bearer ${readOnlyKey}` }
  });
  assert.strictEqual(txRes.status, 200, "Should allow /transactions with transactions:read scope");

  // [5] Test unauthorized action with missing scope
  console.log("[5] Testing missing scope rejection...");
  const forbiddenWriteRes = await app.request("/transactions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${readOnlyKey}`
    },
    body: JSON.stringify({
      accountId: cashAcc.id,
      amount: "-15.50",
      currency: "EUR",
      description: "Coffee",
      bookedAt: new Date().toISOString()
    })
  });
  assert.strictEqual(forbiddenWriteRes.status, 403, "Must reject write when key lacks transactions:write");

  // [6] Test API Key blocked from interactive/sensitive endpoints (requireJwtOnly)
  console.log("[6] Testing blocked interactive endpoints (requireJwtOnly)...");
  const manageKeysWithApiKeyRes = await app.request("/api-keys", {
    headers: { Authorization: `Bearer ${readOnlyKey}` }
  });
  assert.strictEqual(manageKeysWithApiKeyRes.status, 403, "API key cannot list or manage API keys");

  const userPrefRes = await app.request("/users/preferences", {
    headers: { Authorization: `Bearer ${readOnlyKey}` }
  });
  assert.strictEqual(userPrefRes.status, 403, "API key cannot access /users endpoints");

  // [7] Create write-capable API Key and perform transaction
  console.log("[7] Testing API key with transactions:write scope...");
  const createWriteKeyRes = await app.request("/api-keys", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${userJwt}`
    },
    body: JSON.stringify({
      name: "Write Automation",
      scopes: ["transactions:read", "transactions:write"],
      expiresInDays: 7
    })
  });
  assert.strictEqual(createWriteKeyRes.status, 201);
  const writeKey = ((await createWriteKeyRes.json()) as { key: string }).key;

  const writeTxRes = await app.request("/transactions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${writeKey}`
    },
    body: JSON.stringify({
      accountId: cashAcc.id,
      amount: "-25.00",
      currency: "EUR",
      description: "Groceries",
      bookedAt: new Date().toISOString()
    })
  });
  assert.strictEqual(writeTxRes.status, 201, "Transaction creation must succeed with transactions:write scope");

  // [8] Revocation of API key
  console.log("[8] Testing revocation...");
  const revokeRes = await app.request(`/api-keys/${readOnlyKeyId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${userJwt}` }
  });
  assert.strictEqual(revokeRes.status, 200);

  const revokedUseRes = await app.request("/accounts", {
    headers: { Authorization: `Bearer ${readOnlyKey}` }
  });
  assert.strictEqual(revokedUseRes.status, 401, "Revoked key must be immediately rejected with 401");

  // [9] Limit enforcement (max 10 active keys)
  console.log("[9] Testing maximum 10 active keys limit...");
  for (let i = 0; i < 9; i++) {
    const res = await app.request("/api-keys", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userJwt}`
      },
      body: JSON.stringify({
        name: `Key Batch ${i}`,
        scopes: ["accounts:read"]
      })
    });
    assert.strictEqual(res.status, 201);
  }

  const eleventhRes = await app.request("/api-keys", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${userJwt}`
    },
    body: JSON.stringify({
      name: "Excess Key",
      scopes: ["accounts:read"]
    })
  });
  assert.strictEqual(eleventhRes.status, 400, "11th active key must be rejected with 400 limit reached");

  // [10] Test API Discovery, OpenAPI spec and Swagger UI routes
  console.log("[10] Testing API Discovery, OpenAPI spec and Swagger UI...");
  const rootRes = await app.request("/");
  assert.strictEqual(rootRes.status, 200);
  const rootData = (await rootRes.json()) as { docs: string; openapi: string };
  assert.strictEqual(rootData.docs, "/docs");
  assert.strictEqual(rootData.openapi, "/openapi.json");

  const openApiRes = await app.request("/openapi.json");
  assert.strictEqual(openApiRes.status, 200);
  const specData = (await openApiRes.json()) as { openapi: string; info: { title: string } };
  assert.strictEqual(specData.openapi, "3.1.0");
  assert.strictEqual(specData.info.title, "Banky Open Banking API");

  const docsRes = await app.request("/docs");
  assert.strictEqual(docsRes.status, 200);
  const docsHtml = await docsRes.text();
  assert.ok(docsHtml.includes("swagger-ui"), "Docs endpoint must render Swagger UI");

  console.log("=== All API Key & Documentation Tests Passed Successfully! ===");
}

runApiKeysTests().catch((err) => {
  console.error("Test failure:", err);
  process.exit(1);
});
