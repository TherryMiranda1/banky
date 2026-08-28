import { getDb, bankConnections, accounts, transactions, eq } from "../src/db/index.js";
import { app } from "../src/app.js";
import crypto from "node:crypto";

async function runTests() {
  console.log("--- Starting Hito 12 Budgets & Analytics Verification ---");

  // 1. Create a test user
  const email = `budget_user_${Date.now()}@example.com`;
  const regRes = await app.request("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password: "Password123!",
      name: "Budget & Analytics Tester"
    })
  });

  if (regRes.status !== 201) {
    throw new Error(`User registration failed: ${await regRes.text()}`);
  }

  const regData = (await regRes.json()) as any;
  const token = regData.token;
  const userId = regData.user.id;
  console.log(`[Test 1] User registered: ${userId}`);

  // 2. Fetch initial categories & budgets for 2026-03
  const getBudgetsRes1 = await app.request("/budgets?period=2026-03", {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (getBudgetsRes1.status !== 200) {
    throw new Error(`GET /budgets failed: ${await getBudgetsRes1.text()}`);
  }

  const budgetsData1 = (await getBudgetsRes1.json()) as any;
  if (!Array.isArray(budgetsData1.data) || budgetsData1.data.length === 0) {
    throw new Error("Expected seeded categories in budgets response");
  }
  console.log(`✓ Initial budgets retrieved: ${budgetsData1.data.length} categories found.`);

  const alimentacion = budgetsData1.data.find((c: any) => c.categoryName.toLowerCase().includes("aliment") || c.categoryName.toLowerCase().includes("comida") || c.categoryName.toLowerCase().includes("supermercado")) || budgetsData1.data[0];
  const transporte = budgetsData1.data.find((c: any) => c.categoryId !== alimentacion.categoryId) || budgetsData1.data[1];

  // 3. Set budgets for period 2026-03
  console.log(`\n[Test 2] Setting budgets for period 2026-03...`);
  const putBudgetsRes = await app.request("/budgets", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      period: "2026-03",
      budgets: [
        { categoryId: alimentacion.categoryId, amount: "450.00" },
        { categoryId: transporte.categoryId, amount: "120.00" }
      ]
    })
  });

  if (putBudgetsRes.status !== 200) {
    throw new Error(`PUT /budgets failed: ${await putBudgetsRes.text()}`);
  }

  const updatedBudgets = (await putBudgetsRes.json()) as any;
  const updatedAlim = updatedBudgets.data.find((b: any) => b.categoryId === alimentacion.categoryId);
  if (updatedAlim.amount !== "450.00" || updatedAlim.isInherited !== false) {
    throw new Error(`Expected amount 450.00 and isInherited false, got ${JSON.stringify(updatedAlim)}`);
  }
  console.log("✓ Budgets for 2026-03 successfully configured.");

  // 4. Test historical fallback inheritance on future period 2026-04
  console.log(`\n[Test 3] Testing historical inheritance for 2026-04...`);
  const getBudgetsRes2 = await app.request("/budgets?period=2026-04", {
    headers: { Authorization: `Bearer ${token}` }
  });

  const budgetsData2 = (await getBudgetsRes2.json()) as any;
  const inheritedAlim = budgetsData2.data.find((b: any) => b.categoryId === alimentacion.categoryId);
  const inheritedTrans = budgetsData2.data.find((b: any) => b.categoryId === transporte.categoryId);

  if (inheritedAlim.amount !== "450.00" || inheritedAlim.isInherited !== true) {
    throw new Error(`Expected inherited amount 450.00 with isInherited=true, got ${JSON.stringify(inheritedAlim)}`);
  }
  if (inheritedTrans.amount !== "120.00" || inheritedTrans.isInherited !== true) {
    throw new Error(`Expected inherited amount 120.00 with isInherited=true, got ${JSON.stringify(inheritedTrans)}`);
  }
  console.log("✓ Historical inheritance works seamlessly for unconfigured subsequent months.");

  // 5. Override in 2026-04 and verify immutability of 2026-03
  console.log(`\n[Test 4] Overriding budget in 2026-04 and verifying immutability of 2026-03...`);
  await app.request("/budgets", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      period: "2026-04",
      budgets: [
        { categoryId: alimentacion.categoryId, amount: "500.00" }
      ]
    })
  });

  const check2026_03 = await (await app.request("/budgets?period=2026-03", {
    headers: { Authorization: `Bearer ${token}` }
  })).json() as any;

  const alim2026_03 = check2026_03.data.find((b: any) => b.categoryId === alimentacion.categoryId);
  if (alim2026_03.amount !== "450.00") {
    throw new Error(`2026-03 was mutated! Expected 450.00, got ${alim2026_03.amount}`);
  }
  console.log("✓ Budgets are strictly immutable across historical periods.");

  // 6. Test GET /analytics/categories
  console.log(`\n[Test 5] Testing GET /analytics/categories with income and expenditures...`);
  const db = getDb();
  const connId = crypto.randomUUID();
  const accId = crypto.randomUUID();

  await db.insert(bankConnections).values({
    id: connId,
    userId,
    bankName: "Santander",
    aspspName: "Banco Santander",
    aspspCountry: "ES",
    sessionIdEnc: "enc_dummy",
    validUntil: new Date(Date.now() + 86400000).toISOString(),
    status: "active"
  });

  await db.insert(accounts).values({
    id: accId,
    connectionId: connId,
    iban: "ES9121000418450200051332",
    alias: "Main Account",
    currency: "EUR"
  });

  // Insert transactions in 2026-03 cycle (March 2026)
  // Income: +2500 EUR
  // Expense 1: -200 EUR (Alimentación)
  // Expense 2: -50 EUR (Transporte)
  // Expense 3: -30 EUR (Uncategorized)
  await db.insert(transactions).values([
    {
      id: crypto.randomUUID(),
      accountId: accId,
      amount: "2500.00",
      currency: "EUR",
      description: "NOMINA MENSUAL",
      category: null,
      bookedAt: "2026-03-05T10:00:00.000Z",
      raw: "{}"
    },
    {
      id: crypto.randomUUID(),
      accountId: accId,
      amount: "-200.00",
      currency: "EUR",
      description: "MERCADONA COMPRA",
      category: alimentacion.categoryName,
      bookedAt: "2026-03-10T12:00:00.000Z",
      raw: "{}"
    },
    {
      id: crypto.randomUUID(),
      accountId: accId,
      amount: "-50.00",
      currency: "EUR",
      description: "METRO MADRID",
      category: transporte.categoryName,
      bookedAt: "2026-03-15T15:00:00.000Z",
      raw: "{}"
    },
    {
      id: crypto.randomUUID(),
      accountId: accId,
      amount: "-30.00",
      currency: "EUR",
      description: "UNKNOWN STORE",
      category: null,
      bookedAt: "2026-03-20T18:00:00.000Z",
      raw: "{}"
    }
  ]);

  const analyticsRes = await app.request("/analytics/categories?period=2026-03", {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (analyticsRes.status !== 200) {
    throw new Error(`GET /analytics/categories failed: ${await analyticsRes.text()}`);
  }

  const analytics = (await analyticsRes.json()) as any;
  console.log("Analytics Response Summary:", JSON.stringify(analytics.summary, null, 2));

  if (analytics.summary.totalIncome !== 2500) {
    throw new Error(`Expected totalIncome 2500, got ${analytics.summary.totalIncome}`);
  }
  if (analytics.summary.totalSpent !== 280) {
    throw new Error(`Expected totalSpent 280, got ${analytics.summary.totalSpent}`);
  }
  if (analytics.summary.netSavings !== 2220) {
    throw new Error(`Expected netSavings 2220, got ${analytics.summary.netSavings}`);
  }
  if (analytics.uncategorized.spentAmount !== 30) {
    throw new Error(`Expected uncategorized 30, got ${analytics.uncategorized.spentAmount}`);
  }

  const alimAnalytics = analytics.categories.find((c: any) => c.categoryId === alimentacion.categoryId);
  if (alimAnalytics.spentAmount !== 200 || alimAnalytics.budgetAmount !== 450 || alimAnalytics.remainingAmount !== 250) {
    throw new Error(`Alimentación analytics mismatch: ${JSON.stringify(alimAnalytics)}`);
  }
  console.log("✓ Category breakdown, budget comparisons and macro metrics correctly calculated!");

  console.log("\n=======================================================");
  console.log("🎉 ALL HITO 12 BACKEND TESTS PASSED SUCCESSFULLY 🎉");
  console.log("=======================================================\n");
}

runTests().catch((err) => {
  console.error("Test failure:", err);
  process.exit(1);
});
