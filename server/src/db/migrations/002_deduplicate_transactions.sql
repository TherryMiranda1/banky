-- Migration 002: Deduplicate transactions caused by random UUID fallback in sync
--
-- Root cause: EnableBankingAdapter generated crypto.randomUUID() when transaction_id
-- and entry_reference were both absent, causing the same transaction to be inserted
-- multiple times with different IDs on each sync run.
--
-- Safe strategy: Delete rows whose source_id is a UUID (length=36, hyphens at positions 9, 14)
-- AND there exists a sibling row for the same (account_id, booked_at, amount, currency)
-- with an entry_reference-based source_id (pattern: YYYY-MM-DD.N).
--
-- This never collapses two legitimate transactions with the same amount+date — it only
-- removes UUID ghosts that have a real entry_reference counterpart.

-- Dry-run: count rows that will be deleted
-- SELECT COUNT(*) as rows_to_delete
-- FROM transactions t
-- WHERE length(t.source_id) = 36
--   AND substr(t.source_id, 9, 1) = '-'
--   AND substr(t.source_id, 14, 1) = '-'
--   AND EXISTS (
--     SELECT 1 FROM transactions t2
--     WHERE t2.account_id = t.account_id
--       AND t2.booked_at  = t.booked_at
--       AND t2.amount     = t.amount
--       AND t2.currency   = t.currency
--       AND t2.source_id GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9].*'
--   );

DELETE FROM transactions
WHERE length(source_id) = 36
  AND substr(source_id, 9, 1) = '-'
  AND substr(source_id, 14, 1) = '-'
  AND EXISTS (
    SELECT 1 FROM transactions t2
    WHERE t2.account_id = transactions.account_id
      AND t2.booked_at  = transactions.booked_at
      AND t2.amount     = transactions.amount
      AND t2.currency   = transactions.currency
      AND t2.source_id GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9].*'
  );
