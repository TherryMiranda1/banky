import { z } from "zod";

export const API_KEY_SCOPES = [
  "accounts:read",
  "balance:read",
  "transactions:read",
  "transactions:write",
  "categories:read",
  "budgets:read",
  "sync:write"
] as const;

export type ApiKeyScope = (typeof API_KEY_SCOPES)[number];

export const ApiKeyScopeSchema = z.enum(API_KEY_SCOPES);

export const CreateApiKeySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must not exceed 100 characters"),
  scopes: z.array(ApiKeyScopeSchema).min(1, "At least one scope is required"),
  expiresInDays: z.number().int().min(1).max(365).optional()
});

export type CreateApiKeyInput = z.infer<typeof CreateApiKeySchema>;
