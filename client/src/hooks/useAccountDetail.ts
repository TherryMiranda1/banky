import { useState, useEffect, useCallback } from "react";
import { getAccount, Account } from "@/lib/api/accounts";
import { getTransactions, Transaction } from "@/lib/api/transactions";

export interface AccountDetailState {
  account: Account | null;
  transactions: Transaction[];
  total: number;
  page: number;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  fromDate: string;
  toDate: string;
  selectedCategory: string;
  availableCategories: string[];
  setFromDate: (date: string) => void;
  setToDate: (date: string) => void;
  setSelectedCategory: (cat: string) => void;
  resetFilters: () => void;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useAccountDetail(accountId: string | undefined): AccountDetailState {
  const [account, setAccount] = useState<Account | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

  const limit = 50;

  const fetchInitialData = useCallback(async () => {
    if (!accountId) {
      setError("No account ID provided");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setPage(1);

    try {
      const [acc, txRes] = await Promise.all([
        getAccount(accountId),
        getTransactions({
          accountId,
          page: 1,
          limit,
          from: fromDate || undefined,
          to: toDate || undefined,
          category: selectedCategory || undefined
        })
      ]);

      setAccount(acc);
      setTransactions(txRes.data);
      setTotal(txRes.total);
      setHasMore(txRes.hasMore);

      // Collect categories
      const cats = new Set<string>();
      txRes.data.forEach((tx) => {
        if (tx.category) cats.add(tx.category);
      });
      setAvailableCategories((prev) => Array.from(new Set([...prev, ...Array.from(cats)])));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load account details";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [accountId, fromDate, toDate, selectedCategory]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const loadMore = useCallback(async () => {
    if (!accountId || isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    const nextPage = page + 1;

    try {
      const txRes = await getTransactions({
        accountId,
        page: nextPage,
        limit,
        from: fromDate || undefined,
        to: toDate || undefined,
        category: selectedCategory || undefined
      });

      setTransactions((prev) => [...prev, ...txRes.data]);
      setPage(nextPage);
      setTotal(txRes.total);
      setHasMore(txRes.hasMore);

      const cats = new Set<string>();
      txRes.data.forEach((tx) => {
        if (tx.category) cats.add(tx.category);
      });
      setAvailableCategories((prev) => Array.from(new Set([...prev, ...Array.from(cats)])));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load more transactions";
      setError(msg);
    } finally {
      setIsLoadingMore(false);
    }
  }, [accountId, isLoadingMore, hasMore, page, fromDate, toDate, selectedCategory]);

  const resetFilters = useCallback(() => {
    setFromDate("");
    setToDate("");
    setSelectedCategory("");
  }, []);

  const refresh = useCallback(async () => {
    await fetchInitialData();
  }, [fetchInitialData]);

  return {
    account,
    transactions,
    total,
    page,
    hasMore,
    isLoading,
    isLoadingMore,
    error,
    fromDate,
    toDate,
    selectedCategory,
    availableCategories,
    setFromDate,
    setToDate,
    setSelectedCategory,
    resetFilters,
    loadMore,
    refresh
  };
}
