import type { ApiKeyScope, CreateApiKeyInput } from "./api-key-scopes.js";

export interface CreatedApiKeyResult {
  id: string;
  name: string;
  key: string;
  keyPrefix: string;
  scopes: ApiKeyScope[];
  expiresAt: string | null;
  createdAt: string;
}

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

export interface VerifiedApiKey {
  keyId: string;
  userId: string;
  name: string;
  scopes: ApiKeyScope[];
}

export interface IApiKeyService {
  create(userId: string, input: CreateApiKeyInput): Promise<CreatedApiKeyResult>;
  list(userId: string): Promise<ApiKeyItem[]>;
  revoke(userId: string, keyId: string): Promise<boolean>;
  verify(rawKey: string): Promise<VerifiedApiKey | null>;
}
