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
      className={`fixed top-14 lg:top-16 left-0 right-0 lg:left-64 z-20 transition-all duration-200 pointer-events-none ${
        isVisible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 -translate-y-2 pointer-events-none"
      }`}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex items-center justify-between gap-4 px-4 py-2 rounded-md bg-surface/95 border border-border shadow-lg backdrop-blur-md">
          <div className="flex items-center gap-2.5 min-w-0">
            {isGlobalView ? (
              <Layers className="w-4 h-4 text-text shrink-0" />
            ) : (
              <BankLogo bankName={account?.bankName || ""} logoUrl={account?.logoUrl} size="sm" />
            )}

            <div className="min-w-0 flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-semibold text-text truncate">
                {bankName}
              </h2>
              <span className="text-[11px] font-mono text-muted truncate">
                {isGlobalView
                  ? `(${selectedCount}/${totalCount})`
                  : account?.iban
                  ? `••${account.iban.replace(/\s+/g, "").slice(-4)}`
                  : ""}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span
              className={`font-mono text-sm sm:text-base font-bold tracking-tight ${
                isNegative ? "text-expense" : "text-text"
              }`}
            >
              {formatCurrencySymbol(currency)}{formatBalanceAmount(balanceNum)}
            </span>

            <div className="flex items-center gap-1 border-l border-border pl-2">
              {onRefresh && (
                <button
                  type="button"
                  onClick={onRefresh}
                  title="Sincronizar"
                  className="p-1 rounded text-muted hover:text-text cursor-pointer transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={onExportExcel}
                title="Exportar CSV"
                className="p-1 rounded text-muted hover:text-positive cursor-pointer transition-colors"
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
