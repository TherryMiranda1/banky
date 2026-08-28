import React from "react";
import { Link } from "react-router-dom";
import { BankLogo } from "@/components/accounts/BankLogo";
import { Account } from "@/lib/api/accounts";
import { formatFirstName } from "@/lib/format-utils";
import {
  Layers,
  CheckCircle,
  AlertTriangle,
  PowerOff,
  FileSpreadsheet,
  RefreshCw,
  Filter
} from "lucide-react";

interface AccountHeroProps {
  account?: Account | null;
  accountsList: Account[];
  selectedAccountIds: string[];
  isGlobalView: boolean;
  currentAccountId: string;
  searchParamsString: string;
  onToggleAccount: (id: string) => void;
  onSelectAllAccounts: () => void;
  onExportExcel: () => void;
  onRefresh?: () => void;
  heroRef?: React.RefObject<HTMLDivElement | null>;
}

function maskIban(iban: string | null): string {
  if (!iban) return "Sin IBAN";
  const clean = iban.replace(/\s+/g, "");
  if (clean.length <= 8) return clean;
  return `${clean.slice(0, 4)} •••• ${clean.slice(-4)}`;
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

export const AccountHero: React.FC<AccountHeroProps> = ({
  account,
  accountsList,
  selectedAccountIds,
  isGlobalView,
  currentAccountId,
  searchParamsString,
  onToggleAccount,
  onSelectAllAccounts,
  onExportExcel,
  onRefresh,
  heroRef
}) => {
  const globalTotalBalance = accountsList
    .filter((acc) => selectedAccountIds.includes(acc.id))
    .reduce((sum, acc) => {
      const amt = parseFloat(acc.lastBalance?.amount || "0");
      return sum + (isNaN(amt) ? 0 : amt);
    }, 0);

  const bankName = isGlobalView
    ? "Todas las Cuentas"
    : account?.nickname || account?.bankName || "Detalles de Cuenta";
  const isExpired = account?.status === "expired";
  const isInactive = account?.isActive === false;
  const balanceNum = isGlobalView
    ? globalTotalBalance
    : parseFloat(account?.lastBalance?.amount || "0");
  const isNegative = !isNaN(balanceNum) && balanceNum < 0;
  const currencyCode = account?.currency || "EUR";

  const searchSuffix = searchParamsString ? `?${searchParamsString}` : "";

  return (
    <div ref={heroRef} className="space-y-4 pt-1">
      {/* GitHub-style Underline Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar border-b border-border/80 pb-px">
        <Link
          to={`/accounts${searchSuffix}`}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
            isGlobalView
              ? "border-accent text-text font-semibold"
              : "border-transparent text-muted hover:text-text hover:border-border"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Todas las cuentas</span>
          <span className="px-1.5 py-0.2 rounded-full bg-surface-elevated border border-border text-[11px] font-mono text-muted">
            {formatCurrencySymbol("EUR")}{formatBalanceAmount(globalTotalBalance)}
          </span>
        </Link>

        {accountsList.map((acc) => {
          const isSelected = acc.id === currentAccountId;
          const bal = parseFloat(acc.lastBalance?.amount || "0");
          const displayLabel = acc.nickname || formatFirstName(acc.alias) || acc.bankName;

          return (
            <Link
              key={acc.id}
              to={`/accounts/${encodeURIComponent(acc.id)}${searchSuffix}`}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
                isSelected
                  ? "border-accent text-text font-semibold"
                  : "border-transparent text-muted hover:text-text hover:border-border"
              }`}
            >
              <BankLogo bankName={acc.bankName} logoUrl={acc.logoUrl} size="sm" />
              <span>{displayLabel}</span>
              <span className="px-1.5 py-0.2 rounded-full bg-surface-elevated border border-border text-[11px] font-mono text-muted">
                {formatCurrencySymbol(acc.currency)}{formatBalanceAmount(bal)}
              </span>
            </Link>
          );
        })}
      </div>

      {/* GitHub Document Header (Canvas Direct) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2">
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-baseline gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">
              {bankName}
            </h1>
            <div className="flex items-baseline gap-1 font-mono">
              <span className={`text-xl sm:text-2xl font-bold ${isNegative ? "text-expense" : "text-text"}`}>
                {formatCurrencySymbol(currencyCode)}{formatBalanceAmount(balanceNum)}
              </span>
              <span className="text-xs text-muted uppercase ml-0.5">
                {currencyCode}
              </span>
            </div>
          </div>

          {/* GitHub Status Line (Single Connected Row) */}
          <div className="flex items-center gap-2.5 text-xs text-muted flex-wrap">
            {isGlobalView ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-accent/10 border border-accent/30 text-accent font-medium text-[11px]">
                <CheckCircle className="w-3 h-3" />
                {selectedAccountIds.length} de {accountsList.length} cuentas activas
              </span>
            ) : isInactive ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-elevated border border-border text-muted font-medium text-[11px]">
                <PowerOff className="w-3 h-3" />
                Inactiva
              </span>
            ) : isExpired ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-expense/10 border border-expense/30 text-expense font-medium text-[11px]">
                <AlertTriangle className="w-3 h-3" />
                Expirada
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-positive/10 border border-positive/30 text-positive font-medium text-[11px]">
                <CheckCircle className="w-3 h-3" />
                Conectada
              </span>
            )}

            <span>•</span>
            <span className="font-mono text-[11px]">
              {isGlobalView
                ? "Historial consolidado multi-banco"
                : `${account?.alias ? `${formatFirstName(account.alias)} · ` : ""}${maskIban(account?.iban ?? null)}`}
            </span>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              title="Refrescar movimientos"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface hover:bg-surface-elevated border border-border text-xs font-medium text-text transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-muted" />
              <span>Sincronizar</span>
            </button>
          )}

          <button
            type="button"
            onClick={onExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface hover:bg-surface-elevated border border-border text-xs font-medium text-text hover:text-positive transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-positive" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Global View: GitHub Label Filter Style */}
      {isGlobalView && accountsList.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
          <span className="text-[11px] font-mono text-muted flex items-center gap-1">
            <Filter className="w-3 h-3 text-muted" />
            Filtrar:
          </span>
          {accountsList.map((acc) => {
            const isActive = selectedAccountIds.includes(acc.id);
            const displayLabel = acc.nickname || formatFirstName(acc.alias) || acc.bankName;

            return (
              <button
                key={acc.id}
                type="button"
                onClick={() => onToggleAccount(acc.id)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono transition-colors cursor-pointer border ${
                  isActive
                    ? "bg-surface-elevated border-border text-text font-medium"
                    : "bg-transparent border-border/40 text-muted/50 hover:text-muted"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isActive ? "bg-accent" : "bg-muted/40"
                  }`}
                />
                <span>{displayLabel}</span>
              </button>
            );
          })}

          {selectedAccountIds.length < accountsList.length && (
            <button
              type="button"
              onClick={onSelectAllAccounts}
              className="text-[11px] font-mono text-accent hover:underline cursor-pointer ml-1"
            >
              Todas
            </button>
          )}
        </div>
      )}
    </div>
  );
};
