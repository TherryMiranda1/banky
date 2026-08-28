import { IBankingAdapter } from "../core/ports/IBankingAdapter.js";
import { getBankingAdapter } from "../core/infra/adapterFactory.js";
import {
  AppDatabase,
  getDb,
  bankConnections,
  accounts,
  transactions,
  categories,
  categorizationRules,
  eq,
  and,
  ne,
  lte,
  gt,
  sql
} from "../db/index.js";
import { decrypt } from "./crypto.js";
import { AppError } from "../errors/AppError.js";
import { CategorizationEngine } from "../core/domain/categorization-engine.js";
import { TransferDetectionService } from "./transfer-detection.js";

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

export class SyncService {
  private readonly adapter: IBankingAdapter;

  constructor(
    adapter?: IBankingAdapter,
    private readonly dbInstance?: AppDatabase
  ) {
    this.adapter = adapter || getBankingAdapter();
  }


  private get db(): AppDatabase {
    return this.dbInstance || getDb();
  }

  async syncAll(userId?: string): Promise<SyncResult> {
    const nowIso = new Date().toISOString();

    if (userId) {
      await this.db
        .update(bankConnections)
        .set({ status: "expired" })
        .where(
          and(
            eq(bankConnections.userId, userId),
            lte(bankConnections.validUntil, nowIso),
            ne(bankConnections.status, "expired")
          )
        );
    } else {
      await this.db
        .update(bankConnections)
        .set({ status: "expired" })
        .where(
          and(
            lte(bankConnections.validUntil, nowIso),
            ne(bankConnections.status, "expired")
          )
        );
    }

    const conditions = [
      eq(bankConnections.status, "active"),
      gt(bankConnections.validUntil, nowIso)
    ];

    if (userId) {
      conditions.push(eq(bankConnections.userId, userId));
    }

    const connections = await this.db
      .select({
        id: bankConnections.id,
        userId: bankConnections.userId,
        sessionIdEnc: bankConnections.sessionIdEnc,
        validUntil: bankConnections.validUntil,
        status: bankConnections.status
      })
      .from(bankConnections)
      .where(and(...conditions));

    let syncedCount = 0;
    let totalAccounts = 0;
    let totalTransactions = 0;
    const errors: SyncErrorItem[] = [];

    for (const conn of connections) {
      try {
        const sessionId = decrypt(conn.sessionIdEnc);
        const bankAccounts = await this.adapter.getAccounts(sessionId);
        totalAccounts += bankAccounts.length;

        // Fetch user's categorization rules for auto-categorization
        const userRules = await this.db
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
          .where(eq(categorizationRules.userId, conn.userId));

        const engine = new CategorizationEngine(userRules);

        for (const account of bankAccounts) {
          if (!account.uid || typeof account.uid !== "string" || account.uid.trim() === "") {
            console.warn(`[SyncService] Skipping account without valid uid in connection ${conn.id}`);
            continue;
          }

          try {
            await this.db
              .insert(accounts)
              .values({
                id: account.uid,
                connectionId: conn.id,
                iban: account.iban || null,
                alias: account.name || null,
                currency: account.currency,
                lastBalance: null,
                syncedAt: null
              })
              .onConflictDoUpdate({
                target: accounts.id,
                set: {
                  connectionId: conn.id,
                  iban: sql`COALESCE(${account.iban || null}, ${accounts.iban})`,
                  alias: sql`COALESCE(${account.name || null}, ${accounts.alias})`,
                  currency: account.currency
                }
              });

            let lastBalanceJson: string | null = null;
            try {
              const balances = await this.adapter.getBalances(account.uid, sessionId);
              lastBalanceJson = JSON.stringify(balances);
            } catch (balErr) {
              console.warn(`[SyncService] Failed to fetch balances for account ${account.uid}:`, balErr);
            }

            const [latestTx] = await this.db
              .select({ maxBooked: sql<string | null>`MAX(${transactions.bookedAt})` })
              .from(transactions)
              .where(eq(transactions.accountId, account.uid));

            const fromDate = latestTx?.maxBooked ? latestTx.maxBooked.split("T")[0] : undefined;
            const txList = await this.adapter.getTransactions(account.uid, sessionId, fromDate);

            let insertedCount = 0;
            for (const tx of txList) {
              const initialCategory = engine.evaluate({
                description: tx.description || null,
                amount: tx.amount,
                accountId: account.uid
              });
              const sourceId = tx.id || null;
              const compositeId = sourceId ? `${account.uid}::${sourceId}` : `${account.uid}::${crypto.randomUUID()}`;

              const res = await this.db
                .insert(transactions)
                .values({
                  id: compositeId,
                  sourceId: sourceId,
                  accountId: account.uid,
                  amount: tx.amount,
                  currency: tx.currency,
                  description: tx.description || null,
                  category: initialCategory,
                  bookedAt: tx.bookedAt,
                  raw: JSON.stringify(tx.raw || tx)
                })
                .onConflictDoNothing();

              const changes = (res as any)?.changes ?? (res as any)?.meta?.changes ?? (res as any)?.rowsAffected ?? 0;
              if (changes > 0) {
                insertedCount++;
              }
            }

            totalTransactions += insertedCount;
            const now = new Date().toISOString();

            await this.db
              .update(accounts)
              .set({
                lastBalance: lastBalanceJson,
                syncedAt: now
              })
              .where(eq(accounts.id, account.uid));
          } catch (accErr: unknown) {
            const accErrMsg = accErr instanceof Error ? accErr.message : String(accErr);
            console.error(`[SyncService] Error syncing account ${account.uid}:`, accErrMsg);
            errors.push({ connectionId: conn.id, error: `Account ${account.uid}: ${accErrMsg}` });
          }
        }

        syncedCount++;
      } catch (err: unknown) {
        const isAuthError =
          (err instanceof AppError && (err.statusCode === 401 || err.statusCode === 403)) ||
          (typeof err === "object" &&
            err !== null &&
            "statusCode" in err &&
            ((err as any).statusCode === 401 || (err as any).statusCode === 403)) ||
          (typeof err === "object" &&
            err !== null &&
            "status" in err &&
            ((err as any).status === 401 || (err as any).status === 403));

        if (isAuthError) {
          await this.db
            .update(bankConnections)
            .set({ status: "expired" })
            .where(eq(bankConnections.id, conn.id));
        }

        const errorMessage = err instanceof Error ? err.message : String(err);
        errors.push({ connectionId: conn.id, error: errorMessage });
      }
    }

    if (userId) {
      try {
        const transferDetector = new TransferDetectionService();
        await transferDetector.detectAndMatchTransfers(userId);
      } catch (tErr) {
        console.warn("[SyncService] Transfer detection warning:", tErr);
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
