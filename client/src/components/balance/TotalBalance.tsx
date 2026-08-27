import React from "react";
import { RefreshCw, Clock, ArrowUpRight, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

interface TotalBalanceProps {
  totals: Record<string, string>;
  lastSyncedAt: string | null;
  isSyncing: boolean;
  onSync: () => void;
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
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hours ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

export const TotalBalance: React.FC<TotalBalanceProps> = ({
  totals,
  lastSyncedAt,
  isSyncing,
  onSync
}) => {
  const currencies = Object.keys(totals);
  const primaryCurrency = currencies.includes("EUR")
    ? "EUR"
    : currencies[0] || "EUR";
  const primaryAmount = totals[primaryCurrency] || "0.00";
  const otherCurrencies = currencies.filter((c) => c !== primaryCurrency);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-surface border border-border/90 p-5 sm:p-8 shadow-2xl">
      <div className="absolute -right-24 -top-24 w-80 h-80 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 w-60 h-60 bg-accent/[0.03] rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/50 pb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-accent animate-pulse" />
            <span className="text-xs font-mono font-semibold uppercase tracking-widest text-muted">
              Aggregate Net Balance
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-1.5 text-xs text-muted font-mono">
              <Clock className="w-3.5 h-3.5" />
              <span>Synced {formatRelativeTime(lastSyncedAt)}</span>
            </div>

            <button
              type="button"
              onClick={onSync}
              disabled={isSyncing}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-border/60 hover:bg-border text-xs font-mono text-text transition-colors disabled:opacity-50 cursor-pointer"
              title="Trigger account synchronization"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-accent ${isSyncing ? "animate-spin" : ""}`} />
              <span>{isSyncing ? "Syncing..." : "Sync"}</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="min-w-0">
            <p className="text-xs text-muted font-mono mb-1">Total Liquid Assets</p>
            <div className="flex items-baseline gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap">
              <span className="text-2xl sm:text-3xl md:text-4xl font-mono text-muted font-light">
                {formatCurrencySymbol(primaryCurrency)}
              </span>
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold font-mono tracking-tight whitespace-nowrap bg-gradient-to-r from-accent via-emerald-200 to-white bg-clip-text text-transparent drop-shadow-sm">
                {formatAmount(primaryAmount)}
              </h1>
              <span className="text-xs sm:text-sm font-mono text-muted font-medium ml-1">
                {primaryCurrency}
              </span>
            </div>
          </div>

          {otherCurrencies.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:border-l md:border-border/60 md:pl-6">
              {otherCurrencies.map((curr) => (
                <div
                  key={curr}
                  className="px-3.5 py-2 rounded-xl bg-bg/70 border border-border/80 flex items-center gap-2.5 shadow-inner"
                >
                  <TrendingUp className="w-4 h-4 text-accent/80 shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase font-mono text-muted">{curr} Balance</p>
                    <p className="text-base sm:text-lg font-bold font-mono text-text whitespace-nowrap">
                      {formatCurrencySymbol(curr)}
                      {formatAmount(totals[curr] || "0.00")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-muted pt-3 border-t border-border/30">
          <span className="font-mono text-[11px] sm:text-xs">Real-time SQLite read cache (zero external latency)</span>
          <Link
            to="/connect"
            className="inline-flex items-center gap-1 text-accent font-mono hover:underline hover:text-accent/90 transition-colors shrink-0"
          >
            Connect another bank <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
};
