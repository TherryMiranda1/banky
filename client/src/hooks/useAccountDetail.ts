import { useState, useEffect, useCallback, useRef } from "react";
import { getAccount, getAccounts, Account } from "@/lib/api/accounts";
import {
  getTransactions,
  Transaction,
  updateTransactionCategory,
  suggestTransactionRule
} from "@/lib/api/transactions";
import {
  CategoryItem,
  getCategories,
  createCategorizationRule,
  applyCategorizationRules
} from "@/lib/api/categories";
import { TransactionTypeFilter } from "@/components/transactions/TransactionFilters";

export interface ToastActionState {
  isOpen: boolean;
  transactionId: string;
  categoryId: string;
  categoryName: string;
  description: string | null;
}

export interface UseAccountDetailOptions {
  initialPeriod?: string;
  initialCategory?: string;
  initialType?: TransactionTypeFilter;
  initialFrom?: string;
  initialTo?: string;
  onFilterChange?: (filters: {
    period?: string;
    category?: string;
    type?: TransactionTypeFilter;
    from?: string;
    to?: string;
  }) => void;
}

export interface AccountDetailState {
  account: Account | null;
  accountsList: Account[];
  selectedAccountIds: string[];
  transactions: Transaction[];
  total: number;
  page: number;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  selectedPeriod: string;
  fromDate: string;
  toDate: string;
  selectedCategory: string;
  selectedType: TransactionTypeFilter;
  availableCategories: string[];
  categoriesList: CategoryItem[];
  toastState: ToastActionState | null;
  isCreatingRule: boolean;
  setSelectedPeriod: (period: string) => void;
  setFromDate: (date: string) => void;
  setToDate: (date: string) => void;
  setSelectedCategory: (cat: string) => void;
  setSelectedType: (type: TransactionTypeFilter) => void;
  toggleAccount: (accountId: string) => void;
  selectAllAccounts: () => void;
  resetFilters: () => void;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  updateCategory: (
    transactionId: string,
    categoryId: string | null,
    categoryName: string | null
  ) => Promise<void>;
  dismissToast: () => void;
  createRuleFromToast: () => Promise<void>;
}

export function useAccountDetail(
  accountId: string | undefined,
  optionsOrPeriod: string | UseAccountDetailOptions = ""
): AccountDetailState {
  const options: UseAccountDetailOptions =
    typeof optionsOrPeriod === "string"
      ? { initialPeriod: optionsOrPeriod }
      : optionsOrPeriod;

  const [account, setAccount] = useState<Account | null>(null);
  const [accountsList, setAccountsList] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedPeriod, setSelectedPeriodState] = useState<string>(options.initialPeriod || "");
  const [fromDate, setFromDateState] = useState<string>(options.initialFrom || "");
  const [toDate, setToDateState] = useState<string>(options.initialTo || "");
  const [selectedCategory, setSelectedCategoryState] = useState<string>(options.initialCategory || "");
  const [selectedType, setSelectedTypeState] = useState<TransactionTypeFilter>(options.initialType || "all");
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [categoriesList, setCategoriesList] = useState<CategoryItem[]>([]);
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);

  const [toastState, setToastState] = useState<ToastActionState | null>(null);
  const [isCreatingRule, setIsCreatingRule] = useState<boolean>(false);

  const onFilterChangeRef = useRef(options.onFilterChange);
  onFilterChangeRef.current = options.onFilterChange;

  // Sync state if options change from outside (e.g. back/forward navigation)
  useEffect(() => {
    if (options.initialPeriod !== undefined && options.initialPeriod !== selectedPeriod) {
      setSelectedPeriodState(options.initialPeriod);
    }
  }, [options.initialPeriod]);

  useEffect(() => {
    if (options.initialCategory !== undefined && options.initialCategory !== selectedCategory) {
      setSelectedCategoryState(options.initialCategory);
    }
  }, [options.initialCategory]);

  useEffect(() => {
    if (options.initialType !== undefined && options.initialType !== selectedType) {
      setSelectedTypeState(options.initialType);
    }
  }, [options.initialType]);

  useEffect(() => {
    if (options.initialFrom !== undefined && options.initialFrom !== fromDate) {
      setFromDateState(options.initialFrom);
    }
  }, [options.initialFrom]);

  useEffect(() => {
    if (options.initialTo !== undefined && options.initialTo !== toDate) {
      setToDateState(options.initialTo);
    }
  }, [options.initialTo]);

  const setSelectedPeriod = useCallback((period: string) => {
    setSelectedPeriodState(period);
    onFilterChangeRef.current?.({ period });
  }, []);

  const setFromDate = useCallback((date: string) => {
    setFromDateState(date);
    onFilterChangeRef.current?.({ from: date });
  }, []);

  const setToDate = useCallback((date: string) => {
    setToDateState(date);
    onFilterChangeRef.current?.({ to: date });
  }, []);

  const setSelectedCategory = useCallback((cat: string) => {
    setSelectedCategoryState(cat);
    onFilterChangeRef.current?.({ category: cat });
  }, []);

  const setSelectedType = useCallback((type: TransactionTypeFilter) => {
    setSelectedTypeState(type);
    onFilterChangeRef.current?.({ type });
  }, []);

  const limit = 50;
  const isGlobal = !accountId || accountId === "all";

  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setPage(1);

    try {
      const [acc, allAccs, catRes] = await Promise.all([
        isGlobal ? Promise.resolve(null) : getAccount(accountId!),
        getAccounts().catch(() => [] as Account[]),
        getCategories().catch(() => [] as CategoryItem[])
      ]);

      setAccount(acc);
      setAccountsList(allAccs);
      setCategoriesList(catRes);

      let effectiveSelected = selectedAccountIds;
      if (effectiveSelected.length === 0 && allAccs.length > 0) {
        // Default to active accounts only
        const activeOnly = allAccs.filter((a) => a.isActive !== false).map((a) => a.id);
        effectiveSelected = activeOnly.length > 0 ? activeOnly : allAccs.map((a) => a.id);
        setSelectedAccountIds(effectiveSelected);
      }

      if (isGlobal && effectiveSelected.length === 0 && allAccs.length > 0) {
        setTransactions([]);
        setTotal(0);
        setHasMore(false);
        return;
      }

      const txRes = await getTransactions({
        accountId: isGlobal ? undefined : accountId,
        accountIds: isGlobal && effectiveSelected.length > 0 ? effectiveSelected : undefined,
        page: 1,
        limit,
        period: selectedPeriod || undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
        category: selectedCategory || undefined,
        type: selectedType !== "all" ? selectedType : undefined
      });

      setTransactions(txRes.data);
      setTotal(txRes.total);
      setHasMore(txRes.hasMore);

      const cats = new Set<string>();
      catRes.forEach((c) => cats.add(c.name));
      txRes.data.forEach((tx) => {
        if (tx.category) cats.add(tx.category);
      });
      setAvailableCategories(Array.from(cats));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load account details";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [accountId, isGlobal, selectedPeriod, fromDate, toDate, selectedCategory, selectedType, selectedAccountIds]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const toggleAccount = useCallback((accId: string) => {
    setSelectedAccountIds((prev) => {
      if (prev.includes(accId)) {
        return prev.filter((id) => id !== accId);
      } else {
        return [...prev, accId];
      }
    });
  }, []);

  const selectAllAccounts = useCallback(() => {
    // If all are selected, toggle to only active
    setSelectedAccountIds(accountsList.map((a) => a.id));
  }, [accountsList]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    const nextPage = page + 1;

    try {
      const txRes = await getTransactions({
        accountId: isGlobal ? undefined : accountId,
        accountIds: isGlobal && selectedAccountIds.length > 0 ? selectedAccountIds : undefined,
        page: nextPage,
        limit,
        period: selectedPeriod || undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
        category: selectedCategory || undefined,
        type: selectedType !== "all" ? selectedType : undefined
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
  }, [accountId, isGlobal, selectedAccountIds, isLoadingMore, hasMore, page, selectedPeriod, fromDate, toDate, selectedCategory, selectedType]);

  const updateCategory = useCallback(
    async (
      transactionId: string,
      categoryId: string | null,
      categoryName: string | null
    ) => {
      const targetTx = transactions.find((t) => t.id === transactionId);
      const previousCategory = targetTx ? targetTx.category : null;
      const previousIsTransfer = targetTx ? targetTx.isTransfer : false;
      const isTransfer = categoryName?.toLowerCase() === "traspasos" || categoryName?.toLowerCase() === "traspaso";

      setTransactions((prev) =>
        prev.map((tx) =>
          tx.id === transactionId
            ? { ...tx, category: categoryName, isTransfer }
            : tx
        )
      );

      if (categoryName) {
        setAvailableCategories((prev) =>
          prev.includes(categoryName) ? prev : [...prev, categoryName]
        );
      }

      try {
        const updated = await updateTransactionCategory(transactionId, categoryId);

        setTransactions((prev) =>
          prev.map((tx) =>
            tx.id === transactionId
              ? { ...tx, category: updated.category, isTransfer: updated.isTransfer }
              : tx
          )
        );

        if (categoryId && categoryName) {
          setToastState({
            isOpen: true,
            transactionId,
            categoryId,
            categoryName,
            description: targetTx?.description ?? null
          });
        }
      } catch (err) {
        setTransactions((prev) =>
          prev.map((tx) =>
            tx.id === transactionId
              ? { ...tx, category: previousCategory, isTransfer: previousIsTransfer }
              : tx
          )
        );
        const msg = err instanceof Error ? err.message : "Error al actualizar categoría";
        setError(msg);
      }
    },
    [transactions]
  );

  const dismissToast = useCallback(() => {
    setToastState(null);
  }, []);

  const createRuleFromToast = useCallback(async () => {
    if (!toastState) return;

    try {
      setIsCreatingRule(true);
      const suggestion = await suggestTransactionRule(toastState.transactionId);
      await createCategorizationRule({
        categoryId: toastState.categoryId,
        pattern: suggestion.pattern,
        priority: 0
      });
      await applyCategorizationRules();
      setToastState(null);
      await fetchInitialData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al crear la regla";
      setError(msg);
    } finally {
      setIsCreatingRule(false);
    }
  }, [toastState, fetchInitialData]);

  const resetFilters = useCallback(() => {
    setFromDateState("");
    setToDateState("");
    setSelectedCategoryState("");
    setSelectedTypeState("all");
    onFilterChangeRef.current?.({
      category: "",
      type: "all",
      from: "",
      to: ""
    });
  }, []);

  const refresh = useCallback(async () => {
    await fetchInitialData();
  }, [fetchInitialData]);

  return {
    account,
    accountsList,
    selectedAccountIds,
    transactions,
    total,
    page,
    hasMore,
    isLoading,
    isLoadingMore,
    error,
    selectedPeriod,
    fromDate,
    toDate,
    selectedCategory,
    selectedType,
    availableCategories,
    categoriesList,
    toastState,
    isCreatingRule,
    setSelectedPeriod,
    setFromDate,
    setToDate,
    setSelectedCategory,
    setSelectedType,
    toggleAccount,
    selectAllAccounts,
    resetFilters,
    loadMore,
    refresh,
    updateCategory,
    dismissToast,
    createRuleFromToast
  };
}
