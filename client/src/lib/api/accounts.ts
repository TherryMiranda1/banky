import { apiFetch } from "./client.js";

export interface AccountBalance {
  amount: string;
  currency: string;
  type?: string;
  bookedAmount?: string;
  heldAmount?: string;
}

export interface Account {
  id: string;
  connectionId?: string;
  alias: string | null;
  nickname?: string | null;
  bankName: string;
  logoUrl?: string | null;
  iban: string | null;
  currency: string;
  lastBalance: AccountBalance | null;
  syncedAt: string | null;
  status?: string;
  isActive: boolean;
  position?: number;
}

export interface BankConnection {
  id: string;
  bankName: string;
  aspspName: string;
  aspspCountry: string;
  logoUrl: string | null;
  status: string;
  validUntil: string;
  createdAt: string;
  accountsCount: number;
  activeAccountsCount: number;
}

export interface ConnectionAccountsResponse {
  connection: {
    id: string;
    bankName: string;
    aspspName: string;
    logoUrl: string | null;
    status: string;
    validUntil: string;
  };
  accounts: Account[];
}

export interface SyncResult {
  synced: number;
  accounts: number;
  transactions: number;
  errors: Array<{ connectionId: string; error: string }>;
}

export async function getAccounts(): Promise<Account[]> {
  return apiFetch<Account[]>("/accounts");
}

export async function reorderAccounts(accountIds: string[]): Promise<Account[]> {
  return apiFetch<Account[]>("/accounts/reorder", {
    method: "PUT",
    body: JSON.stringify({ accountIds })
  });
}

export async function getAccount(id: string): Promise<Account> {
  return apiFetch<Account>(`/accounts/${encodeURIComponent(id)}`);
}

export async function updateAccount(
  id: string,
  updates: { nickname?: string | null; isActive?: boolean }
): Promise<Account> {
  return apiFetch<Account>(`/accounts/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(updates)
  });
}

export async function toggleAccountVisibility(
  accountId: string,
  isActive: boolean
): Promise<Account> {
  return apiFetch<Account>(`/accounts/${encodeURIComponent(accountId)}/visibility`, {
    method: "PATCH",
    body: JSON.stringify({ isActive })
  });
}

export async function deleteAccount(accountId: string): Promise<{ success: boolean; id: string }> {
  return apiFetch<{ success: boolean; id: string }>(`/accounts/${encodeURIComponent(accountId)}`, {
    method: "DELETE"
  });
}

export async function getBankConnections(): Promise<BankConnection[]> {
  return apiFetch<BankConnection[]>("/accounts/connections");
}

export async function getAccountsByConnection(connectionId: string): Promise<ConnectionAccountsResponse> {
  return apiFetch<ConnectionAccountsResponse>(`/accounts/connection/${encodeURIComponent(connectionId)}`);
}

export async function disconnectBank(connectionId: string): Promise<{ success: boolean; connectionId: string }> {
  return apiFetch<{ success: boolean; connectionId: string }>(`/accounts/connection/${encodeURIComponent(connectionId)}`, {
    method: "DELETE"
  });
}

export async function ensureCashAccount(): Promise<Account> {
  return apiFetch<Account>("/accounts/cash", {
    method: "POST"
  });
}

export async function getTotalBalance(): Promise<Record<string, string>> {
  return apiFetch<Record<string, string>>("/balance/total");
}

export async function triggerSync(): Promise<SyncResult> {
  return apiFetch<SyncResult>("/sync", {
    method: "POST",
    body: JSON.stringify({})
  });
}
