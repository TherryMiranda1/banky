import React from "react";
import { Account } from "@/lib/api/accounts";
import { AlertTriangle, Power, Settings2, ChevronLeft, ChevronRight, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { BankLogo } from "./BankLogo";
import { formatFirstName } from "@/lib/format-utils";

interface AccountCardProps {
  account: Account;
  onEdit?: (account: Account) => void;
  onToggleActive?: (account: Account) => void;
  onMove?: (direction: "prev" | "next") => void;
  isFirst?: boolean;
  isLast?: boolean;
}

function getBankBadge(bankName: string): { label: string; bg: string; text: string } {
  const normalized = bankName.toLowerCase();
  if (normalized.includes("efectivo") || normalized.includes("cash")) {
    return { label: "Cash", bg: "bg-emerald-500/10 border-emerald-500/30", text: "text-emerald-400" };
  }
  if (normalized.includes("santander")) {
    return { label: "Santander", bg: "bg-red-500/10 border-red-500/30", text: "text-red-400" };
  }
  if (normalized.includes("revolut")) {
    return { label: "Revolut", bg: "bg-blue-500/10 border-blue-500/30", text: "text-blue-400" };
  }
  if (normalized.includes("bbva")) {
    return { label: "BBVA", bg: "bg-sky-500/10 border-sky-500/30", text: "text-sky-400" };
  }
  if (normalized.includes("caixa") || normalized.includes("imagin")) {
    return { label: "Caixa", bg: "bg-cyan-500/10 border-cyan-500/30", text: "text-cyan-400" };
  }
  return { label: "Bank", bg: "bg-surface border-border", text: "text-muted" };
}

function maskIban(iban: string | null): string {
  if (!iban) return "Efectivo";
  const clean = iban.replace(/\s+/g, "");
  if (clean.length <= 8) return clean;
  return `•••• ${clean.slice(-4)}`;
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

export const AccountCard: React.FC<AccountCardProps> = ({
  account,
  onEdit,
  onToggleActive,
  onMove,
  isFirst = false,
  isLast = false
}) => {
  const isExpired = account.status === "expired";
  const isActive = account.isActive ?? true;
  const balanceAmountStr = account.lastBalance?.amount ?? "0.00";
  const balanceNum = parseFloat(balanceAmountStr);
  const isNegative = !isNaN(balanceNum) && balanceNum < 0;

  const displayName = account.nickname || formatFirstName(account.alias) || account.bankName;
  const bankBadge = getBankBadge(account.bankName);

  return (
    <div
      className={`group relative rounded-2xl bg-surface border border-border/80 p-5 flex flex-col justify-between transition-all duration-200 hover:border-border hover:shadow-lg ${
        !isActive ? "opacity-60 grayscale-[20%]" : ""
      }`}
    >
      {/* Card Header: Bank Logo + Info + Actions */}
      <div className="flex items-start justify-between gap-3">
        <Link
          to={`/accounts/${encodeURIComponent(account.id)}`}
          className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
        >
          <BankLogo bankName={account.bankName} logoUrl={account.logoUrl} size="md" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-text group-hover:text-accent transition-colors truncate">
                {displayName}
              </span>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full border ${bankBadge.bg} ${bankBadge.text}`}>
                {bankBadge.label}
              </span>
            </div>
            <p className="text-xs text-muted font-mono mt-0.5 truncate">
              {maskIban(account.iban)}
            </p>
          </div>
        </Link>

        {/* Quick controls toolbar */}
        <div className="flex items-center gap-1 shrink-0">
          {onMove && (
            <div className="flex items-center bg-bg/80 border border-border/60 rounded-lg p-0.5">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onMove("prev");
                }}
                disabled={isFirst}
                title="Mover cuenta a la izquierda"
                className="p-1 rounded text-muted hover:text-text hover:bg-border/60 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onMove("next");
                }}
                disabled={isLast}
                title="Mover cuenta a la derecha"
                className="p-1 rounded text-muted hover:text-text hover:bg-border/60 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {onEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit(account);
              }}
              title="Configurar cuenta"
              className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-border/60 transition-colors cursor-pointer"
            >
              <Settings2 className="w-4 h-4" />
            </button>
          )}

          {onToggleActive && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleActive(account);
              }}
              title={isActive ? "Desactivar cuenta" : "Activar cuenta"}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isActive
                  ? "text-accent/80 hover:text-accent hover:bg-accent/10"
                  : "text-muted hover:text-text hover:bg-border/60"
              }`}
            >
              <Power className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Card Footer: Balance & Navigation link */}
      <Link
        to={`/accounts/${encodeURIComponent(account.id)}`}
        className="mt-5 pt-4 border-t border-border/40 flex items-end justify-between cursor-pointer"
      >
        <div>
          <span className="text-[10px] text-muted font-mono uppercase tracking-wider block">
            Saldo Disponible
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-sm font-mono text-muted">
              {formatCurrencySymbol(account.currency)}
            </span>
            <span
              className={`text-2xl font-bold font-mono tracking-tight ${
                isNegative ? "text-negative" : "text-text group-hover:text-accent transition-colors"
              }`}
            >
              {formatBalanceAmount(balanceAmountStr)}
            </span>
            <span className="text-xs font-mono text-muted ml-0.5">
              {account.currency}
            </span>
          </div>

          {account.lastBalance?.heldAmount && (
            <div className="mt-1 flex items-center gap-1.5 text-[10px] font-mono text-amber-300">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span>Retención: {formatCurrencySymbol(account.currency)}{account.lastBalance.heldAmount}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isExpired ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-negative/10 text-negative border border-negative/20">
              <AlertTriangle className="w-3 h-3" />
              Expirada
            </span>
          ) : !isActive ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-border text-muted">
              Inactiva
            </span>
          ) : (
            <div className="w-8 h-8 rounded-full bg-bg/80 border border-border/60 text-muted group-hover:text-accent group-hover:border-accent/40 flex items-center justify-center transition-colors">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          )}
        </div>
      </Link>
    </div>
  );
};
