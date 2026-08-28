import React from "react";
import { BankLogo } from "@/components/accounts/BankLogo";
import { Account } from "@/lib/api/accounts";
import { Layers, FileSpreadsheet, RefreshCw } from "lucide-react";

interface AccountStickyHeaderProps {
  isVisible: boolean;
  account?: Account | null;
  isGlobalView: boolean;
  totalBalance: number;
  selectedCount: number;
  totalCount: number;
  onExportExcel: () => void;
  onRefresh?: () => void;
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

function formatBalanceAmount(num: number): string {
  if (isNaN(num)) return "0.00";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
}

export const AccountStickyHeader: React.FC<AccountStickyHeaderProps> = ({
  isVisible,
  account,
  isGlobalView,
  totalBalance,
  selectedCount,
  totalCount,
  onExportExcel,
  onRefresh
}) => {
  const bankName = isGlobalView
    ? "Todas las Cuentas"
    : account?.nickname || account?.bankName || "Detalles de Cuenta";

  const balanceNum = isGlobalView
    ? totalBalance
    : parseFloat(account?.lastBalance?.amount || "0");
  const isNegative = !isNaN(balanceNum) && balanceNum < 0;
  const currency = account?.currency || "EUR";

  return (
    <div
      className={`fixed top-14 lg:top-16 left-0 right-0 lg:left-64 z-20 transition-all duration-300 pointer-events-none ${
        isVisible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 -translate-y-3 pointer-events-none"
      }`}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex items-center justify-between gap-4 px-4 py-2 rounded-2xl bg-surface/90 border border-border/80 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-3 min-w-0">
            {isGlobalView ? (
              <div className="w-8 h-8 rounded-xl bg-white shadow-xs flex items-center justify-center text-slate-800 shrink-0">
                <Layers className="w-4 h-4 text-slate-700" />
              </div>
            ) : (
              <BankLogo bankName={account?.bankName || ""} logoUrl={account?.logoUrl} size="sm" />
            )}

            <div className="min-w-0">
              <h2 className="text-sm font-semibold tracking-tight text-text truncate">
                {bankName}
              </h2>
              <p className="text-[11px] font-mono text-muted truncate">
                {isGlobalView
                  ? `${selectedCount}/${totalCount} cuentas activas`
                  : account?.iban
                  ? `•••• ${account.iban.replace(/\s+/g, "").slice(-4)}`
                  : "Cuenta activa"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <span
                className={`font-mono text-base sm:text-lg font-bold tracking-tight ${
                  isNegative ? "text-expense" : "text-text"
                }`}
              >
                {formatCurrencySymbol(currency)}{formatBalanceAmount(balanceNum)}
              </span>
            </div>

            <div className="flex items-center gap-1 border-l border-border/60 pl-2">
              {onRefresh && (
                <button
                  type="button"
                  onClick={onRefresh}
                  title="Refrescar datos"
                  className="p-1.5 rounded-lg bg-surface hover:bg-border/60 text-muted hover:text-text transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={onExportExcel}
                title="Exportar a Excel"
                className="p-1.5 rounded-lg bg-surface hover:bg-border/60 text-muted hover:text-positive transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-positive" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
