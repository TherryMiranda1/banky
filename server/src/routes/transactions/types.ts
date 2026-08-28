import { z } from "zod";

export const TransactionMetadataSchema = z.object({
  balanceAfter: z.object({
    amount: z.string(),
    currency: z.string()
  }).nullable().optional(),
  counterparty: z.object({
    name: z.string().nullable().optional(),
    iban: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    country: z.string().nullable().optional()
  }).nullable().optional(),
  mcc: z.string().nullable().optional(),
  mccInfo: z.object({
    code: z.string(),
    name: z.string(),
    group: z.string(),
    icon: z.string()
  }).nullable().optional(),
  bankTransactionCode: z.object({
    code: z.string().optional(),
    subCode: z.string().optional(),
    description: z.string().optional()
  }).nullable().optional(),
  exchangeRate: z.object({
    rate: z.string().optional(),
    sourceCurrency: z.string().optional(),
    sourceAmount: z.string().optional(),
    unitCurrency: z.string().optional()
  }).nullable().optional(),
  dates: z.object({
    bookingDate: z.string().nullable().optional(),
    valueDate: z.string().nullable().optional(),
    transactionDate: z.string().nullable().optional()
  }).nullable().optional(),
  referenceNumber: z.string().nullable().optional(),
  remittanceInformation: z.array(z.string()).nullable().optional(),
  note: z.string().nullable().optional()
}).nullable().optional();

export type TransactionMetadata = z.infer<typeof TransactionMetadataSchema>;

export const TransactionSchema = z.object({
  id: z.string(),
  accountId: z.string().optional(),
  accountAlias: z.string().nullable().optional(),
  bankName: z.string().optional(),
  iban: z.string().nullable().optional(),
  amount: z.string(),
  currency: z.string(),
  description: z.string().nullable(),
  category: z.string().nullable(),
  bookedAt: z.string(),
  isTransfer: z.boolean().optional().default(false),
  transferMatchId: z.string().nullable().optional(),
  metadata: TransactionMetadataSchema
});

export const TransactionsResponseSchema = z.object({
  data: z.array(TransactionSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  hasMore: z.boolean()
});

export type TransactionResponse = z.infer<typeof TransactionSchema>;
export type TransactionsPaginatedResponse = z.infer<typeof TransactionsResponseSchema>;

export const TransactionsQuerySchema = z.object({
  accountId: z.string().optional(),
  accountIds: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  from: z.string().optional(),
  to: z.string().optional(),
  period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Period must be in YYYY-MM format").optional(),
  category: z.string().optional(),
  type: z.enum(["all", "income", "expense", "transfer"]).optional()
});

export const UpdateCategoryBodySchema = z.object({
  categoryId: z.string().nullable()
});

export const CreateManualTransactionSchema = z.object({
  accountId: z.string().min(1),
  amount: z.string().regex(/^-?\d+(\.\d{1,2})?$/, "Amount must be a valid decimal string"),
  currency: z.string().min(1).default("EUR"),
  description: z.string().trim().min(1).max(200),
  category: z.string().nullable().optional(),
  bookedAt: z.string().min(1)
});

export const UpdateManualTransactionSchema = z.object({
  amount: z.string().regex(/^-?\d+(\.\d{1,2})?$/).optional(),
  currency: z.string().min(1).optional(),
  description: z.string().trim().max(200).optional(),
  category: z.string().nullable().optional(),
  bookedAt: z.string().optional()
});

