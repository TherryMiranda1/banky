import { z } from "zod";

export const AccountBalanceSchema = z.object({
  amount: z.string(),
  currency: z.string(),
  type: z.string().optional(),
  bookedAmount: z.string().optional(),
  heldAmount: z.string().optional()
});

export const AccountSchema = z.object({
  id: z.string(),
  connectionId: z.string().optional(),
  alias: z.string().nullable(),
  nickname: z.string().nullable().optional(),
  bankName: z.string(),
  logoUrl: z.string().nullable().optional(),
  iban: z.string().nullable(),
  currency: z.string(),
  lastBalance: AccountBalanceSchema.nullable(),
  syncedAt: z.string().nullable(),
  status: z.string().optional(),
  isActive: z.boolean().default(true),
  position: z.number().default(0)
});

export type AccountResponse = z.infer<typeof AccountSchema>;

export const AccountParamSchema = z.object({
  id: z.string().min(1)
});

export const ConnectionParamSchema = z.object({
  connectionId: z.string().min(1)
});

export const UpdateAccountSchema = z.object({
  nickname: z.string().trim().max(50).nullable().optional(),
  isActive: z.boolean().optional()
});

export const ToggleVisibilitySchema = z.object({
  isActive: z.boolean()
});

export const ReorderAccountsSchema = z.object({
  accountIds: z.array(z.string().min(1)).min(1, "accountIds must contain at least one ID")
});

export const AccountTransactionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  from: z.string().optional(),
  to: z.string().optional(),
  category: z.string().optional()
});
