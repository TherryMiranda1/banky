import { apiFetch } from "./client.js";

export interface AccountBalance {
  amount: string;
  currency: string;
  type?: string;
}

export interface Account {
  id: string;
  alias: string | null;
  bankName: string;
  iban: string | null;
  currency: string;
  lastBalance: AccountBalance | null;
  syncedAt: string | null;
  status?: string;
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

export async function getAccount(id: string): Promise<Account> {
  return apiFetch<Account>(`/accounts/${encodeURIComponent(id)}`);
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
