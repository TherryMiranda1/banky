import React from "react";
import { RefreshCw, Plus, Wallet, CheckCircle, TrendingUp } from "lucide-react";
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
  if (!dateStr) return "Nunca";
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return "hace un momento";
    if (diffSec < 3600) return `hace ${Math.floor(diffSec / 60)} min`;
    if (diffSec < 86400) return `hace ${Math.floor(diffSec / 3600)} h`;
    return date.toLocaleDateString("es-ES", { month: "short", day: "numeric" });
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
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2 border-b border-border/80 pb-6">
      {/* Balance & Status Details */}
      <div className="space-y-2 min-w-0">
        <div>
          <span className="text-xs font-mono text-muted uppercase tracking-wider block">
            Patrimonio Total Consolidado
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl sm:text-4xl font-bold font-mono tracking-tight text-text">
              {formatCurrencySymbol(primaryCurrency)}{formatAmount(primaryAmount)}
            </span>
            <span className="text-xs font-mono text-muted uppercase">
              {primaryCurrency}
            </span>

            {/* Other Currencies Inline */}
            {otherCurrencies.length > 0 && (
              <div className="flex items-center gap-2 ml-3">
                {otherCurrencies.map((curr) => (
                  <span
                    key={curr}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-elevated border border-border text-xs font-mono text-muted"
                  >
                    <TrendingUp className="w-3 h-3 text-accent" />
                    <span>{formatCurrencySymbol(curr)}{formatAmount(totals[curr] || "0.00")}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* GitHub Status Line */}
        <div className="flex items-center gap-2 text-xs text-muted flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-positive/10 border border-positive/30 text-positive font-medium text-[11px]">
            <CheckCircle className="w-3 h-3" />
            Conectado
          </span>
          <span>•</span>
          <span className="font-mono text-[11px]">
            Actualizado {formatRelativeTime(lastSyncedAt)}
          </span>
          <span>•</span>
          <span className="font-mono text-[11px] text-muted/80">
            Open Banking AISP (Solo lectura)
          </span>
        </div>
      </div>

      {/* Action Buttons (GitHub Primer Style) */}
      <div className="flex items-center gap-2 shrink-0 flex-wrap">
        <Link
          to="/connect"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent hover:bg-accent/90 text-bg font-semibold text-xs transition-colors shadow-xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Conectar banco</span>
        </Link>

        {onOpenCashModal && (
          <button
            type="button"
            onClick={onOpenCashModal}
            disabled={isInitializingCash}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface hover:bg-surface-elevated border border-border text-text font-medium text-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Wallet className="w-3.5 h-3.5 text-income" />
            <span>Efectivo</span>
          </button>
        )}

        <button
          type="button"
          onClick={onSync}
          disabled={isSyncing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface hover:bg-surface-elevated border border-border text-text font-medium text-xs transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-muted ${isSyncing ? "animate-spin text-accent" : ""}`} />
          <span>{isSyncing ? "Sincronizando..." : "Sincronizar"}</span>
        </button>
      </div>
    </div>
  );
};
