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
  SlidersHorizontal
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
    <div
      ref={heroRef}
      className="rounded-3xl bg-surface/80 border border-border/70 p-5 sm:p-7 space-y-6 shadow-xl backdrop-blur-md transition-all"
    >
      {/* Account Switcher Pills */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 border-b border-border/40">
        <Link
          to={`/accounts${searchSuffix}`}
          className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            isGlobalView
              ? "bg-accent/15 text-accent border border-accent/40 shadow-xs"
              : "bg-surface border border-border/60 text-muted hover:text-text hover:border-border"
          }`}
        >
          <div className="w-5 h-5 rounded-md bg-white shadow-xs flex items-center justify-center text-slate-900 shrink-0">
            <Layers className="w-3.5 h-3.5 text-slate-800" />
          </div>
          <span>Todas</span>
          <span className="font-mono text-[11px] px-1.5 py-0.5 rounded-md bg-bg/80 border border-border/60 text-text">
            {formatCurrencySymbol("EUR")}{formatBalanceAmount(globalTotalBalance)}
          </span>
        </Link>

        {accountsList.map((acc) => {
          const isSelected = acc.id === currentAccountId;
          const bal = parseFloat(acc.lastBalance?.amount || "0");
          const displayLabel = acc.nickname || formatFirstName(acc.alias) || acc.bankName;
          const accInactive = acc.isActive === false;

          return (
            <Link
              key={acc.id}
              to={`/accounts/${encodeURIComponent(acc.id)}${searchSuffix}`}
              className={`shrink-0 flex items-center gap-2.5 px-3 py-1.5 rounded-xl border text-xs transition-all cursor-pointer ${
                isSelected
                  ? "bg-accent/15 text-accent font-semibold border-accent/40 shadow-xs"
                  : accInactive
                  ? "bg-surface/40 border-border/40 text-muted/60 hover:text-text opacity-60"
                  : "bg-surface border-border/60 text-muted hover:text-text hover:border-border"
              }`}
            >
              <BankLogo bankName={acc.bankName} logoUrl={acc.logoUrl} size="sm" />
              <div className="text-left">
                <p className="leading-tight truncate max-w-[120px] font-medium text-text">
                  {displayLabel}
                </p>
                <p className="font-mono text-[10px] text-muted leading-tight mt-0.5">
                  {formatCurrencySymbol(acc.currency)}{formatBalanceAmount(bal)}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Hero Body */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            {isGlobalView ? (
              <div className="w-11 h-11 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-800 shrink-0">
                <Layers className="w-6 h-6 text-slate-700" />
              </div>
            ) : (
              <BankLogo bankName={account?.bankName || ""} logoUrl={account?.logoUrl} size="md" />
            )}

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text">
                  {bankName}
                </h1>
                {!isGlobalView && (
                  isInactive ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono bg-border/80 text-muted border border-border">
                      <PowerOff className="w-3 h-3" />
                      Inactiva
                    </span>
                  ) : isExpired ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono bg-negative/15 text-negative border border-negative/30">
                      <AlertTriangle className="w-3 h-3" />
                      Expirada
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono bg-accent/15 text-accent border border-accent/30">
                      <CheckCircle className="w-3 h-3" />
                      Activa
                    </span>
                  )
                )}
              </div>
              <p className="text-xs text-muted font-mono mt-0.5">
                {isGlobalView
                  ? `${selectedAccountIds.length} de ${accountsList.length} cuentas activas seleccionadas`
                  : `${account?.alias ? `${formatFirstName(account.alias)} • ` : ""}${maskIban(account?.iban ?? null)}`}
              </p>
            </div>
          </div>

          <div>
            <span className="text-[11px] font-mono text-muted uppercase tracking-wider block">
              {isGlobalView ? "Saldo Total Combinado" : "Saldo Disponible"}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-lg font-mono text-muted">
                {formatCurrencySymbol(currencyCode)}
              </span>
              <span
                className={`text-3xl sm:text-4xl font-extrabold font-mono tracking-tight ${
                  isNegative ? "text-expense" : "text-text"
                }`}
              >
                {formatBalanceAmount(balanceNum)}
              </span>
              <span className="text-xs font-mono text-muted uppercase">
                {currencyCode}
              </span>
            </div>
          </div>
        </div>

        {/* Hero Actions */}
        <div className="flex items-center gap-2.5">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              title="Refrescar datos"
              className="p-2.5 rounded-xl bg-surface hover:bg-border/60 border border-border text-muted hover:text-text transition-all cursor-pointer shadow-xs"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={onExportExcel}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface hover:bg-border/60 border border-border text-text hover:text-positive text-xs font-semibold transition-all cursor-pointer shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-positive" />
            <span>Exportar Excel</span>
          </button>
        </div>
      </div>

      {/* Global View: Inline Minimal Filter Pills */}
      {isGlobalView && accountsList.length > 1 && (
        <div className="pt-3 border-t border-border/40 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-muted text-[11px] font-mono">
            <SlidersHorizontal className="w-3.5 h-3.5 text-accent" />
            <span>Cuentas en el cálculo ({selectedAccountIds.length}/{accountsList.length}):</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {accountsList.map((acc) => {
              const isActive = selectedAccountIds.includes(acc.id);
              const displayLabel = acc.nickname || formatFirstName(acc.alias) || acc.bankName;

              return (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => onToggleAccount(acc.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer border ${
                    isActive
                      ? "bg-accent/15 border-accent/40 text-text font-medium"
                      : "bg-surface/40 border-border/60 text-muted/60 opacity-60 hover:opacity-100"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isActive ? "bg-accent" : "bg-muted"
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
                className="text-[11px] font-mono text-accent hover:underline cursor-pointer pl-1"
              >
                Todas
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
