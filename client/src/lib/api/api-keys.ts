import { apiFetch } from "./client";

export type ApiKeyScope =
  | "accounts:read"
  | "balance:read"
  | "transactions:read"
  | "transactions:write"
  | "categories:read"
  | "budgets:read"
  | "sync:write";

export interface ApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: ApiKeyScope[];
  expiresAt: string | null;
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}

export interface CreateApiKeyPayload {
  name: string;
  scopes: ApiKeyScope[];
  expiresInDays?: number;
}

export interface CreateApiKeyResult {
  id: string;
  name: string;
  key: string;
  keyPrefix: string;
  scopes: ApiKeyScope[];
  expiresAt: string | null;
  createdAt: string;
}

export async function getApiKeys(): Promise<ApiKeyItem[]> {
  return apiFetch<ApiKeyItem[]>("/api-keys");
}

export async function createApiKey(payload: CreateApiKeyPayload): Promise<CreateApiKeyResult> {
  return apiFetch<CreateApiKeyResult>("/api-keys", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function revokeApiKey(id: string): Promise<{ success: boolean; id: string }> {
  return apiFetch<{ success: boolean; id: string }>(`/api-keys/${id}`, {
    method: "DELETE"
  });
}
