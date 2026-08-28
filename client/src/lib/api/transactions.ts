import { apiFetch } from "./client.js";

export interface TransactionMetadata {
  balanceAfter?: {
    amount: string;
    currency: string;
  } | null;
  counterparty?: {
    name?: string | null;
    iban?: string | null;
    city?: string | null;
    country?: string | null;
  } | null;
  mcc?: string | null;
  mccInfo?: {
    code: string;
    name: string;
    group: string;
    icon: string;
  } | null;
  bankTransactionCode?: {
    code?: string;
    subCode?: string;
    description?: string;
  } | null;
  exchangeRate?: {
    rate?: string;
    sourceCurrency?: string;
    sourceAmount?: string;
    unitCurrency?: string;
  } | null;
  dates?: {
    bookingDate?: string | null;
    valueDate?: string | null;
    transactionDate?: string | null;
  } | null;
  referenceNumber?: string | null;
  remittanceInformation?: string[] | null;
  note?: string | null;
}

export interface Transaction {
  id: string;
  accountId?: string;
  accountAlias?: string | null;
  bankName?: string;
  iban?: string | null;
  amount: string;
  currency: string;
  description: string | null;
  category: string | null;
  bookedAt: string;
  isTransfer?: boolean;
  transferMatchId?: string | null;
  metadata?: TransactionMetadata | null;
}

export interface TransactionsResponse {
  data: Transaction[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface TransactionQueryParams {
  accountId?: string;
  accountIds?: string[];
  page?: number;
  limit?: number;
  from?: string;
  to?: string;
  period?: string;
  category?: string;
  type?: "all" | "income" | "expense" | "transfer";
}

export interface TransactionResponse {
  data: Transaction;
}

export interface SuggestRuleResponse {
  data: {
    transactionId: string;
    pattern: string;
    merchantName: string;
    description: string | null;
  };
}

export async function getTransactions(params: TransactionQueryParams): Promise<TransactionsResponse> {
  const searchParams = new URLSearchParams();
  if (params.accountId && params.accountId !== "all") {
    searchParams.set("accountId", params.accountId);
  }
  if (params.accountIds && params.accountIds.length > 0) {
    searchParams.set("accountIds", params.accountIds.join(","));
  }

  if (params.page !== undefined) {
    searchParams.set("page", params.page.toString());
  }
  if (params.limit !== undefined) {
    searchParams.set("limit", params.limit.toString());
  }
  if (params.from) {
    searchParams.set("from", params.from);
  }
  if (params.to) {
    searchParams.set("to", params.to);
  }
  if (params.period) {
    searchParams.set("period", params.period);
  }
  if (params.category) {
    searchParams.set("category", params.category);
  }
  if (params.type && params.type !== "all") {
    searchParams.set("type", params.type);
  }

  return apiFetch<TransactionsResponse>(`/transactions?${searchParams.toString()}`);
}

export async function createManualTransaction(data: {
  accountId: string;
  amount: string;
  currency?: string;
  description: string;
  category?: string | null;
  bookedAt: string;
}): Promise<Transaction> {
  const res = await apiFetch<TransactionResponse>("/transactions", {
    method: "POST",
    body: JSON.stringify({
      currency: "EUR",
      ...data
    })
  });
  return res.data;
}

export async function updateManualTransaction(
  id: string,
  data: {
    amount?: string;
    currency?: string;
    description?: string;
    category?: string | null;
    bookedAt?: string;
  }
): Promise<Transaction> {
  const res = await apiFetch<TransactionResponse>(`/transactions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data)
  });
  return res.data;
}

export async function deleteManualTransaction(id: string): Promise<{ success: boolean; id: string }> {
  return apiFetch<{ success: boolean; id: string }>(`/transactions/${id}`, {
    method: "DELETE"
  });
}

export async function updateTransactionCategory(
  id: string,
  categoryId: string | null
): Promise<Transaction> {
  const res = await apiFetch<TransactionResponse>(`/transactions/${id}/category`, {
    method: "PATCH",
    body: JSON.stringify({ categoryId })
  });
  return res.data;
}

export async function suggestTransactionRule(
  id: string
): Promise<{ transactionId: string; pattern: string; merchantName: string; description: string | null }> {
  const res = await apiFetch<SuggestRuleResponse>(`/transactions/${id}/suggest-rule`, {
    method: "POST"
  });
  return res.data;
}

