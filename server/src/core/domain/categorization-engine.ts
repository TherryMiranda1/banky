export interface RuleEvaluationItem {
  id: string;
  pattern?: string | null;
  priority: number;
  categoryName: string;
  accountId?: string | null;
  direction?: "in" | "out" | "all" | null;
}

export interface TransactionEvaluationItem {
  id?: string;
  description: string | null;
  amount?: string | number | null;
  accountId?: string | null;
}

export interface CategorizationResult {
  transactionId: string;
  category: string;
}

interface CompiledRule {
  id: string;
  regex: RegExp | null;
  categoryName: string;
  priority: number;
  accountId: string | null;
  direction: "in" | "out" | "all" | null;
}

export class CategorizationEngine {
  private compiledRules: CompiledRule[] = [];

  constructor(rules: RuleEvaluationItem[] = []) {
    this.compileRules(rules);
  }

  public setRules(rules: RuleEvaluationItem[]): void {
    this.compileRules(rules);
  }

  private compileRules(rules: RuleEvaluationItem[]): void {
    const sorted = [...rules].sort((a, b) => b.priority - a.priority);
    this.compiledRules = [];

    for (const rule of sorted) {
      const cleanPattern = rule.pattern ? rule.pattern.trim() : "";
      const accountId = rule.accountId ? rule.accountId.trim() : null;
      const direction = rule.direction && rule.direction !== "all" ? rule.direction : null;

      let regex: RegExp | null = null;
      if (cleanPattern) {
        let normalizedPattern = cleanPattern;
        if (normalizedPattern.includes("\n")) {
          const lines = normalizedPattern
            .split(/\r?\n/)
            .map((l) => l.trim())
            .filter((l) => l.length > 0);
          if (lines.length > 0) {
            normalizedPattern = lines.map((l) => `(?:${l})`).join("|");
          }
        }
        try {
          regex = new RegExp(normalizedPattern, "i");
        } catch {
          // Skip invalid regex
          regex = null;
        }
      }

      // Ensure rule has at least one active criterion
      if (regex || accountId || direction) {
        this.compiledRules.push({
          id: rule.id,
          regex,
          categoryName: rule.categoryName,
          priority: rule.priority,
          accountId,
          direction
        });
      }
    }
  }

  public evaluate(
    input: string | TransactionEvaluationItem | null,
    amount?: string | number | null,
    accountId?: string | null
  ): string | null {
    let tx: TransactionEvaluationItem;

    if (input === null || typeof input === "string") {
      tx = {
        description: input,
        amount: amount ?? null,
        accountId: accountId ?? null
      };
    } else {
      tx = input;
    }

    const desc = tx.description ? tx.description.trim() : "";
    const parsedAmount =
      tx.amount !== undefined && tx.amount !== null
        ? typeof tx.amount === "number"
          ? tx.amount
          : parseFloat(String(tx.amount))
        : null;

    for (const rule of this.compiledRules) {
      // 1. Check account filter if configured
      if (rule.accountId) {
        if (!tx.accountId || tx.accountId !== rule.accountId) {
          continue;
        }
      }

      // 2. Check flow direction filter if configured
      if (rule.direction) {
        if (parsedAmount === null || isNaN(parsedAmount)) {
          continue;
        }
        if (rule.direction === "in" && parsedAmount <= 0) {
          continue;
        }
        if (rule.direction === "out" && parsedAmount >= 0) {
          continue;
        }
      }

      // 3. Check regex pattern if configured
      if (rule.regex) {
        if (!desc || !rule.regex.test(desc)) {
          continue;
        }
      }

      return rule.categoryName;
    }

    return null;
  }

  public evaluateBatch(transactions: TransactionEvaluationItem[]): CategorizationResult[] {
    const results: CategorizationResult[] = [];

    for (const tx of transactions) {
      const category = this.evaluate(tx);
      if (category && tx.id) {
        results.push({
          transactionId: tx.id,
          category
        });
      }
    }

    return results;
  }
}

