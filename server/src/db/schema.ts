import type Database from "better-sqlite3";

export function runMigrations(db: Database.Database): void {
  db.pragma("foreign_keys = ON");
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            TEXT PRIMARY KEY,
      email         TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name          TEXT NOT NULL,
      created_at    TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS bank_connections (
      id            TEXT PRIMARY KEY,
      user_id       TEXT NOT NULL DEFAULT 'default-user',
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
  `);

  const connCols = db.prepare("PRAGMA table_info(bank_connections)").all() as Array<{ name: string }>;
  const hasStatus = connCols.some((col) => col.name === "status");
  if (!hasStatus) {
    db.exec("ALTER TABLE bank_connections ADD COLUMN status TEXT NOT NULL DEFAULT 'active'");
  }
  const hasUserId = connCols.some((col) => col.name === "user_id");
  if (!hasUserId) {
    db.exec("ALTER TABLE bank_connections ADD COLUMN user_id TEXT NOT NULL DEFAULT 'default-user'");
  }

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_bank_connections_user ON bank_connections(user_id);
    CREATE INDEX IF NOT EXISTS idx_accounts_connection ON accounts(connection_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_booked ON transactions(booked_at);
  `);
}
