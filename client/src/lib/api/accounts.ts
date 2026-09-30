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
