import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import crypto from "node:crypto";
import {
  getDb,
  categories,
  categorizationRules,
  transactions,
  accounts,
  bankConnections,
  eq,
  and,
  asc,
  desc,
  inArray
} from "../../db/index.js";
import { requireAuth } from "../../middleware/auth.js";
import { BadRequestError, NotFoundError, ConflictError } from "../../errors/AppError.js";
import { seedDefaultCategoriesIfEmpty } from "../../services/categories-seed.js";
import { CategorizationEngine } from "../../core/domain/categorization-engine.js";

export const categoriesRouter = new Hono();

categoriesRouter.use("*", requireAuth);

const CreateCategorySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(50),
  color: z.string().trim().min(1, "Color is required").max(30),
  icon: z.string().trim().min(1, "Icon is required").max(50),
  realmSprite: z.string().trim().optional().nullable()
});

const UpdateCategorySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(50),
  color: z.string().trim().min(1, "Color is required").max(30),
  icon: z.string().trim().min(1, "Icon is required").max(50),
  realmSprite: z.string().trim().optional().nullable()
});

const ReorderCategoriesSchema = z.object({
  categoryIds: z.array(z.string().min(1)).min(1, "categoryIds must contain at least one ID")
});

const validateRegexPattern = (val: string | null | undefined): boolean => {
  if (!val || !val.trim()) return true;
  let normalized = val.trim();
  if (normalized.includes("\n")) {
    const lines = normalized
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (lines.length > 0) {
      normalized = lines.map((l) => `(?:${l})`).join("|");
    }
  }
  try {
    new RegExp(normalized, "i");
    return true;
  } catch {
    return false;
  }
};

const CreateRuleSchema = z
  .object({
    categoryId: z.string().min(1, "Category ID is required"),
    pattern: z
      .string()
      .trim()
      .optional()
      .nullable()
      .refine(validateRegexPattern, "Invalid regular expression pattern"),
    accountId: z.string().trim().optional().nullable(),
    direction: z.enum(["in", "out", "all"]).optional().nullable(),
    priority: z.coerce.number().int().default(0)
  })
  .refine((data) => {
    const hasPattern = Boolean(data.pattern && data.pattern.trim());
    const hasAccount = Boolean(data.accountId && data.accountId.trim());
    const hasDirection = Boolean(data.direction && data.direction !== "all");
    return hasPattern || hasAccount || hasDirection;
  }, "Rule must specify at least a pattern, account, or flow direction");

const UpdateRuleSchema = z
  .object({
    categoryId: z.string().min(1, "Category ID is required"),
    pattern: z
      .string()
      .trim()
      .optional()
      .nullable()
      .refine(validateRegexPattern, "Invalid regular expression pattern"),
    accountId: z.string().trim().optional().nullable(),
    direction: z.enum(["in", "out", "all"]).optional().nullable(),
    priority: z.coerce.number().int().default(0)
  })
  .refine((data) => {
    const hasPattern = Boolean(data.pattern && data.pattern.trim());
    const hasAccount = Boolean(data.accountId && data.accountId.trim());
    const hasDirection = Boolean(data.direction && data.direction !== "all");
    return hasPattern || hasAccount || hasDirection;
  }, "Rule must specify at least a pattern, account, or flow direction");

// GET /categories - List categories for user (seeds defaults if empty)
categoriesRouter.get("/", async (c) => {
  const userId = c.get("userId");
  const db = getDb();

  await seedDefaultCategoriesIfEmpty(db, userId);

  const list = await db
    .select()
    .from(categories)
    .where(eq(categories.userId, userId))
    .orderBy(asc(categories.position), asc(categories.name));

  return c.json({ data: list });
});

// PUT /categories/reorder - Update category display positions
categoriesRouter.put(
  "/reorder",
  zValidator("json", ReorderCategoriesSchema, (result) => {
    if (!result.success) {
      const issue = result.error.issues[0];
      throw new BadRequestError(issue ? `${issue.path.join(".")}: ${issue.message}` : "Invalid body");
    }
  }),
  async (c) => {
    const userId = c.get("userId");
    const { categoryIds } = c.req.valid("json");
    const db = getDb();

    for (let i = 0; i < categoryIds.length; i++) {
      await db
        .update(categories)
        .set({ position: i })
        .where(and(eq(categories.id, categoryIds[i]), eq(categories.userId, userId)));
    }

    const updatedList = await db
      .select()
      .from(categories)
      .where(eq(categories.userId, userId))
      .orderBy(asc(categories.position), asc(categories.name));

    return c.json({ data: updatedList });
  }
);

// POST /categories - Create custom category
categoriesRouter.post(
  "/",
  zValidator("json", CreateCategorySchema, (result) => {
    if (!result.success) {
      const issue = result.error.issues[0];
      throw new BadRequestError(issue ? `${issue.path.join(".")}: ${issue.message}` : "Invalid body");
    }
  }),
  async (c) => {
    const userId = c.get("userId");
    const { name, color, icon, realmSprite } = c.req.valid("json");
    const db = getDb();

    const categoryId = crypto.randomUUID();
    const now = new Date().toISOString();

    const existingCats = await db
      .select()
      .from(categories)
      .where(eq(categories.userId, userId));
    const nextPosition = existingCats.length;

    await db.insert(categories).values({
      id: categoryId,
      userId,
      name,
      color,
      icon,
      realmSprite: realmSprite ?? null,
      position: nextPosition,
      createdAt: now
    });

    const [created] = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
      .limit(1);

    return c.json({ data: created }, 201);
  }
);

// PUT /categories/:id - Update category
categoriesRouter.put(
  "/:id",
  zValidator("json", UpdateCategorySchema, (result) => {
    if (!result.success) {
      const issue = result.error.issues[0];
      throw new BadRequestError(issue ? `${issue.path.join(".")}: ${issue.message}` : "Invalid body");
    }
  }),
  async (c) => {
    const userId = c.get("userId");
    const id = c.req.param("id");
    const { name, color, icon, realmSprite } = c.req.valid("json");
    const db = getDb();

    const [existing] = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
      .limit(1);

    if (!existing) {
      throw new NotFoundError(`Category with id '${id}' not found`);
    }

    await db
      .update(categories)
      .set({ name, color, icon, realmSprite: realmSprite ?? null })
      .where(and(eq(categories.id, id), eq(categories.userId, userId)));

    const [updated] = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
      .limit(1);

    return c.json({ data: updated });
  }
);

// DELETE /categories/:id - Delete category and unassign associated transactions
categoriesRouter.delete("/:id", async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");
  const db = getDb();

  const [existing] = await db
    .select()
    .from(categories)
    .where(and(eq(categories.id, id), eq(categories.userId, userId)))
    .limit(1);

  if (!existing) {
    throw new NotFoundError(`Category with id '${id}' not found`);
  }

  // Find all account IDs of this user to unassign matching category names in transactions
  const userAccounts = await db
    .select({ id: accounts.id })
    .from(accounts)
    .innerJoin(bankConnections, eq(accounts.connectionId, bankConnections.id))
    .where(eq(bankConnections.userId, userId));

  if (userAccounts.length > 0) {
    const accountIds = userAccounts.map((a) => a.id);
    await db
      .update(transactions)
      .set({ category: null })
      .where(
        and(
          inArray(transactions.accountId, accountIds),
          eq(transactions.category, existing.name)
        )
      );
  }

  await db
    .delete(categories)
    .where(and(eq(categories.id, id), eq(categories.userId, userId)));

  return c.json({ success: true, id });
});

// GET /categories/rules - List categorization rules with category & account details
categoriesRouter.get("/rules", async (c) => {
  const userId = c.get("userId");
  const db = getDb();

  const rules = await db
    .select({
      id: categorizationRules.id,
      userId: categorizationRules.userId,
      categoryId: categorizationRules.categoryId,
      accountId: categorizationRules.accountId,
      direction: categorizationRules.direction,
      pattern: categorizationRules.pattern,
      priority: categorizationRules.priority,
      createdAt: categorizationRules.createdAt,
      categoryName: categories.name,
      categoryColor: categories.color,
      categoryIcon: categories.icon,
      accountAlias: accounts.alias,
      accountNickname: accounts.nickname,
      accountIban: accounts.iban,
      accountBankName: bankConnections.bankName
    })
    .from(categorizationRules)
    .innerJoin(categories, eq(categorizationRules.categoryId, categories.id))
    .leftJoin(accounts, eq(categorizationRules.accountId, accounts.id))
    .leftJoin(bankConnections, eq(accounts.connectionId, bankConnections.id))
    .where(eq(categorizationRules.userId, userId))
    .orderBy(desc(categorizationRules.priority), asc(categorizationRules.createdAt));

  const formattedRules = rules.map((r) => {
    let accountName: string | null = null;
    if (r.accountId) {
      accountName = r.accountNickname || r.accountAlias || r.accountBankName || "Cuenta";
    }
    return {
      id: r.id,
      userId: r.userId,
      categoryId: r.categoryId,
      accountId: r.accountId,
      direction: r.direction,
      pattern: r.pattern,
      priority: r.priority,
      createdAt: r.createdAt,
      categoryName: r.categoryName,
      categoryColor: r.categoryColor,
      categoryIcon: r.categoryIcon,
      accountName,
      accountIban: r.accountIban
    };
  });

  return c.json({ data: formattedRules });
});

// POST /categories/rules - Create new rule
categoriesRouter.post(
  "/rules",
  zValidator("json", CreateRuleSchema, (result) => {
    if (!result.success) {
      const issue = result.error.issues[0];
      throw new BadRequestError(issue ? `${issue.path.join(".")}: ${issue.message}` : "Invalid body");
    }
  }),
  async (c) => {
    const userId = c.get("userId");
    const { categoryId, pattern, accountId, direction, priority } = c.req.valid("json");
    const db = getDb();

    const [category] = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
      .limit(1);

    if (!category) {
      throw new NotFoundError(`Category with id '${categoryId}' not found`);
    }

    const cleanPattern = pattern ? pattern.trim() : null;
    const cleanAccountId = accountId ? accountId.trim() : null;
    const cleanDirection = direction && direction !== "all" ? direction : null;

    if (cleanAccountId) {
      const [acc] = await db
        .select({ id: accounts.id })
        .from(accounts)
        .innerJoin(bankConnections, eq(accounts.connectionId, bankConnections.id))
        .where(and(eq(accounts.id, cleanAccountId), eq(bankConnections.userId, userId)))
        .limit(1);
      if (!acc) {
        throw new NotFoundError(`Account with id '${cleanAccountId}' not found`);
      }
    }

    const existingRules = await db
      .select()
      .from(categorizationRules)
      .where(eq(categorizationRules.userId, userId));

    const duplicate = existingRules.find((r) => {
      const sameCategory = r.categoryId === categoryId;
      const sameAccount = (r.accountId || null) === cleanAccountId;
      const sameDirection = (r.direction || null) === cleanDirection;
      const samePattern =
        (r.pattern ? r.pattern.trim().toLowerCase() : "") === (cleanPattern ? cleanPattern.toLowerCase() : "");
      return sameCategory && sameAccount && sameDirection && samePattern;
    });

    if (duplicate) {
      throw new ConflictError("An identical categorization rule already exists");
    }

    const ruleId = crypto.randomUUID();
    const now = new Date().toISOString();

    await db.insert(categorizationRules).values({
      id: ruleId,
      userId,
      categoryId,
      accountId: cleanAccountId,
      direction: cleanDirection,
      pattern: cleanPattern,
      priority: priority ?? 0,
      createdAt: now
    });

    const [created] = await db
      .select({
        id: categorizationRules.id,
        userId: categorizationRules.userId,
        categoryId: categorizationRules.categoryId,
        accountId: categorizationRules.accountId,
        direction: categorizationRules.direction,
        pattern: categorizationRules.pattern,
        priority: categorizationRules.priority,
        createdAt: categorizationRules.createdAt,
        categoryName: categories.name,
        categoryColor: categories.color,
        categoryIcon: categories.icon,
        accountAlias: accounts.alias,
        accountNickname: accounts.nickname,
        accountIban: accounts.iban,
        accountBankName: bankConnections.bankName
      })
      .from(categorizationRules)
      .innerJoin(categories, eq(categorizationRules.categoryId, categories.id))
      .leftJoin(accounts, eq(categorizationRules.accountId, accounts.id))
      .leftJoin(bankConnections, eq(accounts.connectionId, bankConnections.id))
      .where(and(eq(categorizationRules.id, ruleId), eq(categorizationRules.userId, userId)))
      .limit(1);

    const formatted = {
      id: created.id,
      userId: created.userId,
      categoryId: created.categoryId,
      accountId: created.accountId,
      direction: created.direction,
      pattern: created.pattern,
      priority: created.priority,
      createdAt: created.createdAt,
      categoryName: created.categoryName,
      categoryColor: created.categoryColor,
      categoryIcon: created.categoryIcon,
      accountName: created.accountNickname || created.accountAlias || created.accountBankName || null,
      accountIban: created.accountIban
    };

    return c.json({ data: formatted }, 201);
  }
);

// PUT /categories/rules/:id - Update existing rule
categoriesRouter.put(
  "/rules/:id",
  zValidator("json", UpdateRuleSchema, (result) => {
    if (!result.success) {
      const issue = result.error.issues[0];
      throw new BadRequestError(issue ? `${issue.path.join(".")}: ${issue.message}` : "Invalid body");
    }
  }),
  async (c) => {
    const userId = c.get("userId");
    const id = c.req.param("id");
    const { categoryId, pattern, accountId, direction, priority } = c.req.valid("json");
    const db = getDb();

    const [existingRule] = await db
      .select()
      .from(categorizationRules)
      .where(and(eq(categorizationRules.id, id), eq(categorizationRules.userId, userId)))
      .limit(1);

    if (!existingRule) {
      throw new NotFoundError(`Rule with id '${id}' not found`);
    }

    const [category] = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
      .limit(1);

    if (!category) {
      throw new NotFoundError(`Category with id '${categoryId}' not found`);
    }

    const cleanPattern = pattern ? pattern.trim() : null;
    const cleanAccountId = accountId ? accountId.trim() : null;
    const cleanDirection = direction && direction !== "all" ? direction : null;

    if (cleanAccountId) {
      const [acc] = await db
        .select({ id: accounts.id })
        .from(accounts)
        .innerJoin(bankConnections, eq(accounts.connectionId, bankConnections.id))
        .where(and(eq(accounts.id, cleanAccountId), eq(bankConnections.userId, userId)))
        .limit(1);
      if (!acc) {
        throw new NotFoundError(`Account with id '${cleanAccountId}' not found`);
      }
    }

    const otherRules = await db
      .select()
      .from(categorizationRules)
      .where(and(eq(categorizationRules.userId, userId)));

    const duplicate = otherRules.find((r) => {
      if (r.id === id) return false;
      const sameCategory = r.categoryId === categoryId;
      const sameAccount = (r.accountId || null) === cleanAccountId;
      const sameDirection = (r.direction || null) === cleanDirection;
      const samePattern =
        (r.pattern ? r.pattern.trim().toLowerCase() : "") === (cleanPattern ? cleanPattern.toLowerCase() : "");
      return sameCategory && sameAccount && sameDirection && samePattern;
    });

    if (duplicate) {
      throw new ConflictError("Another identical categorization rule already exists");
    }

    await db
      .update(categorizationRules)
      .set({
        categoryId,
        accountId: cleanAccountId,
        direction: cleanDirection,
        pattern: cleanPattern,
        priority: priority ?? 0
      })
      .where(and(eq(categorizationRules.id, id), eq(categorizationRules.userId, userId)));

    const [updated] = await db
      .select({
        id: categorizationRules.id,
        userId: categorizationRules.userId,
        categoryId: categorizationRules.categoryId,
        accountId: categorizationRules.accountId,
        direction: categorizationRules.direction,
        pattern: categorizationRules.pattern,
        priority: categorizationRules.priority,
        createdAt: categorizationRules.createdAt,
        categoryName: categories.name,
        categoryColor: categories.color,
        categoryIcon: categories.icon,
        accountAlias: accounts.alias,
        accountNickname: accounts.nickname,
        accountIban: accounts.iban,
        accountBankName: bankConnections.bankName
      })
      .from(categorizationRules)
      .innerJoin(categories, eq(categorizationRules.categoryId, categories.id))
      .leftJoin(accounts, eq(categorizationRules.accountId, accounts.id))
      .leftJoin(bankConnections, eq(accounts.connectionId, bankConnections.id))
      .where(and(eq(categorizationRules.id, id), eq(categorizationRules.userId, userId)))
      .limit(1);

    const formatted = {
      id: updated.id,
      userId: updated.userId,
      categoryId: updated.categoryId,
      accountId: updated.accountId,
      direction: updated.direction,
      pattern: updated.pattern,
      priority: updated.priority,
      createdAt: updated.createdAt,
      categoryName: updated.categoryName,
      categoryColor: updated.categoryColor,
      categoryIcon: updated.categoryIcon,
      accountName: updated.accountNickname || updated.accountAlias || updated.accountBankName || null,
      accountIban: updated.accountIban
    };

    return c.json({ data: formatted });
  }
);

// DELETE /categories/rules/:id - Delete rule
categoriesRouter.delete("/rules/:id", async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");
  const db = getDb();

  const [existing] = await db
    .select()
    .from(categorizationRules)
    .where(and(eq(categorizationRules.id, id), eq(categorizationRules.userId, userId)))
    .limit(1);

  if (!existing) {
    throw new NotFoundError(`Rule with id '${id}' not found`);
  }

  await db
    .delete(categorizationRules)
    .where(and(eq(categorizationRules.id, id), eq(categorizationRules.userId, userId)));

  return c.json({ success: true, id });
});

// POST /categories/rules/apply - Re-evaluate all user transactions with current rules
categoriesRouter.post("/rules/apply", async (c) => {
  const userId = c.get("userId");
  const db = getDb();

  const rawRules = await db
    .select({
      id: categorizationRules.id,
      pattern: categorizationRules.pattern,
      priority: categorizationRules.priority,
      accountId: categorizationRules.accountId,
      direction: categorizationRules.direction as any,
      categoryName: categories.name
    })
    .from(categorizationRules)
    .innerJoin(categories, eq(categorizationRules.categoryId, categories.id))
    .where(eq(categorizationRules.userId, userId));

  const engine = new CategorizationEngine(rawRules);

  const userTransactions = await db
    .select({
      id: transactions.id,
      description: transactions.description,
      amount: transactions.amount,
      accountId: transactions.accountId,
      currentCategory: transactions.category
    })
    .from(transactions)
    .innerJoin(accounts, eq(transactions.accountId, accounts.id))
    .innerJoin(bankConnections, eq(accounts.connectionId, bankConnections.id))
    .where(eq(bankConnections.userId, userId));

  let appliedCount = 0;

  for (const tx of userTransactions) {
    const matchedCategory = engine.evaluate(tx);
    if (matchedCategory && matchedCategory !== tx.currentCategory) {
      await db
        .update(transactions)
        .set({ category: matchedCategory })
        .where(eq(transactions.id, tx.id));
      appliedCount++;
    }
  }

  return c.json({
    applied: appliedCount,
    total: userTransactions.length
  });
});

