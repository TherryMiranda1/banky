import {
  getDb,
  transactions,
  accounts,
  bankConnections,
  categories,
  eq,
  and,
  sql
} from "../db/index.js";

export interface TransferDetectionResult {
  matchedPairs: number;
  totalTransfersMarked: number;
}

export class TransferDetectionService {
  private db = getDb();

  async ensureTransferCategory(userId: string): Promise<string> {
    const [existing] = await this.db
      .select({ id: categories.id })
      .from(categories)
      .where(and(eq(categories.userId, userId), eq(categories.name, "Traspasos")))
      .limit(1);

    if (existing) {
      return existing.id;
    }

    const newId = crypto.randomUUID();
    await this.db
      .insert(categories)
      .values({
        id: newId,
        userId,
        name: "Traspasos",
        color: "#3b82f6",
        icon: "ArrowLeftRight"
      })
      .onConflictDoNothing();

    return newId;
  }

  async detectAndMatchTransfers(userId: string): Promise<TransferDetectionResult> {
    await this.ensureTransferCategory(userId);

    // 1. Fetch all accounts for user
    const userAccounts = await this.db
      .select({
        id: accounts.id,
        iban: accounts.iban,
        alias: accounts.alias,
        nickname: accounts.nickname,
        bankName: bankConnections.bankName
      })
      .from(accounts)
      .innerJoin(bankConnections, eq(accounts.connectionId, bankConnections.id))
      .where(eq(bankConnections.userId, userId));

    if (userAccounts.length < 2) {
      return { matchedPairs: 0, totalTransfersMarked: 0 };
    }

    const accountIds = userAccounts.map((a) => a.id);
    const userIbans = new Set<string>();
    for (const a of userAccounts) {
      if (a.iban) {
        userIbans.add(a.iban.replace(/\s+/g, "").toUpperCase());
      }
    }

    // 2. Fetch all unmatched transactions for these accounts
    const allTxs = await this.db
      .select({
        id: transactions.id,
        accountId: transactions.accountId,
        amount: transactions.amount,
        currency: transactions.currency,
        description: transactions.description,
        category: transactions.category,
        bookedAt: transactions.bookedAt,
        isTransfer: transactions.isTransfer,
        transferMatchId: transactions.transferMatchId,
        raw: transactions.raw
      })
      .from(transactions)
      .where(
        and(
          sql`${transactions.accountId} IN (${sql.join(accountIds.map((id) => sql`${id}`), sql`, `)})`,
          eq(transactions.isTransfer, false)
        )
      )
      .orderBy(transactions.bookedAt);

    let matchedPairs = 0;
    const pairedTxIds = new Set<string>();

    for (let i = 0; i < allTxs.length; i++) {
      const tx1 = allTxs[i]!;
      if (pairedTxIds.has(tx1.id)) continue;

      const amt1 = parseFloat(tx1.amount);
      if (isNaN(amt1) || Math.abs(amt1) < 0.001) continue;

      const date1 = new Date(tx1.bookedAt.split("T")[0]!).getTime();

      for (let j = i + 1; j < allTxs.length; j++) {
        const tx2 = allTxs[j]!;
        if (pairedTxIds.has(tx2.id)) continue;
        if (tx1.accountId === tx2.accountId) continue;
        if (tx1.currency !== tx2.currency) continue;

        const amt2 = parseFloat(tx2.amount);
        if (isNaN(amt2)) continue;

        // Amounts must be opposite (one debit, one credit) and equal
        if (Math.abs(amt1 + amt2) > 0.01) continue;

        // Dates must be within 4 calendar days
        const date2 = new Date(tx2.bookedAt.split("T")[0]!).getTime();
        const diffDays = Math.abs(date2 - date1) / (1000 * 60 * 60 * 24);
        if (diffDays > 4) continue;

        // Match found!
        const matchId = `match_${crypto.randomUUID()}`;
        pairedTxIds.add(tx1.id);
        pairedTxIds.add(tx2.id);
        matchedPairs++;

        await this.db
          .update(transactions)
          .set({
            isTransfer: true,
            transferMatchId: matchId,
            category: "Traspasos"
          })
          .where(eq(transactions.id, tx1.id));

        await this.db
          .update(transactions)
          .set({
            isTransfer: true,
            transferMatchId: matchId,
            category: "Traspasos"
          })
          .where(eq(transactions.id, tx2.id));

        break;
      }
    }

    return {
      matchedPairs,
      totalTransfersMarked: pairedTxIds.size
    };
  }
}
