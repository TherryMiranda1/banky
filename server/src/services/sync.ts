import { IBankingAdapter, BankAccount } from "../core/ports/IBankingAdapter.js";
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

    const expireConditions = [lte(bankConnections.validUntil, nowIso), ne(bankConnections.status, "expired")];
    if (userId) expireConditions.push(eq(bankConnections.userId, userId));
    await this.db.update(bankConnections).set({ status: "expired" }).where(and(...expireConditions));

    const conditions = [
      eq(bankConnections.status, "active"),
      gt(bankConnections.validUntil, nowIso),
      ne(bankConnections.aspspName, "cash")
    ];

    if (userId) {
      conditions.push(eq(bankConnections.userId, userId));
    }

    const connections = await this.db
      .select({
        id: bankConnections.id,
        userId: bankConnections.userId,
        aspspName: bankConnections.aspspName,
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
            const targetAccountId = await this.resolveTargetAccount(conn.userId, conn.id, account);

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
              .where(eq(transactions.accountId, targetAccountId));

            const fromDate = latestTx?.maxBooked ? latestTx.maxBooked.split("T")[0] : undefined;
            const txList = await this.adapter.getTransactions(account.uid, sessionId, fromDate);

            let insertedCount = 0;
            for (const tx of txList) {
              const initialCategory = engine.evaluate({
                description: tx.description || null,
                amount: tx.amount,
                accountId: targetAccountId
              });
              const sourceId = tx.id;
              const compositeId = `${targetAccountId}::${sourceId}`;

              const res = await this.db
                .insert(transactions)
                .values({
                  id: compositeId,
                  sourceId: sourceId,
                  accountId: targetAccountId,
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
              .where(eq(accounts.id, targetAccountId));
          } catch (accErr: unknown) {
            const accErrMsg = accErr instanceof Error ? accErr.message : String(accErr);
            console.error(`[SyncService] Error syncing account ${account.uid}:`, accErrMsg);
            errors.push({ connectionId: conn.id, error: `Account ${account.uid}: ${accErrMsg}` });
          }
        }

        syncedCount++;
      } catch (err: unknown) {
        const errStatus = err instanceof AppError ? err.statusCode : typeof err === "object" && err !== null ? ((err as any).statusCode || (err as any).status) : null;
        if (errStatus === 401 || errStatus === 403) {
          await this.db.update(bankConnections).set({ status: "expired" }).where(eq(bankConnections.id, conn.id));
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

  private async resolveTargetAccount(
    userId: string,
    connId: string,
    account: BankAccount
  ): Promise<string> {
    let existing: { id: string } | undefined;
    if (account.iban) {
      [existing] = await this.db
        .select({ id: accounts.id })
        .from(accounts)
        .innerJoin(bankConnections, eq(accounts.connectionId, bankConnections.id))
        .where(and(eq(bankConnections.userId, userId), eq(accounts.iban, account.iban)))
        .limit(1);
    }
    if (!existing && account.identificationHash) {
      [existing] = await this.db
        .select({ id: accounts.id })
        .from(accounts)
        .innerJoin(bankConnections, eq(accounts.connectionId, bankConnections.id))
        .where(and(eq(bankConnections.userId, userId), eq(accounts.identificationHash, account.identificationHash)))
        .limit(1);
    }
    if (!existing) {
      [existing] = await this.db
        .select({ id: accounts.id })
        .from(accounts)
        .innerJoin(bankConnections, eq(accounts.connectionId, bankConnections.id))
        .where(and(eq(bankConnections.userId, userId), eq(accounts.id, account.uid)))
        .limit(1);
    }

    const targetId = existing ? existing.id : account.uid;

    if (existing) {
      await this.db
        .update(accounts)
        .set({
          connectionId: connId,
          identificationHash: account.identificationHash || sql`${accounts.identificationHash}`,
          alias: sql`COALESCE(${account.name || null}, ${accounts.alias})`,
          currency: account.currency
        })
        .where(eq(accounts.id, targetId));
    } else {
      await this.db
        .insert(accounts)
        .values({
          id: targetId,
          connectionId: connId,
          iban: account.iban || null,
          identificationHash: account.identificationHash || null,
          alias: account.name || null,
          currency: account.currency,
          lastBalance: null,
          syncedAt: null
        })
        .onConflictDoUpdate({
          target: accounts.id,
          set: {
            connectionId: connId,
            iban: sql`COALESCE(${account.iban || null}, ${accounts.iban})`,
            identificationHash: account.identificationHash || sql`${accounts.identificationHash}`,
            alias: sql`COALESCE(${account.name || null}, ${accounts.alias})`,
            currency: account.currency
          }
        });
    }

    return targetId;
  }
}
