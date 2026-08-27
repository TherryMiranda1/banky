-- Banky SQLite / Cloudflare D1 Database Schema

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name          TEXT NOT NULL,
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
  currency      TEXT NOT NULL,
  last_balance  TEXT,
  synced_at     TEXT
);

CREATE TABLE IF NOT EXISTS transactions (
  id          TEXT PRIMARY KEY,
  account_id  TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  amount      TEXT NOT NULL,
  currency    TEXT NOT NULL,
  description TEXT,
  category    TEXT,
  booked_at   TEXT NOT NULL,
  raw         TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_accounts_connection ON accounts(connection_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_booked ON transactions(booked_at);
