import { getDb, users, bankConnections, accounts, transactions, categories, categorizationRules, eq } from "../src/db/index.js";
import { app } from "../src/app.js";
import { hashPassword } from "../src/services/password.js";
import { createAuthToken } from "../src/services/jwt.js";
import { CategorizationEngine } from "../src/core/domain/categorization-engine.js";
import crypto from "node:crypto";

async function runTests() {
  console.log("--- Starting Categories, Advanced Rules & Reordering Verification ---");
  const db = getDb();

  // Test 1: Unit test CategorizationEngine
  console.log("\n[Test 1] Testing CategorizationEngine regex, direction, account and priority resolution...");
  const engine = new CategorizationEngine([
    { id: "1", pattern: "mercadona|carrefour", priority: 10, categoryName: "Alimentación" },
    { id: "2", pattern: "uber|cabify", priority: 5, categoryName: "Transporte" },
    { id: "3", pattern: "uber eats", priority: 20, categoryName: "Alimentación" }, // higher priority than uber
    { id: "4", pattern: "invalid(regex[", priority: 10, categoryName: "Ignored" }, // malformed regex shouldn't throw
    { id: "5", accountId: "acc_nomina", direction: "in", priority: 30, categoryName: "Nómina" }, // only account + direction
    { id: "6", direction: "out", pattern: "farmacia", priority: 25, categoryName: "Salud" }, // direction + pattern
    { id: "7", accountId: "acc_cash", priority: 15, categoryName: "Efectivo Gastos" } // only account
  ]);

  const match1 = engine.evaluate("COMPRA EN MERCADONA MADRID");
  if (match1 !== "Alimentación") throw new Error(`Expected Alimentación, got ${match1}`);

  const match2 = engine.evaluate("UBER TRIP MADRID");
  if (match2 !== "Transporte") throw new Error(`Expected Transporte, got ${match2}`);

  const match3 = engine.evaluate("UBER EATS RESTAURANT");
  if (match3 !== "Alimentación") throw new Error(`Expected Alimentación (priority 20 override), got ${match3}`);

  const match4 = engine.evaluate("UNKNOWN TRANSACTION 123");
  if (match4 !== null) throw new Error(`Expected null, got ${match4}`);

  // Test multi-criteria
  const matchNomina = engine.evaluate({
    description: "TRANSFERENCIA EMITIDA POR EMPRESA",
    amount: "2500.00",
    accountId: "acc_nomina"
  });
  if (matchNomina !== "Nómina") throw new Error(`Expected Nómina, got ${matchNomina}`);

  const matchNominaNegative = engine.evaluate({
    description: "TRANSFERENCIA EMITIDA POR EMPRESA",
    amount: "-50.00",
    accountId: "acc_nomina"
  });
  if (matchNominaNegative === "Nómina") throw new Error("Expected not Nómina for negative amount");

  const matchSalud = engine.evaluate({
    description: "FARMACIA CENTRAL",
    amount: "-18.50",
    accountId: "acc_other"
  });
  if (matchSalud !== "Salud") throw new Error(`Expected Salud, got ${matchSalud}`);

  const matchSaludIncome = engine.evaluate({
    description: "DEVOLUCION FARMACIA CENTRAL",
    amount: "18.50",
    accountId: "acc_other"
  });
  if (matchSaludIncome === "Salud") throw new Error("Expected not Salud for positive amount when direction is out");

  const matchCash = engine.evaluate({
    description: "CAFE",
    amount: "-2.00",
    accountId: "acc_cash"
  });
  if (matchCash !== "Efectivo Gastos") throw new Error(`Expected Efectivo Gastos, got ${matchCash}`);

  console.log("✓ CategorizationEngine passed all multi-criteria cases.");

  // Test 2: User registration auto-seeds categories
  console.log("\n[Test 2] Testing User Registration auto-seeding...");
  const testUserEmail = `user_cat_${Date.now()}@example.com`;
  const regRes = await app.request("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: testUserEmail,
      password: "Password123!",
      name: "Category Tester"
    })
  });
  if (regRes.status !== 201) {
    throw new Error(`Register failed with status ${regRes.status}: ${await regRes.text()}`);
  }
  const regData = (await regRes.json()) as any;
  const token = regData.token;
  const userId = regData.user.id;

  // Verify categories were seeded
  const getCatRes = await app.request("/categories", {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (getCatRes.status !== 200) {
    throw new Error(`GET /categories failed: ${await getCatRes.text()}`);
  }
  const catList = (await getCatRes.json()) as any;
  console.log(`✓ Seeded categories count: ${catList.data.length}`);
  if (catList.data.length < 6) throw new Error(`Expected at least 6 seeded categories, got ${catList.data.length}`);

  // Test 3: List seeded rules
  console.log("\n[Test 3] Testing GET /categories/rules...");
  const getRulesRes = await app.request("/categories/rules", {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (getRulesRes.status !== 200) throw new Error(`GET /categories/rules failed: ${await getRulesRes.text()}`);
  const rulesList = (await getRulesRes.json()) as any;
  console.log(`✓ Seeded rules count: ${rulesList.data.length}`);
  if (rulesList.data.length < 6) throw new Error(`Expected rules for default categories, got ${rulesList.data.length}`);

  // Test 4: Create new Category & Rule with account/direction
  console.log("\n[Test 4] Testing POST /categories and POST /categories/rules with account/direction...");
  const createCatRes = await app.request("/categories", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name: "Suscripciones",
      color: "#ec4899",
      icon: "Film"
    })
  });
  if (createCatRes.status !== 201) throw new Error(`POST /categories failed: ${await createCatRes.text()}`);
  const newCat = (await createCatRes.json()) as any;
  const newCatId = newCat.data.id;

  // Create bank account to link
  const connId = crypto.randomUUID();
  const accId = crypto.randomUUID();
  const now = new Date().toISOString();

  await db.insert(bankConnections).values({
    id: connId,
    userId,
    bankName: "Test Bank",
    aspspName: "Test ASPSP",
    aspspCountry: "ES",
    sessionIdEnc: "dummy",
    validUntil: "2099-01-01T00:00:00.000Z",
    status: "active"
  });

  await db.insert(accounts).values({
    id: accId,
    connectionId: connId,
    iban: "ES9900000000000000000000",
    alias: "Main Account",
    currency: "EUR"
  });

  const createRuleRes = await app.request("/categories/rules", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      categoryId: newCatId,
      pattern: "chatgpt|github|claude|openai",
      accountId: accId,
      direction: "out",
      priority: 15
    })
  });
  if (createRuleRes.status !== 201) throw new Error(`POST /categories/rules failed: ${await createRuleRes.text()}`);
  const newRule = (await createRuleRes.json()) as any;
  console.log(`✓ Created category '${newCat.data.name}' and rule '${newRule.data.pattern}' (Account: ${newRule.data.accountName}, Direction: ${newRule.data.direction})`);

  // Test 5: Re-categorize transactions
  console.log("\n[Test 5] Testing Historical Re-categorization (POST /categories/rules/apply)...");
  const tx1Id = crypto.randomUUID();
  const tx2Id = crypto.randomUUID();
  const tx3Id = crypto.randomUUID();

  await db.insert(transactions).values([
    {
      id: tx1Id,
      accountId: accId,
      amount: "-45.50",
      currency: "EUR",
      description: "COMPRA EN MERCADONA S.A.",
      category: null,
      bookedAt: now,
      raw: "{}"
    },
    {
      id: tx2Id,
      accountId: accId,
      amount: "-20.00",
      currency: "EUR",
      description: "OPENAI CHATGPT PLUS SUBSCRIPTION",
      category: null,
      bookedAt: now,
      raw: "{}"
    },
    {
      id: tx3Id,
      accountId: accId,
      amount: "-12.00",
      currency: "EUR",
      description: "UNMATCHED PAYMENT UNKNOWN",
      category: null,
      bookedAt: now,
      raw: "{}"
    }
  ]);

  const applyRes = await app.request("/categories/rules/apply", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (applyRes.status !== 200) throw new Error(`POST /categories/rules/apply failed: ${await applyRes.text()}`);
  const applyData = (await applyRes.json()) as any;
  console.log(`✓ Apply result: ${applyData.applied} updated out of ${applyData.total}`);
  if (applyData.applied !== 2) throw new Error(`Expected 2 categorized transactions, got ${applyData.applied}`);

  const [dbTx1] = await db.select().from(transactions).where(eq(transactions.id, tx1Id));
  const [dbTx2] = await db.select().from(transactions).where(eq(transactions.id, tx2Id));
  const [dbTx3] = await db.select().from(transactions).where(eq(transactions.id, tx3Id));

  if (dbTx1.category !== "Alimentación") throw new Error(`Expected Alimentación for tx1, got ${dbTx1.category}`);
  if (dbTx2.category !== "Suscripciones") throw new Error(`Expected Suscripciones for tx2, got ${dbTx2.category}`);
  if (dbTx3.category !== null) throw new Error(`Expected null category for tx3, got ${dbTx3.category}`);

  // Test 6: Reorder categories (PUT /categories/reorder)
  console.log("\n[Test 6] Testing Category Reordering (PUT /categories/reorder)...");
  const allCatsRes = await app.request("/categories", {
    headers: { Authorization: `Bearer ${token}` }
  });
  const currentCats = (await allCatsRes.json()) as any;
  const reversedIds = currentCats.data.map((c: any) => c.id).reverse();

  const reorderCatRes = await app.request("/categories/reorder", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      categoryIds: reversedIds
    })
  });
  if (reorderCatRes.status !== 200) throw new Error(`PUT /categories/reorder failed: ${await reorderCatRes.text()}`);
  const reorderedCats = (await reorderCatRes.json()) as any;
  if (reorderedCats.data[0].id !== reversedIds[0]) {
    throw new Error(`Expected first category to be ${reversedIds[0]}, got ${reorderedCats.data[0].id}`);
  }
  console.log("✓ PUT /categories/reorder successfully updated positions.");

  // Test 7: Reorder accounts (PUT /accounts/reorder)
  console.log("\n[Test 7] Testing Accounts Reordering (PUT /accounts/reorder)...");
  const acc2Id = crypto.randomUUID();
  await db.insert(accounts).values({
    id: acc2Id,
    connectionId: connId,
    iban: "ES9900000000000000000001",
    alias: "Second Account",
    currency: "EUR"
  });

  const reorderAccRes = await app.request("/accounts/reorder", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      accountIds: [acc2Id, accId]
    })
  });
  if (reorderAccRes.status !== 200) throw new Error(`PUT /accounts/reorder failed: ${await reorderAccRes.text()}`);
  const reorderedAccs = (await reorderAccRes.json()) as any;
  if (reorderedAccs[0].id !== acc2Id) {
    throw new Error(`Expected first account to be ${acc2Id}, got ${reorderedAccs[0].id}`);
  }
  console.log("✓ PUT /accounts/reorder successfully updated positions.");

  // Test 8: Delete category unassigns transactions
  console.log("\n[Test 8] Testing DELETE /categories/:id unassigns transactions...");
  const delCatRes = await app.request(`/categories/${newCatId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (delCatRes.status !== 200) throw new Error(`DELETE /categories failed: ${await delCatRes.text()}`);
  const [unassignedTx2] = await db.select().from(transactions).where(eq(transactions.id, tx2Id));
  if (unassignedTx2.category !== null) throw new Error(`Expected null category after delete, got ${unassignedTx2.category}`);
  console.log("✓ Delete category unassigned transaction category properly.");

  console.log("\n--- ALL BACKEND CATEGORIES, RULES & REORDERING VERIFICATIONS PASSED ---");
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});

