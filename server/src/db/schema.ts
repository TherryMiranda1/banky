import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import type Database from "better-sqlite3";

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    name: text("name").notNull(),
    cutoffDay: integer("cutoff_day").notNull().default(1),
    createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
    updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`)
  },
  (table) => [
    index("idx_users_email").on(table.email)
  ]
);

export const bankConnections = sqliteTable(
  "bank_connections",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().default("default-user").references(() => users.id, { onDelete: "cascade" }),
    bankName: text("bank_name").notNull(),
    aspspName: text("aspsp_name").notNull(),
    aspspCountry: text("aspsp_country").notNull(),
    logoUrl: text("logo_url"),
    sessionIdEnc: text("session_id_enc").notNull(),
    validUntil: text("valid_until").notNull(),
    status: text("status").notNull().default("active"),
    createdAt: text("created_at").notNull().default(sql`(datetime('now'))`)
  },
  (table) => [
    index("idx_bank_connections_user").on(table.userId)
  ]
);

export const accounts = sqliteTable(
  "accounts",
  {
    id: text("id").primaryKey(),
    connectionId: text("connection_id").notNull().references(() => bankConnections.id, { onDelete: "cascade" }),
    iban: text("iban"),
    alias: text("alias"),
    nickname: text("nickname"),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    position: integer("position").notNull().default(0),
    currency: text("currency").notNull(),
    lastBalance: text("last_balance"),
    syncedAt: text("synced_at")
  },
  (table) => [
    index("idx_accounts_connection").on(table.connectionId)
  ]
);

export const transactions = sqliteTable(
  "transactions",
  {
    id: text("id").primaryKey(),
    sourceId: text("source_id"),
    accountId: text("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
    amount: text("amount").notNull(),
    currency: text("currency").notNull(),
    description: text("description"),
    category: text("category"),
    bookedAt: text("booked_at").notNull(),
    isTransfer: integer("is_transfer", { mode: "boolean" }).notNull().default(false),
    transferMatchId: text("transfer_match_id"),
    raw: text("raw").notNull()
  },
  (table) => [
    index("idx_transactions_account").on(table.accountId),
    index("idx_transactions_booked").on(table.bookedAt),
    index("idx_transactions_source").on(table.accountId, table.sourceId),
    index("idx_transactions_transfer").on(table.isTransfer)
  ]
);

export const categories = sqliteTable(
  "categories",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color").notNull(),
    icon: text("icon").notNull(),
    position: integer("position").notNull().default(0),
    createdAt: text("created_at").notNull().default(sql`(datetime('now'))`)
  },
  (table) => [
    index("idx_categories_user").on(table.userId)
  ]
);

export const categorizationRules = sqliteTable(
  "categorization_rules",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    categoryId: text("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
    accountId: text("account_id").references(() => accounts.id, { onDelete: "cascade" }),
    direction: text("direction"),
    pattern: text("pattern"),
    priority: integer("priority").notNull().default(0),
    createdAt: text("created_at").notNull().default(sql`(datetime('now'))`)
  },
  (table) => [
    index("idx_categorization_rules_user").on(table.userId),
    index("idx_categorization_rules_category").on(table.categoryId),
    index("idx_categorization_rules_account").on(table.accountId)
  ]
);

export const categoryBudgets = sqliteTable(
  "category_budgets",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    categoryId: text("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
    period: text("period").notNull(),
    amount: text("amount").notNull(),
    createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
    updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`)
  },
  (table) => [
    uniqueIndex("idx_budgets_user_period").on(table.userId, table.categoryId, table.period),
    index("idx_budgets_user_period_lookup").on(table.userId, table.period)
  ]
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type BankConnection = typeof bankConnections.$inferSelect;
export type NewBankConnection = typeof bankConnections.$inferInsert;

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

export type CategorizationRule = typeof categorizationRules.$inferSelect;
export type NewCategorizationRule = typeof categorizationRules.$inferInsert;

export type CategoryBudget = typeof categoryBudgets.$inferSelect;
export type NewCategoryBudget = typeof categoryBudgets.$inferInsert;

export function runMigrations(db: Database.Database): void {
  db.pragma("foreign_keys = ON");
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            TEXT PRIMARY KEY,
      email         TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name          TEXT NOT NULL,
      cutoff_day    INTEGER NOT NULL DEFAULT 1,
      created_at    TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS bank_connections (
      id            TEXT PRIMARY KEY,
      user_id       TEXT NOT NULL DEFAULT 'default-user' REFERENCES users(id) ON DELETE CASCADE,
      bank_name     TEXT NOT NULL,
      aspsp_name    TEXT NOT NULL,
      aspsp_country TEXT NOT NULL,
      session_id_enc TEXT NOT NULL,
      valid_until   TEXT NOT NULL,
      status        TEXT NOT NULL DEFAULT 'active',
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id            TEXT PRIMARY KEY,
      connection_id TEXT NOT NULL REFERENCES bank_connections(id) ON DELETE CASCADE,
      iban          TEXT,
      alias         TEXT,
      nickname      TEXT,
      is_active     INTEGER NOT NULL DEFAULT 1,
      position      INTEGER NOT NULL DEFAULT 0,
      currency      TEXT NOT NULL,
      last_balance  TEXT,
      synced_at     TEXT
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id                TEXT PRIMARY KEY,
      source_id         TEXT,
      account_id        TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      amount            TEXT NOT NULL,
      currency          TEXT NOT NULL,
      description       TEXT,
      category          TEXT,
      booked_at         TEXT NOT NULL,
      is_transfer       INTEGER NOT NULL DEFAULT 0,
      transfer_match_id TEXT,
      raw               TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      id         TEXT PRIMARY KEY,
      user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name       TEXT NOT NULL,
      color      TEXT NOT NULL,
      icon       TEXT NOT NULL,
      position   INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS categorization_rules (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
      account_id  TEXT REFERENCES accounts(id) ON DELETE CASCADE,
      direction   TEXT,
      pattern     TEXT,
      priority    INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS category_budgets (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
      period      TEXT NOT NULL,
      amount      TEXT NOT NULL,
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const userCols = db.prepare("PRAGMA table_info(users)").all() as Array<{ name: string }>;
  const hasCutoffDay = userCols.some((col) => col.name === "cutoff_day");
  if (!hasCutoffDay) {
    db.exec("ALTER TABLE users ADD COLUMN cutoff_day INTEGER NOT NULL DEFAULT 1");
  }

  const connCols = db.prepare("PRAGMA table_info(bank_connections)").all() as Array<{ name: string }>;
  const hasStatus = connCols.some((col) => col.name === "status");
  if (!hasStatus) {
    db.exec("ALTER TABLE bank_connections ADD COLUMN status TEXT NOT NULL DEFAULT 'active'");
  }
  const hasUserId = connCols.some((col) => col.name === "user_id");
  if (!hasUserId) {
    db.exec("ALTER TABLE bank_connections ADD COLUMN user_id TEXT NOT NULL DEFAULT 'default-user'");
  }
  const hasLogoUrl = connCols.some((col) => col.name === "logo_url");
  if (!hasLogoUrl) {
    db.exec("ALTER TABLE bank_connections ADD COLUMN logo_url TEXT");
  }

  const accCols = db.prepare("PRAGMA table_info(accounts)").all() as Array<{ name: string }>;
  const hasIsActive = accCols.some((col) => col.name === "is_active");
  if (!hasIsActive) {
    db.exec("ALTER TABLE accounts ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1");
  }
  const hasNickname = accCols.some((col) => col.name === "nickname");
  if (!hasNickname) {
    db.exec("ALTER TABLE accounts ADD COLUMN nickname TEXT");
  }
  const hasAccPosition = accCols.some((col) => col.name === "position");
  if (!hasAccPosition) {
    db.exec("ALTER TABLE accounts ADD COLUMN position INTEGER NOT NULL DEFAULT 0");
  }

  const txCols = db.prepare("PRAGMA table_info(transactions)").all() as Array<{ name: string }>;
  const hasSourceId = txCols.some((col) => col.name === "source_id");
  if (!hasSourceId) {
    db.exec("ALTER TABLE transactions ADD COLUMN source_id TEXT");
  }
  const hasIsTransfer = txCols.some((col) => col.name === "is_transfer");
  if (!hasIsTransfer) {
    db.exec("ALTER TABLE transactions ADD COLUMN is_transfer INTEGER NOT NULL DEFAULT 0");
  }
  const hasTransferMatchId = txCols.some((col) => col.name === "transfer_match_id");
  if (!hasTransferMatchId) {
    db.exec("ALTER TABLE transactions ADD COLUMN transfer_match_id TEXT");
  }

  const catCols = db.prepare("PRAGMA table_info(categories)").all() as Array<{ name: string }>;
  const hasCatPosition = catCols.some((col) => col.name === "position");
  if (!hasCatPosition) {
    db.exec("ALTER TABLE categories ADD COLUMN position INTEGER NOT NULL DEFAULT 0");
  }

  const ruleCols = db.prepare("PRAGMA table_info(categorization_rules)").all() as Array<{ name: string }>;
  const hasAccountId = ruleCols.some((col) => col.name === "account_id");
  if (!hasAccountId) {
    db.exec("ALTER TABLE categorization_rules ADD COLUMN account_id TEXT REFERENCES accounts(id) ON DELETE CASCADE");
  }
  const hasDirection = ruleCols.some((col) => col.name === "direction");
  if (!hasDirection) {
    db.exec("ALTER TABLE categorization_rules ADD COLUMN direction TEXT");
  }

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_bank_connections_user ON bank_connections(user_id);
    CREATE INDEX IF NOT EXISTS idx_accounts_connection ON accounts(connection_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_booked ON transactions(booked_at);
    CREATE INDEX IF NOT EXISTS idx_transactions_source ON transactions(account_id, source_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_transfer ON transactions(is_transfer);
    CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id);
    CREATE INDEX IF NOT EXISTS idx_categorization_rules_user ON categorization_rules(user_id);
    CREATE INDEX IF NOT EXISTS idx_categorization_rules_category ON categorization_rules(category_id);
    CREATE INDEX IF NOT EXISTS idx_categorization_rules_account ON categorization_rules(account_id);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_budgets_user_period ON category_budgets(user_id, category_id, period);
    CREATE INDEX IF NOT EXISTS idx_budgets_user_period_lookup ON category_budgets(user_id, period);
  `);
}
