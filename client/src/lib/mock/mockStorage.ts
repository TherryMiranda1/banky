import {
  MOCK_USER,
  MOCK_ACCOUNTS,
  MOCK_CATEGORIES,
  MOCK_RULES,
  MOCK_BUDGETS,
  MOCK_TRANSACTIONS,
  MOCK_ASPSPS
} from "./mockData";
import { Account, SyncResult } from "@/lib/api/accounts";
import {
  Transaction,
  TransactionQueryParams,
  TransactionsResponse
} from "@/lib/api/transactions";
import { CategoryItem, CategorizationRuleItem } from "@/lib/api/categories";
import { BudgetItem, CategoryAnalyticsResponse } from "@/lib/api/budgets";
import {
  KingdomState,
  Building,
  BuildingType,
  BuildingStatus,
  KingdomHealth,
  KingdomEvent
} from "@/lib/api/kingdom";
import { User, Aspsp } from "@/lib/api/auth";

const MOCK_STORAGE_KEY = "banky_mock_database_v1";

interface MockDatabaseState {
  user: User;
  accounts: Account[];
  categories: CategoryItem[];
  rules: CategorizationRuleItem[];
  budgets: BudgetItem[];
  transactions: Transaction[];
  aspsps: Aspsp[];
}

function getInitialState(): MockDatabaseState {
  return {
    user: { ...MOCK_USER },
    accounts: JSON.parse(JSON.stringify(MOCK_ACCOUNTS)),
    categories: JSON.parse(JSON.stringify(MOCK_CATEGORIES)),
    rules: JSON.parse(JSON.stringify(MOCK_RULES)),
    budgets: JSON.parse(JSON.stringify(MOCK_BUDGETS)),
    transactions: JSON.parse(JSON.stringify(MOCK_TRANSACTIONS)),
    aspsps: JSON.parse(JSON.stringify(MOCK_ASPSPS))
  };
}

class MockStorageManager {
  private state: MockDatabaseState;

  constructor() {
    this.state = this.loadFromStorage();
  }

  private loadFromStorage(): MockDatabaseState {
    try {
      const stored = localStorage.getItem(MOCK_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Ignore parse error and fallback to initial
    }
    const initial = getInitialState();
    this.persist(initial);
    return initial;
  }

  private persist(state: MockDatabaseState): void {
    try {
      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage full or unavailable
    }
    this.state = state;
  }

  public resetToDefault(): void {
    const initial = getInitialState();
    this.persist(initial);
  }

  // Auth
  public getUser(): User {
    return this.state.user;
  }

  public updateUser(updates: Partial<User>): User {
    this.state.user = { ...this.state.user, ...updates };
    this.persist(this.state);
    return this.state.user;
  }

  // ASPSPs
  public getAspsps(country?: string): Aspsp[] {
    if (!country) return this.state.aspsps;
    return this.state.aspsps.filter((a) => a.country.toUpperCase() === country.toUpperCase());
  }


  // Accounts
  public getAccounts(): Account[] {
    return this.state.accounts.filter((a) => a.isActive !== false);
  }

  public getAllAccounts(): Account[] {
    return this.state.accounts;
  }

  public getAccount(id: string): Account | undefined {
    return this.state.accounts.find((a) => a.id === id);
  }

  public updateAccount(id: string, updates: { nickname?: string | null; isActive?: boolean }): Account {
    const idx = this.state.accounts.findIndex((a) => a.id === id);
    if (idx !== -1) {
      this.state.accounts[idx] = { ...this.state.accounts[idx], ...updates };
      this.persist(this.state);
      return this.state.accounts[idx];
    }
    throw new Error("Account not found");
  }

  public reorderAccounts(accountIds: string[]): Account[] {
    const accountMap = new Map(this.state.accounts.map((a) => [a.id, a]));
    const reordered: Account[] = [];
    accountIds.forEach((id, idx) => {
      const acc = accountMap.get(id);
      if (acc) {
        acc.position = idx;
        reordered.push(acc);
      }
    });
    this.state.accounts = reordered;
    this.persist(this.state);
    return this.state.accounts;
  }

  public ensureCashAccount(): Account {
    const cash = this.state.accounts.find((a) => a.bankName === "Cash" || a.id === "acc-cash-1");
    if (cash) return cash;
    const newCash: Account = {
      id: `acc-cash-${Date.now()}`,
      alias: "Efectivo / Billetera",
      nickname: "Efectivo",
      bankName: "Cash",
      logoUrl: null,
      iban: null,
      currency: "EUR",
      lastBalance: { amount: "0.00", currency: "EUR", type: "manual", bookedAmount: "0.00", heldAmount: "0.00" },
      syncedAt: new Date().toISOString(),
      status: "active",
      isActive: true,
      position: this.state.accounts.length
    };
    this.state.accounts.push(newCash);
    this.persist(this.state);
    return newCash;
  }

  public getTotalBalance(): Record<string, string> {
    let total = 0;
    this.state.accounts.forEach((acc) => {
      if (acc.isActive && acc.lastBalance) {
        total += parseFloat(acc.lastBalance.amount || "0");
      }
    });
    return { EUR: total.toFixed(2) };
  }

  public triggerSync(): SyncResult {
    this.state.accounts = this.state.accounts.map((acc) => ({
      ...acc,
      syncedAt: new Date().toISOString()
    }));
    this.persist(this.state);
    return {
      synced: this.state.accounts.length,
      accounts: this.state.accounts.length,
      transactions: this.state.transactions.length,
      errors: []
    };
  }

  // Transactions
  public getTransactions(params: TransactionQueryParams): TransactionsResponse {
    let list = [...this.state.transactions];

    if (params.accountId && params.accountId !== "all") {
      list = list.filter((tx) => tx.accountId === params.accountId);
    }
    if (params.accountIds && params.accountIds.length > 0) {
      list = list.filter((tx) => tx.accountId && params.accountIds!.includes(tx.accountId));
    }
    if (params.category) {
      list = list.filter((tx) => tx.category === params.category);
    }
    if (params.type && params.type !== "all") {
      if (params.type === "transfer") {
        list = list.filter((tx) => tx.isTransfer);
      } else if (params.type === "income") {
        list = list.filter((tx) => !tx.isTransfer && parseFloat(tx.amount) > 0);
      } else if (params.type === "expense") {
        list = list.filter((tx) => !tx.isTransfer && parseFloat(tx.amount) < 0);
      }
    }
    if (params.from) {
      list = list.filter((tx) => tx.bookedAt >= params.from!);
    }
    if (params.to) {
      list = list.filter((tx) => tx.bookedAt <= params.to!);
    }

    // Sort descending by bookedAt
    list.sort((a, b) => new Date(b.bookedAt).getTime() - new Date(a.bookedAt).getTime());

    const page = params.page || 1;
    const limit = params.limit || 20;
    const total = list.length;
    const startIndex = (page - 1) * limit;
    const paged = list.slice(startIndex, startIndex + limit);

    return {
      data: paged,
      total,
      page,
      limit,
      hasMore: startIndex + limit < total
    };
  }

  public createManualTransaction(data: {
    accountId: string;
    amount: string;
    currency?: string;
    description: string;
    category?: string | null;
    bookedAt: string;
  }): Transaction {
    const acc = this.state.accounts.find((a) => a.id === data.accountId);
    const newTx: Transaction = {
      id: `tx-manual-${Date.now()}`,
      accountId: data.accountId,
      accountAlias: acc?.alias || acc?.bankName || "Cuenta Manual",
      bankName: acc?.bankName || "Cash",
      iban: acc?.iban || null,
      amount: data.amount,
      currency: data.currency || "EUR",
      description: data.description,
      category: data.category || null,
      bookedAt: data.bookedAt,
      metadata: {
        note: "Transacción manual"
      }
    };
    this.state.transactions.unshift(newTx);

    // Update account balance
    if (acc && acc.lastBalance) {
      const curr = parseFloat(acc.lastBalance.amount || "0");
      const diff = parseFloat(data.amount);
      const updated = (curr + diff).toFixed(2);
      acc.lastBalance.amount = updated;
      acc.lastBalance.bookedAmount = updated;
    }

    this.persist(this.state);
    return newTx;
  }

  public updateManualTransaction(
    id: string,
    data: {
      amount?: string;
      currency?: string;
      description?: string;
      category?: string | null;
      bookedAt?: string;
    }
  ): Transaction {
    const idx = this.state.transactions.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error("Transaction not found");
    const existing = this.state.transactions[idx];
    this.state.transactions[idx] = { ...existing, ...data };
    this.persist(this.state);
    return this.state.transactions[idx];
  }

  public deleteManualTransaction(id: string): { success: boolean; id: string } {
    const tx = this.state.transactions.find((t) => t.id === id);
    if (tx && tx.accountId) {
      const acc = this.state.accounts.find((a) => a.id === tx.accountId);
      if (acc && acc.lastBalance) {
        const curr = parseFloat(acc.lastBalance.amount || "0");
        const diff = parseFloat(tx.amount);
        const updated = (curr - diff).toFixed(2);
        acc.lastBalance.amount = updated;
        acc.lastBalance.bookedAmount = updated;
      }
    }
    this.state.transactions = this.state.transactions.filter((t) => t.id !== id);
    this.persist(this.state);
    return { success: true, id };
  }

  public updateTransactionCategory(id: string, categoryId: string | null): Transaction {
    const tx = this.state.transactions.find((t) => t.id === id);
    if (!tx) throw new Error("Transaction not found");
    tx.category = categoryId;
    this.persist(this.state);
    return tx;
  }

  // Categories
  public getCategories(): CategoryItem[] {
    return [...this.state.categories].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  }

  public createCategory(data: { name: string; color: string; icon: string }): CategoryItem {
    const newCat: CategoryItem = {
      id: `cat-${Date.now()}`,
      userId: this.state.user.id,
      name: data.name,
      color: data.color,
      icon: data.icon,
      position: this.state.categories.length,
      createdAt: new Date().toISOString()
    };
    this.state.categories.push(newCat);
    this.persist(this.state);
    return newCat;
  }

  public updateCategory(id: string, data: { name: string; color: string; icon: string }): CategoryItem {
    const cat = this.state.categories.find((c) => c.id === id);
    if (!cat) throw new Error("Category not found");
    Object.assign(cat, data);
    this.persist(this.state);
    return cat;
  }

  public deleteCategory(id: string): { success: boolean; id: string } {
    this.state.categories = this.state.categories.filter((c) => c.id !== id);
    this.state.budgets = this.state.budgets.filter((b) => b.categoryId !== id);
    this.state.rules = this.state.rules.filter((r) => r.categoryId !== id);
    this.state.transactions.forEach((t) => {
      if (t.category === id) t.category = null;
    });
    this.persist(this.state);
    return { success: true, id };
  }

  public reorderCategories(categoryIds: string[]): CategoryItem[] {
    const map = new Map(this.state.categories.map((c) => [c.id, c]));
    const reordered: CategoryItem[] = [];
    categoryIds.forEach((id, idx) => {
      const cat = map.get(id);
      if (cat) {
        cat.position = idx;
        reordered.push(cat);
      }
    });
    this.state.categories = reordered;
    this.persist(this.state);
    return this.state.categories;
  }

  // Rules
  public getCategorizationRules(): CategorizationRuleItem[] {
    return this.state.rules;
  }

  public createCategorizationRule(data: {
    categoryId: string;
    pattern?: string | null;
    accountId?: string | null;
    direction?: "in" | "out" | "all" | null;
    priority?: number;
  }): CategorizationRuleItem {
    const cat = this.state.categories.find((c) => c.id === data.categoryId);
    const acc = data.accountId ? this.state.accounts.find((a) => a.id === data.accountId) : null;
    const newRule: CategorizationRuleItem = {
      id: `rule-${Date.now()}`,
      userId: this.state.user.id,
      categoryId: data.categoryId,
      categoryName: cat?.name || "Categoría",
      categoryColor: cat?.color || "#00E5A0",
      categoryIcon: cat?.icon || "Tags",
      accountId: data.accountId,
      accountName: acc?.alias || acc?.bankName || null,
      accountIban: acc?.iban || null,
      pattern: data.pattern || null,
      direction: data.direction || "all",
      priority: data.priority ?? 5,
      createdAt: new Date().toISOString()
    };
    this.state.rules.push(newRule);
    this.persist(this.state);
    return newRule;
  }

  public updateCategorizationRule(
    id: string,
    data: {
      categoryId: string;
      pattern?: string | null;
      accountId?: string | null;
      direction?: "in" | "out" | "all" | null;
      priority?: number;
    }
  ): CategorizationRuleItem {
    const rule = this.state.rules.find((r) => r.id === id);
    if (!rule) throw new Error("Rule not found");
    const cat = this.state.categories.find((c) => c.id === data.categoryId);
    const acc = data.accountId ? this.state.accounts.find((a) => a.id === data.accountId) : null;

    Object.assign(rule, {
      ...data,
      categoryName: cat?.name || rule.categoryName,
      categoryColor: cat?.color || rule.categoryColor,
      categoryIcon: cat?.icon || rule.categoryIcon,
      accountName: acc?.alias || acc?.bankName || null,
      accountIban: acc?.iban || null
    });
    this.persist(this.state);
    return rule;
  }

  public deleteCategorizationRule(id: string): { success: boolean; id: string } {
    this.state.rules = this.state.rules.filter((r) => r.id !== id);
    this.persist(this.state);
    return { success: true, id };
  }

  public applyCategorizationRules(): { applied: number; total: number } {
    let applied = 0;
    this.state.transactions.forEach((tx) => {
      if (!tx.category && !tx.isTransfer) {
        for (const rule of this.state.rules) {
          if (rule.pattern && tx.description?.toUpperCase().includes(rule.pattern.toUpperCase())) {
            tx.category = rule.categoryId;
            applied++;
            break;
          }
        }
      }
    });
    this.persist(this.state);
    return { applied, total: this.state.transactions.length };
  }

  // Budgets & Analytics
  public getBudgets(_period: string): BudgetItem[] {
    return this.state.budgets;
  }

  public updateBudgets(
    _period: string,
    updates: Array<{ categoryId: string; amount: string }>
  ): BudgetItem[] {
    const catMap = new Map(this.state.categories.map((c) => [c.id, c]));
    updates.forEach((u) => {
      const existing = this.state.budgets.find((b) => b.categoryId === u.categoryId);
      const cat = catMap.get(u.categoryId);
      if (existing) {
        existing.amount = u.amount;
      } else if (cat) {
        this.state.budgets.push({
          id: `bgt-${u.categoryId}`,
          categoryId: u.categoryId,
          categoryName: cat.name,
          categoryColor: cat.color,
          categoryIcon: cat.icon,
          amount: u.amount,
          isInherited: false
        });
      }
    });
    this.persist(this.state);
    return this.state.budgets;
  }

  public getCategoryAnalytics(period: string): CategoryAnalyticsResponse {
    const budgetMap = new Map(this.state.budgets.map((b) => [b.categoryId, parseFloat(b.amount || "0")]));

    let totalIncome = 0;
    let totalSpent = 0;
    let uncategorizedSpent = 0;
    const categorySpentMap = new Map<string, number>();

    this.state.transactions.forEach((tx) => {
      if (tx.isTransfer) return;
      const amt = parseFloat(tx.amount);
      if (amt > 0) {
        totalIncome += amt;
      } else {
        const spent = Math.abs(amt);
        totalSpent += spent;
        if (tx.category) {
          categorySpentMap.set(tx.category, (categorySpentMap.get(tx.category) || 0) + spent);
        } else {
          uncategorizedSpent += spent;
        }
      }
    });

    let totalBudgeted = 0;
    const categoryAnalytics = this.state.categories
      .filter((cat) => cat.id !== "cat-income")
      .map((cat) => {
        const budgetAmount = budgetMap.get(cat.id) || 0;
        totalBudgeted += budgetAmount;
        const spentAmount = categorySpentMap.get(cat.id) || 0;
        const remainingAmount = Math.max(0, budgetAmount - spentAmount);
        const spentPercentage = budgetAmount > 0 ? Math.round((spentAmount / budgetAmount) * 100) : 0;

        return {
          categoryId: cat.id,
          categoryName: cat.name,
          categoryColor: cat.color,
          categoryIcon: cat.icon,
          budgetAmount,
          spentAmount,
          remainingAmount,
          spentPercentage,
          isInheritedBudget: false
        };
      });

    const netSavings = totalIncome - totalSpent;
    const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

    return {
      period: period || new Date().toISOString().substring(0, 7),
      cycleRange: {
        from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
        to: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString(),
        label: "Ciclo Actual",
        dateRangeLabel: "Mes en curso"
      },
      categories: categoryAnalytics,
      uncategorized: {
        spentAmount: uncategorizedSpent
      },
      summary: {
        totalIncome,
        totalSpent,
        netSavings,
        savingsRate,
        totalBudgeted
      }
    };
  }

  public getKingdomState(period: string): KingdomState {
    const analytics = this.getCategoryAnalytics(period);
    const totals = this.getTotalBalance();
    const totalBalanceEur = parseFloat(totals["EUR"] || "4875.70");

    const buildings: Building[] = analytics.categories.map((cat) => {
      let type: BuildingType = "house";
      const name = cat.categoryName.toLowerCase();
      if (name.includes("vivienda") || name.includes("alquiler")) type = "house";
      else if (name.includes("alimentaci") || name.includes("super")) type = "granary";
      else if (name.includes("restaurante") || name.includes("caf")) type = "tavern";
      else if (name.includes("transporte") || name.includes("coche")) type = "stable";
      else if (name.includes("suscrip") || name.includes("ocio")) type = "library";
      else if (name.includes("compra") || name.includes("ropa")) type = "windmill";
      else if (name.includes("imprevisto") || name.includes("salud") || name.includes("cuidado")) type = "watchtower";
      else if (name.includes("ahorro") || name.includes("invers")) type = "vault";
      else if (name.includes("nomina") || name.includes("ingreso")) type = "market";

      const level: 1 | 2 | 3 = cat.spentAmount >= 600 ? 3 : cat.spentAmount >= 150 ? 2 : 1;
      const status: BuildingStatus =
        cat.budgetAmount > 0 && cat.spentPercentage > 100
          ? "burning"
          : cat.budgetAmount === 0 && cat.spentAmount > 0
          ? "ruined"
          : "healthy";

      return {
        id: cat.categoryId,
        type,
        level,
        status,
        categoryName: cat.categoryName,
        categoryColor: cat.categoryColor,
        categoryIcon: cat.categoryIcon,
        spentAmount: cat.spentAmount,
        budgetAmount: cat.budgetAmount,
        spentPercentage: cat.spentPercentage
      };
    });

    const burningCount = buildings.filter((b) => b.status === "burning").length;
    let health: KingdomHealth = "stable";
    if (burningCount >= 3 || analytics.summary.netSavings <= -1000) {
      health = "crisis";
    } else if (burningCount >= 1 || analytics.summary.savingsRate < 0 || analytics.summary.netSavings < 0) {
      health = "struggling";
    } else if (analytics.summary.savingsRate >= 25 && analytics.summary.netSavings > 0) {
      health = "thriving";
    }

    const events: KingdomEvent[] = [];
    buildings.forEach((b) => {
      if (b.status === "burning") {
        events.push({
          kind: "fire",
          categoryName: b.categoryName,
          severity: b.spentPercentage >= 150 ? "high" : "low"
        });
      }
    });

    if (analytics.summary.totalIncome > 0) {
      events.push({
        kind: "caravan",
        count: Math.min(5, Math.max(1, Math.floor(analytics.summary.totalIncome / 500)))
      });
    }

    const treasuryLevel: 1 | 2 | 3 =
      totalBalanceEur >= 5000 && analytics.summary.netSavings >= 0 ? 3 : totalBalanceEur >= 1000 ? 2 : 1;

    return {
      period: analytics.period,
      health,
      summary: {
        totalIncome: analytics.summary.totalIncome,
        totalSpent: analytics.summary.totalSpent,
        netSavings: analytics.summary.netSavings,
        savingsRate: analytics.summary.savingsRate,
        totalBudgeted: analytics.summary.totalBudgeted,
        totalBalanceEur
      },
      treasuryLevel,
      buildings,
      events
    };
  }
}

export const mockStorage = new MockStorageManager();
