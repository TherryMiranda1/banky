-- Banky SQLite / Cloudflare D1 Database Schema

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name          TEXT NOT NULL,
  cutoff_day    INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS bank_connections (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL DEFAULT 'default-user' REFERENCES users(id) ON DELETE CASCADE,
  bank_name     TEXT NOT NULL,
  aspsp_name    TEXT NOT NULL,
  aspsp_country TEXT NOT NULL,
  logo_url      TEXT,
  session_id_enc TEXT NOT NULL,
  valid_until   TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'active',
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_bank_connections_user ON bank_connections(user_id);

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

CREATE INDEX IF NOT EXISTS idx_accounts_connection ON accounts(connection_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_booked ON transactions(booked_at);
CREATE INDEX IF NOT EXISTS idx_transactions_source ON transactions(account_id, source_id);
CREATE INDEX IF NOT EXISTS idx_transactions_transfer ON transactions(is_transfer);

CREATE TABLE IF NOT EXISTS categories (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  color        TEXT NOT NULL,
  icon         TEXT NOT NULL,
  realm_sprite TEXT,
  position     INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id);

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

CREATE INDEX IF NOT EXISTS idx_categorization_rules_user ON categorization_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_categorization_rules_category ON categorization_rules(category_id);
CREATE INDEX IF NOT EXISTS idx_categorization_rules_account ON categorization_rules(account_id);

CREATE TABLE IF NOT EXISTS category_budgets (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  period      TEXT NOT NULL,
  amount      TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_budgets_user_period ON category_budgets(user_id, category_id, period);
CREATE INDEX IF NOT EXISTS idx_budgets_user_period_lookup ON category_budgets(user_id, period);


