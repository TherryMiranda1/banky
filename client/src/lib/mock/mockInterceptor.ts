import { mockStorage } from "./mockStorage";

export const MOCK_TOKEN = "banky_mock_demo_session_token";
export const MOCK_MODE_STORAGE_KEY = "banky_mock_mode_active";

export function isMockModeActive(): boolean {
  if (typeof window === "undefined") return false;
  if (import.meta.env.VITE_MOCK_MODE === "true") return true;
  return localStorage.getItem(MOCK_MODE_STORAGE_KEY) === "true";
}

export function setMockModeActive(active: boolean): void {
  if (typeof window === "undefined") return;
  if (active) {
    localStorage.setItem(MOCK_MODE_STORAGE_KEY, "true");
  } else {
    localStorage.removeItem(MOCK_MODE_STORAGE_KEY);
  }
}

export async function handleMockRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Small simulated latency for natural UI feel
  await new Promise((resolve) => setTimeout(resolve, 80));

  const method = (options.method || "GET").toUpperCase();
  const urlObj = new URL(endpoint, "http://localhost");
  const path = urlObj.pathname;
  const searchParams = urlObj.searchParams;

  let body: any = {};
  if (options.body && typeof options.body === "string") {
    try {
      body = JSON.parse(options.body);
    } catch {
      body = {};
    }
  }

  // Auth endpoints
  if (path === "/auth/me") {
    return { user: mockStorage.getUser() } as T;
  }
  if (path === "/auth/login" || path === "/auth/register") {
    return {
      token: MOCK_TOKEN,
      user: mockStorage.getUser()
    } as T;
  }
  if (path === "/aspsps") {
    const country = searchParams.get("country") || "ES";
    return { aspsps: mockStorage.getAspsps(country) } as T;
  }

  if (path === "/auth/start") {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return { url: `${origin}/?connected=true` } as T;
  }

  if (path === "/auth/callback") {
    return { success: true, connectionId: "mock-conn-1", accountsCount: 2 } as T;
  }

  // User preferences
  if (path === "/users/preferences") {
    if (method === "PATCH") {
      const updated = mockStorage.updateUser(body);
      return { data: updated } as T;
    }
    return { data: { cutoffDay: mockStorage.getUser().cutoffDay || 1 } } as T;
  }

  // Accounts
  if (path === "/accounts") {
    return mockStorage.getAccounts() as T;
  }
  if (path === "/accounts/reorder" && method === "PUT") {
    return mockStorage.reorderAccounts(body.accountIds || []) as T;
  }
  if (path === "/accounts/cash" && method === "POST") {
    return mockStorage.ensureCashAccount() as T;
  }
  if (path.startsWith("/accounts/")) {
    const id = decodeURIComponent(path.replace("/accounts/", ""));
    if (method === "PATCH") {
      return mockStorage.updateAccount(id, body) as T;
    }
    const acc = mockStorage.getAccount(id);
    if (!acc) throw new Error("Account not found");
    return acc as T;
  }
  if (path === "/balance/total") {
    return mockStorage.getTotalBalance() as T;
  }
  if (path === "/sync" && method === "POST") {
    return mockStorage.triggerSync() as T;
  }

  // Transactions
  if (path === "/transactions") {
    if (method === "POST") {
      const tx = mockStorage.createManualTransaction(body);
      return { data: tx } as T;
    }
    const accountIdsParam = searchParams.get("accountIds");
    const params = {
      accountId: searchParams.get("accountId") || undefined,
      accountIds: accountIdsParam ? accountIdsParam.split(",") : undefined,
      category: searchParams.get("category") || undefined,
      type: (searchParams.get("type") as any) || undefined,
      from: searchParams.get("from") || undefined,
      to: searchParams.get("to") || undefined,
      page: searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : undefined
    };
    return mockStorage.getTransactions(params) as T;
  }

  if (path.startsWith("/transactions/") && path.endsWith("/suggest-rule")) {
    const id = path.split("/")[2];
    const tx = mockStorage.getTransactions({ limit: 1000 }).data.find((t) => t.id === id);
    return {
      data: {
        transactionId: id,
        pattern: tx?.description?.split(" ")[0] || "COMPRA",
        merchantName: tx?.description || "Comercio",
        description: tx?.description || null
      }
    } as T;
  }

  if (path.startsWith("/transactions/") && path.endsWith("/category")) {
    const id = path.split("/")[2];
    const tx = mockStorage.updateTransactionCategory(id, body.categoryId ?? null);
    return { data: tx } as T;
  }

  if (path.startsWith("/transactions/")) {
    const id = path.replace("/transactions/", "");
    if (method === "PATCH") {
      const tx = mockStorage.updateManualTransaction(id, body);
      return { data: tx } as T;
    }
    if (method === "DELETE") {
      return mockStorage.deleteManualTransaction(id) as T;
    }
  }

  // Categories & Rules
  if (path === "/categories") {
    if (method === "POST") {
      return { data: mockStorage.createCategory(body) } as T;
    }
    return { data: mockStorage.getCategories() } as T;
  }
  if (path === "/categories/reorder" && method === "PUT") {
    return { data: mockStorage.reorderCategories(body.categoryIds || []) } as T;
  }
  if (path === "/categories/rules") {
    if (method === "POST") {
      return { data: mockStorage.createCategorizationRule(body) } as T;
    }
    return { data: mockStorage.getCategorizationRules() } as T;
  }
  if (path === "/categories/rules/apply" && method === "POST") {
    return mockStorage.applyCategorizationRules() as T;
  }
  if (path.startsWith("/categories/rules/")) {
    const id = path.replace("/categories/rules/", "");
    if (method === "PUT") {
      return { data: mockStorage.updateCategorizationRule(id, body) } as T;
    }
    if (method === "DELETE") {
      return mockStorage.deleteCategorizationRule(id) as T;
    }
  }
  if (path.startsWith("/categories/")) {
    const id = path.replace("/categories/", "");
    if (method === "PUT") {
      return { data: mockStorage.updateCategory(id, body) } as T;
    }
    if (method === "DELETE") {
      return mockStorage.deleteCategory(id) as T;
    }
  }

  // Budgets & Analytics
  if (path === "/budgets") {
    const period = searchParams.get("period") || "";
    if (method === "PUT") {
      const updated = mockStorage.updateBudgets(body.period, body.budgets || []);
      return { period: body.period, data: updated } as T;
    }
    return { period, data: mockStorage.getBudgets(period) } as T;
  }
  if (path === "/analytics/categories") {
    const period = searchParams.get("period") || "";
    return mockStorage.getCategoryAnalytics(period) as T;
  }

  // Kingdom Gamification
  if (path === "/kingdom") {
    const period = searchParams.get("period") || "";
    return mockStorage.getKingdomState(period) as T;
  }

  throw new Error(`Mock handler for ${method} ${path} not implemented`);
}
