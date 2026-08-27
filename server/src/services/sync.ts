import { IBankingAdapter } from "../core/ports/IBankingAdapter.js";
import { EnableBankingAdapter } from "../core/infra/enable-banking/EnableBankingAdapter.js";
import { IDatabase, getDatabase } from "../db/index.js";
import { decrypt } from "./crypto.js";
import { AppError } from "../errors/AppError.js";

export interface SyncErrorItem {
  connectionId: string;
  error: string;
}

export interface SyncResult {
  synced: number;
  accounts: number;
  transactions: number;
  errors: SyncErrorItem[];
}

interface ConnectionRow {
  id: string;
  session_id_enc: string;
  valid_until: string;
  status: string;
}

interface AccountRow {
  synced_at: string | null;
}

export class SyncService {
  constructor(
    private readonly adapter: IBankingAdapter = new EnableBankingAdapter(),
    private readonly dbInstance?: IDatabase
  ) {}

  private get db(): IDatabase {
    return this.dbInstance || getDatabase();
  }

  async syncAll(userId?: string): Promise<SyncResult> {
    if (userId) {
      await this.db.execute(
        "UPDATE bank_connections SET status = 'expired' WHERE user_id = ? AND datetime(valid_until) <= datetime('now') AND status != 'expired'",
        [userId]
      );
    } else {
      await this.db.execute(
        "UPDATE bank_connections SET status = 'expired' WHERE datetime(valid_until) <= datetime('now') AND status != 'expired'"
      );
    }

    const connections = await this.db.query<ConnectionRow>(
      userId
        ? "SELECT id, session_id_enc, valid_until, status FROM bank_connections WHERE status = 'active' AND user_id = ? AND datetime(valid_until) > datetime('now')"
        : "SELECT id, session_id_enc, valid_until, status FROM bank_connections WHERE status = 'active' AND datetime(valid_until) > datetime('now')",
      userId ? [userId] : []
    );

    let syncedCount = 0;
    let totalAccounts = 0;
    let totalTransactions = 0;
    const errors: SyncErrorItem[] = [];

    for (const conn of connections) {
      try {
        const sessionId = decrypt(conn.session_id_enc);
        const accounts = await this.adapter.getAccounts(sessionId);
        totalAccounts += accounts.length;

        for (const account of accounts) {
          await this.db.execute(
            `INSERT INTO accounts (id, connection_id, iban, alias, currency, last_balance, synced_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET
               connection_id = excluded.connection_id,
               iban = COALESCE(excluded.iban, accounts.iban),
               alias = COALESCE(excluded.alias, accounts.alias),
               currency = excluded.currency`,
            [account.uid, conn.id, account.iban, account.name, account.currency, null, null]
          );

          const balances = await this.adapter.getBalances(account.uid, sessionId);
          const lastBalanceJson = JSON.stringify(balances);

          const latestTx = await this.db.queryOne<{ max_booked: string | null }>(
            "SELECT MAX(booked_at) as max_booked FROM transactions WHERE account_id = ?",
            [account.uid]
          );
          const fromDate = latestTx?.max_booked ? latestTx.max_booked.split("T")[0] : undefined;

          const transactions = await this.adapter.getTransactions(account.uid, sessionId, fromDate);

          let insertedCount = 0;
          for (const tx of transactions) {
            const result = await this.db.execute(
              `INSERT OR IGNORE INTO transactions (id, account_id, amount, currency, description, category, booked_at, raw)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                tx.id,
                account.uid,
                tx.amount,
                tx.currency,
                tx.description,
                null,
                tx.bookedAt,
                JSON.stringify(tx)
              ]
            );
            if (result.changes > 0) {
              insertedCount++;
            }
          }

          totalTransactions += insertedCount;
          const now = new Date().toISOString();
          await this.db.execute(
            "UPDATE accounts SET last_balance = ?, synced_at = ? WHERE id = ?",
            [lastBalanceJson, now, account.uid]
          );
        }

        syncedCount++;
      } catch (err: unknown) {
        const isAuthError =
          (err instanceof AppError && (err.statusCode === 401 || err.statusCode === 403)) ||
          (typeof err === "object" &&
            err !== null &&
            "statusCode" in err &&
            (err.statusCode === 401 || err.statusCode === 403)) ||
          (typeof err === "object" &&
            err !== null &&
            "status" in err &&
            (err.status === 401 || err.status === 403));

        if (isAuthError) {
          await this.db.execute(
            "UPDATE bank_connections SET status = 'expired' WHERE id = ?",
            [conn.id]
          );
        }

        const errorMessage = err instanceof Error ? err.message : String(err);
        errors.push({ connectionId: conn.id, error: errorMessage });
      }
    }

    return {
      synced: syncedCount,
      accounts: totalAccounts,
      transactions: totalTransactions,
      errors
    };
  }
}
