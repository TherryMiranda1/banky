import React, { useMemo, useState, useEffect, useRef } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { useAccountDetail } from "@/hooks/useAccountDetail";
import { useAuth } from "@/context/AuthContext";
import { getCurrentPeriod } from "@/lib/cycle-utils";
import { AccountHero } from "@/components/accounts/AccountHero";
import { AccountStickyHeader } from "@/components/accounts/AccountStickyHeader";
import { AccountContextBar } from "@/components/transactions/AccountContextBar";
import { PeriodSummaryStrip } from "@/components/transactions/PeriodSummaryStrip";
import { GroupedTransactionFeed } from "@/components/transactions/GroupedTransactionFeed";
import { TransactionTypeFilter } from "@/components/transactions/TransactionFilters";
import { ActionToast } from "@/components/ui/ActionToast";
import { exportTransactionsToExcel } from "@/lib/export-excel";
import { ArrowLeft, AlertCircle, RefreshCw } from "lucide-react";

export const AccountDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const currentAccountId = !id || id === "all" ? "all" : id;
  const isGlobalView = currentAccountId === "all";

  const userCutoffDay = user?.cutoffDay || 1;
  const defaultPeriod = useMemo(() => getCurrentPeriod(userCutoffDay), [userCutoffDay]);

  const urlPeriod = searchParams.get("period") || defaultPeriod;
  const urlCategory = searchParams.get("category") || "";
  const urlType = (searchParams.get("type") as TransactionTypeFilter) || "all";
  const urlFrom = searchParams.get("from") || "";
  const urlTo = searchParams.get("to") || "";
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [isStickyVisible, setIsStickyVisible] = useState<boolean>(false);
  const heroRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY || document.documentElement.scrollTop;
      setIsStickyVisible(scrollPos > 140);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleFilterParamChange = (filters: {
    period?: string;
    category?: string;
    type?: TransactionTypeFilter;
    from?: string;
    to?: string;
  }) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (filters.period !== undefined) {
        if (filters.period) next.set("period", filters.period);
        else next.delete("period");
      }
      if (filters.category !== undefined) {
        if (filters.category) next.set("category", filters.category);
        else next.delete("category");
      }
      if (filters.type !== undefined) {
        if (filters.type && filters.type !== "all") next.set("type", filters.type);
        else next.delete("type");
      }
      if (filters.from !== undefined) {
        if (filters.from) next.set("from", filters.from);
        else next.delete("from");
      }
      if (filters.to !== undefined) {
        if (filters.to) next.set("to", filters.to);
        else next.delete("to");
      }
      return next;
    }, { replace: true });
  };

  const {
    account,
    accountsList,
    selectedAccountIds,
    transactions,
    total,
    hasMore,
    isLoading,
    isLoadingMore,
    error,
    selectedPeriod,
    fromDate,
    toDate,
    selectedCategory,
    selectedType,
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
  } = useAccountDetail(isGlobalView ? undefined : id, {
    initialPeriod: urlPeriod,
    initialCategory: urlCategory,
    initialType: urlType,
    initialFrom: urlFrom,
    initialTo: urlTo,
    onFilterChange: handleFilterParamChange
  });

  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) return transactions;
    const q = searchQuery.toLowerCase();
    return transactions.filter(
      (tx) =>
        (tx.description && tx.description.toLowerCase().includes(q)) ||
        (tx.category && tx.category.toLowerCase().includes(q)) ||
        (tx.bankName && tx.bankName.toLowerCase().includes(q))
    );
  }, [transactions, searchQuery]);

  const globalTotalBalance = useMemo(() => {
    return accountsList
      .filter((acc) => selectedAccountIds.includes(acc.id))
      .reduce((sum, acc) => {
        const amt = parseFloat(acc.lastBalance?.amount || "0");
        return sum + (isNaN(amt) ? 0 : amt);
      }, 0);
  }, [accountsList, selectedAccountIds]);

  const handleExportExcel = () => {
    const fileName = isGlobalView
      ? "banky-todas-las-cuentas"
      : `banky-${(account?.nickname || account?.bankName || "cuenta").toLowerCase().replace(/\s+/g, "-")}`;
    exportTransactionsToExcel(filteredTransactions, fileName);
  };

  if (error && !account && !isGlobalView) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 rounded-3xl bg-surface border border-negative/30 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-negative/10 text-negative flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-text">Error al cargar la cuenta</h2>
        <p className="text-sm text-muted font-mono">{error}</p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            to="/accounts"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface border border-border text-text font-mono text-xs hover:border-accent/60 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Ver todas las cuentas
          </Link>
          <button
            type="button"
            onClick={refresh}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent text-bg font-semibold text-xs uppercase tracking-wider hover:bg-accent/90 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-5xl mx-auto animate-in fade-in duration-200">
      {/* Sticky Shrinking Header on Scroll */}
      <AccountStickyHeader
        isVisible={isStickyVisible}
        account={account}
        isGlobalView={isGlobalView}
        totalBalance={globalTotalBalance}
        selectedCount={selectedAccountIds.length}
        totalCount={accountsList.length}
        onExportExcel={handleExportExcel}
        onRefresh={refresh}
      />

      {/* Main Account Hero */}
      <AccountHero
        account={account}
        accountsList={accountsList}
        selectedAccountIds={selectedAccountIds}
        isGlobalView={isGlobalView}
        currentAccountId={currentAccountId}
        searchParamsString={searchParams.toString()}
        onToggleAccount={toggleAccount}
        onSelectAllAccounts={selectAllAccounts}
        onExportExcel={handleExportExcel}
        onRefresh={refresh}
        heroRef={heroRef}
      />

      {/* Spend Summary Strip */}
      <PeriodSummaryStrip
        transactions={filteredTransactions}
        currency={account?.currency || "EUR"}
      />

      {/* Unified Period Navigation & Smart Context Toolbar */}
      <AccountContextBar
        selectedPeriod={selectedPeriod || defaultPeriod}
        cutoffDay={userCutoffDay}
        onSelectPeriod={setSelectedPeriod}
        fromDate={fromDate}
        toDate={toDate}
        selectedCategory={selectedCategory}
        categoriesList={categoriesList}
        selectedType={selectedType}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onFromChange={setFromDate}
        onToChange={setToDate}
        onCategoryChange={setSelectedCategory}
        onTypeChange={setSelectedType}
        onReset={() => {
          setSearchQuery("");
          resetFilters();
        }}
      />

      {/* Grouped Transaction Feed with Sticky Headers */}
      <GroupedTransactionFeed
        transactions={filteredTransactions}
        total={total}
        hasMore={hasMore}
        isLoading={isLoading}
        isLoadingMore={isLoadingMore}
        onLoadMore={loadMore}
        onUpdateCategory={updateCategory}
        categoriesList={categoriesList}
      />

      {/* Action Toast */}
      <ActionToast
        isOpen={Boolean(toastState?.isOpen)}
        message={`Categoría actualizada. ¿Crear regla para "${toastState?.categoryName}"?`}
        actionLabel="Crear regla"
        onAction={createRuleFromToast}
        onDismiss={dismissToast}
        isLoadingAction={isCreatingRule}
        durationMs={5000}
      />
    </div>
  );
};
