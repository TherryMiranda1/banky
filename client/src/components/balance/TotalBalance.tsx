import React from "react";
import { RefreshCw, Clock, Plus, DollarSign, ArrowUpRight, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

interface TotalBalanceProps {
  totals: Record<string, string>;
  lastSyncedAt: string | null;
  isSyncing: boolean;
  onSync: () => void;
  onOpenCashModal?: () => void;
  isInitializingCash?: boolean;
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

function formatAmount(amountStr: string): string {
  const num = parseFloat(amountStr);
  if (isNaN(num)) return amountStr;
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
}

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return "Never";
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return "Just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

export const TotalBalance: React.FC<TotalBalanceProps> = ({
  totals,
  lastSyncedAt,
  isSyncing,
  onSync,
  onOpenCashModal,
  isInitializingCash = false
}) => {
  const currencies = Object.keys(totals);
  const primaryCurrency = currencies.includes("EUR")
    ? "EUR"
    : currencies[0] || "EUR";
  const primaryAmount = totals[primaryCurrency] || "0.00";
  const otherCurrencies = currencies.filter((c) => c !== primaryCurrency);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-surface border border-border/80 p-6 sm:p-8 shadow-xl">
      {/* Subtle background ambient glows */}
      <div className="absolute top-0 right-1/4 w-72 h-72 bg-accent/[0.04] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-60 h-60 bg-blue-500/[0.03] rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center space-y-6">
        {/* Top bar: Status & Live indicator */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-bg/80 border border-border/60 text-[11px] font-mono text-muted">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span>Total Balance</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted font-mono bg-bg/60 px-2.5 py-1 rounded-full border border-border/40">
            <Clock className="w-3 h-3 text-muted/80" />
            <span>{formatRelativeTime(lastSyncedAt)}</span>
          </div>
        </div>

        {/* Primary Hero Balance */}
        <div className="space-y-2 py-2">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-2xl sm:text-3xl font-mono text-muted font-light">
              {formatCurrencySymbol(primaryCurrency)}
            </span>
            <span className="text-4xl sm:text-6xl font-bold font-mono tracking-tight text-text">
              {formatAmount(primaryAmount)}
            </span>
            <span className="text-xs sm:text-sm font-mono text-muted font-medium ml-1">
              {primaryCurrency}
            </span>
          </div>

          {/* Secondary Currencies (Pills) */}
          {otherCurrencies.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              {otherCurrencies.map((curr) => (
                <div
                  key={curr}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-bg/80 border border-border text-xs font-mono text-text"
                >
                  <TrendingUp className="w-3 h-3 text-accent" />
                  <span className="text-muted">{curr}:</span>
                  <span className="font-semibold">
                    {formatCurrencySymbol(curr)}
                    {formatAmount(totals[curr] || "0.00")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Revolut-style Quick Action Buttons */}
        <div className="flex items-center justify-center gap-3 sm:gap-6 pt-2 pb-1 flex-wrap">
          {/* Connect / Add Bank */}
          <Link
            to="/connect"
            className="flex flex-col items-center gap-1.5 group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-accent/15 border border-accent/30 text-accent flex items-center justify-center group-hover:bg-accent group-hover:text-bg transition-all duration-200 shadow-sm group-hover:scale-105">
              <Plus className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-medium text-text group-hover:text-accent transition-colors">
              Conectar
            </span>
          </Link>

          {/* Cash Transaction */}
          {onOpenCashModal && (
            <button
              type="button"
              onClick={onOpenCashModal}
              disabled={isInitializingCash}
              className="flex flex-col items-center gap-1.5 group cursor-pointer disabled:opacity-50"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-bg transition-all duration-200 shadow-sm group-hover:scale-105">
                <DollarSign className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-medium text-text group-hover:text-emerald-400 transition-colors">
                Efectivo
              </span>
            </button>
          )}

          {/* Sync Accounts */}
          <button
            type="button"
            onClick={onSync}
            disabled={isSyncing}
            className="flex flex-col items-center gap-1.5 group cursor-pointer disabled:opacity-50"
          >
            <div className="w-12 h-12 rounded-full bg-surface border border-border text-muted flex items-center justify-center group-hover:border-accent/40 group-hover:text-accent transition-all duration-200 shadow-sm group-hover:scale-105">
              <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin text-accent" : ""}`} />
            </div>
            <span className="text-[11px] font-medium text-muted group-hover:text-text transition-colors">
              {isSyncing ? "Sincronizando" : "Sincronizar"}
            </span>
          </button>

          {/* View Details / All Transactions */}
          <Link
            to="/accounts"
            className="flex flex-col items-center gap-1.5 group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-surface border border-border text-muted flex items-center justify-center group-hover:border-border/80 group-hover:text-text transition-all duration-200 shadow-sm group-hover:scale-105">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-medium text-muted group-hover:text-text transition-colors">
              Movimientos
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
};
