import React from "react";
import { useParams, Link } from "react-router-dom";
import { useAccountDetail } from "@/hooks/useAccountDetail";
import { TransactionList } from "@/components/transactions/TransactionList";
import { TransactionFilters } from "@/components/transactions/TransactionFilters";
import {
  ArrowLeft,
  Building2,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  RefreshCw
} from "lucide-react";

function maskIban(iban: string | null): string {
  if (!iban) return "No IBAN";
  const clean = iban.replace(/\s+/g, "");
  if (clean.length <= 8) return clean;
  const prefix = clean.slice(0, 4);
  const suffix = clean.slice(-4);
  return `${prefix} •••• ${suffix}`;
}

function formatCurrencySymbol(currency: string): string {
  switch (currency.toUpperCase()) {
    case "EUR":
      return "€";
    case "GBP":
      return "£";
    case "USD":
      return "$";
    default:
      return `${currency} `;
  }
}

function formatBalanceAmount(amountStr: string): string {
  const num = parseFloat(amountStr);
  if (isNaN(num)) return amountStr;
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
}

export const AccountDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const {
    account,
    transactions,
    total,
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
  } = useAccountDetail(id);

  if (error && !account) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 rounded-2xl bg-surface border border-negative/30 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-negative/10 text-negative flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-text">Failed to load account details</h2>
        <p className="text-sm text-muted font-mono">{error}</p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-surface border border-border text-text font-mono text-xs hover:border-accent/60 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <button
            type="button"
            onClick={refresh}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent text-bg font-semibold text-xs uppercase tracking-wider hover:bg-accent/90 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  const bankName = account?.bankName || "Account Details";
  const isExpired = account?.status === "expired";
  const balanceStr = account?.lastBalance?.amount ?? "0.00";
  const balanceNum = parseFloat(balanceStr);
  const isNegativeBalance = !isNaN(balanceNum) && balanceNum < 0;

  return (
    <div className="space-y-6 max-w-5xl animate-in fade-in duration-200">
      {/* Breadcrumb Navigation & Top Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-mono text-muted min-w-0">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-muted hover:text-accent transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
          <span className="shrink-0">/</span>
          <span className="text-text font-medium truncate min-w-0">{bankName}</span>
        </div>
      </div>

      {/* Account Summary Banner */}
      <div className="p-5 sm:p-6 rounded-2xl bg-surface border border-border flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6 shadow-xl">
        <div className="flex items-start gap-3.5 sm:gap-4 min-w-0">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-accent/10 border border-accent/20 text-accent flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-text truncate">
                {bankName}
              </h1>
              {isExpired ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-mono bg-negative/10 text-negative border border-negative/20 shrink-0">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Expired
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-mono bg-accent/10 text-accent border border-accent/20 shrink-0">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Active
                </span>
              )}
            </div>
            <p className="text-xs text-muted font-mono mt-1 truncate">
              {account?.alias ? `${account.alias} • ` : ""}
              {maskIban(account?.iban ?? null)}
            </p>
          </div>
        </div>

        <div className="md:text-right border-t md:border-t-0 pt-3 md:pt-0 border-border/40">
          <span className="text-[10px] sm:text-[11px] text-muted font-mono uppercase tracking-wider block">
            Current Balance
          </span>
          <div className="flex items-baseline md:justify-end gap-1.5 mt-0.5">
            <span className="text-sm sm:text-base font-mono text-muted">
              {account ? formatCurrencySymbol(account.currency) : "€"}
            </span>
            <span
              className={`text-2xl sm:text-3xl font-bold font-mono tracking-tight whitespace-nowrap ${
                isNegativeBalance ? "text-negative" : "text-accent"
              }`}
            >
              {account ? formatBalanceAmount(balanceStr) : "---"}
            </span>
            <span className="text-xs font-mono text-muted ml-1">
              {account?.currency || "EUR"}
            </span>
          </div>
        </div>
      </div>

      {/* Transaction Filters */}
      <TransactionFilters
        fromDate={fromDate}
        toDate={toDate}
        selectedCategory={selectedCategory}
        availableCategories={availableCategories}
        onFromChange={setFromDate}
        onToChange={setToDate}
        onCategoryChange={setSelectedCategory}
        onReset={resetFilters}
      />

      {/* Transactions List */}
      <TransactionList
        transactions={transactions}
        total={total}
        hasMore={hasMore}
        isLoading={isLoading}
        isLoadingMore={isLoadingMore}
        onLoadMore={loadMore}
      />
    </div>
  );
};
