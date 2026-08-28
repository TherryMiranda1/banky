import React, { useMemo } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { useAccountDetail } from "@/hooks/useAccountDetail";
import { useAuth } from "@/context/AuthContext";
import { getCurrentPeriod } from "@/lib/cycle-utils";
import { CycleTabs } from "@/components/transactions/CycleTabs";
import { TransactionList } from "@/components/transactions/TransactionList";
import { TransactionFilters, TransactionTypeFilter } from "@/components/transactions/TransactionFilters";
import { ActionToast } from "@/components/ui/ActionToast";
import { BankLogo } from "@/components/accounts/BankLogo";
import { exportTransactionsToExcel } from "@/lib/export-excel";
import {
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  Layers,
  PowerOff
} from "lucide-react";
import { formatFirstName } from "@/lib/format-utils";

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

  const handlePeriodChange = (newPeriod: string) => {
    setSelectedPeriod(newPeriod);
  };

  const handleExportExcel = () => {
    const fileName = isGlobalView
      ? "banky-todas-las-cuentas"
      : `banky-${(account?.nickname || account?.bankName || "cuenta").toLowerCase().replace(/\s+/g, "-")}`;
    exportTransactionsToExcel(transactions, fileName);
  };

  // Calculate total global balance for currently active/selected accounts
  const globalTotalBalance = useMemo(() => {
    return accountsList
      .filter((acc) => selectedAccountIds.includes(acc.id))
      .reduce((sum, acc) => {
        const amt = parseFloat(acc.lastBalance?.amount || "0");
        return sum + (isNaN(amt) ? 0 : amt);
      }, 0);
  }, [accountsList, selectedAccountIds]);

  if (error && !account && !isGlobalView) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 rounded-2xl bg-surface border border-negative/30 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-negative/10 text-negative flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-text">Error al cargar la cuenta</h2>
        <p className="text-sm text-muted font-mono">{error}</p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            to="/accounts"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-surface border border-border text-text font-mono text-xs hover:border-accent/60 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Ver todas las cuentas
          </Link>
          <button
            type="button"
            onClick={refresh}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent text-bg font-semibold text-xs uppercase tracking-wider hover:bg-accent/90 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const bankName = isGlobalView
    ? "Todas las Cuentas"
    : account?.nickname || account?.bankName || "Detalles de Cuenta";
  const isExpired = account?.status === "expired";
  const isInactive = account?.isActive === false;
  const balanceStr = isGlobalView
    ? globalTotalBalance.toFixed(2)
    : account?.lastBalance?.amount ?? "0.00";
  const balanceNum = parseFloat(balanceStr);
  const isNegativeBalance = !isNaN(balanceNum) && balanceNum < 0;

  return (
    <div className="space-y-5 max-w-5xl animate-in fade-in duration-200">
      {/* Superior Account Switcher Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {/* All Accounts Tab */}
        <Link
          to={`/accounts${searchParams.toString() ? `?${searchParams.toString()}` : ""}`}
          className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
            isGlobalView
              ? "bg-accent/10 border-accent text-accent shadow-[0_0_16px_rgba(0,229,160,0.2)]"
              : "bg-surface border-border text-muted hover:text-text hover:border-border/80"
          }`}
        >
          <div className="w-6 h-6 rounded-lg bg-white shadow-sm border border-border/40 flex items-center justify-center text-slate-800 shrink-0">
            <Layers className="w-3.5 h-3.5 text-slate-700" />
          </div>
          <span>Todas las cuentas</span>
          <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-bg/80 border border-border/60">
            {formatCurrencySymbol("EUR")}{formatBalanceAmount(globalTotalBalance.toFixed(2))}
          </span>
        </Link>

        {/* Individual Account Tabs */}
        {accountsList.map((acc) => {
          const isSelected = acc.id === currentAccountId;
          const bal = acc.lastBalance?.amount || "0.00";
          const ibanEnd = acc.iban ? acc.iban.replace(/\s+/g, "").slice(-4) : null;
          const displayLabel = acc.nickname || formatFirstName(acc.alias) || acc.bankName;
          const accInactive = acc.isActive === false;

          return (
            <Link
              key={acc.id}
              to={`/accounts/${encodeURIComponent(acc.id)}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`}
              className={`shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs transition-all cursor-pointer ${
                isSelected
                  ? "bg-accent/10 border-accent text-accent font-semibold shadow-[0_0_16px_rgba(0,229,160,0.2)]"
                  : accInactive
                  ? "bg-surface/50 border-border/60 text-muted/70 hover:text-text opacity-70"
                  : "bg-surface border-border text-muted hover:text-text hover:border-border/80"
              }`}
            >
              <BankLogo bankName={acc.bankName} logoUrl={acc.logoUrl} size="sm" />
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <p className="leading-tight truncate max-w-[110px]">
                    {displayLabel}
                  </p>
                  {accInactive && (
                    <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-border text-muted shrink-0">
                      Off
                    </span>
                  )}
                  {ibanEnd && !accInactive && (
                    <span className="font-mono text-[9px] text-muted">
                      ••{ibanEnd}
                    </span>
                  )}
                </div>
                <p className="font-mono text-[10px] text-muted leading-tight">
                  {formatCurrencySymbol(acc.currency)}{formatBalanceAmount(bal)}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Account Summary Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5 min-w-0">
          {isGlobalView ? (
            <div className="w-11 h-11 rounded-xl bg-white shadow-sm border border-border/40 flex items-center justify-center text-slate-800 shrink-0">
              <Layers className="w-6 h-6 text-slate-700" />
            </div>
          ) : (
            <BankLogo bankName={account?.bankName || ""} logoUrl={account?.logoUrl} size="lg" />
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-text truncate">
                {bankName}
              </h1>
              {!isGlobalView && (
                isInactive ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-mono bg-border text-muted border border-border/80 shrink-0">
                    <PowerOff className="w-3 h-3" />
                    Cuenta Inactiva
                  </span>
                ) : isExpired ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-mono bg-negative/10 text-negative border border-negative/20 shrink-0">
                    <AlertTriangle className="w-3 h-3" />
                    Expirada
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-mono bg-accent/10 text-accent border border-accent/20 shrink-0">
                    <CheckCircle className="w-3 h-3" />
                    Activa
                  </span>
                )
              )}
            </div>
            <p className="text-xs text-muted font-mono mt-0.5 truncate">
              {isGlobalView
                ? `${selectedAccountIds.length} de ${accountsList.length} cuentas activas • Historial unificado`
                : `${account?.alias ? `${formatFirstName(account.alias)} • ` : ""}${maskIban(account?.iban ?? null)}${account?.nickname ? ` (${account.bankName})` : ""}`}
            </p>
          </div>
        </div>

        <div className="md:text-right border-t md:border-t-0 pt-2.5 md:pt-0 border-border/40 flex items-baseline md:flex-col justify-between md:justify-end">
          <span className="text-[10px] text-muted font-mono uppercase tracking-wider block">
            {isGlobalView ? "Saldo Total Combinado" : "Saldo Disponible"}
          </span>
          <div className="flex items-baseline md:justify-end gap-1.5 mt-0.5">
            <span className="text-sm font-mono text-muted">
              {account ? formatCurrencySymbol(account.currency) : "€"}
            </span>
            <span
              className={`text-xl sm:text-2xl font-bold font-mono tracking-tight whitespace-nowrap ${
                isNegativeBalance ? "text-negative" : "text-accent"
              }`}
            >
              {formatBalanceAmount(balanceStr)}
            </span>
            <span className="text-xs font-mono text-muted ml-1">
              {account?.currency || "EUR"}
            </span>
          </div>
        </div>
      </div>

      {/* Multi-Account Toggle Chips (Global View) */}
      {isGlobalView && accountsList.length > 1 && (
        <div className="p-3.5 rounded-xl bg-surface border border-border/80 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-mono text-muted uppercase tracking-wider">
              Cuentas incluidas en el cálculo ({selectedAccountIds.length}/{accountsList.length})
            </span>
            {selectedAccountIds.length < accountsList.length && (
              <button
                type="button"
                onClick={selectAllAccounts}
                className="text-[11px] font-mono text-accent hover:underline cursor-pointer"
              >
                Activar todas
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {accountsList.map((acc) => {
              const isActive = selectedAccountIds.includes(acc.id);
              const ibanEnd = acc.iban ? acc.iban.replace(/\s+/g, "").slice(-4) : null;
              const displayLabel = acc.nickname || formatFirstName(acc.alias) || acc.bankName;
              const isAccountDisabled = acc.isActive === false;

              return (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => toggleAccount(acc.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                    isActive
                      ? "bg-accent/10 border-accent/60 text-text shadow-xs"
                      : "bg-bg/40 border-border/60 text-muted opacity-50 hover:opacity-80"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full transition-colors ${
                      isActive ? "bg-accent shadow-[0_0_8px_rgba(0,229,160,0.6)]" : "bg-muted"
                    }`}
                  />
                  <span className="font-sans font-medium text-xs text-text">{displayLabel}</span>
                  {isAccountDisabled && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-border text-muted font-mono">
                      inactiva
                    </span>
                  )}
                  {ibanEnd && <span className="text-[10px] text-muted font-mono">•••• {ibanEnd}</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Monthly Financial Cycle Navigation Tabs */}
      <CycleTabs
        selectedPeriod={selectedPeriod || defaultPeriod}
        cutoffDay={userCutoffDay}
        onSelectPeriod={handlePeriodChange}
      />

      {/* Transaction Filters */}
      <TransactionFilters
        fromDate={fromDate}
        toDate={toDate}
        selectedCategory={selectedCategory}
        categoriesList={categoriesList}
        selectedType={selectedType}
        onFromChange={setFromDate}
        onToChange={setToDate}
        onCategoryChange={setSelectedCategory}
        onTypeChange={setSelectedType}
        onReset={resetFilters}
        onExportExcel={handleExportExcel}
      />

      {/* Transactions List */}
      <TransactionList
        transactions={transactions}
        total={total}
        hasMore={hasMore}
        isLoading={isLoading}
        isLoadingMore={isLoadingMore}
        onLoadMore={loadMore}
        onUpdateCategory={updateCategory}
        categoriesList={categoriesList}
      />

      {/* Interactive Action Toast for Quick Rule Creation */}
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
