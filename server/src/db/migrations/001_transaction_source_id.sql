-- Migration 001: Add source_id column and composite index to transactions table
-- Supports Option B (Clean reset of existing legacy simple ID transactions or in-place addition)

-- 1. Add source_id column
ALTER TABLE transactions ADD COLUMN source_id TEXT;

-- 2. Create composite index for account and source transactions
CREATE INDEX IF NOT EXISTS idx_transactions_source ON transactions(account_id, source_id);

-- Optional for Option B (Reset transactions table to re-sync cleanly):
-- DELETE FROM transactions;
