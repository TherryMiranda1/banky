import { apiFetch } from "./client.js";

export interface Transaction {
  id: string;
  amount: string;
  currency: string;
  description: string | null;
  category: string | null;
  bookedAt: string;
}

export interface TransactionsResponse {
  data: Transaction[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface TransactionQueryParams {
  accountId: string;
  page?: number;
  limit?: number;
  from?: string;
  to?: string;
  category?: string;
}

export async function getTransactions(params: TransactionQueryParams): Promise<TransactionsResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set("accountId", params.accountId);

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
  if (params.category) {
    searchParams.set("category", params.category);
  }

  return apiFetch<TransactionsResponse>(`/transactions?${searchParams.toString()}`);
}
